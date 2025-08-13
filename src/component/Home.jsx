import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { FaRegCopy } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import logo from "../assets/TagIDLogo.png";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "@sweetalert2/theme-dark/dark.css";
import axios from "axios";
import { LogInsert, Server } from "../App";
import { MdClose } from 'react-icons/md';
import Cookies from 'js-cookie'; // Make sure to import js-cookie





const getSortedDetails = (piDetails, sortConfig) => {
  return [...piDetails]
    .map((item, index) => ({ ...item, originalIndex: index }))
    .sort((a, b) => {
      if (sortConfig.key === null) return 0;

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;

      if (sortConfig.key === 'quantity') {
        const aQuantity = Number(aValue);
        const bQuantity = Number(bValue);

        return sortConfig.direction === 'ascending' ? aQuantity - bQuantity : bQuantity - aQuantity;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
};

const Home = () => {
  const [selectedItem, setSelectedItem] = useState("");
  const [getPiNumber, setGetPiNumber] = useState([]);
  const [filteredPiNumbers, setFilteredPiNumbers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("ALL");
  const [selectedShift, setselectedShift] = useState("ALL");
  const [userName, setUserName] = useState("");
  const [UserFirstName, setUserFirstName] = useState("");
  const [userLastName, setuserLastName] = useState("");
  const [UserRole, setUserRole] = useState("");
  const [MachineNO, setMachineNO] = useState("");
  const [piDetails, setPiDetails] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [IsAllocateDisabled, setIsAllocateDisabled] = useState(true);
  const [PINumber, setPINumbers] = useState("");
  const [SummaryData, setSummaryData] = useState(null);
  const [GetEPC, setGetEPC] = useState("");
  const [toPrintPI, setToPrintPI] = useState(null);
  const [refetchData, setRefetchData] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [Password, setPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [batch_no, setbatch_no] = useState("");
  const [ShowBatch, setShowBatch] = useState(false);
  const [showLoaderforpigrid, setshowLoaderforpigrid] = useState(false);
  const [TataUpdate, setTataUpdate] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [percentageDiff, setpercentageDiff] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchQuery, setSearchQuery] = useState("");
  const [fgCodes, setFgCodes] = useState({});
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const sortedDetails = getSortedDetails(piDetails, sortConfig);
  // Set Countdown in milliseconds
  const startCountdown = () => {
    timerRef.current = setTimeout(() => {
      toast.warn("Logging out due to inactivity...");
      handleLogout();
    }, 600000); // 10  min 
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
    if (toPrintPI && piNumber !== toPrintPI) {
      toast.warn(`Please update the ${toPrintPI} PI before selecting another.`);
      return;
    }
    setSelectedItem(piNumber);
    fetchPIDetails(piNumber);

    // Uncheck the "Select All"
    setIsSelectAllChecked(false);
    setSelectedRows(new Set());
  };

  const fetchPIDetails = async (piNumber) => {
    try {
      const response = await axios.post(
        `${Server}/api/Printing_API/getPIDetails`, {
        pi_number: piNumber,
        machine: MachineNO
      }
      );
      const data = response.data;
      if (Array.isArray(data)) {
        setPiDetails(data);
        const toPrintRows = new Set();

        data.forEach((detail, index) => {
          if (detail.status === "To-Print") {
            toPrintRows.add(index);
          }
        });

        setSelectedRows(toPrintRows);
        setIsAllocateDisabled(toPrintRows.size > 0);
        setIsUpdateDisabled(toPrintRows.size === 0);
      } else {
        setPiDetails([]);
        setSelectedRows(new Set());
        setIsAllocateDisabled(true);
        setIsUpdateDisabled(true);
      }
      console.log("GetPI Details", data);
    } catch (error) {
      toast.error(error.response.data.detail);
      setPiDetails([]);
      setSelectedRows(new Set());
      setIsAllocateDisabled(true);
      setIsUpdateDisabled(true);
    }
  };

  useEffect(() => {
    // const userData = JSON.parse(localStorage.getItem("userData"));
    const userData = JSON.parse(Cookies.get('userData'));

    console.log(userData);
    if (!userData) {
      navigate("/");
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

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keypress", handleUserActivity);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keypress", handleUserActivity);
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
        setshowLoaderforpigrid(true);

        try {
          const response = await axios.get(
            `${Server}/api/Printing_API/getPINumber?machine=${MachineNO}`
          );
          const piData = response.data;
          const toPrintPI =
            piData.find((item) => item.status === "To-Print")?.pi_number ||
            null;
          setToPrintPI(toPrintPI);

          // if (toPrintPI) {
          //   Swal.fire(
          //     "",
          //     `${toPrintPI} is a To-Print PI. Please update it before proceeding.`,
          //     "info"
          //   );
          // }
          setGetPiNumber(piData);
          // filterPiNumbers(selectedCustomer, piData);
          // filterShift(selectedShift, piData);
          filterPiNumbers(selectedCustomer, selectedShift, piData, searchQuery);
          console.log("GetPI Number", piData);
          console.log("selectedCustomer", selectedCustomer);
          setshowLoaderforpigrid(false);
          // Reset refetchData after fetching
          setRefetchData(false);
        } catch (error) {
          toast.error(error.response.data.detail);
        }
      };
      fetchData();
    }
  }, [MachineNO, selectedCustomer, refetchData, selectedShift]);

  const filterPiNumbers = (customer, shift, piData, searchQuery) => {
    let filtered = piData;

    // Filter by customer
    if (customer !== "ALL") {
      filtered = filtered.filter((item) => item.brand === customer);
    }
    // Filter by search query 
    if (searchQuery) {
      filtered = filtered.filter(item => {
        return item.pi_number.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    // Filter by shift
    if (shift !== "ALL") {
      filtered = filtered.filter((item) => item.shift === shift);
    }

    // Separate to-be-printed and to-print items
    const toBePrinted = filtered.filter((item) => item.status === "To-be-Printed");
    const toPrint = filtered.filter((item) => item.status === "To-Print");

    // Combine and update the state
    setFilteredPiNumbers([...toPrint, ...toBePrinted]);
  };


  const handleCustomerChange = (e) => {
    const customer = e.target.value;
    console.log(customer)
    setSelectedCustomer(customer);
    setPiDetails([]);
    setSelectedItem('')
    filterPiNumbers(customer, selectedShift, getPiNumber, searchQuery);
  };

  const handleShift = (e) => {
    const shift = e.target.value;
    setselectedShift(shift);
    setPiDetails([]);
    setSelectedItem('')
    filterPiNumbers(selectedCustomer, shift, getPiNumber, searchQuery);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    filterPiNumbers(selectedCustomer, selectedShift, getPiNumber, e.target.value);

  }
  useEffect(() => {
    if (selectedItem) {
      const selectedItemDetails = getPiNumber.find(detail => detail.pi_number === selectedItem);

      if (selectedItemDetails) {
        setIsAllocateDisabled(selectedItemDetails.status === "To-Print");
      }
    }
  }, [selectedItem, piDetails, getPiNumber]);


  const handleCopyFGCode = (sourceIndex) => {
    const valueToCopy = fgCodes[sourceIndex];
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




  const handleAllocate = async () => {
    // 🔍 Find all invalid FG code rows
    const invalidFGRows = Array.from(selectedRows).filter(
      (index) => !fgCodes[index] || fgCodes[index].length < 2 || fgCodes[index].length > 3
    );

    if (invalidFGRows.length > 0) {
      const rowDetails = invalidFGRows.map((index) => {
        const detail = piDetails[index];
        console.log('detail', detail)
        return `Row ${index + 1} (Article: ${detail.article_number || "N/A"})`;
      });

      Swal.fire(
        "Invalid FG Codes",
        `\n\n${rowDetails.join("\n")}`,
        "warning"
      );
      return;
    }
    if (selectedItem.startsWith('WEL') || selectedItem.startsWith('TRI') || selectedItem.startsWith('HP') || selectedItem.startsWith('NV')) {
      setShowBatch(true)
    }
    else if (selectedItem.startsWith('TT')) {
      const { value: isConfirmBatch } = await Swal.fire({
        text: 'Do want to Use Batch Wise ?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'YES',
        cancelButtonText: 'NO',
        reverseButtons: true,
      });

      console.log("isConfirmBatch", isConfirmBatch);
      // if (!isConfirmBatch) return;
      if (isConfirmBatch) {
        setShowBatch(true);
        setTataUpdate(true)
        return;
      }
      else {
        handleDefaultAllocation();
        return;
      }
    }
    else {
      handleDefaultAllocation();
    }
  }

  const handleDefaultAllocation = async () => {
    if (selectedRows.size === 0) {
      Swal.fire(
        "Error",
        "Please select at least one row to allocate.",
        "error"
      );
      return;
    }

    setShowLoader(true);

    const selectedData = Array.from(selectedRows).map((index) => {
      const detail = piDetails[index];
      console.log("Selected data ", detail);

      // console.log('po_number in allocate button' ,detail.po_number)

      //pass file_type accoding to machine no
      let FileOutputType = "";
      if (MachineNO.includes("PL")) {
        FileOutputType = "xml";
      } else if (MachineNO.includes("SIM") || MachineNO.includes("CLS")) {
        FileOutputType = "excel";
      } else {
        FileOutputType = "";
      }
      console.log('allocate data ', detail.purchorder, detail.category2, detail.po_number)
      return {
        pi_number: selectedItem || "",
        fg_code: fgCodes[index] || "",
        ean_number: detail.article_number || "",
        purch_order: detail.purchorder || detail.category2 || detail.po_number || "",
        // purch_order:passaspurchorder || "",
        quantity: detail.quantity || "",
        file_output_type: FileOutputType,
        machine: MachineNO || "",
        version_no: "2.2.1",
        operator: `${UserFirstName} ${userLastName}` || "",
      };
    });

    const requestData = { insertData: selectedData };
    console.log("requestData EPC", requestData);

    try {
      const response = await axios.post(
        // console.log(`${Server}/api/Printing_API/epc_generation`)
        `${Server}/api/Printing_API/epc_generation`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // response.status === 200  response.statusText === "OK"
      if (response.statusText === "OK") {
        const epcData = response.data;
        console.log("EPC Generated", epcData);
        setIsUpdateDisabled(false);
        setIsAllocateDisabled(true);
        setGetEPC(epcData);
        // Show SweetAlert success notification
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "EPC Haas Bean Successfully Generated! Then click on update ",
          showConfirmButton: false,
          timer: 1000, // 3 seconds
          background: "#f0f0f0",
          customClass: {
            title: "swal2-title",
            popup: "swal2-popup",
            icon: "swal2-icon",
          },
        });
        await fetchPIDetails(selectedItem);
      } else {
        toast.error("EPC Has Not Been Updated!");
      }
    } catch (error) {
      console.error("Error generating EPC:", error);
      toast.error(error.response.data.detail);
    } finally {
      setShowLoader(false);
      setRefetchData(true);
      // fetchPIDetails();
    }
  };

  const handleUpdate = async () => {
    setFgCodes('')
    try {
      console.log("Enter in handle update function");
      const eanNumbers = Array.from(selectedRows).map((index) => {
        const detail = piDetails[index];
        return detail.article_number;
      });

      const Purchorder = Array.from(selectedRows).map((index) => {
        const detail = piDetails[index];
        return detail.purchorder;
      });

      const category2 = Array.from(selectedRows).map((index) => {
        const detail = piDetails[index];
        return detail.category2;
      });

      const ponumber = Array.from(selectedRows).map((index) => {
        const detail = piDetails[index];
        return detail.po_number;
      });

      // console.log('update data in purchorder', Purchorder, category2, ponumber)

      let passaspurchorder = [];
      // Check for non-empty arrays that don't contain undefined
      if (Array.isArray(Purchorder) && Purchorder.length > 0 && Purchorder.every(item => item !== undefined)) {
        passaspurchorder = Purchorder;
      } else if (Array.isArray(category2) && category2.length > 0 && category2.every(item => item !== undefined)) {
        passaspurchorder = category2;
      } else if (Array.isArray(ponumber) && ponumber.length > 0 && ponumber.every(item => item !== undefined)) {
        passaspurchorder = ponumber;
      } else {
        passaspurchorder = [""];
      }


      // detail.purchorder || detail.category2 || detail.po_number || ""

      console.log('passaspurchorder', passaspurchorder)

      const selectedData = {
        pi_number: selectedItem || "",
        ean_number: eanNumbers,
        purch_order: passaspurchorder,
        machine: MachineNO || "",
        force_update: 'NO',
      };


      console.log("selectedData:", selectedData);

      const getApiEndpoint = (selectedItem) => {
        // console.log("apiendpoit hit");
        // console.log('selectedItem', selectedItem);
        if (selectedItem.startsWith('WEL') || selectedItem.startsWith('TRI') || selectedItem.startsWith('HP') || (TataUpdate && selectedItem.startsWith('TT'))) {
          setTataUpdate(false)
          return `${Server}/api/Printing_API/Walmart_sb/update_fetch_data`;

        }
        return `${Server}/api/Printing_API/update_fetch_data`;
      };

      console.log("Selected Data:", selectedData);
      setSelectedData(selectedData);

      const apiEndpoint = getApiEndpoint(selectedItem);
      const response = await axios.post(apiEndpoint, selectedData, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("ResponseGetData", response);
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
        setpercentageDiff(percentageDiff);
        console.log("percentageDiff", percentageDiff);

        if (percentageDiff <= 9) {
          await executeForceUpdate(selectedData, true);
        } else {
          setShowPasswordPrompt(true);
        }
      } else {
        setRefetchData(true);
        setIsAllocateDisabled(false);
        await fetchPIDetails(selectedItem);
      }
    } catch (error) {
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

      const getApiEndpoint = (selectedItem) => {
        console.log("apiendpoit hit");
        console.log('selectedItem', selectedItem);
        if (selectedItem.startsWith('WEL') || selectedItem.startsWith('TRI') || selectedItem.startsWith('HP') || selectedItem.startsWith('NV') || selectedItem.startsWith('TT')) {
          return `${Server}/api/Printing_API/Walmart_sb/update_fetch_data`;
        }
        return `${Server}/api/Printing_API/update_fetch_data`;
      };

      const apiEndpoint = await getApiEndpoint(selectedItem);
      const forceUpdateResponse = await axios.post(apiEndpoint, forceUpdateData, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("ResponseGetData after force update", forceUpdateResponse.data.data);
      setSummaryData(forceUpdateResponse.data.data);
      setRefetchData(true);
      await fetchPIDetails(selectedItem);

      await logInsert(forceUpdateData, forceUpdateResponse.data.res_check.diff, percentageDiff);
    } catch (error) {
      // console.error("Error during force update:", error);
      toast.error(error.response.data.detail);
    }
  };

  const logInsert = async (forceUpdateData, diff, percentageDiff) => {
    try {
      const LogInsertResponse = await axios.post(
        `${LogInsert}/api/log_insert/?software=PrintingMaster&type=Force Updated&details=${UserFirstName} has Force Updated ${JSON.stringify(forceUpdateData)} Differences ${diff} Qty.`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('LogInsertResponse', LogInsertResponse.data.message);
      //
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

      if (response.status == 200) {
        await executeForceUpdate(selectedData, true);
        setShowPasswordPrompt(false)
        // setRefetchData(true);
        setIsAllocateDisabled(false);
        setIsUpdateDisabled(false)
        await fetchPIDetails(selectedItem);
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


  const handleBatchSubmit = async () => {

    if (batch_no && Number(batch_no) > 5000) {
      toast.warn("Please Enter Less than 5000", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    if (selectedRows.size === 0) {
      Swal.fire(
        "Error",
        "Please select at least one row to allocate.",
        "error"
      );
      return;
    }
    setShowBatch(false)
    setShowLoader(true);


    const selectedData = Array.from(selectedRows).map((index) => {
      const detail = piDetails[index];
      console.log("Selected data ", detail);

      //pass file_type accoding to machine no
      let FileOutputType = "";
      if (MachineNO.includes("PL")) {
        FileOutputType = "xml";
      } else if (MachineNO.includes("SIM") || MachineNO.includes("CLS")) {
        FileOutputType = "excel";
      } else {
        FileOutputType = "";
      }

      return {
        pi_number: selectedItem || "",
        fg_code: fgCodes[index] || "",
        ean_number: detail.article_number || "",
        purch_order: detail.purchorder || detail.category2 || detail.po_number || "",
        quantity: detail.quantity || "",
        file_output_type: FileOutputType,
        machine: MachineNO || "",
        version_no: "2.2.1",
        operator: `${UserFirstName} ${userLastName}` || "",
        batch_no: `${batch_no}`
      };
    });

    const requestData = { insertData: selectedData };
    console.log("requestData EPC", requestData);

    try {
      const response = await axios.post(
        `${Server}/api/Printing_API/Walmart_sb/epc_generation`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // response.status === 200  response.statusText === "OK"
      if (response.statusText === "OK") {
        const epcData = response.data;
        console.log("EPC Generated", epcData);
        setIsUpdateDisabled(false);
        setIsAllocateDisabled(true);
        setGetEPC(epcData);
        // Show SweetAlert success notification
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "EPC Haas Bean Successfully Generated! Then click on update ",
          showConfirmButton: false,
          timer: 1000, // 3 seconds
          background: "#f0f0f0",
          customClass: {
            title: "swal2-title",
            popup: "swal2-popup",
            icon: "swal2-icon",
          },
        });
        await fetchPIDetails(selectedItem);
      } else {
        toast.error("EPC Has Not Been Updated!");
      }
    } catch (error) {
      console.error("Error generating EPC:", error);
      // Swal.fire("Error", "Failed to generate EPC.", "error");
      toast.error(error.response.data.detail);
    } finally {
      setShowLoader(false);
      setRefetchData(true);
      // fetchPIDetails();
    }
  };


  const hasToPrint = piDetails.some((detail) => detail.status === "To-Print");

  const handleSelectAllChange = () => {
    const newSelectedRows = new Set();

    if (!isSelectAllChecked) {
      piDetails.forEach((detail, index) => {
        if (detail.status !== "To-Print") {
          newSelectedRows.add(index);
        }
      });
    }

    setSelectedRows(newSelectedRows);
    setIsSelectAllChecked(!isSelectAllChecked);

    const hasToBePrinted = Array.from(newSelectedRows).some(
      (i) => piDetails[i].status === "To-be-Printed"
    );
    const hasToPrint = Array.from(newSelectedRows).some(
      (i) => piDetails[i].status === "To-Print"
    );

    setIsAllocateDisabled(!hasToBePrinted && newSelectedRows.size > 0);
    setIsUpdateDisabled(!hasToPrint && newSelectedRows.size > 0);
  };

  const handleCheckboxChange = (index) => {
    const newSelectedRows = new Set(selectedRows);
    const selectedDetail = piDetails[index];
    const hasToPrintSelected = Array.from(selectedRows).some(
      (i) => piDetails[i].status === "To-Print"
    );

    if (hasToPrintSelected && selectedDetail.status !== "To-Print") {
      return;
    }

    if (selectedDetail.status === "To-Print") {
      return;
    }

    if (newSelectedRows.has(index)) {
      newSelectedRows.delete(index);
    } else {
      newSelectedRows.add(index);
    }

    setSelectedRows(newSelectedRows);

    setIsSelectAllChecked(newSelectedRows.size === piDetails.length);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });
  };


  return (
    <div className="Main_Container">
      {showLoader && (
        <div className="Loader_Overlay">
          <div className="CreateLoader">
            <span className="loader"></span>
            <h6>Please Wait, EPC Generated...</h6>
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
      {ShowBatch && (
        <div className="password-prompt">
          <div className="password-prompt-header">
            <h2>Quantity</h2>
            <button className="close-button" onClick={() => setShowBatch(false)}>
              <MdClose />
            </button>
          </div>
          <input
            type="number"
            value={batch_no}
            onChange={(e) => setbatch_no(e.target.value)}
            placeholder="Batch Quantity"
          />
          <button onClick={handleBatchSubmit}>Submit</button>
        </div>
      )}
      <div className="Container">
        <div className="Container_Header">
          <img src={logo} alt="TagId Logo" />
          <div className="Container_Header_companyName">
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
              <option value="AL">Alok</option>
              <option value="ZE">zecode</option>
              <option value="CP_BRAMHA">Bramha</option>
              <option value="CP_OZ">Ozarck</option>
              <option value="CP_AV">avia</option>
              <option value="GC">Go Colour</option>
              <option value="IH">I Home</option>
              <option value="CG">Creative Garments</option>
              <option value="FP">Focus Prints</option>
              <option value="SN">Snitch</option>
              <option value="SH">Sheridan</option>
              <option value="MN">Manaca</option>
              <option value="CL">Continuity Label</option>
            </select>
          </div>
          <div className="Container_Header_companyName">
            <label>Shift:</label>
            <select value={selectedShift} onChange={handleShift}>
              <option value="ALL">ALL</option>
              <option value="First">First</option>
              <option value="Second">Second</option>
              <option value="Third">Third</option>
            </select>
          </div>
          <div className="Container_Header_machine_no">
            <h6>Machine No-{MachineNO}</h6>
          </div>
          <div className="Container_Header_Username">
            {/* <CgProfile color="rgb(57, 112, 231)" size={30} /> */}

            <lord-icon
              // src="https://cdn.lordicon.com/kdduutaw.json"
              src="https://cdn.lordicon.com/cniwvohj.json"
              trigger="in"
              colors="primary:#3970E7,secondary:#08a88a"
              style={{ width: '40px', height: '40px' }}
            ></lord-icon>

            <h3>
              {UserFirstName} {userLastName}
            </h3>
            {/* <lord-icon
              // src="https://cdn.lordicon.com/kdduutaw.json"
              src="https://cdn.lordicon.com/jzzzcrxv.json"
              trigger="hover"
              stroke="bold"
              colors="primary:#FF8C00,secondary:#FF8C00"
              style={{ width: '40px', height: '40px' }}
              cursor="pointer"
              onClick={handleLogout}
            ></lord-icon> */}

            <FiLogOut
              color="orange"
              size={30}
              cursor="pointer"
              onClick={handleLogout}
            />
          </div>
        </div>
        <input className='Container_Grid__search' typeof='text' placeholder='Search PI Number' value={searchQuery} onChange={handleSearchChange}></input>
        <div className="Container_Grid">
          <div className="Container_Grid_PI">
            {showLoaderforpigrid && (
              <div className="CreateLoader" style={{
                marginLeft: '8%',
                marginTop: '6%',
              }}>
                <span className="loader"></span>
                <h6>Please Wait,Loading PI...</h6>
              </div>
            )}
            {filteredPiNumbers.map((piNumberObj, index) => {
              const piNumber = piNumberObj.pi_number; // Get the pi_number from the object
              const isSelected = piNumber === selectedItem;
              const isToPrint = piNumberObj.status === "To-Print";

              return (
                <li
                  key={index}
                  onClick={() => handleClick(piNumber)}
                  className={`${isSelected ? "selected" : ""} ${isToPrint ? "to-print" : ""
                    }`}
                  style={{
                    cursor:
                      toPrintPI && piNumber !== toPrintPI
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {piNumber}
                </li>
              );
            })}

          </div>

          <div className="Container_Grid_PI_details">
            {piDetails.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedRows.size === piDetails.length}
                        onChange={handleSelectAllChange}
                        disabled={hasToPrint} />
                      All
                    </th>
                    <th>FG Code</th>
                    {Object.keys(piDetails[0]).map((key) => (
                      <th key={key} onClick={() => handleSort(key)} style={{ cursor: 'pointer' }}>
                        {(key.charAt(0).toUpperCase() + key.slice(1)).replace("_", " ")}
                        {sortConfig.key === key && (
                          <span>
                            {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedDetails.map((detail, index) => {
                    const originalIndex = detail.originalIndex; //  original index
                    const isToPrint = detail.status === "To-Print";
                    const hasToPrintSelected = Array.from(selectedRows).some(
                      (i) => piDetails[i].status === "To-Print"
                    );

                    // Remove the originalIndex field from the detail
                    const detailWithoutIndex = { ...detail };
                    delete detailWithoutIndex.originalIndex;

                    return (
                      <tr key={originalIndex} className="container-tr-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(originalIndex)}
                            onChange={() => handleCheckboxChange(originalIndex)}
                            disabled={isToPrint || hasToPrintSelected}
                          />
                        </td>
                        <td style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                          <input
                            type="text"
                            maxLength={3}
                            value={fgCodes[originalIndex] || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, "");
                              setFgCodes((prev) => ({ ...prev, [originalIndex]: value }));
                            }}
                            placeholder="FG"
                            disabled={!selectedRows.has(originalIndex) || isToPrint}
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
                        {Object.keys(detailWithoutIndex).map((key) => (
                          <td key={key}>{detailWithoutIndex[key]}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            ) : (
              <h5>No Data Found... Please Select PI</h5>
            )}
          </div>
        </div>
        <div className="Container_Bottom">
          <button
            disabled={IsAllocateDisabled || selectedRows.size === 0}
            onClick={handleAllocate}
          >
            Allocate
          </button>
          {SummaryData && (
            <>
              <div className="Container_Bottom_Summary">
                <h6>
                  Printed Article (This Machine):{" "}
                  {SummaryData["Printed_Articles_(TM)"]}
                </h6>
                <h6>
                  Total Printed Articles:{" "}
                  {SummaryData["Printed_Articles_Count"]}
                </h6>
                <h6>Total Articles: {SummaryData["Article_Count"]}</h6>
              </div>
              <div className="Container_Bottom_Summary">
                <h6>
                  Printed Quantity (This Machine):{" "}
                  {SummaryData["Printed_Quantity_(TM)"]}
                </h6>
                <h6>
                  Total Printed Quantity:{" "}
                  {SummaryData["Total_Printed_Quantity"]}
                </h6>
                <h6>
                  Total Print Quantity: {SummaryData["Total_Print_Quantity"]}
                </h6>
              </div>
            </>
          )}
          <button
            disabled={isUpdateDisabled || selectedRows.size === 0}
            onClick={handleUpdate}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
