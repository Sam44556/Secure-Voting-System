import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import VerifyEmail from './pages/VerifyEmail';
import PendingApproval from './pages/PendingApproval';
import MainLayout from './layouts/MainLayout';

// Dashboards
import AdminDashboard from './pages/AdminDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import VoterDashboard from './pages/VoterDashboard';
import AuditorDashboard from './pages/AuditorDashboard';
import ElectionDetails from './pages/ElectionDetails';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  // Workflow 1 & 3: Role=NULL check
  if (!user.role) return <Navigate to="/pending-approval" />;

  // RBAC check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <MainLayout>{children}</MainLayout>;
};

const DashboardSwitcher = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'Admin': return <AdminDashboard />;
    case 'Election Officer': return <OfficerDashboard />;
    case 'Voter': return <VoterDashboard />;
    case 'Auditor': return <AuditorDashboard />;
    default: return <Navigate to="/pending-approval" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />

          {/* Pending Approval (Authenticated but no role) */}
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardSwitcher />
              </ProtectedRoute>
            }
          />

          <Route
            path="/election/:id"
            element={
              <ProtectedRoute>
                <ElectionDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;
