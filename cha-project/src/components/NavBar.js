import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegUser, FaBars } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import { RiArrowDropDownLine, RiArrowDropUpLine } from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import { PiArrowBendUpRightBold } from "react-icons/pi";
import { jwtDecode } from "jwt-decode";
import styles from "../styles/NavBar.module.css";

// Sample cartItems data


const NavBar = () => {
    const links = [
        { name: "Home", path: "/Home" },
        { name: "Shop", path: "/Shop1" },
        { name: "About", path: "/About" },
        { name: "Contact", path: "/Contact" },
    ];

    const [sideNavOpen, setSideNavOpen] = useState(false);
    const [sideCartOpen, setSideCartOpen] = useState(false); // State for the side cart
    const [dropDownOpen, setDropDownOpen] = useState(false);
    const [userName, setUserName] = useState(null);
    const navigate = useNavigate(); // Initialize navigate

    // Side cart states
    // Load cart from localStorage (Assume it's an array of { id, size, color, quantity })
    const localStorageCart = JSON.parse(localStorage.getItem('cart') || "[]");

    // Side cart states
    const [quantities, setQuantities] = useState(localStorageCart.map(item => item.quantity));
    const [lastValidQuantities, setLastValidQuantities] = useState(localStorageCart.map(item => item.quantity));
    const [editingIndex, setEditingIndex] = useState(null); // Track the current editing input
    const intervalRef = useRef(null); // Reference for interval
    const inputRef = useRef(null); // Reference to the current input element
    const [cart, setCart] = useState([]);


    useEffect(() => {
        const localStorageCart = JSON.parse(localStorage.getItem('cart') || "[]");
        console.log(localStorageCart, 'cart token');

        // Get all item IDs and quantities from localStorageCart
        const itemIds = localStorageCart.map(item => item.id);
        const initialQuantities = localStorageCart.map(item => item.quantity || 1);
        console.log(itemIds, 'this is the itemid')

        if (itemIds.length > 0) {
            // Map over each item ID to create a fetch request for each item
            const fetchPromises = itemIds.map(id =>
                fetch(`http://localhost:3000/api/product/${id}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to fetch product with id ${id}`);
                        }
                        return response.json();
                    })
            );
            // Wait for all fetch requests to complete
            Promise.all(fetchPromises)
                .then(products => {
                    const updatedProducts = products.map((product) => {
                        console.log(product[0], "A ")
                        return product[0]
                    })
                    setCart(updatedProducts); // Set the cart with all fetched products
                    console.log(products, 'cart data');
                })
                .catch(error => {
                    console.error("Error fetching product data:", error);
                });
        } else {
            console.log("No items in cart.");
            setCart([]); // Clear cart data if no items are present
        }

        console.log("Cart details:");
        console.log("Cart ids:", itemIds);
        console.log("Cart quantities:", initialQuantities);

        setQuantities(initialQuantities);
        setLastValidQuantities(initialQuantities); // Initialize last valid quantities
    }, []);



    // Function to calculate subtotal
    const calculateSubtotal = () => {
        return cart.reduce((total, item, index) => {
            return total + item.price * quantities[index];
        }, 0);
    };

    const subtotal = calculateSubtotal();

    // Update localStorage when quantities change
    const updateLocalStorageCart = (updatedQuantities) => {
        // Re-fetch `localStorageCart` to get the latest data
        const currentLocalStorageCart = JSON.parse(localStorage.getItem('cart') || "[]");
        const updatedCart = currentLocalStorageCart.map((cartItem, index) => {
            const matchedItem = cart.find(item => item.id === cartItem.id);
            if (matchedItem) {
                return { ...cartItem, quantity: updatedQuantities[index] };
            }
            return cartItem;
        });
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    // Handle item removal
    const handleRemoveItem = (index) => {
        const itemToRemove = cart[index];
        console.log(cart, index)
        // Re-fetch `localStorageCart` to get the latest data
        const currentLocalStorageCart = JSON.parse(localStorage.getItem('cart') || "[]");
        // Remove item from localStorage cart
        const updatedLocalStorageCart = currentLocalStorageCart.filter(cartItem => cartItem.id !== itemToRemove.id);

        localStorage.setItem('cart', JSON.stringify(updatedLocalStorageCart));

        // Update state: remove item from cart and adjust quantities
        setCart(prevCart => prevCart.filter((_, i) => i !== index));
        setQuantities(prevQuantities => prevQuantities.filter((_, i) => i !== index));
    };

    // Function to handle quantity increase (max 50)
    const increaseQuantity = (index) => {
        setQuantities(prevQuantities => {
            const newQuantities = [...prevQuantities];
            if (newQuantities[index] < 50) {
                newQuantities[index] += 1;
                updateLocalStorageCart(newQuantities);
            }
            return newQuantities;
        });
    };

    // Function to handle quantity decrease (min 1)
    const decreaseQuantity = (index) => {
        setQuantities(prevQuantities => {
            const newQuantities = [...prevQuantities];
            if (newQuantities[index] > 1) {
                newQuantities[index] -= 1;
                updateLocalStorageCart(newQuantities);
            }
            return newQuantities;
        });
    };

    // Function to start auto incrementing quantity
    const startIncreasing = (index) => {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => increaseQuantity(index), 200);
    };

    // Function to start auto decrementing quantity
    const startDecreasing = (index) => {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => decreaseQuantity(index), 200);
    };

    // Function to stop auto incrementing/decrementing quantity
    const stopChanging = () => {
        clearInterval(intervalRef.current);
    };

    // Clear interval when the component unmounts
    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    // Handle input change, enforce limits during typing
    const handleInputChange = (index, value) => {
        // Allow user to clear input but restrict value from exceeding max of 50
        if (value === '' || (!isNaN(value) && value <= 50)) {
            setQuantities(prevQuantities => {
                const newQuantities = [...prevQuantities];
                newQuantities[index] = value === '' ? '' : parseInt(value, 10); // Allow temporary empty string or a valid number
                updateLocalStorageCart(newQuantities);
                return newQuantities;
            });
        }
    };

    // Handle input blur or Enter key press to save, ensuring non-blank values
    const handleSaveQuantity = (index) => {
        setQuantities(prevQuantities => {
            const newQuantities = [...prevQuantities];
            const currentValue = newQuantities[index];

            // Ensure the value is valid, revert to original if invalid or blank
            if (currentValue === '' || isNaN(currentValue) || currentValue < 1 || currentValue > 50) {
                newQuantities[index] = lastValidQuantities[index]; // Revert to the original quantity if invalid
            } else {
                // Update cartItems with the new valid value (if needed)
                setLastValidQuantities(newQuantities);
            }

            return newQuantities;
        });

        setEditingIndex(null); // Close the input after saving
    };

    // Handle key press (Enter key to save)
    const handleKeyPress = (e, index) => {
        if (e.key === 'Enter') {
            handleSaveQuantity(index);
        }
    };

    // Detect clicks outside of the input
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                if (editingIndex !== null) {
                    handleSaveQuantity(editingIndex); // Save quantity if clicked outside
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingIndex]);

    useEffect(() => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUserName(decodedToken.org_name); // Ensure your token has a 'name' field
            } catch (error) {
                console.error('Invalid token:', error);
                navigate('/Home');
                handleLogout();
            }
        }
    }, []);

    const toggleSideNav = () => {
        setSideNavOpen(!sideNavOpen);
        if (sideCartOpen) {
            setSideCartOpen(false); // Close side cart when side nav opens
        }
    };

    const toggleSideCart = () => {
        setSideCartOpen(!sideCartOpen);
        if (sideNavOpen) {
            setSideNavOpen(false); // Close side nav when side cart opens
        }
    };

    const hideDropDown = () => {
        setDropDownOpen(false);
    };

    const openDropDown = () => {
        setDropDownOpen(true);
    };

    const disableScroll = (event) => {
        event.preventDefault();
        window.scrollTo(0, 0);
    };

    useEffect(() => {
        if (sideNavOpen || sideCartOpen) {
            window.addEventListener('scroll', disableScroll, { passive: false });
        } else {
            window.removeEventListener('scroll', disableScroll);
        }

        return () => {
            window.removeEventListener('scroll', disableScroll);
        };
    }, [sideNavOpen, sideCartOpen]);

    // Logout Handler
    const handleLogout = () => {
        sessionStorage.removeItem('token');
        localStorage.removeItem('token'); // Remove token from sessionStorage
        localStorage.removeItem('cart'); // Remove token from sessionStorage
        setUserName(null); // Clear userName state
        navigate('/Home'); // Redirect to Home page or Login page
    };

    return (
        <div style={{ margin: 0, padding: 0, width: "100%" }}>
            {/* Darken Div for Side Nav and Side Cart */}
            <div
                className={styles.darkenDiv}
                style={{ opacity: sideNavOpen || sideCartOpen ? 1 : 0, width: sideNavOpen || sideCartOpen ? '100vw' : 0 }}
                onClick={() => {
                    setSideNavOpen(false);
                    setSideCartOpen(false);
                }}
            ></div>

            {/* Side Nav Bar */}
            <div className={`${styles.sideNav} ${sideNavOpen ? styles.sideNavOpen : ""}`} id="sideNav">
                <div className={styles.sideNavHead}>
                    Menu
                    <FaArrowRightLong className={styles.sideNavToggle} id="sideNavToggle" onClick={toggleSideNav} />
                </div>
                <div className={styles.sideNavLinks}>
                    {links.map((link, index) => (
                        <NavLink
                            key={index}
                            to={link.path}
                            exact
                            className={({ isActive }) =>
                                isActive ? `${styles.link}` : styles.link
                            }
                            onClick={toggleSideNav}
                        >
                            {link.name}
                        </NavLink>
                    ))}
                </div>
            </div>

            <div className={`${styles.sideCart} ${sideCartOpen ? styles.sideCartOpen : ""}`} id="sideCart">
                <div className={styles.sideCartHead}>
                    <IoClose className={styles.cartIcons} onClick={toggleSideCart} />
                    Shopping Cart
                    <Link to="/shoppingcart" className={styles.cartIcons}>
                        <PiArrowBendUpRightBold />
                    </Link>
                </div>

                <div className={styles.contentWrapper}>
                    <table className={styles.tableContent}>
                        <tbody>
                            {cart.map((item, index) => {
                                console.log(item.name)
                                return (
                                    <tr key={index}>
                                        <td className={styles.productRow}>
                                            <img src="https://placehold.co/430x640" alt={item.name} className={styles.productImage} />
                                            <div style={{ marginLeft: '5px' }} className={styles.productDetailsWrapper}>
                                                <p className={styles.productName}>{item.name}</p>
                                                <div>
                                                    <p className={styles.productPrice}>{item.description}</p>
                                                    <br />
                                                    {/* <p className={styles.productPrice}>{`$${item.price.toFixed(2)}`}</p> */}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.quantityContainer}>
                                                <div className={styles.quantityBox}
                                                    onMouseDown={() => startDecreasing(index)}
                                                    onMouseUp={stopChanging}
                                                    onMouseLeave={stopChanging}>
                                                    <button className={styles.quantityButton} onClick={() => decreaseQuantity(index)}>-</button>
                                                </div>
                                                {editingIndex === index ? (
                                                    <input
                                                        ref={inputRef}
                                                        className={styles.quantityInput}
                                                        type="number"
                                                        value={quantities[index]}
                                                        min="1"
                                                        max="50"
                                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                                        onBlur={() => handleSaveQuantity(index)}
                                                        onKeyPress={(e) => handleKeyPress(e, index)}
                                                    />
                                                ) : (
                                                    <div className={styles.quantityRectangle} onClick={() => setEditingIndex(index)}>
                                                        <span>{quantities[index]}</span>
                                                    </div>
                                                )}
                                                <div className={styles.quantityBox}
                                                    onMouseDown={() => startIncreasing(index)}
                                                    onMouseUp={stopChanging}
                                                    onMouseLeave={stopChanging}>
                                                    <button className={styles.quantityButton} onClick={() => increaseQuantity(index)}>+</button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.iconWrapper}>
                                            <IoClose className={styles.closeIcon} onClick={() => handleRemoveItem(index)} />
                                        </td>
                                    </tr>)
                            }


                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.checkoutContainer}>
                    <table className={styles.totalSum}>
                        <tr>
                            <td style={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}>Subtotal:</td>
                            <td style={{ fontWeight: 'bold' }}>{`$${subtotal.toFixed(2)}`}</td>
                        </tr>
                    </table>
                    <Link to='/shoppingcart'>
                        <button className={styles.checkoutBtn}>Checkout</button>
                    </Link>
                </div>
            </div>

            {/* Nav Bar */}
            <nav className={styles.navbar}>
                <Link to="/Home" className={styles.logo}>BrandTailors Co.</Link>
                <div className={styles.linksDiv}>
                    {links.map((link, index) => (
                        <NavLink
                            key={index}
                            to={link.path}
                            exact
                            className={({ isActive }) =>
                                isActive ? `${styles.link} ${styles.linkActive}` : styles.link
                            }
                        >
                            {link.name}
                        </NavLink>
                    ))}
                </div>
                <div className={styles.sideDiv}>
                    {userName ? (
                        <div className={styles.userContainer}>
                            <span className={styles.icons}><FaRegUser /></span>
                            <Link to="/profile" className={styles.userName}>{userName}</Link>
                            <NavLink className={styles.icons} to="/profile"><FaRegUser /></NavLink>
                            <span className={styles.userName}>{userName}</span>

                            <button onClick={handleLogout} className={styles.logoutButton}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <NavLink className={styles.loginLink} to={"/login"}>
                            <span className={styles.icons}><FaRegUser /></span>
                            <span className={styles.loginText}>Login / Register</span>
                        </NavLink>
                    )}
                    <span className={styles.icons}><IoSearch /></span>
                    <span className={styles.icons} onClick={toggleSideCart} id="cart"><MdOutlineShoppingCart /></span>
                    <FaBars className={`${styles.colNavbar} ${styles.icons}`} id="sideNavIcon" onClick={toggleSideNav} />
                </div>
            </nav>
        </div>
    );
};

export default NavBar;
