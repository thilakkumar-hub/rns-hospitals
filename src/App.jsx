import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Wards from './pages/Wards';
import WardDetail from './pages/WardDetail';
import Staff from './pages/Staff';
import Patients from './pages/Patients';
import Announcements from './pages/Announcements';
import EmergencyContacts from './pages/EmergencyContacts';
import CodeGenerator from './pages/admin/CodeGenerator';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Checking authentication..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="wards" element={<Wards />} />
        <Route path="wards/:id" element={<WardDetail />} />
        <Route path="staff" element={<Staff />} />
        <Route path="patients" element={<Patients />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="emergency" element={<EmergencyContacts />} />
        <Route path="profile" element={<Profile />} />

        {/* Admin only */}
        <Route path="admin/codes" element={<AdminRoute><CodeGenerator /></AdminRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
