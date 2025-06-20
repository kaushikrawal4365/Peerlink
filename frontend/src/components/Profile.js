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
  Rating,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
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

  // Get bio from localStorage or use default
  const getStoredBio = () => {
    return localStorage.getItem('userBio') || 'No bio added yet.';
  };

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get bio from localStorage first
      const storedBio = getStoredBio();
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const endpoint = urlUserId 
          ? `http://localhost:5001/api/users/${urlUserId}`
          : 'http://localhost:5001/api/users/me';
        
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const serverData = response.data;
        
        // Update profile with server data but keep the bio from localStorage
        setProfile(prev => ({
          ...serverData,
          bio: storedBio || serverData.bio || 'No bio added yet.',
          // Ensure subjects are properly formatted
          subjectsToTeach: Array.isArray(serverData.subjectsToTeach) 
            ? serverData.subjectsToTeach 
            : [],
          subjectsToLearn: Array.isArray(serverData.subjectsToLearn) 
            ? serverData.subjectsToLearn 
            : []
        }));
        
        // Also update edit form with current data
        setEditProfile(prev => ({
          ...prev,
          bio: storedBio || serverData.bio || '',
          subjectsToTeach: Array.isArray(serverData.subjectsToTeach) 
            ? [...serverData.subjectsToTeach] 
            : [],
          subjectsToLearn: Array.isArray(serverData.subjectsToLearn) 
            ? [...serverData.subjectsToLearn] 
            : []
        }));
        
        // Initialize edit form with fetched data
        setEditProfile(prev => ({
          ...prev,
          bio: storedBio || serverData.bio || '',
          subjectsToTeach: Array.isArray(serverData.subjectsToTeach) 
            ? [...serverData.subjectsToTeach] 
            : [],
          subjectsToLearn: Array.isArray(serverData.subjectsToLearn) 
            ? [...serverData.subjectsToLearn] 
            : [],
          previewImage: serverData.profileImage || '',
          newTeachSubject: '',
          newLearnSubject: '',
          teachProficiency: 3,
          learnProficiency: 1
        }));
      } catch (err) {
        console.warn('Warning: Could not fetch profile from server, using local data only', err);
      }
      
    } catch (err) {
      console.error('Error in profile setup:', err);
      setError('Profile loaded with limited functionality.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, urlUserId]);

  // Fetch profile on component mount or when URL userId changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handlers
  const handleOpenEdit = () => {
    setEditProfile(prev => ({
      ...prev,
      bio: profile.bio || '',
      subjectsToTeach: [...(profile.subjectsToTeach || [])],
      subjectsToLearn: [...(profile.subjectsToLearn || [])],
      previewImage: profile.profileImage || '',
      newTeachSubject: '',
      newLearnSubject: '',
      teachProficiency: 3,
      learnProficiency: 1
    }));
    setIsEditing(true);
  };
  
  // Handle removing a subject from view mode
  const handleRemoveSubject = (type, subjectToRemove) => {
    if (window.confirm(`Remove ${subjectToRemove.subject} from your ${type}?`)) {
      const updatedProfile = { ...profile };
      if (type === 'teaching') {
        updatedProfile.subjectsToTeach = updatedProfile.subjectsToTeach.filter(
          s => s.subject !== subjectToRemove.subject
        );
      } else {
        updatedProfile.subjectsToLearn = updatedProfile.subjectsToLearn.filter(
          s => s.subject !== subjectToRemove.subject
        );
      }
      setProfile(updatedProfile);
      
      // Update server if authenticated
      const token = localStorage.getItem('token');
      if (token) {
        axios.put('http://localhost:5001/api/users/profile', updatedProfile, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(console.error);
      }
    }
  };
  
  const handleCloseEdit = () => {
    setIsEditing(false);
    setError('');
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
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
  
  const handleAddTeachSubject = () => {
    if (editProfile.newTeachSubject && !editProfile.subjectsToTeach.some(s => s.subject === editProfile.newTeachSubject)) {
      setEditProfile(prev => ({
        ...prev,
        subjectsToTeach: [
          ...prev.subjectsToTeach, 
          { subject: prev.newTeachSubject, proficiency: prev.teachProficiency }
        ],
        newTeachSubject: ''
      }));
    }
  };
  
  const handleAddLearnSubject = () => {
    if (editProfile.newLearnSubject && !editProfile.subjectsToLearn.some(s => s.subject === editProfile.newLearnSubject)) {
      setEditProfile(prev => ({
        ...prev,
        subjectsToLearn: [
          ...prev.subjectsToLearn, 
          { subject: prev.newLearnSubject, proficiency: prev.learnProficiency }
        ],
        newLearnSubject: ''
      }));
    }
  };
  
  // Get available subjects that haven't been selected yet
  const getAvailableSubjects = (selectedSubjects) => {
    return SUBJECTS.filter(subject => 
      !selectedSubjects.some(s => s.subject === subject)
    );
  };
  
  const handleRemoveTeachSubject = (subjectToRemove) => {
    setEditProfile(prev => ({
      ...prev,
      subjectsToTeach: prev.subjectsToTeach.filter(s => s.subject !== subjectToRemove)
    }));
  };
  
  const handleRemoveLearnSubject = (subjectToRemove) => {
    setEditProfile(prev => ({
      ...prev,
      subjectsToLearn: prev.subjectsToLearn.filter(s => s.subject !== subjectToRemove)
    }));
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      
      // Save bio to localStorage
      localStorage.setItem('userBio', editProfile.bio);
      
      // Update local profile state
      const updatedProfile = {
        ...profile,
        bio: editProfile.bio,
        subjectsToTeach: [...editProfile.subjectsToTeach],
        subjectsToLearn: [...editProfile.subjectsToLearn],
        profileImage: editProfile.previewImage || profile.profileImage
      };
      
      setProfile(updatedProfile);
      
      // Only try to save to server if we have a token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Create the request payload
          const payload = {
            bio: editProfile.bio,
            subjectsToTeach: editProfile.subjectsToTeach,
            subjectsToLearn: editProfile.subjectsToLearn
          };
          
          // For profile image, we'll use FormData
          if (editProfile.profileImage) {
            const formData = new FormData();
            formData.append('profileImage', editProfile.profileImage);
            
            // Upload the image
            const uploadResponse = await axios.post('http://localhost:5001/api/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
              }
            });
            
            // Update the profile with the image URL
            payload.profileImage = uploadResponse.data.imageUrl;
            updatedProfile.profileImage = uploadResponse.data.imageUrl;
          }
          
          // Update the profile on the server
          await axios.put('http://localhost:5001/api/users/profile', payload, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Update local storage with the latest profile
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
          
        } catch (err) {
          console.warn('Warning: Could not update profile on server', err);
          // Continue with local updates even if server update fails
        }
      }
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to save profile changes. Please try again.');
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

  // Render profile not found
  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography variant="h6">Profile not found</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', alignItems: 'start', mb: 4 }}>
          <Avatar
            src={profile.profileImage}
            sx={{ width: 100, height: 100, mr: 3 }}
          />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                {profile.name}
              </Typography>
              {isOwnProfile && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleOpenEdit}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              {profile.email}
            </Typography>
            
            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 3, my: 2 }}>
              <Box>
                <Typography variant="h6" color="primary">
                  {profile.subjectsToTeach?.length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Teaching
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="secondary">
                  {profile.subjectsToLearn?.length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Learning
                </Typography>
              </Box>
            </Box>
            
            {profile.bio && (
              <Typography variant="body1" sx={{ mt: 1 }}>
                {profile.bio}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Teaching and Learning Sections */}
        <Grid container spacing={3}>
          {/* Teaching Subjects */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Teaching
                </Typography>
                {profile.subjectsToTeach?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {profile.subjectsToTeach.map((subject, index) => (
                      <Box 
                        key={index}
                        sx={{
                          position: 'relative',
                          '&:hover .remove-chip': {
                            display: 'flex'
                          },
                          mr: 1,
                          mb: 1
                        }}
                      >
                        <Chip
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <span>{subject.subject}</span>
                              <Box sx={{ color: 'gold', ml: 0.5 }}>
                                {'★'.repeat(subject.proficiency)}
                                {'☆'.repeat(5 - subject.proficiency)}
                              </Box>
                            </Box>
                          }
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            height: 'auto', 
                            py: 0.5,
                            pr: 3,
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText'
                            }
                          }}
                        />
                        <IconButton
                          className="remove-chip"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSubject('teaching', subject);
                          }}
                          sx={{
                            display: 'none',
                            position: 'absolute',
                            right: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'error.main',
                            backgroundColor: 'background.paper',
                            width: 20,
                            height: 20,
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'error.contrastText'
                            }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No teaching subjects added yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Learning Subjects */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Learning
                </Typography>
                {profile.subjectsToLearn?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {profile.subjectsToLearn.map((subject, index) => (
                      <Box 
                        key={index}
                        sx={{
                          position: 'relative',
                          '&:hover .remove-chip': {
                            display: 'flex'
                          },
                          mr: 1,
                          mb: 1
                        }}
                      >
                        <Chip
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <span>{subject.subject}</span>
                              <Box sx={{ color: 'gold', ml: 0.5, fontSize: '0.9em' }}>
                                (Goal: {'★'.repeat(subject.proficiency)})
                              </Box>
                            </Box>
                          }
                          color="secondary"
                          variant="outlined"
                          sx={{ 
                            height: 'auto', 
                            py: 0.5,
                            pr: 3,
                            '&:hover': {
                              backgroundColor: 'secondary.light',
                              color: 'secondary.contrastText'
                            }
                          }}
                        />
                        <IconButton
                          className="remove-chip"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSubject('learning', subject);
                          }}
                          sx={{
                            display: 'none',
                            position: 'absolute',
                            right: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'error.main',
                            backgroundColor: 'background.paper',
                            width: 20,
                            height: 20,
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'error.contrastText'
                            }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No learning interests added yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
      </Paper>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onClose={handleCloseEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Profile Picture */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={editProfile.previewImage}
                    sx={{ width: 120, height: 120, mb: 2 }}
                  />
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-image-upload"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="profile-image-upload">
                    <Button variant="outlined" component="span" startIcon={<AddIcon />}>
                      {editProfile.previewImage ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                  </label>
                </Box>
              </Grid>

              {/* Bio */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  value={editProfile.bio}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </Grid>

              {/* Teaching Subjects */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Teaching Subjects
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={editProfile.newTeachSubject}
                      onChange={(e) => setEditProfile(prev => ({ ...prev, newTeachSubject: e.target.value }))}
                      label="Subject"
                      size="small"
                    >
                      {SUBJECTS.filter(subj => !editProfile.subjectsToTeach.some(s => s.subject === subj))
                        .map((subject) => (
                          <MenuItem key={subject} value={subject}>
                            {subject}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Skill:
                    </Typography>
                    <Rating
                      value={editProfile.teachProficiency}
                      onChange={(e, newValue) => setEditProfile(prev => ({ ...prev, teachProficiency: newValue }))}
                      size="small"
                      max={5}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleAddTeachSubject}
                    disabled={!editProfile.newTeachSubject}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 40, p: 1, bgcolor: 'action.hover', borderRadius: 1, alignItems: 'center' }}>
                  {editProfile.subjectsToTeach.length > 0 ? (
                    editProfile.subjectsToTeach.map((subject, index) => (
                      <Chip
                        key={index}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{subject.subject}</span>
                            <Box sx={{ color: 'gold', fontSize: '0.9em' }}>
                              ({'★'.repeat(subject.proficiency)})
                            </Box>
                          </Box>
                        }
                        onDelete={() => handleRemoveTeachSubject(subject.subject)}
                        color="primary"
                        variant="outlined"
                        sx={{ height: 'auto', py: 0.5 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center' }}>
                      No teaching subjects added yet
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Learning Subjects */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Learning Interests
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={editProfile.newLearnSubject}
                      onChange={(e) => setEditProfile(prev => ({ ...prev, newLearnSubject: e.target.value }))}
                      label="Subject"
                      size="small"
                    >
                      {SUBJECTS.filter(subj => !editProfile.subjectsToLearn.some(s => s.subject === subj))
                        .map((subject) => (
                          <MenuItem key={subject} value={subject}>
                            {subject}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Goal:
                    </Typography>
                    <Rating
                      value={editProfile.learnProficiency}
                      onChange={(e, newValue) => setEditProfile(prev => ({ ...prev, learnProficiency: newValue }))}
                      size="small"
                      max={5}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleAddLearnSubject}
                    disabled={!editProfile.newLearnSubject}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 40, p: 1, bgcolor: 'action.hover', borderRadius: 1, alignItems: 'center' }}>
                  {editProfile.subjectsToLearn.length > 0 ? (
                    editProfile.subjectsToLearn.map((subject, index) => (
                      <Chip
                        key={index}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{subject.subject}</span>
                            <Box sx={{ color: 'gold', fontSize: '0.9em' }}>
                              (Goal: {'★'.repeat(subject.proficiency)})
                            </Box>
                          </Box>
                        }
                        onDelete={() => handleRemoveLearnSubject(subject.subject)}
                        color="secondary"
                        variant="outlined"
                        sx={{ height: 'auto', py: 0.5 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center' }}>
                      No learning subjects added yet
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseEdit} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            color="primary"
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
