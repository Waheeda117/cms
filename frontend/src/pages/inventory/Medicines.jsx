import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Pill,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} from "../../api/api";
import Pagination from "../../components/UI/Pagination.jsx";
import Modal from "../../components/UI/Modal.jsx";
import { useAuthStore } from "../../store/authStore";

const Medicines = () => {
  const { theme } = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [newMedicineName, setNewMedicineName] = useState("");
  const [editMedicineName, setEditMedicineName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [apiError, setApiError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState(null);

  const { user } = useAuthStore();

  // Fetch medicines data
  const fetchData = async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      const response = await getMedicines(page, limit);
      setMedicines(response.data.data.medicines);
      setPaginationData(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError("Failed to fetch medicines data");
      console.error("Error fetching medicines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  // Client-side search filtering (excluding medicine with ID 1)
  const filteredMedicines = useMemo(() => {
    if (!medicines) return [];

    // Filter out medicine with ID 1
    const filtered = medicines.filter((medicine) => medicine.medicineId !== 1);

    if (!searchTerm) return filtered;

    const lowerSearch = searchTerm.toLowerCase();
    return filtered.filter(
      (medicine) =>
        medicine.name.toLowerCase().includes(lowerSearch) ||
        medicine.medicineId.toString().includes(lowerSearch)
    );
  }, [medicines, searchTerm]);

  // Validation function for medicine name
  const validateMedicineName = (name) => {
    const regex = /^[a-zA-Z0-9 ]*$/;
    if (!regex.test(name)) {
      return "Only alphabets and numbers are allowed";
    }
    if (name.length > 50) {
      return "Medicine name cannot exceed 50 characters";
    }
    if (name.trim().length === 0) {
      return "Medicine name is required";
    }
    return "";
  };

  // Check if medicine name is valid and not empty
  const isMedicineNameValid = (name) => {
    return name.trim().length > 0 && validateMedicineName(name) === "";
  };

  // Reset all modal states
  const resetModalStates = () => {
    setNewMedicineName("");
    setEditMedicineName("");
    setValidationError("");
    setApiError("");
  };

  // Handle add medicine
  const handleAddMedicine = async () => {
    const errorMsg = validateMedicineName(newMedicineName);
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    try {
      await addMedicine({ name: newMedicineName.trim() });
      setIsAddModalOpen(false);
      resetModalStates();
      fetchData(); // Refresh the list
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to add medicine");
      console.error("Error adding medicine:", err);
    }
  };

  // Handle edit medicine
  const handleEditMedicine = async () => {
    const errorMsg = validateMedicineName(editMedicineName);
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    try {
      await updateMedicine(selectedMedicine.medicineId, {
        name: editMedicineName.trim(),
      });
      setIsEditModalOpen(false);
      resetModalStates();
      setSelectedMedicine(null);
      fetchData(); // Refresh the list
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to update medicine");
      console.error("Error updating medicine:", err);
    }
  };

  // Handle delete medicine
  const handleDeleteMedicine = async () => {
    try {
      await deleteMedicine(selectedMedicine.medicineId);
      setIsDeleteModalOpen(false);
      setSelectedMedicine(null);
      fetchData(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete medicine");
      console.error("Error deleting medicine:", err);
      setIsDeleteModalOpen(false);
    }
  };

  // Open edit modal with pre-populated data
  const openEditModal = (medicine) => {
    setSelectedMedicine(medicine);
    setEditMedicineName(medicine.name);
    resetModalStates();
    setIsEditModalOpen(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (medicine) => {
    setSelectedMedicine(medicine);
    resetModalStates();
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center p-8 ${theme.cardOpacity} rounded-xl`}>
          <p className={`text-xl ${theme.textPrimary} mb-4`}>{error}</p>
          <button
            onClick={fetchData}
            className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
          Medicines Management
        </h1>
        <p className={`${theme.textMuted}`}>Manage your medicine inventory</p>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
      >
        <div className="p-6">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row gap-5 justify-between items-start mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                Medicines List
              </h2>
              <p className={`${theme.textMuted}`}>
                View and manage all medicines
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200`}
            >
              <Plus className="w-5 h-5" />
              <span>Add Medicine</span>
            </motion.button>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Medicine ID</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Name</span>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMedicines.map((medicine) => (
                  <tr
                    key={medicine._id}
                    className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center mr-3`}
                        >
                          <Pill className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className={`font-medium ${theme.textPrimary}`}>
                          {medicine.medicineId}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>
                      {medicine.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center items-center space-x-2">
                        {/* Don't show edit/delete for medicine with ID 1 */}
                        {medicine.medicineId !== 1 && (
                          <>
                            <button
                              className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                              onClick={() => openEditModal(medicine)}
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                              onClick={() => openDeleteModal(medicine)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredMedicines.length === 0 && (
            <div className="text-center py-12">
              <Pill className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                {searchTerm
                  ? `No medicines found matching "${searchTerm}"`
                  : "No medicines found"}
              </h3>
              <p className={`${theme.textMuted} mb-4`}>
                {searchTerm
                  ? "Try adjusting your search terms or clear the search to see all medicines"
                  : "Get started by adding your first medicine"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 mx-auto`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Medicine</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {paginationData && medicines.length > 0 && (
          <Pagination
            currentPage={paginationData.currentPage}
            totalPages={paginationData.totalPages}
            totalItems={paginationData.totalItems}
            itemsPerPage={paginationData.itemsPerPage}
            hasNextPage={paginationData.hasNextPage}
            hasPrevPage={paginationData.hasPrevPage}
            onPageChange={(page) => setCurrentPage(page)}
            onLimitChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
          />
        )}
      </motion.div>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetModalStates();
        }}
        title="Add New Medicine"
      >
        <div className="p-6">
          <div className="mb-4">
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Medicine Name *
            </label>
            <input
              type="text"
              value={newMedicineName}
              onChange={(e) => {
                setNewMedicineName(e.target.value);
                setValidationError("");
                setApiError("");
              }}
              className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
              placeholder="Enter medicine name"
            />

            <p className="text-green-500 text-xs mt-1">
              * Only alphabets and digits are allowed, No special characters &
              max length is 50 characters
            </p>

            {validationError && (
              <p className="text-red-500 text-xs mt-1">{validationError}</p>
            )}
            {apiError && (
              <p className="text-red-500 text-xs mt-1">{apiError}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                resetModalStates();
              }}
              className={`px-4 py-2 ${theme.cardSecondary} ${theme.borderSecondary} border rounded-lg ${theme.textPrimary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddMedicine}
              disabled={!isMedicineNameValid(newMedicineName)}
              className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Add Medicine
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetModalStates();
          setSelectedMedicine(null);
        }}
        title="Edit Medicine"
      >
        <div className="p-6">
          <div className="mb-4">
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Medicine Name
            </label>
            <input
              type="text"
              value={editMedicineName || selectedMedicine?.name || ""}
              onChange={(e) => {
                setEditMedicineName(e.target.value);
                setValidationError("");
                setApiError("");
              }}
              className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
              placeholder="Enter medicine name"
            />

            <p className="text-green-500 text-xs mt-1">
              * Only alphabets and digits are allowed, No special characters &
              max length is 50 characters
            </p>

            {validationError && (
              <p className="text-red-500 text-xs mt-1">{validationError}</p>
            )}
            {apiError && (
              <p className="text-red-500 text-xs mt-1">{apiError}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                resetModalStates();
                setSelectedMedicine(null);
              }}
              className={`px-4 py-2 ${theme.cardSecondary} ${theme.borderSecondary} border rounded-lg ${theme.textPrimary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleEditMedicine}
              disabled={!isMedicineNameValid(editMedicineName)}
              className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Update Medicine
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMedicine(null);
        }}
        title="Confirm Deletion"
      >
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className={`text-center ${theme.textSecondary}`}>
              Are you sure you want to delete the medicine "
              {selectedMedicine?.name}"? This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedMedicine(null);
              }}
              className={`px-4 py-2 ${theme.cardSecondary} ${theme.borderSecondary} border rounded-lg ${theme.textPrimary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteMedicine}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700"
            >
              Delete Medicine
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Medicines;
