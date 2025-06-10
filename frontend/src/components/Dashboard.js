import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Rating,
  Collapse
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';

const MotionPaper = motion(Paper);

const StatCard = ({ title, value, icon }) => (
  <MotionPaper
    elevation={3}
    sx={{ p: 3, display: 'flex', alignItems: 'center', height: '100%' }}
    whileHover={{ y: -5, boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)' }}
  >
    {icon}
    <Box ml={2}>
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" component="p" fontWeight="bold">
        {value}
      </Typography>
    </Box>
  </MotionPaper>
);

const SubjectSection = ({ title, subjects, onAdd, onDelete, isEditing }) => (
  <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '60px' }}>
      <AnimatePresence>
        {subjects.map((sub) => (
          <motion.div
            key={sub.subject}
            layout
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          >
            <Chip
              label={`${sub.subject} (${sub.proficiency || 'Beginner'})`}
              onDelete={isEditing ? () => onDelete(sub.subject, title.toLowerCase().includes('teach')) : undefined}
              color={title.toLowerCase().includes('teach') ? "primary" : "secondary"}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
    <Collapse in={isEditing}>
        <Button
            startIcon={<AddCircleOutlineIcon />}
            onClick={onAdd}
            variant="outlined"
            sx={{ mt: 2 }}
        >
            Add New Subject
        </Button>
    </Collapse>
  </Paper>
);

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // State for dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('teach'); // 'teach' or 'learn'
  const [newSubject, setNewSubject] = useState('');
  const [proficiency, setProficiency] = useState(3);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to access the dashboard');
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('http://localhost:5000/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to fetch user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setNewSubject('');
    setProficiency(3);
    setOpenDialog(true);
  };

  const handleAddSubject = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        `http://localhost:5000/subjects/${dialogType}`,
        { subject: newSubject, proficiency },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data.user);
      setOpenDialog(false);
    } catch (err) {
      console.error(`Failed to add subject to ${dialogType}`, err);
    }
  };

  const handleDeleteSubject = async (subjectName, isTeaching) => {
    const endpoint = isTeaching ? 'teach' : 'learn';
    const token = localStorage.getItem('token');
    try {
      const res = await axios.delete(
        `http://localhost:5000/subjects/${endpoint}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { subject: subjectName },
        }
      );
      setUser(res.data.user);
    } catch (err) {
      console.error(`Failed to delete subject from ${endpoint}`, err);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Typography color="error">{error}</Typography></Box>;
  }

  if (!user) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Welcome, {user.name}!
            </Typography>
            <Button
                variant="contained"
                startIcon={isEditing ? <DoneIcon /> : <EditIcon />}
                onClick={() => setIsEditing(!isEditing)}
            >
                {isEditing ? 'Done' : 'Edit Subjects'}
            </Button>
        </Box>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Subjects to Teach" value={user.subjectsToTeach.length} icon={<SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Subjects to Learn" value={user.subjectsToLearn.length} icon={<PeopleIcon sx={{ fontSize: 40, color: 'secondary.main' }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Successful Matches" value={user.matches.filter(m => m.status === 'accepted').length} icon={<CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />} />
          </Grid>

          <Grid item xs={12} md={6}>
            <SubjectSection
              title="I Can Teach"
              subjects={user.subjectsToTeach}
              onAdd={() => handleOpenDialog('teach')}
              onDelete={handleDeleteSubject}
              isEditing={isEditing}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <SubjectSection
              title="I Want to Learn"
              subjects={user.subjectsToLearn}
              onAdd={() => handleOpenDialog('learn')}
              onDelete={handleDeleteSubject}
              isEditing={isEditing}
            />
          </Grid>
        </Grid>
      </Container>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add a Subject to {dialogType === 'teach' ? 'Teach' : 'Learn'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Subject Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            sx={{ mt: 1 }}
          />
          {dialogType === 'teach' && (
            <>
              <Typography component="legend" sx={{ mt: 2 }}>Proficiency</Typography>
              <Rating
                name="proficiency-rating"
                value={proficiency}
                onChange={(event, newValue) => setProficiency(newValue)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddSubject} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;