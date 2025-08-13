// UpdateUserModal.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import {
  User,
  Mail,
  CreditCard,
  Phone,
  MapPin,
  Users,
  Stethoscope,
  FileText,
  Calendar,
  Loader,
  Save,
} from "lucide-react";
import Modal from "../../components/UI/Modal";
import CNICInput from "../CNICInput";
import { SPECIALITIES, GENDERS } from "../../constants/selectOptions";

const UpdateUserModal = ({ isOpen, onClose, userData, onSuccess }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    cnic: "",
    phoneNumber: "",
    address: "",
    gender: "",
    // Doctor specific fields
    speciality: "",
    registrationNumber: "",
    doctorSchedule: [],
  });

  // Pre-fill form data when userData changes
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        cnic: userData.cnic || "",
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
        gender: userData.gender || "",
        // Fix: Convert array to string or use empty string
        speciality: userData.speciality || "", // Remove the [] default
        registrationNumber: userData.registrationNumber || "",
        doctorSchedule: userData.doctorSchedule || [],
      });
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleScheduleChange = (day) => {
    setFormData((prev) => ({
      ...prev,
      doctorSchedule: prev.doctorSchedule.includes(day)
        ? prev.doctorSchedule.filter((d) => d !== day)
        : [...prev.doctorSchedule, day],
    }));
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phoneNumber ||
      !formData.address ||
      !formData.gender
    ) {
      setError("All required fields must be filled");
      return false;
    }

    // Email: OPTIONAL — agar likha hai to valid hona chahiye, blank allowed hai
    const e = (formData.email || "").trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("Please enter a valid email address or leave it blank.");
      return false;
    }

    // Doctor specific validation
    if (userData?.role === "doctor") {
      if (!formData.speciality || !formData.registrationNumber) {
        setError("Speciality and registration number are required for doctors");
        return false;
      }
      if (formData.doctorSchedule.length === 0) {
        setError("Please select at least one working day");
        return false;
      }
    }

    return true;
  };


  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);
  setError("");
  setSuccess("");

  try {
    // Build payload
    const filteredFormData = {
  firstName: formData.firstName,
  lastName: formData.lastName,
  phoneNumber: formData.phoneNumber,
  address: formData.address,
  gender: formData.gender,
};

const emailTrim = (formData.email ?? "").trim();
filteredFormData.email = emailTrim;

const cnicTrim = (formData.cnic ?? "").trim();
if (cnicTrim) filteredFormData.cnic = cnicTrim;
    // Doctor-specific fields
    if (userData?.role === "doctor") {
      const specialityTrim = (formData.speciality ?? "").trim();
      const regTrim = (formData.registrationNumber ?? "").trim();
      if (specialityTrim) filteredFormData.speciality = specialityTrim;
      if (regTrim) filteredFormData.registrationNumber = regTrim;
      if (Array.isArray(formData.doctorSchedule) && formData.doctorSchedule.length > 0) {
        filteredFormData.doctorSchedule = formData.doctorSchedule;
      }
    }

    // Lazy-import API and update
    const { updateUserDataByRoleAndId } = await import("../../api/api");
    const response = await updateUserDataByRoleAndId(
      userData.role,
      userData._id,
      filteredFormData
    );

  setSuccess(response.message || "Profile updated successfully");
setTimeout(() => {
  // Kya user ne email/CNIC blank chhoda?
  const clearedEmail = (formData.email ?? "").trim() === "";
  const clearedCnic  = (formData.cnic  ?? "").trim() === "";

  const patchedUser = {
    ...response.user,
    ...(clearedEmail ? { email: "" } : {}),
    ...(clearedCnic  ? { cnic: "" }  : {}),
  };

  const skipRefetch = clearedEmail || clearedCnic;

  onSuccess(patchedUser, { skipRefetch });
  onClose();
  resetForm();
}, 1500);


  } catch (error) {
    setError(error?.response?.data?.message || "Update failed. Please try again.");
  } finally {
    setLoading(false);
  }
};
  
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      cnic: "",
      phoneNumber: "",
      address: "",
      gender: "",
      speciality: "",
      registrationNumber: "",
      doctorSchedule: [],
    });
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    // Reset to original userData when closing without saving
    if (userData) {
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        cnic: userData.cnic || "",
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
        gender: userData.gender || "",
        speciality: userData.speciality || "",
        registrationNumber: userData.registrationNumber || "",
        doctorSchedule: userData.doctorSchedule || [],
      });
    }
    setError("");
    setSuccess("");
    onClose();
  };

  const getRoleConfig = () => {
    if (!userData)
      return {
        title: "Update Profile",
        subtitle: "",
        icon: User,
        color: "text-gray-500",
        bgColor: "bg-gray-500",
      };

    const configs = {
      doctor: {
        title: "Update Doctor Profile",
        subtitle: `Update ${userData.firstName}${userData.lastName}'s profile information`,
        icon: Stethoscope,
        color: "text-purple-500",
        bgColor: "bg-purple-500",
      },
      receptionist: {
        title: "Update Receptionist Profile",
        subtitle: `Update  ${userData.firstName}${userData.lastName}'s profile information`,
        icon: User,
        color: "text-blue-500",
        bgColor: "bg-blue-500",
      },
      pharmacist_dispenser: {
        title: "Update Dispenser Profile",
        subtitle: `Update  ${userData.firstName}${userData.lastName}'s profile information`,
        icon: Users,
        color: "text-green-500",
        bgColor: "bg-green-500",
      },
      pharmacist_inventory: {
        title: "Update Inventory Staff Profile",
        subtitle: `Update  ${userData.firstName}${userData.lastName}'s profile information`,
        icon: Users,
        color: "text-orange-500",
        bgColor: "bg-orange-500",
      },
    };
    return configs[userData.role] || configs.doctor;
  };

  const config = getRoleConfig();
  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  if (!userData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={config.title}
      subtitle={config.subtitle}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div
            className={`p-4 rounded-full ${config.bgColor} bg-opacity-20 border border-current ${config.color}`}
          >
            <config.icon className={`w-8 h-8 ${config.color}`} />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg dark:bg-green-900 dark:border-green-700 dark:text-green-200"
          >
            {success}
          </motion.div>
        )}

        {/* Basic Information */}
        <div>
          <h3
            className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center space-x-2`}
          >
            <User className="w-5 h-5" />
            <span>Basic Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            {/* <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                First Name *
              </label>
              <div className="relative">
                <User
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                  placeholder="Enter First name"
                  required
                />
              </div>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Last Name *
              </label>
              <div className="relative">
                <User
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                  placeholder="Enter Last name"
                  required
                />
              </div>
            </div> */}

            {/* Phone */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Phone Number *
              </label>
              <div className="relative">
                <Phone
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Gender*
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="mt-4">
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Address *
            </label>
            <div className="relative">
              <MapPin
                className={`absolute left-3 top-3 w-5 h-5 ${theme.textMuted}`}
              />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200 resize-none`}
                placeholder="Enter complete address"
                required
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              CNIC
            </label>
            <CNICInput
              value={formData.cnic}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, cnic: val }))
              }
              placeholder="CNIC (12345-1234567-1)"
              error={error.includes("CNIC") ? error : ""}
            />
          </div>

          {/* Email */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                placeholder="Enter email address"

              />
            </div>
          </div>
        </div>

        {/* Doctor Specific Fields */}
        {userData.role === "doctor" && (
          <div>
            <h3
              className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center space-x-2`}
            >
              <Stethoscope className="w-5 h-5" />
              <span>Professional Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Speciality */}
              <div>
                <label
                  className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                >
                  Speciality *
                </label>
                <div className="relative">
                  <FileText
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                  />
                  {/* <input
                    type="text"
                    name="speciality"
                    value={formData.speciality}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    placeholder="e.g., Cardiology, Neurology"
                    required
                  /> */}
                  <select
                    name="speciality"
                    value={formData.speciality}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    required
                  >
                    <option value="">Select Speciality</option>
                    {SPECIALITIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Registration Number */}
              <div>
                <label
                  className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                >
                  Registration Number *
                </label>
                <div className="relative">
                  <CreditCard
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                  />
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    placeholder="Medical registration number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Doctor Schedule */}
            <div className="mt-4">
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2 flex items-center space-x-2`}
              >
                <Calendar className="w-4 h-4" />
                <span>Working Days *</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {weekDays.map((day) => (
                  <label
                    key={day}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.doctorSchedule.includes(day)}
                      onChange={() => handleScheduleChange(day)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {day}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={handleClose}
            className={`px-6 py-3 ${theme.cardSecondary} ${theme.textSecondary} rounded-lg hover:bg-opacity-70 transition-colors`}
            disabled={loading}
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Update Profile</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateUserModal;
