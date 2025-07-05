import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const MotionPaper = motion(Paper);

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login
        const response = await axios.post('http://localhost:5001/api/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        
        // Save the token and user data
        const { token, isAdmin, name, isProfileComplete } = response.data;
        
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('isAdmin', isAdmin || false);
        localStorage.setItem('userName', name || '');
        localStorage.setItem('isProfileComplete', isProfileComplete || false);
        
        // Call the context login to update the auth state
        await login(token);
        
        // Redirect based on user role and profile status
        if (isAdmin) {
          navigate('/admin');
        } else if (!isProfileComplete) {
          navigate('/setup');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Signup
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        // First, create the user
        const signupResponse = await axios.post('http://localhost:5001/api/auth/signup', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        
        // Then login to get the token
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        
        const { token, isAdmin, name, isProfileComplete } = loginResponse.data;
        
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('isAdmin', isAdmin || false);
        localStorage.setItem('userName', name || '');
        localStorage.setItem('isProfileComplete', isProfileComplete || false);
        
        // Update auth context with the new token and user data
        // Force isProfileComplete to false for new users
        await login(token, { isProfileComplete: false });
        
        // Redirect to setup page after signup
        navigate('/setup', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <AnimatePresence mode="wait">
          <MotionPaper
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 400,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="h4" align="center" gutterBottom>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              {isLogin
                ? 'Sign in to continue your learning journey'
                : 'Join our community of learners and teachers'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {!isLogin && (
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2 }}
                />
              )}

              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  py: 1.5,
                  mt: 2,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                    });
                  }}
                  sx={{ fontWeight: 'medium' }}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Link>
              </Typography>
            </Box>
          </MotionPaper>
        </AnimatePresence>
      </Box>
    </Container>
  );
}

export default Auth;
