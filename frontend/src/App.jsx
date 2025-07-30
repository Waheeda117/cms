import { Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import FloatingShape from "./components/FloatingShape";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import LoadingSpinner from "./components/LoadingSpinner";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import { useTheme } from "./hooks/useTheme";
import AllUsers from "./pages/admin/AllUsers";
import RoleProfile from "./pages/admin/RoleProfile";

import AccountStatusRoute from "./components/AccountStatusRoute";
import AccountInactive from "./components/AccountInactive";
import Stocks from "./pages/inventory/Stocks";
import AllStocks from "./pages/inventory/AllStocks";
import DefaultPasswordModal from "./components/DefaultPasswordModal";
import InventroyAdminDashboard from "./pages/inventory/InventroyAdminDashboard";
import AddBatch from "./pages/inventory/AddBatch";
import UpdateBatch from "./pages/inventory/UpdateBatch";
import BatchByID from "./pages/inventory/BatchByID";
import StockByID from "./pages/inventory/StockByID";

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// redirect authenticated users to their role-based home page
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    // Check account status first - redirect inactive users
    if (user.isActive === false) {
      return <Navigate to="/account-inactive" replace />;
    }

    // Redirect to role-specific dashboard
    const roleRoute = `/${user.role}`;
    return <Navigate to={roleRoute} replace />;
  }

  return children;
};

// Helper component to redirect root "/" to role-based route
const RoleBasedRedirect = () => {
  const { user } = useAuthStore();
  const roleRoute = `/${user.role}`;
  return <Navigate to={roleRoute} replace />;
};

// Generic page components for different routes
const GenericPage = ({ title, role }) => {
  const { theme } = useTheme();
  return (
    <div className="p-8 text-center">
      <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
        {title} - {role.charAt(0).toUpperCase() + role.slice(1)}
      </h1>
      <p className={`${theme.textMuted} mt-2`}>Coming soon...</p>
    </div>
  );
};

