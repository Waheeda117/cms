import { useNavigate } from "react-router-dom";
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from "../store/authStore";

const AccountInactive = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const handleRedirectToLogin = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            // Even if logout fails, redirect to login
            navigate('/login');
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center px-4`}>
            <div className={`max-w-md w-full mx-auto p-8 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl ${theme.border} border`}>
                <div className="text-center">
                    {/* Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                        <svg 
                            className="h-8 w-8 text-red-600" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" 
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-4 text-red-400">
                        Account Deactivated
                    </h2>

                    {/* Message */}
                    <div className={`${theme.textSecondary} mb-6 space-y-3`}>
                        <p className="text-lg font-medium">
                            Your account has been deactivated by your administrator.
                        </p>
                        <p>
                            Your access to the system has been revoked. If you believe this is an error or need to regain access, please contact your administrator immediately.
                        </p>
                        <p className="text-sm">
                            For assistance, reach out to your system administrator or IT support team.
                        </p>
                    </div>

                    {/* Button */}
                    <button
                        onClick={handleRedirectToLogin}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountInactive;