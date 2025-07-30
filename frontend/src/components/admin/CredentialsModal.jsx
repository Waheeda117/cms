// src/components/admin/CredentialsModal.jsx
import React, { useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import Modal from "../UI/Modal";
import { CheckCircle, Copy } from "lucide-react";
import toast from "react-hot-toast";

const CredentialsModal = ({
  isOpen,
  onClose,
  credentials,
  title = "Login Credentials",
  subtitle = "User credentials have been created",
  successMessage = "Operation Successful",
  nextSteps = [
    "• Share these credentials with the user securely",
    "• User should change password after first login",
    "• Old password is no longer valid",
  ],
  
}) => {
  const { theme } = useTheme();
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard!`, { duration: 2000 });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (!credentials) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
    >
      <div className="p-6">
        <div
          className={`mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800`}
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                {successMessage}
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                The user can now login with the credentials below
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Username Field */}
          <div
            className={`p-4 ${theme.cardSecondary} rounded-lg border ${theme.borderSecondary}`}
          >
            <label
              className={`block text-sm font-medium ${theme.textMuted} mb-2`}
            >
              Username
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={credentials.username}
                readOnly
                className={`flex-1 px-3 py-2 bg-transparent border ${theme.borderSecondary} rounded-lg ${theme.textPrimary} focus:outline-none`}
              />
              <button
                onClick={() =>
                  copyToClipboard(credentials.username, "Username")
                }
                className={`p-2 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary} hover:bg-opacity-70 transition-colors`}
              >
                {copiedField === "Username" ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password Field */}
          <div
            className={`p-4 ${theme.cardSecondary} rounded-lg border ${theme.borderSecondary}`}
          >
            <label
              className={`block text-sm font-medium ${theme.textMuted} mb-2`}
            >
              Password
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={credentials.password}
                readOnly
                className={`flex-1 px-3 py-2 bg-transparent border ${theme.borderSecondary} rounded-lg ${theme.textPrimary} focus:outline-none font-mono`}
              />
              <button
                onClick={() =>
                  copyToClipboard(credentials.password, "Password")
                }
                className={`p-2 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary} hover:bg-opacity-70 transition-colors`}
              >
                {copiedField === "Password" ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800`}
        >
          <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Next Steps:
          </h5>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            {nextSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg hover:shadow-lg transition-all duration-200`}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CredentialsModal;