import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, styled } from '@mui/material/styles';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress,
  Button,
  IconButton,
  Chip,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip
} from '@mui/material';
import Delete from '@mui/icons-material/Delete';
import Refresh from '@mui/icons-material/Refresh';
import Logout from '@mui/icons-material/Logout';
import axios from 'axios';

// Styled components for the admin layout
const AdminContainer = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
});

const MainContent = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  width: '100%',
}));

const AppBar = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

// API base URL
const API_URL = 'http://localhost:5001/api';

const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, userName: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = fetchUsers; // Alias for backward compatibility

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${deleteDialog.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove the user from the local state
      setUsers(users.filter(user => user._id !== deleteDialog.userId));
      setDeleteDialog({ ...deleteDialog, open: false });
      setError('');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AdminContainer>
      <MainContent>
        <AppBar>
          <Typography variant="h5" component="h1">
            PeerLink Admin Dashboard
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            startIcon={<Logout />}
          >
            Logout
          </Button>
        </AppBar>
        <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">User Management</Typography>
        <Box display="flex" gap={2}>
          <Button 
            variant="contained"
            onClick={refreshUsers}
            startIcon={<Refresh />}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <TextField
            size="small"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="outlined"
            disabled={loading}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Subjects</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {user.name}
                    {user.isAdmin && (
                      <Chip label="Admin" size="small" color="primary" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.status || 'offline'} 
                    color={user.status === 'online' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {user.subjectsToTeach?.map((subj, i) => (
                      <Chip 
                        key={`teach-${i}`}
                        label={`${subj.subject} (${'★'.repeat(subj.proficiency)})`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {user.subjectsToLearn?.map((subj, i) => (
                      <Chip 
                        key={`learn-${i}`}
                        label={`${subj.subject} (${'★'.repeat(subj.proficiency)})`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Delete user">
                    <IconButton
                      color="error"
                      onClick={() => setDeleteDialog({ 
                        open: true, 
                        userId: user._id, 
                        userName: user.name 
                      })}
                      disabled={user.isAdmin}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {deleteDialog.userName}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
        </Container>
      </MainContent>
    </AdminContainer>
  );
};

export default AdminDashboard;
