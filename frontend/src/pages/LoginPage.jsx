import { useState } from "react";
import { motion } from "framer-motion";
import { AtSign, Lock, Loader, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../hooks/useTheme";
import hospitalImage from "../assets/login-avatar.png";

const LoginPage = () => {
  const [username, setUsername] = useState(""); // Changed from email to username
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { login, isLoading, error } = useAuthStore();
  const { theme } = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password); // Pass username instead of email
      // The RedirectAuthenticatedUser component will handle the role-based redirect
      // No need to manually navigate here as it will be handled automatically
    } catch (error) {
      // Error handling is managed by the auth store
      console.error('Login failed:', error);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${theme.primary} flex items-center justify-center p-4`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-6xl w-full ${theme.cardOpacity} backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden`}
      >
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Section - Image and Welcome Text */}
          <div
            className={`lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 flex flex-col justify-center items-center text-white relative overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-16 left-16 w-24 h-24 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-16 right-16 w-20 h-20 border-2 border-white rounded-lg rotate-12"></div>
              <div className="absolute top-1/3 left-8 w-16 h-16 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-1/3 left-12 w-12 h-12 border-2 border-white rounded-lg rotate-45"></div>
            </div>

            <div className="relative z-10 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mb-8"
              >
                <img
                  src={hospitalImage}
                  alt="Healthcare Login"
                  className="w-80 h-80 mx-auto object-contain drop-shadow-lg"
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                  Welcome Back to Healthway
                </h1>
                <p className="text-lg mb-6 text-emerald-100">
                  Access your healthcare management dashboard
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="lg:w-1/2 p-8 flex flex-col justify-center">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="max-w-md mx-auto w-full">
                <h2
                  className={`text-3xl font-bold mb-2 text-center bg-gradient-to-r ${theme.gradient} text-transparent bg-clip-text`}
                >
                  Welcome Back
                </h2>
                <p className={`text-center ${theme.textMuted} mb-8`}>
                  Sign in to your medical dashboard and continue providing
                  excellent care
                </p>

                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Username Input */}
                  <Input
                    icon={AtSign}
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />

                  {/* Password Input */}
                  <Input
                    icon={Lock}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <div className="flex items-center justify-end">
                    <Link
                      to="/forgot-password"
                      className={`text-sm ${theme.textMuted} hover:text-emerald-500 hover:underline transition-colors font-medium`}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 font-semibold text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className={`w-full py-3 px-4 bg-gradient-to-r ${theme.buttonGradient} text-white font-bold rounded-lg shadow-lg ${theme.buttonGradientHover} focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      "Sign In to Dashboard"
                    )}
                  </motion.button>
                </form>

                <div
                  className={`mt-6 pt-6 ${theme.borderSecondary} border-t text-center`}
                >
                  <p className={`text-sm ${theme.textMuted}`}>
                    Don't have an account?{" "}
                    <span className={`${theme.textMuted} hover:text-emerald-500 hover:underline transition-colors font-medium cursor-pointer`}>Contact Your Administrator</span>
                    {/* <Link
                      to="/signup"
                      className={`${theme.textMuted} hover:text-emerald-500 hover:underline transition-colors font-medium`}
                    >
                      Create account
                    </Link> */}
                  </p>
                </div>

                {/* Security indicators */}
                <div className="mt-6 text-center">
                  <p
                    className={`text-xs ${theme.textMuted} flex items-center justify-center space-x-4`}
                  >
                    <span className="flex items-center space-x-1">
                      <Shield size={12} />
                      <span>Secure Login</span>
                    </span>
                    <span>•</span>
                    <span>End-to-End Encryption</span>
                  </p>
                </div>

                {/* Quick access info */}
                <div className={`mt-4 p-4 ${theme.cardSecondary} rounded-lg`}>
                  <p className={`text-xs ${theme.textMuted} text-center`}>
                    <strong className={theme.textSecondary}>
                      Quick Access:
                    </strong>{" "}
                    Use your registered username and password to access patient
                    records, manage appointments, and view medical reports.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
