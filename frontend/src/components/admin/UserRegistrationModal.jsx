import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import {
  User,
  Mail,
  Lock,
  CreditCard,
  Phone,
  MapPin,
  Users,
  Stethoscope,
  FileText,
  Calendar,
  Eye,
  EyeOff,
  Loader,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Modal from "../../components/UI/Modal";
import {
  registerDoctor,
  registerReceptionist,
  registerPharmacistDispenser,
  registerPharmacistInventory,
} from "../../api/api";
import CNICInput from "../CNICInput";
import { SPECIALITIES, GENDERS } from "../../constants/selectOptions";
import CredentialsModal from "./CredentialsModal";

const UserRegistrationModal = ({ isOpen, onClose, role, onSuccess }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDoctorFieldsOpen, setIsDoctorFieldsOpen] = useState(false);

  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newUserCredentials, setNewUserCredentials] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "abc12345",
    cnic: "",
    phoneNumber: "",
    address: "",
    gender: "",
    // Doctor specific fields
    speciality: "",
    registrationNumber: "",
    doctorSchedule: [],
  });

  // Generate username based on firstName and lastName
  const generateUsername = (firstName, lastName) => {
    if (!firstName || !lastName) return "";
    return firstName.charAt(0).toLowerCase() + lastName.toLowerCase();
  };

  const displayUsername = generateUsername(
    formData.firstName,
    formData.lastName
  );

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

    // CNIC validation (only if provided)
    if (formData.cnic) {
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      if (!cnicRegex.test(formData.cnic)) {
        setError("CNIC must be in format: 12345-1234567-1");
        return false;
      }
    }

    // Email validation (only if provided)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        return false;
      }
    }

    // Password validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    // Doctor specific validation
    if (role === "doctor") {
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

///aaa/a/a
 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);
  setError("");
  setSuccess("");

  try {
    let response;
    const submitData = { ...formData };

    switch (role) {
      case "doctor":
        response = await registerDoctor(submitData);
        break;
      case "receptionist":
        response = await registerReceptionist(submitData);
        break;
      case "pharmacist_dispenser":
        response = await registerPharmacistDispenser(submitData);
        break;
      case "pharmacist_inventory":
        response = await registerPharmacistInventory(submitData);
        break;
      default:
        throw new Error("Invalid role");
    }

    // Message set (fallback rakha hai)
    setSuccess((response && response.message) ? response.message : "User registered successfully");

    // API se naya user safely nikaal lo (shape flexible rakhi hai)
    const createdUser =
      (response && response.user) ||
      (response && response.data && response.data.user) ||
      null;

    // Credentials modal ke liye username — API se ya fallback (displayUsername tumhari file me pehle se defined hai)
    setNewUserCredentials({
      username: (createdUser && createdUser.username) || displayUsername || "",
      password: "abc12345",
    });
    setShowCredentialsModal(true);

    // Parent ko notify (list refetch) + modal close + form reset
    // setTimeout(() => {
    //   if (onSuccess) onSuccess(createdUser);
    //   if (onClose) onClose();
    //   resetForm();
    // }, 1500);
  } catch (err) {
    setError(
      (err && err.response && err.response.data && err.response.data.message) ||
        "Registration failed. Please try again."
    );
  } finally {
    setLoading(false);
  }
};


  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: null,
      password: "abc12345",
      cnic: null,
      phoneNumber: "",
      address: "",
      gender: "",
      speciality: "",
      registrationNumber: "",
      doctorSchedule: [],
    });
    setError("");
    setSuccess("");
    setIsDoctorFieldsOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  //a//a//aa
 const handleCredentialsClose = () => {
  setShowCredentialsModal(false);
  resetForm();
  onClose?.();             // parent modal band
  window.location.reload(); // ✅ ab close par page reload hoga -> list update
};


  const getRoleConfig = () => {
    const configs = {
      doctor: {
        title: "Register New Doctor",
        subtitle: "Add a new medical doctor to the system",
        icon: Stethoscope,
        color: "text-purple-500",
        bgColor: "bg-purple-500",
      },
      receptionist: {
        title: "Register New Receptionist",
        subtitle: "Add a new receptionist to the front desk team",
        icon: User,
        color: "text-blue-500",
        bgColor: "bg-blue-500",
      },
      pharmacist_dispenser: {
        title: "Register New Dispenser",
        subtitle: "Add a new pharmacy dispenser to the team",
        icon: Users,
        color: "text-green-500",
        bgColor: "bg-green-500",
      },
      pharmacist_inventory: {
        title: "Register New Inventory Staff",
        subtitle: "Add a new inventory pharmacist to the team",
        icon: Users,
        color: "text-orange-500",
        bgColor: "bg-orange-500",
      },
    };
    return configs[role] || configs.doctor;
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

  return (
    <>
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
              {/* First Name */}
              <div>
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
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    placeholder="Enter first name"
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
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
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              {/* Username (LoginID) - ReadOnly */}
              {/* <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                LoginID (Username) *
              </label>
              <div className="relative">
                <User
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                />
                <input
                  type="text"
                  value={displayUsername}
                  readOnly
                  className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border bg-gray-100 dark:bg-gray-700 ${theme.textPrimary} cursor-not-allowed`}
                  placeholder="Auto-generated based on name"
                />
              </div>
              {displayUsername && (
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  This will be your login username
                </p>
              )}
            </div> */}

              {/* Password */}
              {/* <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Password *
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
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
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                  required
                >
                  <option value="">Select Gender</option>
                  {GENDERS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
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

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Email - Optional */}
              <div>
                <label
                  className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                >
                  Email Address (Optional)
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

              {/* CNIC - Optional */}
              <div>
                <label
                  className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                >
                  CNIC (Optional)
                </label>
                <CNICInput
                  value={formData.cnic}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, cnic: val }))
                  }
                  placeholder="12345-1234567-1"
                />
              </div>
            </div>
          </div>

          {/* Doctor Specific Fields - Collapsible */}
          {role === "doctor" && (
            <div>
              <button
                type="button"
                onClick={() => setIsDoctorFieldsOpen(!isDoctorFieldsOpen)}
                className={`w-full flex items-center justify-between p-4 ${theme.cardSecondary} rounded-lg ${theme.textPrimary} hover:bg-opacity-70 transition-colors`}
              >
                <div className="flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5" />
                  <span className="text-lg font-semibold">
                    Professional Information
                  </span>
                </div>
                {isDoctorFieldsOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {isDoctorFieldsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4"
                >
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
                  <div>
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
                </motion.div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row gap-5 justify-end pt-6">
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
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  <span>
                    Register{" "}
                    {role
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={handleCredentialsClose}
        credentials={newUserCredentials}
        title="User Registration Complete"
        subtitle="New user credentials have been created"
        successMessage="Registration Successful"
        nextSteps={[
          "• Share these credentials with the user securely",
          "• User should change password after first login",
        ]}
      />
    </>
  );
};

export default UserRegistrationModal;
