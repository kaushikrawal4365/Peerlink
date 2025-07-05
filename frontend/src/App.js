import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Component Imports
import Auth from './components/Auth';
import SetupForm from './components/SetupForm';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Signup from './components/Signup';
import Matches from './components/Matches';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import NavMenu from './components/NavMenu';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './components/LandingPage';

const drawerWidth = 240;

function AppContent() {
  const { token, user, logout, loading } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  // Check both user object and localStorage for profile completion status
  const isProfileSetupComplete = user?.isProfileComplete || 
                               localStorage.getItem('isProfileComplete') === 'true';
  
  // Show loading state while checking auth status
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {!isAuthPage && token && <NavMenu handleLogout={logout} notifications={[]} />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isAuthPage || location.pathname === '/' ? 0 : 3,
          width: isAuthPage || location.pathname === '/' ? '100%' : { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/signup" element={!token ? <Signup /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!token ? <Auth /> : <Navigate to="/dashboard" />} />
          <Route 
            path="/setup" 
            element={
              token ? (
                isProfileSetupComplete ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <SetupForm />
                )
              ) : (
                <Navigate to="/login" state={{ from: '/setup' }} />
              )
            } 
          />
          <Route
            path="/dashboard"
            element={<PrivateRoute>{isProfileSetupComplete ? <Dashboard /> : <Navigate to="/setup" />}</PrivateRoute>}
          />
          <Route
            path="/matches"
            element={
              <PrivateRoute>
                {isProfileSetupComplete ? <Matches /> : <Navigate to="/setup" />}
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={<PrivateRoute>{user?.isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />}</PrivateRoute>}
          />
          <Route path="/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/chat/:matchId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/"} />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;