import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Grid,
  Chip,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Geography',
  'Economics',
  'Business Studies',
];

const Profile = () => {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();

  // State for profile data
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    profileImage: '',
    subjectsToTeach: [],
    subjectsToLearn: []
  });
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state for editing profile
  const [editProfile, setEditProfile] = useState({
    bio: '',
    subjectsToTeach: [],
    subjectsToLearn: [],
    newTeachSubject: '',
    teachProficiency: 3,
    newLearnSubject: '',
    learnProficiency: 1,
    profileImage: null,
    previewImage: ''
  });
  
  // Get user ID from URL params or use current user
  const currentUserId = JSON.parse(localStorage.getItem('user'))?._id;
  const isOwnProfile = !urlUserId || urlUserId === currentUserId;

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = urlUserId 
        ? `http://localhost:5001/api/users/${urlUserId}`
        : 'http://localhost:5001/api/users/profile';
      
      const response = await axios.get(endpoint, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        } 
      });
      
      const userData = {
        ...response.data,
        subjectsToTeach: response.data.subjectsToTeach || [],
        subjectsToLearn: response.data.subjectsToLearn || []
      };
      
      setProfile(userData);
      setEditProfile(prev => ({
        ...prev,
        bio: userData.bio || '',
        subjectsToTeach: [...(userData.subjectsToTeach || [])],
        subjectsToLearn: [...(userData.subjectsToLearn || [])],
        previewImage: userData.profileImage || ''
      }));
      
      setError('');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, urlUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Open edit modal
  const handleOpenEdit = () => {
    setEditProfile(prev => ({
      ...prev,
      bio: profile.bio || '',
      subjectsToTeach: [...(profile.subjectsToTeach || [])],
      subjectsToLearn: [...(profile.subjectsToLearn || [])],
      newTeachSubject: '',
      teachProficiency: 3,
      newLearnSubject: '',
      learnProficiency: 1,
      previewImage: profile.profileImage || ''
    }));
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile image upload
  const handleImageChange = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfile(prev => ({
          ...prev,
          profileImage: file,
          previewImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding/removing teaching subjects
  const handleAddTeachSubject = () => {
    if (editProfile.newTeachSubject && !editProfile.subjectsToTeach.some(s => s.subject === editProfile.newTeachSubject)) {
      setEditProfile(prev => ({
        ...prev,
        subjectsToTeach: [
          ...prev.subjectsToTeach,
          { subject: prev.newTeachSubject, proficiency: prev.teachProficiency }
        ],
        newTeachSubject: '',
        teachProficiency: 3
      }));
    }
  };

  const handleRemoveTeachSubject = (subjectToRemove) => {
    setEditProfile(prev => ({
      ...prev,
      subjectsToTeach: prev.subjectsToTeach.filter(s => s.subject !== subjectToRemove)
    }));
  };

  // Handle adding/removing learning interests
  const handleAddLearnSubject = () => {
    if (editProfile.newLearnSubject && !editProfile.subjectsToLearn.some(s => s.subject === editProfile.newLearnSubject)) {
      setEditProfile(prev => ({
        ...prev,
        subjectsToLearn: [
          ...prev.subjectsToLearn,
          { subject: prev.newLearnSubject, proficiency: prev.learnProficiency }
        ],
        newLearnSubject: '',
        learnProficiency: 1
      }));
    }
  };

  const handleRemoveLearnSubject = (subjectToRemove) => {
    setEditProfile(prev => ({
      ...prev,
      subjectsToLearn: prev.subjectsToLearn.filter(s => s.subject !== subjectToRemove)
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('bio', editProfile.bio);
      formData.append('subjectsToTeach', JSON.stringify(editProfile.subjectsToTeach));
      formData.append('subjectsToLearn', JSON.stringify(editProfile.subjectsToLearn));
      
      if (editProfile.profileImage) {
        formData.append('profileImage', editProfile.profileImage);
      }
      
      const response = await axios.put('http://localhost:5001/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setProfile(response.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={profile.profileImage}
              sx={{ width: 80, height: 80, mr: 3, fontSize: '2rem' }}
            >
              {profile.name ? profile.name[0].toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1">
                {profile.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {profile.email}
              </Typography>
            </Box>
          </Box>
          
          {isOwnProfile && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleOpenEdit}
            >
              Edit Profile
            </Button>
          )}
        </Box>

        {profile.bio && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>About</Typography>
            <Typography>{profile.bio}</Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Teaching
                </Typography>
                {profile.subjectsToTeach?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profile.subjectsToTeach.map((subject, index) => (
                      <Chip
                        key={index}
                        label={`${subject.subject} (${'★'.repeat(subject.proficiency)})`}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No subjects added yet</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Learning
                </Typography>
                {profile.subjectsToLearn?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profile.subjectsToLearn.map((subject, index) => (
                      <Chip
                        key={index}
                        label={`${subject.subject} (${'★'.repeat(subject.proficiency)})`}
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No interests added yet</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={isEditing} 
        onClose={handleCloseEdit}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Profile Image */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={editProfile.previewImage || editProfile.profileImage}
                sx={{ width: 120, height: 120, mb: 2, fontSize: '3rem' }}
              >
                {profile.name ? profile.name[0].toUpperCase() : 'U'}
              </Avatar>
              <Button
                variant="outlined"
                component="label"
                startIcon={<EditIcon />}
              >
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </Button>
            </Box>

            {/* Bio */}
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              multiline
              rows={4}
              value={editProfile.bio}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
            />

            {/* Teaching Subjects */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Teaching Subjects</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Add Subject to Teach"
                value={editProfile.newTeachSubject}
                onChange={(e) => setEditProfile(prev => ({
                  ...prev,
                  newTeachSubject: e.target.value
                }))}
                variant="outlined"
              />
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Proficiency</InputLabel>
                <Select
                  value={editProfile.teachProficiency}
                  label="Proficiency"
                  onChange={(e) => setEditProfile(prev => ({
                    ...prev,
                    teachProficiency: e.target.value
                  }))}
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <MenuItem key={num} value={num}>
                      {'★'.repeat(num) + '☆'.repeat(5 - num)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                onClick={handleAddTeachSubject}
                disabled={!editProfile.newTeachSubject}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {editProfile.subjectsToTeach?.map((subject, index) => (
                <Chip
                  key={index}
                  label={`${subject.subject} (${'★'.repeat(subject.proficiency)})`}
                  onDelete={() => handleRemoveTeachSubject(subject.subject)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>

            {/* Learning Interests */}
            <Typography variant="h6" gutterBottom>Learning Interests</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Add Subject to Learn"
                value={editProfile.newLearnSubject}
                onChange={(e) => setEditProfile(prev => ({
                  ...prev,
                  newLearnSubject: e.target.value
                }))}
                variant="outlined"
              />
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Proficiency</InputLabel>
                <Select
                  value={editProfile.learnProficiency}
                  label="Proficiency"
                  onChange={(e) => setEditProfile(prev => ({
                    ...prev,
                    learnProficiency: e.target.value
                  }))}
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <MenuItem key={num} value={num}>
                      {'★'.repeat(num) + '☆'.repeat(5 - num)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                onClick={handleAddLearnSubject}
                disabled={!editProfile.newLearnSubject}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {editProfile.subjectsToLearn?.map((subject, index) => (
                <Chip
                  key={index}
                  label={`${subject.subject} (${'★'.repeat(subject.proficiency)})`}
                  onDelete={() => handleRemoveLearnSubject(subject.subject)}
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained" 
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
