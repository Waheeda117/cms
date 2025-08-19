import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import Modal from "../UI/Modal";
import {
  Package,
  Hash,
  Barcode,
  Banknote,
  FileDigit,
  List,
  Trash2,
  Paperclip,
} from "lucide-react";
import { uploadImage } from "../../api/api";

const AddStockModal = ({ isOpen, onClose, existingBatches }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [batchDetails, setBatchDetails] = useState({
    batchNumber: "",
    billID: "",
    overallPrice: "",
  });

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [validationError, setValidationError] = useState("");

  const isBatchValid =
    batchDetails.batchNumber &&
    batchDetails.billID &&
    batchDetails.overallPrice &&
    parseFloat(batchDetails.overallPrice) > 0;

const handleBatchInputChange = (e) => {
  const { name, value } = e.target;

  // Special handling for billID (cheque number) - only allow numeric input with max 7 digits
  if (name === 'billID') {
    // Remove any non-numeric characters and limit to 7 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 7);
    setBatchDetails((prev) => ({ ...prev, [name]: numericValue }));
  } 
  // Special handling for batchNumber - limit to 8 characters
  else if (name === 'batchNumber') {
    // Limit to 8 characters
    const limitedValue = value.slice(0, 8);
    setBatchDetails((prev) => ({ ...prev, [name]: limitedValue }));
  }
  // Special handling for overallPrice - limit to 8 digits (including decimal part)
  else if (name === 'overallPrice') {
    // Allow digits and one decimal point, limit total digits to 8
    const cleanValue = value.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    
    if (parts.length > 2) {
      // More than one decimal point, ignore this input
      return;
    }
    
    // Combine integer and decimal parts, limit total to 8 digits
    const totalDigits = (parts[0] || '').length + (parts[1] || '').length;
    if (totalDigits <= 8) {
      setBatchDetails((prev) => ({ ...prev, [name]: cleanValue }));
    }
  } 
  else {
    setBatchDetails((prev) => ({ ...prev, [name]: value }));
  }
};

  // Handle key press for cheque number input - prevent non-numeric characters
  const handleChequeNumberKeyPress = (e) => {
    // Allow backspace, delete, tab, escape, enter, and arrow keys
    if ([8, 9, 27, 13, 46, 37, 39, 38, 40].indexOf(e.keyCode) !== -1 ||
      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleAttachmentChange = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const uploadPromises = files.map((file) => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...urls]);
    } catch (error) {
      console.error("Attachment upload failed:", error);
      setValidationError("Failed to upload attachments");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (!isBatchValid || uploading) return;
    // Reset validation error
    setValidationError("");

    // Convert to lowercase for case-insensitive comparison
    const newBatchNumber = batchDetails.batchNumber.toLowerCase().trim();
    const newBillID = batchDetails.billID.toLowerCase().trim();

    // Create Sets for fast O(1) lookups
    const batchNumberSet = new Set();
    const billIDSet = new Set();

    // Populate Sets with existing values (lowercase and trimmed)
    existingBatches.forEach((batch) => {
      if (batch.batchNumber) {
        batchNumberSet.add(batch.batchNumber.toLowerCase().trim());
      }
      if (batch.billID) {
        billIDSet.add(batch.billID.toLowerCase().trim());
      }
    });

    // Check for duplicates using Set.has() for optimal performance
    const isBatchDuplicate = batchNumberSet.has(newBatchNumber);
    const isBillDuplicate = billIDSet.has(newBillID);

    // Handle validation errors
    if (isBatchDuplicate && isBillDuplicate) {
      setValidationError("Both batch number and Cheque Number already exist");
    } else if (isBatchDuplicate) {
      setValidationError("Batch number already exists");
    } else if (isBillDuplicate) {
      setValidationError("Cheque Number already exists");
    } else {
      // If no duplicates, proceed
      navigate("/add-batch", { state: { batchDetails, attachments } });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Details"
    // subtitle="Add new medicine batch to your inventory"
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-center mb-6">
          <div
            className={`p-4 rounded-full bg-emerald-500 bg-opacity-20 border border-current text-emerald-500`}
          >
            <Package className="w-8 h-8" />
          </div>
        </div>

        {/* Add validation error display */}
        {validationError && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {validationError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Batch Number */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Batch Number *
            </label>
            <div className="relative">
              <Barcode
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                name="batchNumber"
                value={batchDetails.batchNumber}
                onChange={handleBatchInputChange}
                maxLength={8}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                placeholder="Enter batch number (max 8 digits)"
                required
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Overall Price *
            </label>
            <div className="relative">
              <Banknote
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="number"
                name="overallPrice"
                value={batchDetails.overallPrice}
                onChange={handleBatchInputChange}
                step="0.01"
                min="0.01"
                max="99999999"
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                placeholder="Enter overall price (max 8 digits)"
                required
              />
            </div>
          </div>
        </div>

        {/* Bill ID and Overall Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Cheque number *
            </label>
            <div className="relative">
              <FileDigit
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                name="billID"
                value={batchDetails.billID}
                onChange={handleBatchInputChange}
                onKeyDown={handleChequeNumberKeyPress}
                maxLength={7}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                placeholder="Enter Cheque Number (max 7 digits)"
                pattern="[0-9]*"
                inputMode="numeric"
                required
              />
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Attachments (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAttachmentChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <Paperclip
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <button
                type="button"
                onClick={() => !uploading && fileInputRef.current.click()}
                className={`w-full px-10 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200 text-left`}
                disabled={uploading}
              >
                {uploading
                 ? "Uploading..."
                  : attachments.length
                  ? `Select Attachments  •  ${attachments.length} file(s) added`
                  : "Select Attachments"}
              </button>
            </div>
          </div>
        </div>

        {/* Preview attachments */}
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Attachment ${index}`}
                className="h-16 w-16 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end pt-6">
          <div className="flex gap-5">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 ${theme.cardSecondary} ${theme.textSecondary} rounded-lg hover:bg-opacity-70 transition-colors`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!isBatchValid || uploading}
              className={`px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}           
              
              >
               <span>{uploading ? "Uploading…" : "Add"}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddStockModal;