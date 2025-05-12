import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import { FaRegCopy } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import logo from "../assets/TagIDLogo.png";
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import '@sweetalert2/theme-dark/dark.css';
import axios, { all } from "axios";
import { LogInsert, Server, FileGeneration } from '../App';
import { MdClose } from 'react-icons/md';
import Cookies from 'js-cookie';

const Pcs = () => {

    const [selectedItem, setSelectedItem] = useState('');
    const [getPiNumber, setGetPiNumber] = useState([]);
    const [filteredPiNumbers, setFilteredPiNumbers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('ALL');
    const [selectedShift, setselectedShift] = useState("ALL");
    const [SelectedFIleType, setSelectedFIleType] = useState('');
    const [XmlFile, setXmlFile] = useState('')
    const [userName, setUserName] = useState('');
    const [UserFirstName, setUserFirstName] = useState('');
    const [userLastName, setuserLastName] = useState('');
    const [MachineNO, setMachineNO] = useState('');
    const [UserRole, setUserRole] = useState('');
    const [piDetails, setPiDetails] = useState([]);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
    const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
    const [IsAllocateDisabled, setIsAllocateDisabled] = useState(true);
    const [isAllocateClicked, setIsAllocateClicked] = useState(false);
    const [PINumber, setPINumbers] = useState('');
    const [SummaryData, setSummaryData] = useState(null);
    const [GetEPC, setGetEPC] = useState('');
    const [toPrintPI, setToPrintPI] = useState(null);
    const [hasToPrint, sethasToPrint] = useState(null);
    const [refetchData, setRefetchData] = useState(false);
    const [Password, setPassword] = useState("");
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [ShowFgPage, setShowFgPage] = useState(false);
    const [fgCodes, setFgCodes] = useState({});
    const [showLoaderForfile, setShowLoaderForFile] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [percentageDiff, setpercentageDiff] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const timerRef = useRef(null);

    // Set Countdown in milliseconds
    const startCountdown = () => {
        timerRef.current = setTimeout(() => {
            toast.warn("Logging out due to inactivity...");
            handleLogout();
        }, 600000);  //10 min  in mileseconds 
    };

    const resetCountdown = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        startCountdown();
    };

    // Handle Logout
    const handleLogout = async () => {
        try {
            const response = await axios.post(
                `${Server}/api/Printing_API/logout?username=${userName}`
            );
            if (response.status === 200) {
                Cookies.remove('userData');
                navigate('/');
                toast.success(response.data.message);
            } else {
                console.error("Failed to log out:", response.statusText);
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error during logout.');
            console.error("Error during logout:", error);
        }
    };

    const handleClick = (piNumber) => {
        // if (toPrintPI && piNumber !== toPrintPI) {
        //     toast.warn(`Please update the ${toPrintPI} PI before selecting another.`);
        //     return;
        // }
        setSelectedItem(piNumber);
        const selectedPi = filteredPiNumbers.find(item => item.pi_number === piNumber);
        if (selectedPi && selectedPi.status === 'To-Print') {
            setIsUpdateDisabled(false);
        } else {
            setIsUpdateDisabled(true);
        }
        setIsAllocateDisabled(false);
        setIsAllocateClicked(false)
        fetchPIDetails(piNumber);
    };

    const fetchPIDetails = async (piNumber) => {
        try {
            const response = await axios.post(
                `${Server}/api/Printing_API/getPIDetails`, {
                pi_number: piNumber,
                machine: MachineNO
            });
            const data = response.data;
            if (Array.isArray(data)) {
                setPiDetails(data);

                // Determine which rows are selectable based on statuses
                const toBePrintedRows = new Set(data.map((detail, index) => detail.status === "To-be-Printed"
                    ? index : -1).filter(index => index !== -1));
                const toPrintRows = new Set(data.map((detail, index) => detail.status === "To-Print"
                    ? index : -1).filter(index => index !== -1));
                // Combine both sets to allow selection
                const allSelectableRows = new Set([...toBePrintedRows, ...toPrintRows]);

                setSelectedRows(allSelectableRows);
                setIsAllocateDisabled(toBePrintedRows.size === 0);
                setIsUpdateDisabled(toPrintRows.size === 0); // Enable Update button if there are "To-Print" rows
                setIsAllocateClicked(toPrintRows.size > 0);
            } else {
                setPiDetails([]);
                setSelectedRows(new Set());
                setIsAllocateDisabled(true);
                setIsUpdateDisabled(true);
                setIsAllocateClicked(false)
            }
            console.log("GetPI Details", data);
        } catch (error) {
            // console.error("Error fetching PI details:", error);
            toast.error(error.response.data.detail);
            setPiDetails([]);
            setSelectedRows(new Set());
            setIsAllocateDisabled(true);
            setIsUpdateDisabled(false);
        }
    };




    useEffect(() => {
        // const userData = JSON.parse(localStorage.getItem('userData'));
        const userData = JSON.parse(Cookies.get('userData'));
        console.log(userData)
        if (!userData) {
            navigate('/');
        } else {
            setUserFirstName(userData.user_firstname);
            setuserLastName(userData.user_lastname);
            setMachineNO(userData.user_info);
            setUserName(userData.username);
            setUserRole(userData.user_role);
        }

        startCountdown();

        const handleUserActivity = () => {
            resetCountdown();
        };

        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keypress', handleUserActivity);

        return () => {
            clearTimeout(timerRef.current);
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keypress', handleUserActivity);
        };
    }, [navigate, UserRole]);

    useEffect(() => {
        if (MachineNO) {
            if (["PL", "SIM", "CLS"].some((keyword) => MachineNO.includes(keyword))) {
                navigate("/Pcs");
            } else if (MachineNO.startsWith("NOVEX")) {
                navigate("/Novex");
            } else {
                navigate("/Home");
            }
        }
    }, [MachineNO, navigate, UserRole]);


    useEffect(() => {

        if (MachineNO || refetchData) {
            const fetchData = async () => {

                try {
                    const response = await axios.get(`${Server}/api/Printing_API/getPINumber?machine=${MachineNO}`);
                    const piData = response.data;
                    const toPrintPI = piData.find(item => item.status === "To-Print")?.pi_number || null;
                    setToPrintPI(toPrintPI);
                    // if (selectedCustomer == 'ALL') {
                    //     if (toPrintPI) {
                    //         Swal.fire('', `${toPrintPI} is a To-Print PI. Please update it before proceeding.`, 'info');
                    //     }
                    // }
                    setGetPiNumber(piData);
                    // filterPiNumbers(selectedCustomer, piData);
                    filterPiNumbers(selectedCustomer, selectedShift, piData, searchQuery);
                    console.log("GetPI Number", piData);

                    // Reset refetchData after fetching
                    setRefetchData(false);
                } catch (error) {
                    toast.error(error.response.data.detail);
                    console.log(error);
                }
            };
            fetchData();

        }
    }, [MachineNO, selectedCustomer, refetchData,]);


    const filterPiNumbers = (customer, shift, piData, searchQuery) => {
        // Filter PI numbers by customer
        let filtered = piData.filter(item => {
            return customer === 'ALL' || item.brand === customer;
        });

        // Filter by shift
        filtered = filtered.filter(item => {
            return shift === 'ALL' || item.shift === shift;
        });

        // Filter by search query 
        if (searchQuery) {
            filtered = filtered.filter(item => {
                return item.pi_number.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }

        // Separate "To-Print" and "To-be-Printed" items
        const toBePrinted = filtered.filter(item => item.status === "To-be-Printed");
        const toPrint = filtered.filter(item => item.status === "To-Print");

        // Combine filtered PI numbers
        setFilteredPiNumbers([...toPrint, ...toBePrinted]);

        // Check for "To-Print" PI and show alert if found
        // const toPrintPI = toPrint[0];
        // if (toPrintPI) {
        //     Swal.fire(
        //         '',
        //         `${toPrintPI.pi_number} is a To-Print PI. Please update it before proceeding.`,
        //         'info'
        //     );
        // }
    };

    const handleCustomerChange = (e) => {
        const customer = e.target.value;
        setSelectedCustomer(customer);
        setSelectedItem('')
        filterPiNumbers(customer, selectedShift, getPiNumber, searchQuery);
    };

    const handleShift = (e) => {
        const shift = e.target.value;
        setselectedShift(shift);
        setSelectedItem('')
        filterPiNumbers(selectedCustomer, shift, getPiNumber, searchQuery);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        filterPiNumbers(selectedCustomer, selectedShift, getPiNumber, e.target.value);

    }

    const handleGenerated = async () => {
        setShowLoaderForFile(true);
        try {
            console.log('fileOutputType', SelectedFIleType)

            const response = await axios.post(`${FileGeneration}/api/Printing_API/file_generation`,
                {
                    "pi_number": selectedItem,
                    "file_output_type": SelectedFIleType,
                    "machine": MachineNO
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

            if (response.statusText === "OK") {
                const epcData = response.data;
                console.log("file Generated", epcData);
                setIsAllocateClicked(true);
                setIsUpdateDisabled(false);
                setIsAllocateDisabled(true);
                setGetEPC(epcData);

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'File is Generated Successfully',
                    showConfirmButton: false,
                    timer: 3000, // 3 seconds
                    background: '#f0f0f0',
                    customClass: {
                        title: 'swal2-title',
                        popup: 'swal2-popup',
                        icon: 'swal2-icon'
                    }
                });
            } else {
                toast.error('File Has Not Been Updated!');
            }
        } catch (error) {
            console.error('Error generating File:', error);
            // Swal.fire('Error', 'Failed to generate File.', 'error');
            toast.error(error.response.data.detail);
        }
        finally {
            setShowLoaderForFile(false)
        }
    }

    useEffect(() => {
        if (selectedItem) {
            const selectedItemDetails = getPiNumber.find(detail => detail.pi_number === selectedItem);

            if (selectedItemDetails) {
                setIsAllocateDisabled(selectedItemDetails.status === "To-Print");
            }
        }
    }, [selectedItem, piDetails, getPiNumber]);


    const handleAllocate = async () => {
        setShowFgPage(true)
        setIsAllocateDisabled(true);

        // setShowLoader(true);

        // // Convert selectedRows Set to an array and map to the required format
        // const selectedData = Array.from(selectedRows).map(index => {
        //     const detail = piDetails[index];
        //     console.log("detail selected data ", detail)

        //     let FileOutputType = '';
        //     if (MachineNO.includes('PL')) {
        //         FileOutputType = 'xml';
        //     } else if (MachineNO.includes('SIM') || MachineNO.includes('CLS')) {
        //         FileOutputType = 'excel';
        //     }

        //     return {
        //         pi_number: selectedItem || '',
        //         ean_number: detail.article_number || '',
        //         purch_order: detail.purchorder || detail.category2 || detail.po_number || '',
        //         quantity: detail.quantity || '',
        //         file_output_type: FileOutputType,
        //         machine: MachineNO || '',
        //         version_no: '2.2.1',
        //         operator: `${UserFirstName} ${userLastName}` || ''
        //     };
        // })

        // const requestData = { insertData: selectedData };
        // console.log("requestData EPC", requestData);

        // try {
        //     const response = await axios.post(`${Server}/api/Printing_API/epc_generation`, requestData, {
        //         headers: {
        //             'Content-Type': 'application/json',
        //         }
        //     });

        //     if (response.statusText === "OK") {
        //         const epcData = response.data;
        //         console.log("EPC Generated", epcData);
        //         setIsAllocateClicked(true);
        //         setIsUpdateDisabled(true);
        //         setIsAllocateDisabled(true);
        //         setGetEPC(epcData);

        //         Swal.fire({
        //             icon: 'success',
        //             title: 'Success',
        //             text: 'EPC Has Been Successfully Generated! Then click on update ',
        //             showConfirmButton: false,
        //             timer: 3000, // 3 seconds
        //             background: '#f0f0f0',
        //             customClass: {
        //                 title: 'swal2-title',
        //                 popup: 'swal2-popup',
        //                 icon: 'swal2-icon'
        //             }
        //         });
        //     } else {
        //         toast.error('EPC Has Not Been Updated!');
        //     }
        // } catch (error) {
        //     if (error.response.data.detail) {
        //         toast.error(error.response.data.detail);
        //     } else {
        //         toast.error('An error occurred during login.');
        //     }
        //     console.error(error);
        // } finally {
        //     setShowLoader(false);
        //     setRefetchData(true);
        // }
    };

    const handleCopyFGCode = (sourceIndex) => {
        const valueToCopy = fgCodes[sourceIndex];
        // if (!valueToCopy || valueToCopy.length !== 2) {
        //     Swal.fire("Invalid FG Code", "Enter a valid 2-digit number before copying.", "warning");
        //     return;
        // }

        if (!valueToCopy || valueToCopy.length < 2 || valueToCopy.length > 3) {
              Swal.fire("Invalid FG Code", "Enter a valid 2 or 3-digit number before copying.", "warning");
              return;
            }

        setFgCodes((prev) => {
            const updated = { ...prev };
            selectedRows.forEach((i) => {
                updated[i] = valueToCopy; // Copy to all selected
            });
            return updated;
        });
    };

    const handleclosefg=async()=>{
        setShowFgPage(false)
        setIsAllocateDisabled(false)
    }


    const handleFgCodeSubmit = async () => {
            // 🔍 Find all invalid FG code rows
    const invalidFGRows = Array.from(selectedRows).filter(
        (index) => !fgCodes[index] || fgCodes[index].length < 2 || fgCodes[index].length > 3
      );
  
      if (invalidFGRows.length > 0) {
        const rowDetails = invalidFGRows.map((index) => {
          const detail = piDetails[index];
          console.log('detail',detail)
          return `Row ${index + 1} (Article: ${detail.article_number || "N/A"})`;
        });
  
        Swal.fire(
          "Invalid FG Codes",
          `\n\n${rowDetails.join("\n")}`,
          "warning"
        );
        return;
      } 
        setShowFgPage(false); 
        setShowLoader(true);

        // Convert selectedRows Set to an array and map to the required format
        const selectedData = Array.from(selectedRows).map(index => {
            const detail = piDetails[index];
            console.log("detail selected data ", detail)

            let FileOutputType = '';
            if (MachineNO.includes('PL')) {
                FileOutputType = 'xml';
            } else if (MachineNO.includes('SIM') || MachineNO.includes('CLS')) {
                FileOutputType = 'excel';
            }

            return {
                pi_number: selectedItem || '',
                fg_code: fgCodes[index] || '', 
                ean_number: detail.article_number || '',
                purch_order: detail.purchorder || detail.category2 || detail.po_number || '',
                quantity: detail.quantity || '',
                file_output_type: FileOutputType,
                machine: MachineNO || '',
                version_no: '2.2.1',
                operator: `${UserFirstName} ${userLastName}` || ''
            };
        })

        const requestData = { insertData: selectedData };
        console.log("requestData EPC", requestData);

        try {
            const response = await axios.post(`${Server}/api/Printing_API/epc_generation`, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.statusText === "OK") {
                const epcData = response.data;
                console.log("EPC Generated", epcData);
                setIsAllocateClicked(true);
                setIsUpdateDisabled(true);
                setIsAllocateDisabled(true);
                setGetEPC(epcData);

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Allocation & FG  Has Been Successfully Submited',
                    showConfirmButton: false,
                    timer: 3000, // 3 seconds
                    background: '#f0f0f0',
                    customClass: {
                        title: 'swal2-title',
                        popup: 'swal2-popup',
                        icon: 'swal2-icon'
                    }
                });
            } else {
                toast.error('Allocation & FG Has Not Been Submit !');
            }
        } catch (error) {
            if (error.response.data.detail) {
                toast.error(error.response.data.detail);
            } else {
                toast.error('An error occurred during allocation & FG.');
            }
            console.error(error);
        } finally {
            setShowLoader(false);
            setRefetchData(true);
        }
    };


    const handleUpdate = async () => {
        try {
            // Aggregate all selected ean_numbers and purchase orders
            const eanNumbers = Array.from(selectedRows).map((index) => {
                const detail = piDetails[index];
                return detail.article_number;
            });
            const Purchorder = Array.from(selectedRows).map((index) => {
                const detail = piDetails[index];
                return detail.purchorder || "";
            });
            const selectedData = {
                pi_number: selectedItem || "",
                ean_number: eanNumbers,
                purch_order: Purchorder,
                machine: MachineNO || "",
                force_update: 'NO',
            };

            console.log("Selected Data:", selectedData);
            setSelectedData(selectedData);

            const response = await axios.post(`${Server}/api/Printing_API/update_fetch_data`, selectedData, {
                headers: { "Content-Type": "application/json" },
            });

            console.log("ResponseGetData", response.data.data);
            setSummaryData(response.data.data);
            console.log('response.data.res_check', response.data.res_check);

            const { diff, order_qty, prod_qty } = response.data.res_check;

            if (diff > 0) {
                const { value: isConfirm } = await Swal.fire({
                    title: 'Do you really want to Update?',
                    text: `Differences ${diff} Qty that have not been updated. Order Qty- ${order_qty} And production Qty- ${prod_qty}`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Force Update',
                    cancelButtonText: 'Cancel Update',
                    reverseButtons: true,
                });

                console.log("isConfirm", isConfirm);
                if (!isConfirm) return;

                const percentageDiff = ((order_qty - prod_qty) / order_qty) * 100;
                setpercentageDiff(percentageDiff)

                console.log("percentageDiff", percentageDiff)
                if (percentageDiff <= 9) {
                    await executeForceUpdate(selectedData, true);
                } else {
                    setShowPasswordPrompt(true);
                    setIsUpdateDisabled(false);
                    setIsAllocateClicked(false);
                }
            } else {

                setIsUpdateDisabled(true);
                setIsAllocateClicked(false);
                setRefetchData(true);
                toast.success(`${selectedItem} Update Successfully`)
                setSelectedItem('')
                setIsAllocateDisabled(true);
            }
        } catch (error) {
            // console.error("API call error:", error);
            toast.error(error.response.data.detail);
        }
    };

    const executeForceUpdate = async (selectedData, isForced) => {
        try {
            const forceUpdateData = {
                ...selectedData,
                force_update: isForced ? 'YES' : 'NO',
            };

            console.log("Force Update Data:", forceUpdateData);

            const forceUpdateResponse = await axios.post(`${Server}/api/Printing_API/update_fetch_data`, forceUpdateData, {
                headers: { 'Content-Type': 'application/json' },
            });

            console.log("ResponseGetData after force update", forceUpdateResponse.data.data);
            setSummaryData(forceUpdateResponse.data.data);
            setRefetchData(true);

            toast.success(`${selectedItem} Update Successfully`)

            setSelectedItem('')

            await logInsert(selectedData.pi_number, forceUpdateResponse.data.res_check.diff, percentageDiff);
        } catch (error) {
            toast.error(error.response.data.detail);
            // console.error("Error during force update:", error);
        }
    };

    const logInsert = async (pi_number, diff, percentageDiff) => {
        console.log("percentageDiffinlog", percentageDiff)
        try {
            const LogInsertResponse = await axios.post(
                `${LogInsert}/api/log_insert/?software=PrintingMaster&type=INFO&details=${UserFirstName} has Force Updated pi_number=${pi_number} Differences ${diff} Qty  Differences  ${percentageDiff} % .`,
                { headers: { 'Content-Type': 'application/json' } }
            );
            console.log('LogInsertResponse', LogInsertResponse.data.message);
            setIsAllocateClicked(false)
            setIsUpdateDisabled(true)
        } catch (error) {
            // console.error("API for Log Insert call error:", error);
            toast.error(error.response.data.detail);
        }
    };

    const handlePasswordSubmit = async () => {
        try {
            const response = await axios.post(`${Server}/logIN/token`, {
                username: userName,
                password: Password,
            }, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            // console.log("response.data",response.status==200)

            if (response.status == 200) {
                await executeForceUpdate(selectedData, true);
                setShowPasswordPrompt(false)
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.detail) {
                toast.error(error.response.data.detail);
            } else {
                toast.error('An error occurred during login.');
            }
            console.error("Error during login:", error);
        }
    };

    const getOptions = () => {
        if (MachineNO === 'PL') {
            return (
                <>
                    <option value="">Select file Type</option>
                    <option value="xml">Xml</option>
                </>
            );
        }

        if (selectedItem.startsWith('TT')) {
            return (
                <><option value="">Select File Type</option>
                    <option value="ARTICLEWISE">ARTICLEWISE</option>
                    <option value="POWISE">POWISE</option>
                    <option value="SINGLE">SINGLE</option>
                    <option value="SIZEWISE">SIZEWISE</option>
                    <option value="COLORWISE">COLORWISE</option>
                </>
            );
        }

        if (selectedItem.startsWith('SU')) {
            return (
                <><option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                    <option value="SIZEWISE">SIZEWISE</option>
                </>
            );
        }

        if (selectedItem.startsWith('CC')) {
            return (
                <><option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                    <option value="SIZEWISE">SIZEWISE</option>
                    <option value="ARTICLEWISE">ARTICLEWISE</option>
                </>
            );
        }

        if (selectedItem.startsWith('TRI')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                    <option value="ARTICLEWISE">ARTICLEWISE</option>
                </>
            );
        }

        if (selectedItem.startsWith('BH')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                </>
            );
        }

        if (selectedItem.startsWith('BL')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                </>
            );
        }

        if (selectedItem.startsWith('HP')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                </>
            );
        }

        if (selectedItem.startsWith('NV')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                    <option value="ARTICLEWISE">ARTICLEWISE</option>
                </>
            );
        }

        if (selectedItem.startsWith('CP_BRAHMA')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                </>
            );
        }

        if (selectedItem.startsWith('ZE')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                    <option value="SIZEWISE">SIZEWISE</option>

                </>
            );
        }
        if (selectedItem.startsWith('CP_AV')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                </>
            );
        }
        if (selectedItem.startsWith('CP_OZ')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                </>
            );
        }

        if (selectedItem.startsWith('WEL')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                </>
            );
        }

        if (selectedItem.startsWith('BHG') || selectedItem.startsWith('ALOK')) {
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                    <option value="ARTICLEWISE">ARTICLEWISE</option>
                </>
            );
        }
        if (selectedItem.startsWith('SN') || selectedItem.startsWith('FP') || selectedItem.startsWith('CG') || selectedItem.startsWith('IH') || selectedItem.startsWith('GC') ){
            return (
                <>
                    <option value="">Select File Type</option>
                    <option value="SINGLE">SINGLE</option>
                </>
            );
        }
        return <option value="">Select File Type</option>;
    };

    return (
        <div className='Pcs_Main_Container'>
            {(showLoader || showLoaderForfile) && (
                <div className='Loader_Overlay'>
                    <div className="CreateLoader">
                        <span className="loader"></span>
                        {showLoader ? <h6>Please Wait, Allocatting...</h6> : <h6>Please Wait, File Generating...</h6>}
                    </div>
                </div>
            )}
            {showPasswordPrompt && (
                <div className="password-prompt">
                    <div className="password-prompt-header">
                        <h2>Enter Password</h2>
                        <button className="close-button" onClick={() => setShowPasswordPrompt(false)}>
                            <MdClose />
                        </button>
                    </div>
                    <input
                        type="password"
                        value={Password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                    />
                    <button onClick={handlePasswordSubmit}>Submit</button>
                </div>
            )}
            {ShowFgPage && (
                <div className="fg-prompt">
                    <div className="fg-prompt-header">
                        <h2>Enter FG Codes</h2>
                        <button className="close-button-fg" onClick={handleclosefg}>
                            <MdClose />
                        </button>
                    </div>

                    <div className="fg-table-wrapper">
                        <table className="fg-table">
                            <thead>
                                <tr>
                                    <th>Sr No</th>
                                    <th>FG Code</th>
                                    <th>EAN Number</th>
                                    <th>Purchase Order</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from(selectedRows).map((originalIndex, i) => {
                                    const detail = piDetails[originalIndex] || {};

                                    return (
                                        <tr key={originalIndex}>
                                            <td>{i + 1}</td>
                                            <td>
                                                <input
                                                    type="text"
                                                    maxLength={3}
                                                    value={fgCodes[originalIndex] || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/[^0-9]/g, "");
                                                        setFgCodes((prev) => ({ ...prev, [originalIndex]: value }));
                                                    }}
                                                    placeholder="FG"
                                                    className="fg-code-input"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyFGCode(originalIndex)}
                                                    style={{
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        fontSize: "1rem",
                                                    }}
                                                    title="Copy to selected rows"
                                                >
                                                    <FaRegCopy size={15} />
                                                </button>
                                            </td>
                                            <td>{detail.article_number || ''}</td>
                                            <td>{detail.purchorder || detail.category2 || detail.po_number || ''}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <button onClick={handleFgCodeSubmit} className="submit-fg-button">
                        Submit
                    </button>
                </div>
            )}

            <div className='Pcs_Container'>
                <div className='Pcs_Container_Header'>
                    <img src={logo} alt='TagId Logo' />
                    <div className='Pcs_Container_Header_companyName'>
                        <label>Customer:</label>
                        <select value={selectedCustomer} onChange={handleCustomerChange}>
                            <option value="ALL">ALL</option>
                            <option value="TT">TATA Trent</option>
                            <option value="SU">Style Union</option>
                            <option value="CC">Crimson Club</option>
                            <option value="TRI">Trident</option>
                            <option value="BH">Big Hello</option>
                            <option value="BL">Blazo</option>
                            <option value="HP">Hindustan pencil</option>
                            <option value="NV">Navneet</option>
                            <option value="WEL">Welspun</option>
                            <option value="BHG">BHG</option>
                            <option value="ALOK">Alok</option>
                            <option value="ZE">zecode</option>
                            <option value="CP_BRAHMA">Brahma</option>
                            <option value="CP_OZ">Ozarck</option>
                            <option value="CP_AV">avia</option>
                            <option value="GC">Go Colour</option>
                            <option value="IH">I Home</option>
                            <option value="CG">Creative Garments</option>
                            <option value="FP">Focus Prints</option>
                            <option value="SN">Snitch</option>
                        </select>
                    </div>
                    <div className="Pcs_Container_Header_companyName">
                        <label>Shift:</label>
                        <select value={selectedShift} onChange={handleShift}>
                            <option value="ALL">ALL</option>
                            <option value="First">First</option>
                            <option value="Second">Second</option>
                            <option value="Third">Third</option>
                        </select>
                    </div>
                    <div className='Pcs_Container_Header_machine_no'><h6>Machine No-{MachineNO}</h6></div>
                    <div className='Pcs_Container_Header_Username'>
                        <CgProfile color='rgb(57, 112, 231)' size={30} />
                        <h3>{UserFirstName} {userLastName}</h3>
                        <FiLogOut
                            color='orange'
                            size={30}
                            cursor="pointer"
                            onClick={handleLogout}
                        />
                    </div>
                </div>
                <input className='Pcs_Container_Grid_search' typeof='text' placeholder='Search PI Number' value={searchQuery} onChange={handleSearchChange}></input>
                <div className='Pcs_Container_Grid'>
                    <div className='Pcs_Container_Grid_PI'>
                        {filteredPiNumbers.map((piNumberObj, index) => {
                            const piNumber = piNumberObj.pi_number;
                            const isSelected = piNumber === selectedItem;
                            const isToPrint = piNumberObj.status === "To-Print";

                            return (
                                <li
                                    key={index}
                                    onClick={() => handleClick(piNumber)}
                                    className={`${isSelected ? 'selected' : ''} ${isToPrint ? 'to-print' : ''}`}
                                    style={{ cursor: toPrintPI && piNumber !== toPrintPI ? 'pointer' : 'pointer' }}
                                // style={{ cursor: toPrintPI && piNumber !== toPrintPI ? 'not-allowed' : 'pointer' }}
                                >
                                    {piNumber}
                                </li>
                            );
                        })}
                    </div>

                    <div className='Pcs_Container_Grid_PI_details'>
                        {selectedItem && (
                            <div className='Pcs_Container_Grid_PI_details_heading'>
                                <h6>Select Pi No - {selectedItem}</h6>
                            </div>
                        )}
                        {isAllocateClicked && selectedItem && (
                            <>
                                <div className='Pcs_Container_Grid_PI_details_fileType'>
                                    <label>Select Output type -</label>
                                    <select value={SelectedFIleType} onChange={(e) => setSelectedFIleType(e.target.value)}>
                                        {getOptions()}
                                    </select>
                                </div>
                                {SelectedFIleType && (
                                    <div className='Pcs_Container_Grid_PI_details_GeneratedButton'>
                                        <button onClick={handleGenerated}>{MachineNO === "PL" ? ' Generate Xml File' : 'Generate Excel file'}</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </div>
                <div className='Pcs_Container_Bottom'>
                    <button disabled={IsAllocateDisabled || !selectedItem}
                        onClick={handleAllocate}
                    >Allocate</button>
                    {SummaryData && (<>
                        <div className="Pcs_Container_Bottom_Summary">
                            <h6>Printed Article (This Machine): {SummaryData['Printed_Articles_(TM)']}</h6>
                            <h6>Total Printed Articles: {SummaryData['Printed_Articles_Count']}</h6>
                            <h6>Total Articles: {SummaryData['Article_Count']}</h6>
                        </div>
                        <div className="Pcs_Container_Bottom_Summary">
                            <h6>Printed Quantity (This Machine): {SummaryData['Printed_Quantity_(TM)']}</h6>
                            <h6>Total Printed Quantity: {SummaryData['Total_Printed_Quantity']}</h6>
                            <h6>Total Print Quantity: {SummaryData['Total_Print_Quantity']}</h6>
                        </div></>
                    )}
                    <button disabled={isUpdateDisabled}
                        onClick={handleUpdate}>Update</button>
                </div>
            </div>
        </div>
    );
};

export default Pcs;
