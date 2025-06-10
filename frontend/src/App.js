import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Box } from '@mui/material';

// Component Imports
import Signup from './components/Signup';
import Login from './components/Login';
import SetupForm from './components/SetupForm';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import MatchesSwipe from './components/MatchesSwipe';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import NavMenu from './components/NavMenu';
import PrivateRoute from './components/PrivateRoute';

const drawerWidth = 240;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (token) {
        try {
          const res = await axios.get('http://localhost:5000/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsProfileComplete(res.data.isProfileComplete);
        } catch (error) {
          console.error('Failed to check profile status', error);
          setIsProfileComplete(false);
        }
      }
    };
    checkProfileStatus();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <Box sx={{ display: 'flex' }}>
      {!isAuthPage && token && <NavMenu handleLogout={handleLogout} notifications={notifications} />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: isAuthPage ? '100%' : { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Routes>
          <Route path="/signup" element={token ? <Navigate to="/dashboard" /> : <Signup />} />
          <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
          <Route
            path="/dashboard"
            element={<PrivateRoute>{!isProfileComplete ? <SetupForm /> : <Dashboard />}</PrivateRoute>}
          />
          <Route
            path="/admin"
            element={<PrivateRoute>{isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />}</PrivateRoute>}
          />
          <Route path="/matches" element={<PrivateRoute><MatchesSwipe /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/chat/:matchId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;