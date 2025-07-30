import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useTheme } from '../hooks/useTheme';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
	const { isAuthenticated, user } = useAuthStore();
	const { theme } = useTheme();

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	if (allowedRoles && !allowedRoles.includes(user?.role)) {
		return (
			<div className={`min-h-screen flex items-center justify-center`}>
				<div className={`max-w-md w-full mx-auto mt-10 p-8 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl ${theme.border} border`}>
					<h2 className={`text-2xl font-bold mb-4 text-center text-red-400`}>Access Denied</h2>
					<p className={`${theme.textSecondary} text-center`}>
						You don't have permission to access this page.
						<br />
						<span className="font-semibold">Required role: {allowedRoles.join(" or ")}</span>
					</p>
				</div>
			</div>
		);
	}

	return children;
};

export default RoleProtectedRoute;