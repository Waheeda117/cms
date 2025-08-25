import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme.js";
import { addBulkMedicines } from "../../api/api.js";
import Modal from "../../components/UI/Modal.jsx";

const AddBulkMedicine = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme();

  // Bulk upload states
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState("");
  const [bulkMedicines, setBulkMedicines] = useState([]);
  const [bulkValidationErrors, setBulkValidationErrors] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      resetBulkModalStates();
    }
  }, [isOpen]);

  // Reset bulk modal states
  const resetBulkModalStates = () => {
    setCsvFile(null);
    setCsvData("");
    setBulkMedicines([]);
    setBulkValidationErrors([]);
    setApiError("");
    setBulkLoading(false);
  };

  // Updated validation functions
  const validateField = (field, value, lineIndex) => {
    const errors = [];
    
    switch (field) {
      case "name":
        if (!value || value.trim().length === 0) {
          errors.push(`Line ${lineIndex}: Medicine name is required`);
        } else {
          if (!/^[a-zA-Z0-9 ]*$/.test(value)) {
            errors.push(`Line ${lineIndex}: Medicine name can only contain alphabets, digits and spaces`);
          }
          if (value.length > 50) {
            errors.push(`Line ${lineIndex}: Medicine name cannot exceed 50 characters`);
          }
        }
        break;

      case "strength":
        if (!value || value.trim().length === 0) {
          errors.push(`Line ${lineIndex}: Strength is required`);
        } else {
          if (!/^[a-zA-Z0-9 ]*$/.test(value)) {
            errors.push(`Line ${lineIndex}: Strength can only contain alphabets, digits and spaces`);
          }
          if (value.length > 10) {
            errors.push(`Line ${lineIndex}: Strength cannot exceed 10 characters`);
          }
        }
        break;

      case "category":
        if (!value || value.trim().length === 0) {
          errors.push(`Line ${lineIndex}: Type is required`);
        } else {
          if (!/^[a-zA-Z0-9 ]*$/.test(value)) {
            errors.push(`Line ${lineIndex}: Type can only contain alphabets, digits and spaces`);
          }
          if (value.length > 10) {
            errors.push(`Line ${lineIndex}: Type cannot exceed 10 characters`);
          }
        }
        break;

      case "manufacturer":
        if (!value || value.trim().length === 0) {
          errors.push(`Line ${lineIndex}: Manufacturer is required`);
        } else {
          if (!/^[a-zA-Z0-9 ]*$/.test(value)) {
            errors.push(`Line ${lineIndex}: Manufacturer can only contain alphabets, digits and spaces`);
          }
          if (value.length > 20) {
            errors.push(`Line ${lineIndex}: Manufacturer cannot exceed 20 characters`);
          }
        }
        break;

        case "description":
          if (!value || value.trim().length === 0) {
            errors.push(`Line ${lineIndex}: Formula is required`);
          } else {
            if (!/^[a-zA-Z0-9 ]*$/.test(value)) {
              errors.push(`Line ${lineIndex}: Formula can only contain alphabets, digits and spaces`);
            }
            if (value.length > 50) {
              errors.push(`Line ${lineIndex}: Formula cannot exceed 50 characters`);
            }
          }
          break;

      default:
        break;
    }
    
    return errors;
  };

  // Check for duplicates within the CSV data
  const checkDuplicates = (medicines) => {
    const seen = new Set();
    const duplicates = [];

    medicines.forEach((medicine, index) => {
      const key = `${medicine.name.toLowerCase()}_${medicine.strength.toLowerCase()}_${medicine.category.toLowerCase()}_${medicine.manufacturer.toLowerCase()}`;
      
      if (seen.has(key)) {
        duplicates.push(`Line ${index + 1}: Duplicate medicine found (Name: ${medicine.name}, Strength: ${medicine.strength}, Type: ${medicine.category}, Manufacturer: ${medicine.manufacturer})`);
      } else {
        seen.add(key);
      }
    });

    return duplicates;
  };

  // Parse CSV data with enhanced validation
  const parseCsvData = (csvText) => {
    try {
      const lines = csvText.split("\n").filter((line) => line.trim());
      const medicines = [];
      const errors = [];

      lines.forEach((line, index) => {
        const lineIndex = index + 1;
        const fields = line.split(",").map((field) => field.trim());

        if (fields.length !== 5) {
          errors.push(`Line ${lineIndex}: Invalid CSV format. Expected 5 fields (name,strength,type,manufacturer,formula)`);
          return;
        }

        const [name, strength, category, manufacturer, description] = fields;
        
        // Validate each field
        const nameErrors = validateField("name", name, lineIndex);
        const strengthErrors = validateField("strength", strength, lineIndex);
        const categoryErrors = validateField("category", category, lineIndex);
        const manufacturerErrors = validateField("manufacturer", manufacturer, lineIndex);
        const descriptionErrors = validateField("description", description, lineIndex);

        const allErrors = [...nameErrors, ...strengthErrors, ...categoryErrors, ...manufacturerErrors, ...descriptionErrors];
        
        if (allErrors.length > 0) {
          errors.push(...allErrors);
        } else {
          medicines.push({
            name: name.trim(),
            strength: strength.trim(),
            category: category.trim(),
            manufacturer: manufacturer.trim(),
            description: description.trim()
          });
        }
      });

      // Check for duplicates within the CSV
      const duplicateErrors = checkDuplicates(medicines);
      errors.push(...duplicateErrors);

      setBulkMedicines(medicines);
      setBulkValidationErrors(errors);
      setApiError("");
    } catch (error) {
      setApiError("Failed to parse CSV file");
    }
  };

  // Handle CSV file upload
  const handleCsvFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setApiError("Please select a CSV file");
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      setCsvData(text);
      parseCsvData(text);
    };

    reader.readAsText(file);
  };

  // Handle CSV data change in textarea
  const handleCsvDataChange = (value) => {
    setCsvData(value);
    parseCsvData(value);
  };

  // Create formatted CSV data for display with line numbers and error highlighting
  const getFormattedCsvData = () => {
    const lines = csvData.split("\n");
    const errorLines = new Set();
    
    // Extract line numbers from errors
    bulkValidationErrors.forEach(error => {
      const match = error.match(/Line (\d+):/);
      if (match) {
        errorLines.add(parseInt(match[1]) - 1);
      }
    });

    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const hasError = errorLines.has(index);
      return {
        number: lineNumber,
        content: line,
        hasError
      };
    }).filter(line => line.content.trim());
  };

  // Handle bulk medicine submission
  const handleBulkSubmit = async () => {
    if (bulkMedicines.length === 0) {
      setApiError("No valid medicines to add");
      return;
    }

    if (bulkValidationErrors.length > 0) {
      setApiError("Please fix validation errors before submitting");
      return;
    }

    setBulkLoading(true);
    setApiError("");
    
    try {
      const response = await addBulkMedicines({ medicines: bulkMedicines });
      
      // Close this modal and show results
      onClose();
      
      // Call onSuccess with results to show results modal
      if (onSuccess) {
        onSuccess(response.data.data);
      }
      
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Failed to add bulk medicines"
      );
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    resetBulkModalStates();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Bulk Medicines"
      subtitle="Upload CSV file with medicine details (Name, Strength, Type, Manufacturer, formula)"
    >
      <div className="p-6">
        {/* CSV Format Information */}
      <div className="mb-6">
        <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4`}>
          <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">CSV Format Requirements:</h4>
          <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Name (max 50 chars, alphabets/digits/spaces only)</li>
            <li>• Strength (max 10 chars, alphabets/digits/spaces only)</li>
            <li>• Type (max 10 chars, alphabets/digits/spaces only)</li>
            <li>• Manufacturer (max 20 chars, alphabets/digits/spaces only)</li>
            <li>• Formula (max 50 chars, alphabets/digits/spaces only)</li>
          </ul>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
            Example: Paracetamol,500mg,Tab,GSK,Acetaminophen Formula
          </p>
        </div>
      </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
            Upload CSV File *
          </label>
          <div className={`border-2 border-dashed ${theme.borderSecondary} rounded-lg p-6 text-center`}>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className={`cursor-pointer flex flex-col items-center space-y-2 ${theme.textPrimary}`}
            >
              <FileText className="w-12 h-12 text-purple-500" />
              <span className="text-sm font-medium">
                {csvFile ? csvFile.name : "Click to upload CSV file"}
              </span>
              <span className={`text-xs ${theme.textMuted}`}>
                CSV file with medicine details (Name,Strength,Type,Manufacturer,Formula)
              </span>
            </label>
          </div>
        </div>

{/* Preview Section with Line Numbers */}
        {csvData && (
          <div className="mb-6">
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Preview & Edit Medicine Data
            </label>
            <div className={`border ${theme.borderSecondary} rounded-lg overflow-hidden`}>
              <div className="flex">
                {/* Line Numbers */}
                <div className={`bg-gray-50 dark:bg-gray-800 px-3 py-3 border-r ${theme.borderSecondary} min-w-[60px]`}>
                  <div className="text-xs text-gray-500 font-mono" style={{ lineHeight: '1.5', fontSize: '14px' }}>
                    {csvData.split('\n').map((line, index) => {
                      const lineNumber = index + 1;
                      const formattedData = getFormattedCsvData();
                      const hasError = formattedData[index]?.hasError || false;
                      
                      return (
                        <div
                          key={lineNumber}
                          className={hasError ? 'text-red-500' : ''}
                          style={{ 
                            height: '21px', // Match textarea line height exactly
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {lineNumber}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1">
                  <textarea
                    value={csvData}
                    onChange={(e) => handleCsvDataChange(e.target.value)}
                    rows={Math.max(10, csvData.split('\n').length)}
                    className={`w-full px-4 py-3 ${theme.input} border-0 ${theme.focus} focus:ring-2 ${theme.textPrimary} font-mono resize-none`}
                    placeholder="Medicine data will appear here..."
                    style={{ 
                      lineHeight: '1.5',
                      fontSize: '14px',
                      background: 'transparent',
                      padding: '12px 16px', // Match the py-3 px-4 classes
                      margin: 0
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <p className="text-green-600 dark:text-green-400 text-xs">
                Lines with validation errors will be highlighted in red in the line numbers
              </p>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {bulkValidationErrors.length > 0 && (
          <div className="mb-6">
            <h4 className="text-red-500 font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Validation Errors ({bulkValidationErrors.length}):
            </h4>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-40 overflow-y-auto">
              {bulkValidationErrors.map((error, index) => (
                <p key={index} className="text-red-600 dark:text-red-400 text-sm font-mono">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {bulkMedicines.length > 0 && (
          <div className="mb-6">
            <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4`}>
              <p className={`text-blue-700 dark:text-blue-300 text-sm flex items-center gap-2`}>
                <Check className="w-4 h-4" />
                  {bulkMedicines.length} item(s) loaded
                {bulkValidationErrors.length > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    ({bulkValidationErrors.length} error(s) need to be fixed)
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {apiError && (
          <div className="mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <X className="w-4 h-4" />
                {apiError}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={handleClose}
            className={`px-4 py-2 ${theme.cardSecondary} ${theme.borderSecondary} border rounded-lg ${theme.textPrimary}`}
          >
            Cancel
          </button>
          <button
            onClick={handleBulkSubmit}
            disabled={
              bulkMedicines.length === 0 ||
              bulkValidationErrors.length > 0 ||
              bulkLoading
            }
            className={`px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-purple-700 transition-all duration-200`}
          >
            {bulkLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
            //   `Add ${bulkMedicines.length} Medicines`
              `Upload`
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddBulkMedicine;