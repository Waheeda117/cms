import React, { useState } from "react";
import { Check, AlertCircle, Download } from "lucide-react";
import { useTheme } from "../../hooks/useTheme.js";
import Modal from "../../components/UI/Modal.jsx";
import { downloadResultsAsZip } from "../../utils/downloadUtils.js";

const AddBulkMedicineResults = ({ isOpen, onClose, results }) => {
  const { theme } = useTheme();
  const [downloading, setDownloading] = useState(false);

  if (!results) return null;

  const handleDownloadResults = async () => {
    try {
      setDownloading(true);
      await downloadResultsAsZip(results);
    } catch (error) {
      console.error('Download failed:', error);
      // You can add a toast notification here
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Upload Complete"
      subtitle={`Processed ${results.totalProcessed} medicine(s)`}
    >
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            {results.successCount > 0 ? (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            )}
          </div>
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
            Upload Summary
          </h3>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {results.successCount}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Success
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {results.duplicateCount}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              Duplicates
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {results.failedCount}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              Failed
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Results
          </h4>
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
            Download a ZIP file containing separate CSV files for successful, failed, and duplicate entries organized in folders.
          </p>
          <button
            onClick={handleDownloadResults}
            disabled={downloading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Preparing Download...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Results ZIP</span>
              </>
            )}
          </button>
        </div>

        {/* Detailed Results */}
        {(results.results.duplicates.length > 0 || results.results.failed.length > 0) && (
          <div className="space-y-4">
            {/* Duplicates */}
            {results.results.duplicates.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                  Duplicate Medicines ({results.results.duplicates.length})
                </h4>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-h-32 overflow-y-auto">
                  {results.results.duplicates.map((item, index) => (
                    <p key={index} className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {item.name} - {item.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Failed */}
            {results.results.failed.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                  Failed Medicines ({results.results.failed.length})
                </h4>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-32 overflow-y-auto">
                  {results.results.failed.map((item, index) => (
                    <p key={index} className="text-red-700 dark:text-red-300 text-sm">
                      {item.name} - {item.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddBulkMedicineResults;