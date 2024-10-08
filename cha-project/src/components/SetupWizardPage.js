import React, { useState, useRef, useEffect } from 'react';
import AdminSideNavBar from '../components/AdminSideNavBar'
import styles from '../styles/SetupWizardPage.module.css'

const SetupWizardPage = ({ title, fields, onSubmit }) => {

    // addedRows does not count the first unremovable row in the table
    const [addedRows, setAddedRows] = useState(0)
    const [tableInputs, setTableInputs] = useState([])
    const tableField = useRef(null)

    const addTableRow = () => {
        setAddedRows(addedRows + 1)
    }

    const deleteTableRow = (rowIndex) => {
        console.log(rowIndex)
        let newTableInputs = [...tableInputs]; // Copy of tableInputs array
        {/* rowIndex starts from 1 as first row cannot be deleted*/ }
        newTableInputs.splice(rowIndex + 1, 1);

        // Update rows and tableInputs in state
        setAddedRows(addedRows - 1);
        setTableInputs(newTableInputs);
    };

    useEffect(() => {
        if (fields.find(field => field.fieldType === 'tableInput'))
            fields.find(field => field.fieldType === 'tableInput').onChange(tableInputs);
    }, [tableInputs])


    // a = [
    //     { "name": "prdouct", "price": 10, "description": "test", "image": "image" },
    //     { "name": "prdouct", "price": 10, "description": "test", "image": "image" },
    // ]

    const handleTableInputChange = (id, title, value) => {
        let newTableInputs = tableInputs;  // Copy the state array

        const existingItem = newTableInputs[id];

        if (existingItem) {
            // If it exists, update the input field
            existingItem[title.toLowerCase()] = value;
        } else {
            // If it doesn't exist, create a new entry
            newTableInputs.push({
                [title.toLowerCase()]: value
            });
        }
        console.log(newTableInputs)
        setTableInputs(newTableInputs);  // Update the state
    };

    return (
        <main style={{ display: "flex", flexDirection: "row" }}>
            <AdminSideNavBar />
            <div className={styles.container}>
                <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "2em" }}>{title}</span>
                <form onSubmit={onSubmit} className={styles.form}>
                    {fields.map((field, index) => (
                        <div key={index} className={styles.field}>
                            <label className={styles.label}>{field.label}</label>
                            {/* Handle different field types */}
                            {field.fieldType === 'input' && (
                                <input
                                    className={styles.input}
                                    type={field.type}
                                    value={field.value}
                                    onChange={field.onChange}
                                    required={field.required}
                                />
                            )}
                            {field.fieldType === 'textarea' && (
                                <textarea
                                    className={styles.textArea}
                                    value={field.value}
                                    onChange={field.onChange}
                                    required={field.required}
                                />
                            )}
                            {field.fieldType === 'dropdown' && (
                                <select value={field.id} onChange={field.onChange} required={field.required} className={styles.dropDown}>
                                    <option value="" disabled selected="selected">Select an option</option>
                                    {field.options.map((option, i) => {
                                        return (
                                            <option key={i} value={option.id}>
                                                {option.value}
                                            </option>
                                        )
                                    })}
                                </select>
                            )}
                            {field.fieldType === 'upload' && (
                                <input
                                    type="file"
                                    onChange={field.onChange}
                                    accept="image/png, image/jpeg" />
                            )}
                            {field.fieldType === 'tableInput' && (
                                <div>
                                    <table ref={tableField} style={{ borderCollapse: "collapse", border: "0.5px solid #D9D9D9", width: "80%" }} >
                                        <thead>
                                            <tr>
                                                {field.headers.map((header) => (
                                                    <th className={styles.th}>{header.title}</th>
                                                ))}
                                                <th className={styles.th}></th>
                                            </tr>
                                        </thead>
                                        <tbody className={styles.tbody}>
                                            <tr>
                                                {field.headers.map((header) => {
                                                    const title = header.title
                                                    const type = header.inputType
                                                    if (type === "input") {
                                                        return (
                                                            <td className={styles.td}>
                                                                <input type={header.type ? header.type : "text"}
                                                                    step={header.step ? header.step : undefined}
                                                                    onChange={(e) => handleTableInputChange(0, title, e.target.value)} />
                                                            </td>
                                                        )
                                                    }
                                                    else if (type === "textarea") {
                                                        return (
                                                            <td className={styles.td}>
                                                                <textarea
                                                                    className={styles.tableTextArea}
                                                                    type={header.type ? header.type : "text"}
                                                                    step={header.step ? header.step : undefined}
                                                                    onChange={(e) => handleTableInputChange(0, title, e.target.value)} />
                                                            </td>
                                                        )
                                                    }
                                                    else if (type === "upload") {
                                                        return <td className={styles.td}>
                                                            <input type="file"
                                                                id="fileInput"
                                                                onChange={(e) => handleTableInputChange(0, title, e.target.files[0])}
                                                                accept="image/png, image/jpeg" />
                                                        </td>
                                                    }
                                                }
                                                )}
                                            </tr>
                                            {[...Array(addedRows)].map((_, rowIndex) => {
                                                return (
                                                    <tr key={rowIndex}>
                                                        {field.headers.map((header, headerIndex) => {
                                                            const title = header.title;
                                                            const type = header.inputType;
                                                            const inputValue = tableInputs[rowIndex + 1]?.[title]; // Use rowIndex to access inputs for the current row

                                                            if (type === "input") {
                                                                return (
                                                                    <td className={styles.td} key={headerIndex}>
                                                                        <input
                                                                            type={header.type || "text"}
                                                                            step={header.step || undefined}
                                                                            value={inputValue}
                                                                            onChange={(e) => handleTableInputChange(rowIndex + 1, title, e.target.value)}
                                                                        />
                                                                    </td>
                                                                );

                                                            }
                                                            else if (type === "textarea") {
                                                                return (
                                                                    <td className={styles.td}>
                                                                        <textarea
                                                                            className={styles.tableTextArea}
                                                                            type={header.type ? header.type : "text"}
                                                                            step={header.step ? header.step : undefined}
                                                                            onChange={(e) => handleTableInputChange(rowIndex + 1, title, e.target.value)} />
                                                                    </td>
                                                                )
                                                            }
                                                            else if (type === "upload") {
                                                                return (
                                                                    <td className={styles.td} key={headerIndex}>
                                                                        <input type="file"
                                                                            id="fileInput"
                                                                            onChange={(e) => handleTableInputChange(rowIndex + 1, title, e.target.files[0])}
                                                                            accept="image/png, image/jpeg" />
                                                                    </td>
                                                                );
                                                            } else {
                                                                return null; // Add a fallback for unsupported types
                                                            }
                                                        })}
                                                        <td style={{ display: "flex", justifyContent: "center" }} className={styles.td}>
                                                            <button type="button" className={styles.removeBtn} onClick={() => deleteTableRow(rowIndex)}>
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <div><button className={styles.addProduct} type="button" onClick={() => addTableRow(field)}><span style={{ fontFamily: "Inter", fontWeight: 600, color: "black" }}>+</span> Add new Item</button></div>
                                </div>
                            )}
                        </div>
                    ))}
                    <button type="submit" className={styles.submit}>Submit</button>
                </form>
            </div >
        </main >
    );
};

export default SetupWizardPage;