function App() {
  const { isCheckingAuth, checkAuth, isAuthenticated, user } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Changed default to false
  const [sidebarMiniMode, setSidebarMiniMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [showDefaultPasswordModal, setShowDefaultPasswordModal] = useState(false);

  useEffect(() => {
    checkAuth();
    initializeTheme();
  }, [checkAuth, initializeTheme]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        setSidebarOpen(false);
        setSidebarMiniMode(false); // No mini mode on mobile
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && user.isDefaultPassword) {
      setShowDefaultPasswordModal(true);
    } else {
      setShowDefaultPasswordModal(false);
    }
  }, [isAuthenticated, user]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebarMiniMode = () => {
    if (!isMobile) {
      setSidebarMiniMode(!sidebarMiniMode);
    }
  };

  // Handle clicking outside sidebar on mobile
  const handleOverlayClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  if (isCheckingAuth) return <LoadingSpinner />;

  const isAuthenticatedWithActiveAccount = isAuthenticated && user && user.isActive !== false;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.primary} relative overflow-hidden`}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleOverlayClick}
        />
      )}

      {/* Header */}
      {isAuthenticatedWithActiveAccount && (
        <Header 
          sidebarOpen={sidebarOpen} 
          sidebarMiniMode={sidebarMiniMode}
          onToggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />
      )}

      {/* Sidebar */}
      {isAuthenticatedWithActiveAccount && (
        <Sidebar
          isOpen={sidebarOpen}
          isMiniMode={sidebarMiniMode && !isMobile}
          onToggleMiniMode={toggleSidebarMiniMode}
          onClose={closeSidebar}
          isMobile={isMobile}
        />
      )}

      {/* Main Content */}
      <main className={`
        ${isAuthenticatedWithActiveAccount ? 'pt-16' : 'pt-0'}
        ${isAuthenticatedWithActiveAccount && !isMobile ? 'transition-all duration-300' : ''}
        ${isAuthenticatedWithActiveAccount && sidebarOpen && !isMobile 
          ? sidebarMiniMode 
            ? 'lg:pl-16' 
            : 'lg:pl-72'
          : ''
        }
        ${isAuthenticatedWithActiveAccount ? 'px-4 lg:px-8' : ''}
        ${isAuthenticatedWithActiveAccount ? 'min-h-[calc(100vh-4rem)]' : 'min-h-screen'}
        flex items-center justify-center
      `}>
        <div className="w-full max-w-7xl">
        <Routes>
          {/* Account Inactive Route - No protection needed, just the component */}
          <Route path="/account-inactive" element={<AccountInactive />} />

          {/* Root redirect to role-based route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          {/* Auth routes */}
          <Route
            path="/signup"
            element={
              <RedirectAuthenticatedUser>
                <SignUpPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectAuthenticatedUser>
                <LoginPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/email-verification"
            element={
              <RedirectAuthenticatedUser>
                <EmailVerificationPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RedirectAuthenticatedUser>
                <ForgotPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <RedirectAuthenticatedUser>
                <ResetPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <DashboardPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/user-management"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <AllUsers />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/user-management/:role/:id" // Dynamic route for role profile
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <RoleProfile />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <GenericPage title="Appointments Page" role="admin" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <GenericPage title="Reports Page" role="admin" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory-management"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <Stocks />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/:role/inventory-management/:batchId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin", "pharmacist_inventory"]}>
                  <BatchByID />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/:role/all-stocks/:stockId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin", "pharmacist_inventory"]}>
                  <StockByID />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-batch"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin", "pharmacist_inventory"]}>
                  <AddBatch />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-batch/:batchId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <UpdateBatch />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/all-stocks"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <AllStocks />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <GenericPage title="Settings Page" role="admin" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <AccountStatusRoute>
                    <GenericPage title="Dashboard" role="doctor" />
                  </AccountStatusRoute>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <AccountStatusRoute>
                    <GenericPage title="Patients Page" role="doctor" />
                  </AccountStatusRoute>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <AccountStatusRoute>
                    <GenericPage title="Appointments Page" role="doctor" />
                  </AccountStatusRoute>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/consultations"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <AccountStatusRoute>
                    <GenericPage title="Consultations Page" role="doctor" />
                  </AccountStatusRoute>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <GenericPage title="Reports Page" role="doctor" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["doctor"]}>
                  <GenericPage title="Settings Page" role="doctor" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Receptionist Routes */}
          <Route
            path="/receptionist"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Dashboard" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/patients"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Patients Page" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Appointments Page" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Reports Page" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["receptionist"]}>
                  <GenericPage title="Settings Page" role="receptionist" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Pharmacist Dispenser Routes */}
          <Route
            path="/pharmacist_dispenser"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage title="Dashboard" role="pharmacist_dispenser" />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/patients"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Patients Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Appointments Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/prescriptions"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Prescriptions Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Reports Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_dispenser/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_dispenser"]}>
                  <GenericPage
                    title="Settings Page"
                    role="pharmacist_dispenser"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Pharmacist Inventory Routes */}
          <Route
            path="/pharmacist_inventory"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <InventroyAdminDashboard />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacist_inventory/inventory-management"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <Stocks />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacist_inventory/all-stocks"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <AllStocks />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacist_inventory/patients"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <GenericPage
                    title="Patients Page"
                    role="pharmacist_inventory"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_inventory/appointments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <GenericPage
                    title="Appointments Page"
                    role="pharmacist_inventory"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacist_inventory/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <GenericPage
                    title="Reports Page"
                    role="pharmacist_inventory"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist_inventory/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["pharmacist_inventory"]}>
                  <GenericPage
                    title="Settings Page"
                    role="pharmacist_inventory"
                  />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Catch all routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
              </div>
      </main>
      <Toaster />

      <DefaultPasswordModal 
        isOpen={showDefaultPasswordModal} 
        onClose={() => setShowDefaultPasswordModal(false)} 
      />

    </div>
  );
}

export default App;
