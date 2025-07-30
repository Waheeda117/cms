import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const AccountStatusRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user account is inactive (isActive: false)
    if (user && user.isActive === false) {
        return <Navigate to="/account-inactive" replace />;
    }

    return children;
};

export default AccountStatusRoute;