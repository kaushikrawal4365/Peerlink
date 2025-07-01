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
  
  const handleOpenEdit = () => {
    setEditProfile(prev => ({
      ...prev,
      ...profile,
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
        subjectsToTeach: [...prev.subjectsToTeach, { subject: prev.newTeachSubject, proficiency: prev.teachProficiency }],
        newTeachSubject: '',
        teachProficiency: 3
      }));
    }
  };
  
  const handleAddLearnSubject = () => {
    if (editProfile.newLearnSubject && !editProfile.subjectsToLearn.some(s => s.subject === editProfile.newLearnSubject)) {
      setEditProfile(prev => ({
        ...prev,
        subjectsToLearn: [...prev.subjectsToLearn, { subject: prev.newLearnSubject, proficiency: prev.learnProficiency }],
        newLearnSubject: '',
        learnProficiency: 1
      }));
    }
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
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add all the fields to formData
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
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };



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
      
      // Initialize edit profile state
      setEditProfile({
        bio: userData.bio || '',
        subjectsToTeach: [...userData.subjectsToTeach],
        subjectsToLearn: [...userData.subjectsToLearn],
        newTeachSubject: '',
        teachProficiency: 3,
        newLearnSubject: '',
        learnProficiency: 1,
        profileImage: null,
        previewImage: userData.profileImage || ''
      });
      
      setError('');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
      if (err.response?.status === 401) {
        // Token expired or invalid
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
  }, [fetchProfile, urlUserId]);

  // Handle adding/removing subjects to learn
  const handleRemoveLearnSubject = (subjectToRemove) => {
    setEditProfile(prev => ({
      ...prev,
      subjectsToLearn: prev.subjectsToLearn.filter(s => s.subject !== subjectToRemove)
    }));
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

  const handleRemoveLearnSubject = (subjectToRemove) => {
    setEditProfile(prev => ({
      ...prev,
      subjectsToLearn: prev.subjectsToLearn.filter(s => s.subject !== subjectToRemove)
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('bio', editProfile.bio);
      formData.append('subjectsToTeach', JSON.stringify(editProfile.subjectsToTeach));
      formData.append('subjectsToLearn', JSON.stringify(editProfile.subjectsToLearn));
      
      if (editProfile.profileImage) {
        formData.append('profileImage', editProfile.profileImage);
      }
      
      const response = await axios.put(
        'http://localhost:5001/api/users/profile',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setProfile(response.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        {isEditing && isOwnProfile && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsEditing(false);
                fetchProfile(); // Reset form
              }}
              startIcon={<CloseIcon />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveProfile}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}
        <Typography>No profile data found</Typography>
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
            sx={{ width: 120, height: 120, mr: 3, fontSize: '3rem' }}
          >
            {profile.name ? profile.name[0].toUpperCase() : 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" gutterBottom>
                {profile.name}
              </Typography>
              {isOwnProfile && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleOpenEdit}
                >
                  Edit Profile
                </Button>
              )}
              {isEditing && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              )}
              {!isOwnProfile && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<MessageIcon />}
                >
                  Send Message
                </Button>
              )}
            </Box>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell others about yourself..."
                margin="normal"
                sx={{ mt: 1, mb: 2 }}
              />
            ) : (
              <Typography variant="body1" color="textSecondary" paragraph sx={{ whiteSpace: 'pre-line', mt: 1, mb: 2 }}>
                {profile.bio || 'No bio available'}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Rating value={profile.teachingScore || 0} readOnly precision={0.5} />
              <Typography variant="body2" color="textSecondary">
                ({profile.testimonials?.length || 0} reviews)
              </Typography>
            </Box>
            {isEditing && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Update your profile information below
              </Typography>
            )}
          </Box>
        </Box>

        {/* Subjects Section */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Teaching Subjects */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 1 }} color="primary" />
                    Teaching Subjects
                  </Typography>
                  {isEditing && (
                    <Typography variant="caption" color="text.secondary">
                      {profile.subjectsToTeach?.length || 0} subject(s)
                    </Typography>
                  )}
                </Box>
                
                {isEditing ? (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <FormControl sx={{ flexGrow: 1 }} size="small">
                        <InputLabel>Subject</InputLabel>
                        <Select
                          value={newTeachSubject}
                          onChange={(e) => setNewTeachSubject(e.target.value)}
                          label="Subject"
                        >
                          {SUBJECTS.filter(subj => !profile.subjectsToTeach?.some(s => s.subject === subj)).map((subject) => (
                            <MenuItem key={subject} value={subject}>
                              {subject}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ width: 120 }} size="small">
                        <InputLabel>Proficiency</InputLabel>
                        <Select
                          value={teachProficiency}
                          onChange={(e) => setTeachProficiency(e.target.value)}
                          label="Proficiency"
                        >
                          {[1, 2, 3, 4, 5].map((level) => (
                            <MenuItem key={level} value={level}>
                              {'★'.repeat(level)}{'☆'.repeat(5 - level)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        onClick={handleAddTeachSubject}
                        disabled={!newTeachSubject}
                        sx={{ minWidth: '40px', px: 2 }}
                      >
                        <AddIcon />
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {profile.subjectsToTeach?.map((subject, index) => (
                        <Chip
                          key={index}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <span>{subject.subject}</span>
                              <Box sx={{ ml: 1, color: 'warning.main' }}>
                                {'★'.repeat(subject.proficiency || 1)}
                              </Box>
                            </Box>
                          }
                          color="primary"
                          variant="outlined"
                          onDelete={() => handleRemoveTeachSubject(subject.subject)}
                          deleteIcon={<DeleteIcon />}
                        />
                      ))}
                      {(!profile.subjectsToTeach || profile.subjectsToTeach.length === 0) && (
                        <Typography color="textSecondary" variant="body2">
                          Add subjects you can teach
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '40px' }}>
                    {profile.subjectsToTeach?.map((subject, index) => (
                      <Chip
                        key={index}
                        label={`${subject.subject} (${'★'.repeat(subject.proficiency || 1)})`}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {(!profile.subjectsToTeach || profile.subjectsToTeach.length === 0) && (
                      <Typography color="textSecondary" variant="body2">
                        No teaching subjects added
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Learning Interests */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ mr: 1 }} color="secondary" />
                    Learning Interests
                  </Typography>
                  {isEditing && (
                    <Typography variant="caption" color="text.secondary">
                      {profile.subjectsToLearn?.length || 0} subject(s)
                    </Typography>
                  )}
                </Box>
                
                {isEditing ? (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <FormControl sx={{ flexGrow: 1 }} size="small">
                        <InputLabel>Subject</InputLabel>
                        <Select
                          value={newLearnSubject}
                          onChange={(e) => setNewLearnSubject(e.target.value)}
                          label="Subject"
                        >
                          {SUBJECTS.filter(subj => !profile.subjectsToLearn?.some(s => s.subject === subj)).map((subject) => (
                            <MenuItem key={subject} value={subject}>
                              {subject}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ width: 120 }} size="small">
                        <InputLabel>Proficiency</InputLabel>
                        <Select
                          value={learnProficiency}
                          onChange={(e) => setLearnProficiency(e.target.value)}
                          label="Proficiency"
                        >
                          {[1, 2, 3, 4, 5].map((level) => (
                            <MenuItem key={level} value={level}>
                              {'★'.repeat(level)}{'☆'.repeat(5 - level)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        onClick={handleAddLearnSubject}
                        disabled={!newLearnSubject}
                        sx={{ minWidth: '40px', px: 2 }}
                      >
                        <AddIcon />
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {profile.subjectsToLearn?.map((subject, index) => (
                        <Chip
                          key={index}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <span>{subject.subject}</span>
                              <Box sx={{ ml: 1, color: 'warning.main' }}>
                                {'★'.repeat(subject.proficiency || 1)}
                              </Box>
                            </Box>
                          }
                          color="secondary"
                          variant="outlined"
                          onDelete={() => handleRemoveLearnSubject(subject.subject)}
                          deleteIcon={<DeleteIcon />}
                        />
                      ))}
                      {(!profile.subjectsToLearn || profile.subjectsToLearn.length === 0) && (
                        <Typography color="textSecondary" variant="body2">
                          Add subjects you want to learn
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '40px' }}>
                    {profile.subjectsToLearn?.map((subject, index) => (
                      <Chip
                        key={index}
                        label={`${subject.subject} (${'★'.repeat(subject.proficiency || 1)})`}
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                    {(!profile.subjectsToLearn || profile.subjectsToLearn.length === 0) && (
                      <Typography color="textSecondary" variant="body2">
                        No learning interests added
                      </Typography>
                    )}
                  </Box>
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

        {/* Testimonials Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Testimonials
          </Typography>
          {profile.testimonials && profile.testimonials.length > 0 ? (
            <List>
              {profile.testimonials.map((testimonial, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar src={testimonial.from.profileImage}>
                        {testimonial.from.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" variant="subtitle1">
                            {testimonial.from.name}
                          </Typography>
                          <Rating value={testimonial.rating} size="small" readOnly />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {testimonial.text}
                          </Typography>
                          <br />
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            {new Date(testimonial.date).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < profile.testimonials.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1 
            }}>
              <StarIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography color="textSecondary">
                No reviews yet
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

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
                src={editProfile.previewImage}
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
                onChange={(e) => setEditProfile(prev => ({...prev, newTeachSubject: e.target.value}))}
                variant="outlined"
              />
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Proficiency</InputLabel>
                <Select
                  value={editProfile.teachProficiency}
                  label="Proficiency"
                  onChange={(e) => setEditProfile(prev => ({...prev, teachProficiency: e.target.value}))}
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
                onChange={(e) => setEditProfile(prev => ({...prev, newLearnSubject: e.target.value}))}
                variant="outlined"
              />
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Proficiency</InputLabel>
                <Select
                  value={editProfile.learnProficiency}
                  label="Proficiency"
                  onChange={(e) => setEditProfile(prev => ({...prev, learnProficiency: e.target.value}))}
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
