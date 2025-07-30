import { motion } from "framer-motion";
import Input from "../components/Input";
import CNICInput from "../components/CNICInput";
import { Loader, Lock, Mail, User, UserCheck, AtSign } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";
import { useTheme } from '../hooks/useTheme';
// Import your hospital image
import hospitalImage from "../assets/signup-avatar.png"; // Adjust path as needed

const SignUpPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cnic, setCnic] = useState("");
  const [role, setRole] = useState("admin");
  const navigate = useNavigate();

  const { signup, error, isLoading } = useAuthStore();
  const { theme } = useTheme();

  // Generate username whenever firstName or lastName changes
  useEffect(() => {
    if (firstName && lastName) {
      const generatedUsername = `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`;
      setUsername(generatedUsername);
    } else {
      setUsername("");
    }
  }, [firstName, lastName]);

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!firstName || !lastName || !password) {
      return;
    }

    // Validate CNIC format if provided
    if (cnic) {
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      if (!cnicRegex.test(cnic)) {
        return;
      }
    }

    try {
            await signup(
        firstName.trim(), 
        lastName.trim(), 
        username, 
        email.trim() || null, 
        cnic.trim() || null, 
        password, 
        role
      );
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.primary} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-6xl w-full ${theme.cardOpacity} backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden`}
      >
        <div className="flex flex-col lg:flex-row min-h-[700px]">
          {/* Left Section - Image and Welcome Text */}
          <div className={`lg:w-1/2 bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 flex flex-col justify-center items-center text-white relative overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-20 right-10 w-16 h-16 border-2 border-white rounded-lg rotate-45"></div>
              <div className="absolute top-1/2 left-5 w-12 h-12 border-2 border-white rounded-full"></div>
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
                  alt="Healthcare Management" 
                  className="w-80 h-80 mx-auto object-contain drop-shadow-lg"
                />
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                  Welcome to Healthway
                </h1>
                <p className="text-lg mb-6 text-emerald-100">
                  Comprehensive healthcare management for medical professionals
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Section - Signup Form */}
          <div className="lg:w-1/2 p-8 flex flex-col justify-center">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="max-w-md mx-auto w-full">
                <h2 className={`text-3xl font-bold mb-2 text-center bg-gradient-to-r ${theme.gradient} text-transparent bg-clip-text`}>
                  Create Account
                </h2>
                <p className={`text-center ${theme.textMuted} mb-8`}>
                  Join us for streamlined healthcare management
                </p>

                <form onSubmit={handleSignUp} className="space-y-6">
                  {/* First Name */}
                  <Input
                    icon={User}
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />

                  {/* Last Name */}
                  <Input
                    icon={User}
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />

                  {/* Username (Read-only) */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <AtSign className={`w-5 h-5 ${theme.textMuted}`} />
                    </div>
                    <input
                      type="text"
                      placeholder="Username (Auto-generated)"
                      value={username}
                      readOnly
                      className={`w-full pl-10 pr-3 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.textPrimary} bg-gray-50 dark:bg-gray-800 cursor-not-allowed transition duration-200`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className={`text-xs ${theme.textMuted}`}>Auto</span>
                    </div>
                  </div>

                  {/* Role Selection Dropdown */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <UserCheck className={`w-5 h-5 ${theme.textMuted}`} />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className={`w-full pl-10 pr-3 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                    >
                      <option value="admin" className={theme.input}>
                        Admin
                      </option>
                    </select>
                  </div>

                  {/* Email (Optional) */}
                  <div className="relative">
                    <Input
                      icon={Mail}
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className={`text-xs ${theme.textMuted}`}>Optional</span>
                    </div>
                  </div>

                  {/* CNIC (Optional) */}
                  <div className="relative">
                    <CNICInput
                      value={cnic}
                      onChange={setCnic}
                      placeholder="CNIC (12345-1234567-1) - Optional"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className={`text-xs ${theme.textMuted}`}>Optional</span>
                    </div>
                  </div>

                  {/* Password */}
                  <Input
                    icon={Lock}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  {/* Password Strength Meter */}
                  {/* <PasswordStrengthMeter password={password} /> */}

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
                    className={`w-full py-3 px-4 bg-gradient-to-r ${theme.buttonGradient} text-white font-bold rounded-lg shadow-lg ${theme.buttonGradientHover} focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader className="animate-spin" size={20} />
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </motion.button>
                </form>

                <div className={`mt-6 pt-6 ${theme.borderSecondary} border-t text-center`}>
                  <p className={`text-sm ${theme.textMuted}`}>
                    Already have an account?{" "}
                    <Link 
                      to={"/login"} 
                      className={`${theme.textMuted} hover:text-emerald-500 hover:underline transition-colors font-medium`}
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>

                {/* Trust indicators */}
                <div className="mt-6 text-center">
                  <p className={`text-xs ${theme.textMuted} flex items-center justify-center space-x-4`}>
                    <span className="flex items-center space-x-1">
                      <Lock size={12} />
                      <span>HIPAA Compliant</span>
                    </span>
                    <span>•</span>
                    <span>Medical Grade Security</span>
                  </p>
                </div>

                {/* Username generation info */}
                <div className={`mt-4 p-3 ${theme.cardSecondary} rounded-lg`}>
                  <p className={`text-xs ${theme.textMuted} text-center`}>
                    <strong className={theme.textSecondary}>
                      Username Info:
                    </strong>{" "}
                    Your username is automatically generated from your first and last name. 
                    It will be unique and used for logging in.
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

export default SignUpPage;