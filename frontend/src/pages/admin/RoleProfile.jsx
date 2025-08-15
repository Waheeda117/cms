import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CreditCard,
  UserCheck,
  Stethoscope,
  Clock,
  Edit,
  LockOpen,
  LogOut,
  CheckCircle,
  XCircle,
  Badge,
  Users,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { getUserDataByRoleAndId, resetUserPassword } from "../../api/api";
import UpdateUserModal from "../../components/admin/UpdateUserModal";
import AccountStatusModal from "../../components/admin/AccountStatusModal";
import Modal from "../../components/UI/Modal";
import toast from "react-hot-toast";
import CredentialsModal from "../../components/admin/CredentialsModal";

const RoleProfile = () => {
  const { theme } = useTheme();
  const { role, id } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAccountStatusModalOpen, setIsAccountStatusModalOpen] =
    useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [resetCredentials, setResetCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const handleProfileUpdate = async (updatedUser, options = {}) => {
    if (updatedUser) setUserData(updatedUser);
    if (!options.skipRefetch) {
      await fetchUser();
    }
  };
  // Add this function to handle copying to clipboard
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard!`, { duration: 2000 });

      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Update the handleResetPassword function
  const handleResetPassword = async () => {
    try {
      setIsResettingPassword(true);
      setShowResetConfirmModal(false);

      const response = await resetUserPassword(userData._id);

      if (response.success) {
        // Set credentials for the modal
        setResetCredentials({
          username: userData.username,
          password: "abc12345",
        });

        // Show success toast
        toast.success(
          `Password reset successfully for ${userData.firstName} ${userData.lastName}`,
          {
            duration: 4000,
            position: "top-center",
          }
        );

        // Show credentials modal
        setShowCredentialsModal(true);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to reset password. Please try again.";
      toast.error(errorMessage, {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Fetch user data from API
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserDataByRoleAndId(role, id);
      setUserData(response.user);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  }, [role, id]);

  // Mount/update par fetch call
  useEffect(() => {
    if (role && id) {
      fetchUser();
    }
  }, [role, id, fetchUser]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Error state
  if (error || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className={`text-center p-8 ${theme.cardOpacity} rounded-xl max-w-md`}
        >
          <XCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
          <p className={`text-xl ${theme.textPrimary} mb-4`}>
            {error || "User not found"}
          </p>
          <button
            onClick={() => navigate("/admin/user-management")}
            className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      // hour: "2-digit",
      // minute: "2-digit",
    });
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      admin: Shield,
      doctor: Stethoscope,
      receptionist: UserCheck,
      pharmacist_dispenser: Badge,
      pharmacist_inventory: Users,
    };
    return roleIcons[role] || User;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      admin: "text-red-500",
      doctor: "text-purple-500",
      receptionist: "text-blue-500",
      pharmacist_dispenser: "text-green-500",
      pharmacist_inventory: "text-orange-500",
    };
    return roleColors[role] || "text-gray-500";
  };

  const getRoleBgColor = (role) => {
    const roleBgColors = {
      admin: "bg-red-500 bg-opacity-20 border-red-500",
      doctor: "bg-purple-500 bg-opacity-20 border-purple-500",
      receptionist: "bg-blue-500 bg-opacity-20 border-blue-500",
      pharmacist_dispenser: "bg-green-500 bg-opacity-20 border-green-500",
      pharmacist_inventory: "bg-orange-500 bg-opacity-20 border-orange-500",
    };
    return roleBgColors[role] || "bg-gray-500 bg-opacity-20 border-gray-500";
  };

  const formatRoleName = (role) => {
    const roleNames = {
      admin: "Administrator",
      doctor: "Medical Doctor",
      receptionist: "Receptionist",
      pharmacist_dispenser: "Pharmacy Dispenser",
      pharmacist_inventory: "Inventory Pharmacist",
    };
    return roleNames[role] || role;
  };

  const RoleIcon = getRoleIcon(userData.role);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button and Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-6">
          <div>
            <button
              onClick={() => navigate("/admin/user-management")}
              className={`flex items-center space-x-2 mb-4 ${theme.textPrimary} px-3 py-2 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} border hover:bg-opacity-70 transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" />
              {/* <span>Back to All Users</span> */}
            </button>
          </div>

          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
              {formatRoleName(userData.role)} Profile
            </h1>
            <p className={`${theme.textMuted}`}>
              View and manage {userData.firstName} {userData.lastName}'s profile
              information
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          {/* Profile Card */}
          <div
            className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border overflow-hidden mb-6`}
          >
            {/* Profile Header */}
            <div
              className={`bg-gradient-to-r ${theme.buttonGradient} p-6 text-white relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-x-10 translate-y-10"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mx-auto mb-4">
                  <RoleIcon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-center">
                  {userData.firstName} {userData.lastName}
                </h2>
                <h3 className="text-sm text-center mb-2">
                  @{userData.username}
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                    {formatRoleName(userData.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6">
              <div className="space-y-4">
                {/* <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.textMuted}`}>
                    Account Status
                  </span>
                  <div className="flex items-center space-x-2">
                    {userData.isActive ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 font-medium text-sm">
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-500 font-medium text-sm">
                          Inactive
                        </span>
                      </>
                    )}
                  </div>
                </div> */}

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.textMuted}`}>
                    Account Status
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      {userData.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500 font-medium text-sm">
                            Active
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-500 font-medium text-sm">
                            Inactive
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setIsAccountStatusModalOpen(true)}
                      className={`p-1 rounded-lg ${theme.textPrimary} ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                      title="Edit Account Status"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.textMuted}`}>
                    Verification
                  </span>
                  <div className="flex items-center space-x-2">
                    {userData.isVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 font-medium text-sm">
                          Verified
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-500 font-medium text-sm">
                          Pending
                        </span>
                      </>
                    )}
                  </div>
                </div> */}

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.textMuted}`}>
                    Last Login
                  </span>
                  <span
                    className={`text-sm font-medium ${theme.textSecondary}`}
                  >
                    {userData.lastLogin
                      ? formatDateTime(userData.lastLogin)
                      : "Never"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.textMuted}`}>
                    Member Since
                  </span>
                  <span
                    className={`text-sm font-medium ${theme.textSecondary}`}
                  >
                    {formatDate(userData.createdAt)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {/* <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200`}
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </motion.button> */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsUpdateModalOpen(true)}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200`}
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </motion.button>
                <button
                  onClick={() => setShowResetConfirmModal(true)}
                  disabled={isResettingPassword}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} ${theme.textPrimary} border hover:bg-opacity-70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <LockOpen className="w-4 h-4" />
                  <span>Reset Password</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Detailed Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          {/* Personal Information */}
          <div
            className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border mb-6`}
          >
            <div className="p-6">
              <h3
                className={`text-xl font-bold ${theme.textPrimary} mb-6 flex items-center space-x-2`}
              >
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className={`p-4 ${theme.cardSecondary} rounded-lg`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${getRoleBgColor(
                        userData.role
                      )} border`}
                    >
                      <User
                        className={`w-4 h-4 ${getRoleColor(userData.role)}`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${theme.textMuted}`}>
                      Full Name
                    </span>
                  </div>
                  <p className={`font-semibold ${theme.textPrimary} ml-11`}>
                    {userData.firstName} {userData.lastName}
                  </p>
                </div>

                {/* Email */}
                {userData.email && (
                  <div className={`p-4 ${theme.cardSecondary} rounded-lg`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 rounded-lg bg-blue-500 bg-opacity-20 border border-blue-500">
                        <Mail className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className={`text-sm font-medium ${theme.textMuted}`}>
                        Email Address
                      </span>
                    </div>
                    <p className={`font-semibold ${theme.textPrimary} ml-11`}>
                      {userData.email || "—"}
                    </p>
                  </div>
                )}

                {/* CNIC */}
                <div className={`p-4 ${theme.cardSecondary} rounded-lg`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-500 bg-opacity-20 border border-green-500">
                      <CreditCard className="w-4 h-4 text-green-500" />
                    </div>
                    <span className={`text-sm font-medium ${theme.textMuted}`}>
                      CNIC
                    </span>
                  </div>
                  <p className={`font-semibold ${theme.textPrimary} ml-11`}>
                    {userData.cnic}
                  </p>
                </div>

                {/* Phone */}
                {userData.phoneNumber && (
                  <div className={`p-4 ${theme.cardSecondary} rounded-lg`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-20 border border-yellow-500">
                        <Phone className="w-4 h-4 text-yellow-500" />
                      </div>
                      <span
                        className={`text-sm font-medium ${theme.textMuted}`}
                      >
                        Phone Number
                      </span>
                    </div>
                    <p className={`font-semibold ${theme.textPrimary} ml-11`}>
                      {userData.phoneNumber}
                    </p>
                  </div>
                )}

                {/* Gender */}
                {userData.gender && (
                  <div className={`p-4 ${theme.cardSecondary} rounded-lg`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 rounded-lg bg-pink-500 bg-opacity-20 border border-pink-500">
                        <UserCheck className="w-4 h-4 text-pink-500" />
                      </div>
                      <span
                        className={`text-sm font-medium ${theme.textMuted}`}
                      >
                        Gender*
                      </span>
                    </div>
                    <p className={`font-semibold ${theme.textPrimary} ml-11`}>
                      {userData.gender}
                    </p>
                  </div>
                )}

                {/* Role */}
                <div className={`p-4 ${theme.cardSecondary} rounded-lg`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${getRoleBgColor(
                        userData.role
                      )} border`}
                    >
                      <RoleIcon
                        className={`w-4 h-4 ${getRoleColor(userData.role)}`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${theme.textMuted}`}>
                      Role
                    </span>
                  </div>
                  <p className={`font-semibold ${theme.textPrimary} ml-11`}>
                    {formatRoleName(userData.role)}
                  </p>
                </div>
              </div>

              {/* Address */}
              {userData.address && (
                <div className={`p-4 ${theme.cardSecondary} rounded-lg mt-6`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-500 bg-opacity-20 border border-indigo-500">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className={`text-sm font-medium ${theme.textMuted}`}>
                      Address
                    </span>
                  </div>
                  <p className={`font-semibold ${theme.textPrimary} ml-11`}>
                    {userData.address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Doctor-specific Information */}
          {userData.role === "doctor" && (
            <div
              className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border mb-6`}
            >
              <div className="p-6">
                <h3
                  className={`text-xl font-bold ${theme.textPrimary} mb-6 flex items-center space-x-2`}
                >
                  <Stethoscope className="w-5 h-5" />
                  <span>Medical Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Speciality */}
                  {userData.speciality && (
                    <div className={`p-4 ${theme.cardSecondary} rounded-lg`}>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500 bg-opacity-20 border border-purple-500">
                          <Badge className="w-4 h-4 text-purple-500" />
                        </div>
                        <span
                          className={`text-sm font-medium ${theme.textMuted}`}
                        >
                          Speciality
                        </span>
                      </div>
                      <p className={`font-semibold ${theme.textPrimary} ml-11`}>
                        {userData.speciality}
                      </p>
                    </div>
                  )}

                  {/* Registration Number */}
                  {userData.registrationNumber && (
                    <div className={`p-4 ${theme.cardSecondary} rounded-lg`}>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 rounded-lg bg-teal-500 bg-opacity-20 border border-teal-500">
                          <CreditCard className="w-4 h-4 text-teal-500" />
                        </div>
                        <span
                          className={`text-sm font-medium ${theme.textMuted}`}
                        >
                          Registration Number
                        </span>
                      </div>
                      <p className={`font-semibold ${theme.textPrimary} ml-11`}>
                        {userData.registrationNumber}
                      </p>
                    </div>
                  )}
                </div>

                {/* Doctor Schedule */}
                {userData.doctorSchedule &&
                  userData.doctorSchedule.length > 0 && (
                    <div
                      className={`p-4 ${theme.cardSecondary} rounded-lg mt-6`}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500 bg-opacity-20 border border-emerald-500">
                          <Clock className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span
                          className={`text-sm font-medium ${theme.textMuted}`}
                        >
                          Schedule
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-11">
                        {userData.doctorSchedule.map((day) => (
                          <span
                            key={day}
                            className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Account Activity */}
          <div
            className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
          >
            <div className="p-6">
              <h3
                className={`text-xl font-bold ${theme.textPrimary} mb-6 flex items-center space-x-2`}
              >
                <Calendar className="w-5 h-5" />
                <span>Account Activity</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500 bg-opacity-20 border border-blue-500">
                      <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className={`font-medium `}>Last Login</p>
                      <p className={`text-sm ${theme.textMuted}`}>
                        Most recent access to the system
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold`}>
                    {userData.lastLogin
                      ? formatDateTime(userData.lastLogin)
                      : "Never"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-green-500 bg-opacity-20 border border-green-500">
                      <Calendar className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className={`font-medium `}>Account Created</p>
                      <p className={`text-sm ${theme.textMuted}`}>
                        Initial registration date
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold`}>
                    {formatDate(userData.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-orange-500 bg-opacity-20 border border-orange-500">
                      <Edit className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className={`font-medium `}>Last Updated</p>
                      <p className={`text-sm ${theme.textMuted}`}>
                        Profile information last modified
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold`}>
                    {formatDateTime(userData.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Update Profile Modal */}
      <UpdateUserModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        userData={userData}
        onSuccess={handleProfileUpdate}
      />

      {/* Account Status Modal */}
      <AccountStatusModal
        isOpen={isAccountStatusModalOpen}
        onClose={() => setIsAccountStatusModalOpen(false)}
        userData={userData}
        onSuccess={handleProfileUpdate}
      />

      {/* Reset Password Confirmation Modal */}
      <Modal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        title="Reset Password Confirmation"
        subtitle="This action will reset the user's password to default"
      >
        <div className="p-6">
          <div
            className={`mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Important Notice
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Are you sure you want to reset the password for{" "}
                  <span className="font-semibold">
                    {userData.firstName} {userData.lastName}
                  </span>
                  ?
                </p>
              </div>
            </div>
          </div>

          <div className={`mb-6 p-4 ${theme.cardSecondary} rounded-lg`}>
            <h5 className={`font-medium ${theme.textPrimary} mb-2`}>
              What will happen:
            </h5>
            <ul className={`text-sm ${theme.textMuted} space-y-1`}>
              <li>• User's current password will be replaced</li>
              <li>• Default password "abc12345" will be set</li>
              <li>• User will need to use new credentials to login</li>
              <li>• User can change password after logging in</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowResetConfirmModal(false)}
              className={`flex-1 px-4 py-2 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} ${theme.textPrimary} border hover:bg-opacity-70 transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className={`flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
            >
              {isResettingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <LockOpen className="w-4 h-4" />
                  <span>Reset Password</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false);
          setResetCredentials(null);
          setCopiedField(null);
        }}
        credentials={resetCredentials}
        title="Login Credentials"
        subtitle="Password has been reset successfully"
        successMessage="Password Reset Successful"
        nextSteps={[
          "• Share these credentials with the user securely",
          "• User should change password after first login",
          "• Old password is no longer valid",
        ]}
      />
    </div>
  );
};

export default RoleProfile;
