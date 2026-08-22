import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import NewAppointmentPage from "@/pages/NewAppointmentPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import SearchPage from "@/pages/SearchPage";
import BillingPage from "@/pages/BillingPage";
import ReportsPage from "@/pages/ReportsPage";
import HelpPage from "@/pages/HelpPage";
import PatientRegisterPage from "@/pages/PatientRegisterPage";
import PatientsPage from "@/pages/PatientsPage";
import UserManagementPage from "@/pages/UserManagementPage";

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/appointments/new" element={<NewAppointmentPage />} />
        <Route path="/patients/new" element={<PatientRegisterPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
