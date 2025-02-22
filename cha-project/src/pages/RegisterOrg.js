import React, { useState } from 'react';
import SetupWizardPage from '../components/SetupWizardPage';
import CustomPopUp from '../components/CustomPopUp';
import { useNavigate } from 'react-router-dom';

const CreateOrganization = () => {
    const [orgName, setOrgName] = useState('');
    const [orgEmail, setOrgEmail] = useState('');
    const [orgPhone, setOrgPhone] = useState('');
    const [orgPassword, setOrgPassword] = useState('');
    const [orgIndustry, setOrgIndustry] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [state, setState] = useState('');
    const [orgProducts, setOrgProducts] = useState([]);

    const [showError, setShowError] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    const navigate = useNavigate();

    const token = sessionStorage.getItem("authToken")

    const toggleError = () => {
        setShowError(!showError);
    };
    const toggleWarning = () => {
        setShowWarning(!showWarning);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Assume that there is only one tableInput
        const tableHeaders = fields.find(field => field.fieldType === 'tableInput').headers;
        const requiredHeaders = []
        for (let i = 0; i < tableHeaders.length; i++) {
            if (tableHeaders[i].required)
                requiredHeaders.push(tableHeaders[i].title)
        }
        if (orgProducts.length) {
            const productsValid = orgProducts.every((product) => {
                for (let i = 0; i < product.length; i++) {
                    if (!requiredHeaders.includes(Object.keys(product)[i])) {
                        setShowError(true)
                        return false
                    }
                }
                var values = [product.name, product.price, product.description]
                // Check if value is undefined or an empty string, including spaces
                if (values.includes(undefined)) {
                    return false
                }
                const requiredValues = values.map((value) => { return value.trim() })
                if (requiredValues.includes("")) {
                    setShowError(true)
                    return false
                }
                return true
            })
            const missingImages = orgProducts.some((product) => {
                if (!product.image) {
                    return true
                }
                return false
            })
            console.log(orgProducts)
            if (productsValid) {
                if (missingImages) {
                    setShowWarning(true)
                }
                else {
                    handleRegister(e)
                }
            }
            else {
                setShowError(true)
            }
        }
        else {
            handleRegister(e)
        }

    }

    const handleRegister = async (event) => {
        const orgType = window.location.href.includes("corporate") ? "Corporate" : "Government";
        event.preventDefault();
        try {
            fetch('http://localhost:3000/api/org/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    "name": orgName,
                    "email": orgEmail,
                    "phone": orgPhone,
                    "password": orgPassword,
                    "type": orgType,
                    "industry": orgIndustry,
                    "city": city,
                    "country": country,
                    "address_line1": addressLine1,
                    "address_line2": addressLine2,
                    "postal_code": postalCode,
                    "state": state,
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then((error) => {
                            if (error.message) {
                                alert(error.message)
                            }
                            else {
                                alert("Something went wrong")
                            }
                            throw new Error("Failed to create organization");
                        })
                    }
                    return response.json();
                })
                .then(async response => {
                    if (orgProducts.length) {
                        const org_id = response.data.insertId
                        const formData = new FormData()
                        formData.append("org_id", org_id)
                        orgProducts.map((product) => {
                            formData.append("image", product.image)
                            formData.append('name', product.name)
                        })
                        await fetch(`http://localhost:3000/api/image/upload`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            body: formData
                        })
                            .then((response) => {
                                if (!response.ok) {
                                    return response.json().then((error) => {
                                        alert(error.message)
                                    })
                                }
                                else {
                                    alert("Images stored in S3")
                                }
                            })
                        fetch(`http://localhost:3000/api/product/register/${org_id}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(orgProducts),
                        })
                            .then(productResponse => {
                                if (!productResponse.ok)
                                    return productResponse.json().then((error) => {
                                        if (error.message) {
                                            alert(error.message)
                                        }
                                        else {
                                            alert("Something went wrong")
                                        }
                                        throw new Error('Error creating products for organization');
                                    })
                                alert("Organization created and products registered!");
                                navigate(-1);
                            });
                    } else {
                        alert("Organization created!");
                        navigate(-1);
                    }
                });
        } catch (error) {
            throw new Error('Error creating organization');
        }
    };

    const fields = [
        { fieldType: 'input', label: 'Organization Name', type: 'text', value: orgName, onChange: (e) => setOrgName(e.target.value), required: true },
        { fieldType: 'input', label: 'Organization Email', type: 'text', value: orgEmail, onChange: (e) => setOrgEmail(e.target.value), required: true },
        { fieldType: 'input', label: 'Organization Phone', type: 'tel', value: orgPhone, onChange: (e) => setOrgPhone(e.target.value), required: true },
        { fieldType: 'input', label: 'Organization Password', type: 'password', value: orgPassword, onChange: (e) => setOrgPassword(e.target.value), required: true },
        {
            fieldType: 'dropdown',
            label: 'Organization Industry',
            type: 'text',
            value: orgIndustry,
            onChange: (e) => setOrgIndustry(e.target.value),
            required: true,
            options: [
                { value: "Technology" }, { value: "Finance" }, { value: "Healthcare" },
                { value: "Manufacturing" }, { value: "Retail" }, { value: "Real Estate" },
                { value: "Transportation and Logistics" }, { value: "Construction" },
                { value: "Marketing and Advertising" }, { value: "Others" }
            ]
        },
        { fieldType: 'input', label: 'City', type: 'text', value: city, onChange: (e) => setCity(e.target.value), required: true },
        {
            fieldType: 'dropdown',
            label: 'Country',
            type: 'text',
            value: country,
            onChange: (e) => setCountry(e.target.value),
            required: true,
            options: [
                { value: "PH" }, { value: "SG" }
            ]
        },
        { fieldType: 'input', label: 'Address Line 1', type: 'text', value: addressLine1, onChange: (e) => setAddressLine1(e.target.value), required: true },
        { fieldType: 'input', label: 'Address Line 2 (Optional)', type: 'text', value: addressLine2, onChange: (e) => setAddressLine2(e.target.value), required: false },
        { fieldType: 'input', label: 'Postal Code', type: 'text', value: postalCode, onChange: (e) => setPostalCode(e.target.value), required: true },
        { fieldType: 'input', label: 'State', type: 'text', value: state, onChange: (e) => setState(e.target.value), required: true },
        {
            fieldType: 'tableInput',
            label: 'Register Product (Optional)',
            headers: [
                { title: "Name", inputType: "input" },
                { title: "Price", inputType: "input", type: "number", step: "0.01" },
                { title: "Description", inputType: "textarea", isInputLong: true },
                { title: "Image", inputType: "upload" }
            ],
            value: orgProducts,
            onChange: (e) => setOrgProducts(e),
            required: false,
        },
    ];

    return (
        <main>
            {showError && (
                <CustomPopUp togglePopup={toggleError} title="Error" text="Please ensure that all fields are filled for all registered products" />
            )}
            {showWarning && (
                <CustomPopUp togglePopup={toggleWarning} onConfirm={(e) => handleRegister(e)} title="Warning" text="Some images are not filled. Placeholder images will be used for these products, are you sure you want to proceed?" hasCancel={true} />
            )}
            <SetupWizardPage title="Register Organization" fields={fields} onSubmit={handleSubmit} />
        </main>
    );
};

export default CreateOrganization;
