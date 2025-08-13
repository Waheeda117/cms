import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toLocalISODate } from "../../utils/date";
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
  Edit,
  Check,
  X,
  Calendar,
} from "lucide-react";
import {
  MEDICINES,
  getMedicineById,
  getMedicineByName,
} from "../../constants/selectOptions";
import { getBatchById, updateBatchById, finalizeBatch } from "../../api/api";
import { useAuthStore } from "../../store/authStore";
import { useBatchUpdateStore } from "../../store/batchUpdateStore";
import Modal from "../../components/UI/Modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const parseISOToLocalDate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const UpdateBatch = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { batchId } = useParams();
  const dropdownRef = useRef(null);

  const { user } = useAuthStore();

  // Zustand store for persistence
  const {
    setBatchData,
    getBatchData,
    updateMedicines,
    updateMiscellaneousAmount,
    clearBatchData,
    cleanupOldData,
  } = useBatchUpdateStore();

  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false); // New loading state for finalize
  const [batchIsDraft, setBatchIsDraft] = useState(false); // Track draft status

  // Edit mode state - Updated to include expiry date
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({
    price: "",
    quantity: "",
    expiryDate: "",
  });

  const [batchDetails, setBatchDetails] = useState({
    batchNumber: "",
    billID: "",
    overallPrice: "",
  });

  const persistentData = getBatchData(batchId);
  const [medicines, setMedicines] = useState(persistentData?.medicines || []);
  const [miscellaneousAmount, setMiscellaneousAmount] = useState(
    persistentData?.miscellaneousAmount || 0
  );
  const [currentMedicine, setCurrentMedicine] = useState({
    medicineId: null,
    medicineName: "",
    quantity: "",
    price: "",
    expiryDate: "",
  });

  const redirectPath =
    user?.role === "admin"
      ? "/admin/inventory-management"
      : user?.role === "pharmacist_inventory"
        ? "/pharmacist_inventory/inventory-management"
        : "/inventory-management";

  const submitRedirectPath =
    user?.role === "admin"
      ? `/admin/inventory-management/${batchId}`
      : user?.role === "pharmacist_inventory"
        ? `/pharmacist_inventory/inventory-management/${batchId}`
        : "/inventory-management";

  // Helper functions for date formatting
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return dateString; // Keep ISO format for internal use
  };

  const parseDisplayDate = (displayDate) => {
    if (!displayDate) return "";
    const [day, month, year] = displayDate.split("/");
    if (day && month && year) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return "";
  };

  // Auto-cleanup old data on component mount
  useEffect(() => {
    cleanupOldData();
  }, [cleanupOldData]);

  // Update persistent storage whenever medicines change
  useEffect(() => {
    if (batchId && medicines.length >= 0) {
      updateMedicines(batchId, medicines);
    }
  }, [medicines, batchId, updateMedicines]);

  // Update persistent storage whenever miscellaneous amount changes
  useEffect(() => {
    if (batchId) {
      updateMiscellaneousAmount(batchId, miscellaneousAmount);
    }
  }, [miscellaneousAmount, batchId, updateMiscellaneousAmount]);

  // Update persistent storage whenever current medicine form changes
  // useEffect(() => {
  //   if (
  //     batchId &&
  //     (currentMedicine.medicineId ||
  //       currentMedicine.medicineName ||
  //       currentMedicine.quantity ||
  //       currentMedicine.price ||
  //       currentMedicine.expiryDate)
  //   ) {
  //     updateCurrentMedicine(batchId, currentMedicine);
  //   }
  // }, [currentMedicine, batchId, updateCurrentMedicine]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMedicineDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        setLoading(true);
        const batch = await getBatchById(batchId);

        setBatchDetails({
          batchNumber: batch.data.batchNumber,
          billID: batch.data.billID,
          overallPrice: batch.data.overallPrice,
          isDraft: batch.data.isDraft,
        });

        setBatchIsDraft(batch.data.isDraft);

        // Only load from API if no persistent data exists
        const persistentBatchData = getBatchData(batchId);
        if (
          !persistentBatchData ||
          !persistentBatchData.medicines ||
          persistentBatchData.medicines.length === 0
        ) {
          const existingMedicines = Array.isArray(batch.data.medicines)
            ? batch.data.medicines.map((medicine) => {
              if (!medicine.medicineId) {
                const foundMedicine = getMedicineByName(
                  medicine.medicineName
                );
                return {
                  ...medicine,
                  medicineId: foundMedicine ? foundMedicine.id : null,
                };
              }
              return medicine;
            })
            : [];

          setMedicines(existingMedicines);
          setMiscellaneousAmount(batch.data.miscellaneousAmount || 0);

          // Store initial data in persistent storage
          setBatchData(batchId, {
            medicines: existingMedicines,
            miscellaneousAmount: batch.data.miscellaneousAmount || 0,
          });
        }
      } catch (error) {
        setError("Failed to fetch batch data. Please try again.");
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [batchId, getBatchData, setBatchData]);

  // Updated validation to include expiry date for non-miscellaneous items
  const isMedicineFormValid = useMemo(() => {
    if (currentMedicine.medicineId === 1) {
      return true;
    }

    const priceValid =
      currentMedicine.price &&
      parseFloat(currentMedicine.price) > 0 &&
      currentMedicine.price.toString().replace(".", "").length <= 9;

    const quantityValid =
      currentMedicine.quantity &&
      parseInt(currentMedicine.quantity) > 0 &&
      currentMedicine.quantity.toString().length <= 5;

    const expiryDateValid =
      currentMedicine.expiryDate &&
      new Date(currentMedicine.expiryDate) > new Date();

    return (
      currentMedicine.medicineId &&
      currentMedicine.medicineName &&
      quantityValid &&
      priceValid &&
      expiryDateValid
    );
  }, [currentMedicine]);

  const totalMedicinePrice = useMemo(() => {
    if (!medicines || !Array.isArray(medicines)) return 0;
    return medicines.reduce((total, medicine) => {
      return (
        total +
        parseFloat(medicine.price || 0) * parseInt(medicine.quantity || 0)
      );
    }, 0);
  }, [medicines]);

  const totalQuantity = useMemo(() => {
    if (!medicines || !Array.isArray(medicines)) return 0;
    return medicines.reduce((total, medicine) => {
      return total + parseInt(medicine.quantity || 0);
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

  const hasPriceMismatch = priceDifference > 0.001;
  const isPriceExceeded =
    totalWithMiscellaneous > parseFloat(batchDetails?.overallPrice || 0);
  const canUpdateBatch = !hasPriceMismatch && medicines && medicines.length > 0;

  useEffect(() => {
    if (currentMedicine.medicineId === 1) {
      setCurrentMedicine((prev) => ({
        ...prev,
        price: remainingAmount.toFixed(2),
      }));
    }
  }, [remainingAmount, currentMedicine.medicineId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBatchDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMedicineInputChange = (e) => {
    const { name, value } = e.target;

    let processedValue = value;
    if (name === "price" && value) {
      const digitsOnly = value.replace(".", "");
      if (digitsOnly.length > 9) {
        return;
      }
    }
    if (name === "quantity" && value) {
      if (value.length > 5) {
        return;
      }
    }

    setCurrentMedicine((prev) => ({ ...prev, [name]: processedValue }));
    if (error) setError("");
  };

  const handleMedicineSelect = (medicine) => {
    // Set default expiry date to 2 years from now when medicine is selected
    const defaultExpiryDate = new Date();
    defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 2);
    const defaultExpiryDateString = defaultExpiryDate
      .toISOString()
      .split("T")[0];

    setCurrentMedicine((prev) => ({
      ...prev,
      medicineId: medicine.id,
      medicineName: medicine.name,
      quantity: medicine.id === 1 ? "" : prev.quantity,
      price: medicine.id === 1 ? remainingAmount.toFixed(2) : prev.price,
      expiryDate: medicine.id === 1 ? "" : "", // Set default expiry for non-miscellaneous
    }));
    setShowMedicineDropdown(false);
    setSearchTerm("");
  };

  const checkPriceExceeded = (price, quantity) => {
    const medicineTotal = parseFloat(price) * parseInt(quantity);
    const newTotal = totalWithMiscellaneous + medicineTotal;
    return newTotal > parseFloat(batchDetails.overallPrice);
  };

  const checkEditPriceExceeded = (index, newPrice, newQuantity) => {
    const medicine = medicines[index];
    const currentMedicineTotal =
      parseFloat(medicine.price) * parseInt(medicine.quantity);
    const newMedicineTotal = parseFloat(newPrice) * parseInt(newQuantity);

    const newTotal =
      totalWithMiscellaneous - currentMedicineTotal + newMedicineTotal;
    return newTotal > parseFloat(batchDetails.overallPrice);
  };

  const addMedicineToList = () => {
    if (!isMedicineFormValid) {
      setError("Please fill all required fields with valid values");
      return;
    }

    // Skip duplicate check for miscellaneous
    if (currentMedicine.medicineId !== 1) {
      const existingMedicine = medicines.find(
        (med) => med.medicineId === currentMedicine.medicineId
      );
      if (existingMedicine) {
        setError(
          "This medicine is already added to the list. Please select a different medicine or update the existing entry."
        );
        return;
      }
    }

    if (
      currentMedicine.medicineId !== 1 &&
      checkPriceExceeded(currentMedicine.price, currentMedicine.quantity)
    ) {
      setError("Adding this medicine would exceed the total batch price");
      return;
    }

    if (currentMedicine.medicineId === 1) {
      const miscAmount = parseFloat(currentMedicine.price) || 0;
      setMiscellaneousAmount(miscAmount);
    } else {
      setMedicines((prev) => [
        ...prev,
        {
          ...currentMedicine,
          quantity: parseInt(currentMedicine.quantity),
          price: parseFloat(currentMedicine.price),
          expiryDate: currentMedicine.expiryDate, // Use the selected expiry date
        },
      ]);
    }

    setCurrentMedicine({
      medicineId: null,
      medicineName: "",
      quantity: "",
      price: "",
      expiryDate: "", // Reset expiry date
    });
    setError("");
  };

  const removeMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditValues({ price: "", quantity: "", expiryDate: "" });
    }
  };

  const removeMiscellaneous = () => {
    setMiscellaneousAmount(0);
  };

  const startEdit = (index, medicine) => {
    setEditingIndex(index);

    // Format the expiry date for the date input field
    let formattedExpiryDate = "";
    if (medicine.expiryDate) {
      // If the date is already in YYYY-MM-DD format, use it directly
      // Otherwise, convert it to the correct format
      const date = new Date(medicine.expiryDate);
      if (!isNaN(date.getTime())) {
        formattedExpiryDate = date.toISOString().split("T")[0];
      }
    }

    setEditValues({
      price: medicine.price.toString(),
      quantity: medicine.quantity.toString(),
      expiryDate: formattedExpiryDate, // Use formatted date
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValues({ price: "", quantity: "", expiryDate: "" });
  };

  const saveEdit = (index) => {
    const priceValid =
      editValues.price &&
      parseFloat(editValues.price) > 0 &&
      editValues.price.replace(".", "").length <= 9;

    const quantityValid =
      editValues.quantity &&
      parseInt(editValues.quantity) > 0 &&
      editValues.quantity.length <= 5;

    const expiryDateValid =
      editValues.expiryDate && new Date(editValues.expiryDate) > new Date();

    if (!priceValid || !quantityValid || !expiryDateValid) {
      setError(
        "Please enter valid price (max 9 digits), quantity (max 5 digits), and future expiry date"
      );
      return;
    }

    if (checkEditPriceExceeded(index, editValues.price, editValues.quantity)) {
      setError("Editing this medicine would exceed the total batch price");
      return;
    }

    setMedicines((prev) =>
      prev.map((medicine, i) =>
        i === index
          ? {
            ...medicine,
            price: parseFloat(editValues.price),
            quantity: parseInt(editValues.quantity),
            expiryDate: editValues.expiryDate, // Update expiry date
          }
          : medicine
      )
    );
    setEditingIndex(null);
    setEditValues({ price: "", quantity: "", expiryDate: "" });
    setError("");
  };

  const handleFinalize = async () => {
    setFinalizeLoading(true);
    setError("");
    setSuccess("");

    try {
      await finalizeBatch(batchId);
      setSuccess("Batch finalized successfully!");
      setBatchIsDraft(false); // Update local state

      // Optional: Refresh batch data
      const updatedBatch = await getBatchById(batchId);
      setBatchDetails(updatedBatch.data);

      setTimeout(() => {
        navigate(redirectPath);
      }, 1500);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to finalize batch. Please try again."
      );
    } finally {
      setFinalizeLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "price" && value) {
      const digitsOnly = value.replace(".", "");
      if (digitsOnly.length > 9) return;
    }
    if (name === "quantity" && value) {
      if (value.length > 5) return;
    }

    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

  // ... existing code ...

  const handleSubmit = async (e, finalize = false) => {
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

    setUpdateLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        batchNumber: batchDetails.batchNumber,
        billID: batchDetails.billID,
        overallPrice: parseFloat(batchDetails.overallPrice),
        miscellaneousAmount: miscellaneousAmount,
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

      // For draft batches, set isDraft based on finalize flag
      if (batchIsDraft) {
        payload.isDraft = !finalize;
      }

      const response = await updateBatchById(batchId, payload);

      if (batchIsDraft && finalize) {
        setSuccess("Batch finalized successfully!");
        setBatchIsDraft(false); // Update local state
      } else if (batchIsDraft) {
        setSuccess("Draft saved successfully!");
      } else {
        setSuccess("Batch updated successfully!");
      }

      // Clear persistent data after successful submit
      clearBatchData(batchId);
      navigate(redirectPath);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to update batch. Please try again."
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const proceedCancel = () => {
    clearBatchData(batchId);
    navigate(redirectPath);
  };

  const isMiscellaneousSelected = currentMedicine.medicineId === 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!batchDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center p-8 ${theme.cardOpacity} rounded-xl`}>
          <p className={`text-xl ${theme.textPrimary} mb-4`}>Batch not found</p>
          <button
            onClick={() => navigate(redirectPath)}
            className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.background} min-h-screen p-6`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-2xl font-bold ${theme.textPrimary} mb-8`}>
          Update Batch
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

          {/* Updated form layout to include expiry date */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Medicine Name Field */}
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
                    setCurrentMedicine((prev) => ({
                      ...prev,
                      medicineName: e.target.value,
                    }));
                  }}
                  onFocus={() => setShowMedicineDropdown(true)}
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
                          className={`px-4 py-2 cursor-pointer hover:${theme.cardSecondary
                            } ${theme.textPrimary} ${medicine.name === "MISCELLANEOUS"
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

            {/* Right side - Price, Quantity, and Expiry Date fields */}
            <div>
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
                      type="number"
                      name="price"
                      value={currentMedicine.price}
                      onChange={handleMedicineInputChange}
                      step="0.01"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Price Field */}
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
                        type="number"
                        name="price"
                        value={currentMedicine.price}
                        onChange={handleMedicineInputChange}
                        step="0.01"
                        min="0.01"
                        className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                        placeholder="Enter price"
                      />
                    </div>
                  </div>

                  {/* Quantity Field */}
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
                        className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                        placeholder="Enter quantity"
                      />
                    </div>
                  </div>

                  {/* Expiry Date Field */}
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
                      <DatePicker
                        selected={
                          currentMedicine.expiryDate
                            ? parseISOToLocalDate(currentMedicine.expiryDate) // ✅ no UTC shift
                            : null
                        }
                        onChange={(date) => {
                          const isoDate = date ? toLocalISODate(date) : "";   // ✅ safe YYYY-MM-DD
                          setCurrentMedicine((prev) => ({
                            ...prev,
                            expiryDate: isoDate,
                          }));
                        }}
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}
                        placeholderText="DD/MM/YYYY"
                        className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                        wrapperClassName="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
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

          {/* Updated table to include expiry date column */}
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
                  {medicines && medicines.length > 0 ? (
                    medicines.map((medicine, index) => (
                      <tr
                        key={`${medicine.medicineId}-${index}`}
                        className={`${index % 2 === 0 ? theme.card : theme.cardSecondary
                          } border-b ${theme.borderSecondary}`}
                      >
                        <td className="px-4 py-3">
                          <div
                            className={`flex items-center ${theme.textPrimary}`}
                          >
                            <Pill className="w-4 h-4 text-emerald-500 mr-2" />
                            <div>
                              <span>{medicine.medicineName}</span>
                            </div>
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
                              className={`w-20 px-2 py-1 text-center ${theme.input} rounded border ${theme.borderSecondary}`}
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
                              type="number"
                              name="price"
                              value={editValues.price}
                              onChange={handleEditInputChange}
                              step="0.01"
                              min="0.01"
                              className={`w-24 px-2 py-1 text-center ${theme.input} rounded border ${theme.borderSecondary}`}
                            />
                          ) : (
                            `PKR ${medicine.price.toFixed(2)}`
                          )}
                        </td>

                        {/* Expiry Date Column */}
                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                        >
                          {editingIndex === index ? (
                            <DatePicker
                              selected={
                                editValues.expiryDate
                                  ? parseISOToLocalDate(editValues.expiryDate) // ✅ no UTC shift
                                  : null
                              }
                              onChange={(date) => {
                                const iso = date ? toLocalISODate(date) : "";   // ✅ safe ISO (YYYY-MM-DD)
                                setEditValues((prev) => ({
                                  ...prev,
                                  expiryDate: iso,
                                }));
                              }}
                              dateFormat="dd/MM/yyyy"
                              minDate={new Date()}
                              placeholderText="DD/MM/YYYY"
                              className={`w-32 px-2 py-1 text-center ${theme.input} rounded ${theme.borderSecondary} border ${theme.focus} focus:ring-1`}
                            />

                          ) : medicine.expiryDate ? (
                            formatDateForDisplay(medicine.expiryDate)
                          ) : (
                            "N/A"
                          )}
                        </td>

                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary} font-medium`}
                        >
                          {editingIndex === index
                            ? `PKR ${(
                              parseFloat(editValues.quantity || 0) *
                              parseFloat(editValues.price || 0)
                            ).toFixed(2)}`
                            : `PKR ${(
                              medicine.quantity * medicine.price
                            ).toFixed(2)}`}
                        </td>

                        <td
                          className={`px-4 py-3 text-center ${theme.textPrimary}`}
                        >
                          <div className="flex justify-center space-x-2">
                            {editingIndex === index ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => saveEdit(index)}
                                  className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-green-500 hover:text-white transition-colors`}
                                  title="Save changes"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-gray-500 hover:text-white transition-colors`}
                                  title="Cancel edit"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(index, medicine)}
                                  className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-blue-500 hover:text-white transition-colors`}
                                  title="Edit medicine"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeMedicine(index)}
                                  className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-red-500 hover:text-white transition-colors`}
                                  title="Delete medicine"
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
                    PKR {parseFloat(batchDetails.overallPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {medicines &&
            medicines.length > 0 &&
            hasPriceMismatch &&
            isPriceExceeded && (
              <div
                className={`p-4 rounded-lg border border-red-500 bg-red-500 bg-opacity-10 flex items-center mb-8`}
              >
                <AlertCircle className={`w-5 h-5 text-red-500 mr-2`} />
                <div>
                  <p className={`text-red-700 dark:text-red-300 font-medium`}>
                    Total medicine price has exceeded against this Cheque Number
                  </p>
                  <p className={`text-sm ${theme.textPrimary}`}>
                    Grand total (PKR {totalWithMiscellaneous.toFixed(2)})
                    exceeds batch price (PKR{" "}
                    {parseFloat(batchDetails?.overallPrice || 0).toFixed(2)}) by
                    PKR {priceDifference.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

          {/* Submit Button Section - Updated */}
          <div className="flex justify-end gap-4">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateLoading}
              className={`flex items-center justify-center space-x-2 px-6 py-3 ${theme.cardSecondary} border ${theme.borderSecondary} text-${theme.textPrimary} font-medium rounded-lg shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>Cancel</span>
            </button>

            {/* Save Draft Button (only for drafts) */}
            {batchIsDraft && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={updateLoading || !canUpdateBatch || editingIndex !== null}
                className={`flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updateLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Saving Draft...</span>
                  </>
                ) : (
                  <>
                    <span>Save Draft</span>
                  </>
                )}
              </button>
            )}

            {/* Save Button (finalizes draft or updates finalized batch) */}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={updateLoading || !canUpdateBatch || editingIndex !== null}
              className={`flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {updateLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>{batchIsDraft ? "Saving..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <span>{batchIsDraft ? "Save" : "Save"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* NEW: Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Update"
        subtitle="Are you sure you want to cancel? All unsaved changes will be lost."
      >
        <div className="p-6">
          <p className={`${theme.textPrimary} mb-4`}>
            This action cannot be undone. Any changes you've made will be lost.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCancelModal(false)}
              className={`px-4 py-2 ${theme.textSecondary} rounded-lg`}
            >
              Cancel
            </button>
            <button
              onClick={proceedCancel}
              className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
            >
              Proceed
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UpdateBatch;
