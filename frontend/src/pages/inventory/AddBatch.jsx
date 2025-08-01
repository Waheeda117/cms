import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import {
  Pill,
  Plus,
  Loader,
  Hash,
  Barcode,
  Banknote,
  FileDigit,
  ChevronDown,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Box,
  DollarSign,
  Check,
  X,
  Edit,
  Calendar,
} from "lucide-react";
import {
  MEDICINES,
  getMedicineById,
  getMedicineByName,
} from "../../constants/selectOptions";
import { addToStock } from "../../api/api";
import { useAuthStore } from "../../store/authStore";
import { useAddBatchStore } from "../../store/addBatchStore";
import Modal from "../../components/UI/Modal";

const AddBatch = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { batchDetails: routeBatchDetails, attachments = [] } =
    location.state || {};

  const { user } = useAuthStore();

  const {
    medicines,
    miscellaneousAmount,
    currentMedicine,
    addMedicine,
    removeMedicine,
    updateMedicine,
    setMiscellaneousAmount,
    setCurrentMedicine,
    updateCurrentMedicineField,
    resetCurrentMedicine,
    clearBatchData,
    initializeBatch,
  } = useAddBatchStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({
    price: "",
    quantity: "",
    expiryDate: "",
  });
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const dropdownRef = useRef(null);

  // const [medicines, setMedicines] = useState([]);
  // const [miscellaneousAmount, setMiscellaneousAmount] = useState(0);
  // const [currentMedicine, setCurrentMedicine] = useState({
  //   medicineName: "",
  //   quantity: "",
  //   price: "",
  //   expiryDate: "",
  // });

  useEffect(() => {
    if (routeBatchDetails) {
      initializeBatch(routeBatchDetails);
    } else {
      navigate("/inventory-management");
    }
  }, [routeBatchDetails, navigate, initializeBatch]);

  const batchDetails = routeBatchDetails;

  useEffect(() => {
    if (
      currentMedicine.medicineName &&
      currentMedicine.medicineName !== searchTerm
    ) {
      setSearchTerm("");
    }
  }, [currentMedicine.medicineName]);

  // Set default expiry date (2 years from now) when component mounts
  useEffect(() => {
    const defaultExpiryDate = new Date();
    defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 2);
    const defaultExpiryString = defaultExpiryDate.toISOString().split("T")[0];

    setCurrentMedicine((prev) => ({
      ...prev,
      // expiryDate: defaultExpiryString
    }));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMedicineDropdown(false);
      }
    };

    if (showMedicineDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMedicineDropdown]);

  // Determine redirect path based on user role
  const redirectPath =
    user?.role === "admin"
      ? "/admin/inventory-management"
      : user?.role === "pharmacist_inventory"
      ? "/pharmacist_inventory/inventory-management"
      : "/inventory-management";

  const isMedicineFormValid = useMemo(() => {
    if (currentMedicine.medicineId === 1) {
      // MISCELLANEOUS ID
      return true;
    }
    return (
      currentMedicine.medicineId &&
      currentMedicine.medicineName &&
      currentMedicine.quantity &&
      parseInt(currentMedicine.quantity) > 0 &&
      currentMedicine.price &&
      parseFloat(currentMedicine.price) > 0 &&
      currentMedicine.expiryDate
    );
  }, [currentMedicine]);

  const totalMedicinePrice = useMemo(() => {
    return medicines.reduce((total, medicine) => {
      return total + parseFloat(medicine.price) * parseInt(medicine.quantity);
    }, 0);
  }, [medicines]);

  const totalQuantity = useMemo(() => {
    return medicines.reduce((total, medicine) => {
      return total + parseInt(medicine.quantity);
    }, 0);
  }, [medicines]);

  const remainingAmount = useMemo(() => {
    if (!batchDetails?.overallPrice) return 0;
    const remaining =
      parseFloat(batchDetails.overallPrice) - totalMedicinePrice;
    return Math.max(0, remaining);
  }, [totalMedicinePrice, batchDetails]);

  const totalWithMiscellaneous = totalMedicinePrice + miscellaneousAmount;

  const priceDifference = useMemo(() => {
    if (!batchDetails?.overallPrice) return 0;
    return Math.abs(
      totalWithMiscellaneous - parseFloat(batchDetails.overallPrice)
    );
  }, [totalWithMiscellaneous, batchDetails]);

  const isPriceExceeded =
    totalWithMiscellaneous > parseFloat(batchDetails?.overallPrice || 0);

  // Update miscellaneous amount when remaining amount changes
  useEffect(() => {
    if (currentMedicine.medicineName === "MISCELLANEOUS") {
      updateCurrentMedicineField("price", remainingAmount.toFixed(2));
    }
  }, [
    remainingAmount,
    currentMedicine.medicineName,
    updateCurrentMedicineField,
  ]);

  const hasPriceMismatch = priceDifference > 0.001;
  const canAddBatch = !hasPriceMismatch && medicines.length > 0;

  const handleMedicineInputChange = (e) => {
    const { name, value } = e.target;
    updateCurrentMedicineField(name, value);
    if (error) setError("");
  };

  const handleMedicineSelect = (medicine) => {
    const updatedMedicine = {
      ...currentMedicine,
      medicineId: medicine.id,
      medicineName: medicine.name,
      quantity: medicine.id === 1 ? "" : currentMedicine.quantity,
      price:
        medicine.id === 1 ? remainingAmount.toFixed(2) : currentMedicine.price,
      expiryDate: medicine.id === 1 ? "" : currentMedicine.expiryDate,
    };

    setCurrentMedicine(updatedMedicine);
    setShowMedicineDropdown(false);
    setSearchTerm("");
  };

  const addMedicineToList = () => {
    if (!isMedicineFormValid) {
      setError("Please fill all required fields with valid values");
      return;
    }

    // Check for duplicate medicine
    const existingMedicine = medicines.find(
      (med) => med.medicineId === currentMedicine.medicineId
    );
    if (existingMedicine) {
      setError(
        "This medicine is already added to the list. Please select a different medicine."
      );
      return;
    }

    if (currentMedicine.medicineId === 1) {
      // MISCELLANEOUS
      const miscAmount = parseFloat(currentMedicine.price) || 0;
      setMiscellaneousAmount(miscAmount);
    } else {
      // Calculate what the new total would be if we add this medicine
      const newMedicineTotal =
        parseFloat(currentMedicine.price) * parseInt(currentMedicine.quantity);
      const newGrandTotal =
        totalMedicinePrice + newMedicineTotal + miscellaneousAmount;

      // Check if adding this medicine would exceed the total price
      if (newGrandTotal > parseFloat(batchDetails?.overallPrice || 0)) {
        setError("Adding this medicine would exceed the total batch price.");
        return;
      }

      addMedicine({
        ...currentMedicine,
        quantity: parseInt(currentMedicine.quantity),
        price: parseFloat(currentMedicine.price),
        expiryDate: currentMedicine.expiryDate,
      });
    }

    // Reset form
    resetCurrentMedicine();
    setError("");
  };

  // Updated decimal input handler - only allows dot (.) as decimal separator
  const handleDecimalInput = (e, fieldName, isEdit = false) => {
    let value = e.target.value;

    // Allow empty input
    if (value === "") {
      if (isEdit) {
        setEditValues((prev) => ({ ...prev, [fieldName]: value }));
      } else {
        updateCurrentMedicineField(fieldName, value);
      }
      return;
    }

    // Remove any non-numeric characters except dot (.)
    value = value.replace(/[^0-9.]/g, "");

    const dotIndex = value.indexOf(".");
    if (dotIndex !== -1) {
      value =
        value.substring(0, dotIndex + 1) +
        value.substring(dotIndex + 1).replace(/\./g, "");
    }

    // Ensure only one dot (.)
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit to 9 digits before decimal and 2 after
    if (parts[0] && parts[0].length > 9) {
      parts[0] = parts[0].substring(0, 9);
    }
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
    }

    value = parts.join(".");

    if (isEdit) {
      setEditValues((prev) => ({ ...prev, [fieldName]: value }));
    } else {
      updateCurrentMedicineField(fieldName, value);
    }
  };

  // const removeMedicine = (index) => {
  //   setMedicines((prev) => prev.filter((_, i) => i !== index));
  //   // Cancel editing if the medicine being edited is deleted
  //   if (editingIndex === index) {
  //     setEditingIndex(null);
  //     setEditValues({ price: "", quantity: "", expiryDate: "" });
  //   }
  // };

  const removeMiscellaneous = () => {
    setMiscellaneousAmount(0);
  };

  // Edit functionality
  const handleEdit = (index) => {
    const medicine = medicines[index];
    setEditingIndex(index);
    setEditValues({
      price: medicine.price.toString(),
      quantity: medicine.quantity.toString(),
      expiryDate: medicine.expiryDate,
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = (index) => {
    const newPrice = parseFloat(editValues.price);
    const newQuantity = parseInt(editValues.quantity);
    const newExpiryDate = editValues.expiryDate;

    // Validation
    if (isNaN(newPrice) || newPrice <= 0) {
      setError("Please enter a valid price");
      return;
    }
    if (isNaN(newQuantity) || newQuantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }
    if (!newExpiryDate) {
      setError("Please select an expiry date");
      return;
    }

    // Calculate the current total for this medicine
    const currentMedicineTotal =
      medicines[index].price * medicines[index].quantity;
    const newMedicineTotal = newPrice * newQuantity;

    // Calculate the difference this edit would make
    const difference = newMedicineTotal - currentMedicineTotal;
    const newGrandTotal = totalWithMiscellaneous + difference;

    // Check if editing would exceed the total price
    if (newGrandTotal > parseFloat(batchDetails?.overallPrice || 0)) {
      setError("Editing this medicine would exceed the total batch price.");
      return;
    }

    // Update the medicine using store
    updateMedicine(index, {
      price: newPrice,
      quantity: newQuantity,
      expiryDate: newExpiryDate,
    });

    // Reset edit state
    setEditingIndex(null);
    setEditValues({ price: "", quantity: "", expiryDate: "" });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValues({ price: "", quantity: "", expiryDate: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (medicines.length === 0) {
      setError("At least one medicine is required");
      return;
    }

    if (hasPriceMismatch) {
      if (isPriceExceeded) {
        setError(
          "Total medicine price has exceeded against this Cheque Number"
        );
      }
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        batchNumber: batchDetails.batchNumber,
        billID: batchDetails.billID,
        overallPrice: parseFloat(batchDetails.overallPrice),
        miscellaneousAmount: miscellaneousAmount,
        attachments,
        medicines: medicines.map((medicine) => ({
          medicineId: medicine.medicineId,
          medicineName: medicine.medicineName,
          quantity: medicine.quantity,
          price: medicine.price,
          expiryDate: medicine.expiryDate,
          dateOfPurchase: new Date().toISOString().split("T")[0],
          reorderLevel: 20,
        })),
      };

      const response = await addToStock(payload);
      setSuccess("Batch added successfully!");

      // Clear the stored data after successful submission
      clearBatchData();

      setTimeout(() => {
        navigate(redirectPath);
      }, 1500);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to add stock. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirmation = () => {
    setIsCancelModalOpen(true);
  };

  const handleCancelRedirect = () => {
    clearBatchData();
    navigate(redirectPath);
  };

  const isMiscellaneousSelected = currentMedicine.medicineId === 1;

  return (
    <div className={`${theme.background} min-h-screen p-6`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-2xl font-bold ${theme.textPrimary} mb-8`}>
          Batch Details
        </h1>

        {/* Batch Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-5xl">
          <div
            className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <Barcode className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                <p className={`text-sm ${theme.textMuted} truncate`}>
                  Batch Number
                </p>
              </div>
              <p
                className={`text-lg font-bold ${theme.textPrimary} ml-2 flex-shrink-0`}
              >
                {batchDetails?.batchNumber}
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <FileDigit className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <p className={`text-sm ${theme.textMuted} truncate`}>
                  Cheque Number
                </p>
              </div>
              <p
                className={`text-lg font-bold ${theme.textPrimary} ml-2 flex-shrink-0`}
              >
                {batchDetails?.billID}
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <Banknote className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                <p className={`text-sm ${theme.textMuted} truncate`}>
                  Total Amount
                </p>
              </div>
              <p
                className={`text-lg font-bold ${theme.textPrimary} ml-2 flex-shrink-0`}
              >
                PKR{" "}
                {batchDetails?.overallPrice
                  ? parseFloat(batchDetails.overallPrice).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Medicine Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg mb-6">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 mb-6">
            {/* Medicine Name */}
            <div className="relative" ref={dropdownRef}>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Medicine Name *
              </label>
              <div className="relative">
                <Pill
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                />
                <input
                  type="text"
                  name="medicineName"
                  value={currentMedicine.medicineName || searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowMedicineDropdown(true);
                    updateCurrentMedicineField("medicineName", e.target.value);
                  }}
                  onFocus={() => setShowMedicineDropdown(true)}
                  onBlur={(e) => {
                    // Small delay to allow dropdown item clicks to register
                    setTimeout(() => {
                      if (
                        !dropdownRef.current?.contains(document.activeElement)
                      ) {
                        setShowMedicineDropdown(false);
                      }
                    }, 150);
                  }}
                  className={`w-full pl-10 pr-10 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                  placeholder="Search medicine..."
                />
                <button
                  type="button"
                  onClick={() => setShowMedicineDropdown(!showMedicineDropdown)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme.textMuted}`}
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {showMedicineDropdown && (
                <div
                  className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md ${theme.card} shadow-lg ${theme.border} border`}
                >
                  <ul>
                    {MEDICINES.filter((medicine) =>
                      medicine.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                      .slice(0, 10)
                      .map((medicine) => (
                        <li
                          key={medicine.id}
                          onClick={() => handleMedicineSelect(medicine)}
                          className={`px-4 py-2 cursor-pointer hover:${
                            theme.cardSecondary
                          } ${theme.textPrimary} ${
                            medicine.name === "MISCELLANEOUS"
                              ? "bg-yellow-50 border-l-4 border-yellow-400"
                              : ""
                          }`}
                        >
                          {medicine.name}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Fields Row - Price, Quantity, and Expiry Date OR Miscellaneous Amount */}
            {isMiscellaneousSelected ? (
              <div>
                <label
                  className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                >
                  Miscellaneous Amount *
                </label>
                <div className="relative">
                  <DollarSign
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                  />
                  <input
                    type="text"
                    name="price"
                    value={currentMedicine.price}
                    onChange={(e) => handleDecimalInput(e, "price")}
                    step="0.1"
                    min="0"
                    max={remainingAmount}
                    className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    placeholder={`Remaining: ${remainingAmount.toFixed(2)}`}
                  />
                </div>
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  Remaining amount: PKR {remainingAmount.toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                  >
                    Price * <span className="text-xs">(max 9 digits)</span>
                  </label>
                  <div className="relative">
                    <Banknote
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                    />
                    <input
                      type="text"
                      name="price"
                      value={currentMedicine.price}
                      onChange={(e) => handleDecimalInput(e, "price")}
                      step="0.01"
                      min="0.01"
                      max="999999999.99"
                      className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                      placeholder="Enter price"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                  >
                    Quantity * <span className="text-xs">(max 5 digits)</span>
                  </label>
                  <div className="relative">
                    <Hash
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                    />
                    <input
                      type="number"
                      name="quantity"
                      value={currentMedicine.quantity}
                      onChange={handleMedicineInputChange}
                      min="1"
                      max="99999"
                      onInput={(e) => {
                        // Remove any non-digit characters
                        let value = e.target.value.replace(/[^0-9]/g, "");

                        // Limit to 5 digits
                        if (value.length > 5) {
                          value = value.substring(0, 5);
                        }

                        e.target.value = value;
                      }}
                      className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                  >
                    Expiry Date *
                  </label>
                  <div className="relative">
                    <Calendar
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                    />
                    <input
                      type="date"
                      name="expiryDate"
                      value={currentMedicine.expiryDate}
                      onChange={handleMedicineInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mb-8">
            <button
              type="button"
              onClick={addMedicineToList}
              disabled={!isMedicineFormValid}
              className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {isMiscellaneousSelected ? "Add Miscellaneous" : "Add Medicine"}
              </span>
            </button>
          </div>

          {/* Medicines Table */}
          <div
            className={`${theme.card} rounded-lg overflow-hidden border ${theme.borderSecondary} mb-4`}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme.cardSecondary}`}>
                  <tr>
                    <th
                      className={`px-4 py-3 text-left text-sm font-medium ${theme.textPrimary}`}
                    >
                      Medicine
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}
                    >
                      Quantity
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}
                    >
                      Price
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}
                    >
                      Expiry Date
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}
                    >
                      Total
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${theme.textPrimary}`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.length > 0 ? (
                    medicines.map((medicine, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? theme.card : theme.cardSecondary
                        } border-b ${theme.borderSecondary}`}
                      >
                        <td className="px-4 py-3">
                          <div
                            className={`flex items-center ${theme.textPrimary}`}
                          >
                            <Pill className="w-4 h-4 text-emerald-500 mr-2" />
                            <span>{medicine.medicineName}</span>
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                        >
                          {editingIndex === index ? (
                            <input
                              type="number"
                              name="quantity"
                              value={editValues.quantity}
                              onChange={handleEditInputChange}
                              min="1"
                              max="99999"
                              onInput={(e) => {
                                // Remove any non-digit characters
                                let value = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );

                                // Limit to 5 digits
                                if (value.length > 5) {
                                  value = value.substring(0, 5);
                                }

                                e.target.value = value;
                                handleEditInputChange(e);
                              }}
                              className={`w-20 px-2 py-1 text-center ${theme.input} rounded ${theme.borderSecondary} border ${theme.focus} focus:ring-1`}
                            />
                          ) : (
                            medicine.quantity
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                        >
                          {editingIndex === index ? (
                            <input
                              type="text"
                              name="price"
                              value={editValues.price}
                              onChange={(e) =>
                                handleDecimalInput(e, "price", true)
                              }
                              step="0.1"
                              min="0.1"
                              max="999999999.99"
                              className={`w-24 px-2 py-1 text-center ${theme.input} rounded ${theme.borderSecondary} border ${theme.focus} focus:ring-1`}
                            />
                          ) : (
                            `PKR ${medicine.price.toFixed(2)}`
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                        >
                          {editingIndex === index ? (
                            <input
                              type="date"
                              name="expiryDate"
                              value={editValues.expiryDate}
                              onChange={handleEditInputChange}
                              min={new Date().toISOString().split("T")[0]}
                              className={`w-32 px-2 py-1 text-center ${theme.input} rounded ${theme.borderSecondary} border ${theme.focus} focus:ring-1`}
                            />
                          ) : (
                            new Date(medicine.expiryDate).toLocaleDateString()
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary} font-medium`}
                        >
                          PKR{" "}
                          {editingIndex === index
                            ? (
                                parseFloat(editValues.price || 0) *
                                parseInt(editValues.quantity || 0)
                              ).toFixed(2)
                            : (medicine.quantity * medicine.price).toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                        >
                          <div className="flex justify-center items-center space-x-2">
                            {editingIndex === index ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(index)}
                                  className={`p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors`}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className={`p-1.5 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(index)}
                                  className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-blue-500 hover:text-white transition-colors`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeMedicine(index)}
                                  className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-red-500 hover:text-white transition-colors`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className={`text-center py-4 ${theme.textPrimary}`}
                      >
                        No medicines added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Miscellaneous Section */}
          {miscellaneousAmount > 0 && (
            <div
              className={`${theme.card} rounded-lg border ${theme.borderSecondary} mb-8 p-4`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-yellow-500 mr-2" />
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>
                      Miscellaneous Amount
                    </p>
                    <p className={`text-lg font-bold ${theme.textPrimary}`}>
                      PKR {miscellaneousAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeMiscellaneous}
                  className={`p-1.5 rounded-lg ${theme.cardSecondary} ${theme.textPrimary} hover:bg-red-500 hover:text-white transition-colors`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div
              className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
            >
              <div className="flex items-center">
                <Hash className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Total Quantity</p>
                  <p className={`text-xl font-bold ${theme.textPrimary}`}>
                    {totalQuantity} units
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
            >
              <div className="flex items-center">
                <Banknote className="w-5 h-5 text-green-500 mr-2" />
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>
                    Medicines Total
                  </p>
                  <p className={`text-xl font-bold ${theme.textPrimary}`}>
                    PKR {totalMedicinePrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
            >
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-yellow-500 mr-2" />
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Grand Total</p>
                  <p className={`text-xl font-bold ${theme.textPrimary}`}>
                    PKR {totalWithMiscellaneous.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
            >
              <div className="flex items-center">
                <Box className="w-5 h-5 text-purple-500 mr-2" />
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Batch Price</p>
                  <p className={`text-xl font-bold ${theme.textPrimary}`}>
                    PKR{" "}
                    {batchDetails?.overallPrice
                      ? parseFloat(batchDetails.overallPrice).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Mismatch Warning */}
          {medicines.length > 0 && hasPriceMismatch && isPriceExceeded && (
            <div
              className={`p-4 rounded-lg border border-red-500 bg-red-500 bg-opacity-10 flex items-center mb-8`}
            >
              <AlertCircle className={`w-5 h-5 text-red-500 mr-2`} />
              <div>
                <p className={`text-red-700 dark:text-red-300 font-medium`}>
                  Total medicine price has exceeded against this Cheque Number
                </p>
                <p className={`text-sm ${theme.textPrimary}`}>
                  Grand total (PKR {totalWithMiscellaneous.toFixed(2)}) exceeds
                  batch price (PKR{" "}
                  {parseFloat(batchDetails?.overallPrice || 0).toFixed(2)}) by
                  PKR {priceDifference.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleCancelConfirmation}
              className={`flex items-center justify-center space-x-2 px-6 py-3 ${theme.cardSecondary} border ${theme.borderSecondary} text-${theme.textPrimary} font-medium rounded-lg shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200`}
            >
              <span>Cancel</span>
            </button>

            {/* Add Batch Button */}
            <button
              type="submit"
              disabled={loading || !canAddBatch || editingIndex !== null}
              className={`flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Batch Creation"
        subtitle="Are you sure you want to cancel? All entered data will be lost."
      >
        <div className="p-6">
          <p className={`mb-6 ${theme.textPrimary}`}>
            This action cannot be undone. All medicines and miscellaneous
            amounts you've added will be permanently deleted.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className={`px-4 py-2 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary} text-${theme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              Go Back
            </button>
            <button
              onClick={handleCancelRedirect}
              className={`px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors`}
            >
              Proceed to Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddBatch;
