import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  User,
  Settings,
  KeyRound,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAuthStore } from "../store/authStore";
import UpdatePasswordModal from "./auth/UpdatePasswordModal";

const Header = ({ sidebarOpen, sidebarMiniMode, onToggleSidebar, isMobile }) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-500 bg-opacity-20 text-red-400";
      case "receptionist":
        return "bg-blue-500 bg-opacity-20 text-blue-400";
      case "doctor":
        return "bg-green-500 bg-opacity-20 text-green-400";
      case "pharmacist_dispenser":
        return "bg-purple-500 bg-opacity-20 text-purple-400";
      case "pharmacist_inventory":
        return "bg-teal-500 bg-opacity-20 text-teal-400";
      default:
        return "bg-gray-500 bg-opacity-20 text-gray-400";
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate header positioning based on sidebar state
  const getHeaderClasses = () => {
    let classes = `fixed top-0 right-0 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg ${theme.border} border-b z-40 transition-all duration-300`;
    
    if (isMobile) {
      // On mobile, header spans full width
      classes += ' left-0';
    } else {
      // On desktop, adjust header position based on sidebar state
      if (sidebarOpen) {
        classes += sidebarMiniMode ? ' left-16' : ' left-72';
      } else {
        classes += ' left-0';
      }
    }
    
    return classes;
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={getHeaderClasses()}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Mobile menu button and logo */}
            <div className="flex items-center space-x-4">
              {isMobile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onToggleSidebar}
                  className={`p-2 rounded-lg ${theme.cardSecondary} ${theme.border} border ${theme.textMuted} hover:${theme.textSecondary} transition-colors duration-200`}
                  aria-label="Toggle sidebar"
                >
                  <Menu className="w-5 h-5" />
                </motion.button>
              )}

              {/* Mobile Logo - only show when sidebar is closed */}
              {isMobile && !sidebarOpen && (
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${theme.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                    H
                  </div>
                  <h2 className={`text-lg font-bold bg-gradient-to-r ${theme.gradient} text-transparent bg-clip-text`}>
                    Healthway
                  </h2>
                </div>
              )}
            </div>

            {/* Right side - Navigation & Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Role Badge */}
              {user && (
                <span
                  className={`hidden sm:inline-flex px-2 py-1 cursor-pointer rounded-full text-xs font-semibold whitespace-nowrap ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )}

              {/* Theme Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${theme.cardSecondary} ${theme.border} border ${theme.textMuted} hover:${theme.textSecondary} transition-colors duration-200 flex-shrink-0`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.button>

              {/* User Dropdown */}
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${theme.cardSecondary} ${theme.border} border hover:bg-opacity-70 transition-colors duration-200`}
                  >
                    <User className={`w-4 h-4 ${theme.textSecondary}`} />
                    <span
                      className={`hidden sm:inline text-sm font-medium truncate max-w-32 ${theme.textPrimary}`}
                    >
                      {user.username}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 ${
                        theme.textSecondary
                      } transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute right-0 mt-2 w-48 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-lg ${theme.border} border shadow-lg overflow-hidden z-50`}
                      >
                        <div className="py-1">
                          {/* Settings */}
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              // Add settings functionality here
                            }}
                            className={`w-full flex items-center px-4 py-2 space-x-3 ${theme.textSecondary} hover:${theme.cardSecondary} transition-colors duration-150`}
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Settings</span>
                          </button>

                          {/* Update Password */}
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              setIsPasswordModalOpen(true);
                            }}
                            className={`w-full flex items-center px-4 py-2 space-x-3 ${theme.textSecondary} hover:${theme.cardSecondary} transition-colors duration-150`}
                          >
                            <KeyRound className="w-4 h-4" />
                            <span className="text-sm">Update Password</span>
                          </button>

                          {/* Divider */}
                          <div
                            className={`my-1 ${theme.borderSecondary} border-t`}
                          />

                          {/* Logout */}
                          <button
                            onClick={handleLogout}
                            className={`w-full flex items-center px-4 py-2 space-x-3 text-red-400 hover:bg-red-500 hover:bg-opacity-10 transition-colors duration-150`}
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Password Update Modal */}
      <UpdatePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};

export default Header;