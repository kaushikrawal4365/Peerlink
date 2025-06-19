 import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Grid,
  Chip,
  Rating,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  School as SchoolIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
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
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    subjectsToTeach: [],
    subjectsToLearn: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newTeachSubject, setNewTeachSubject] = useState('');
  const [newLearnSubject, setNewLearnSubject] = useState('');
  const [teachProficiency, setTeachProficiency] = useState(3);
  const [learnProficiency, setLearnProficiency] = useState(1);
  
  const { userId } = useParams();
  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = !userId || userId === currentUserId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5001/api/users/${userId || 'me'}`,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache'
            } 
          }
        );
        setProfile({
          ...response.data,
          subjectsToTeach: response.data.subjectsToTeach || [],
          subjectsToLearn: response.data.subjectsToLearn || []
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleAddTeachSubject = () => {
    if (newTeachSubject && !profile.subjectsToTeach.some(s => s.subject === newTeachSubject)) {
      const updatedProfile = {
        ...profile,
        subjectsToTeach: [
          ...profile.subjectsToTeach,
          { subject: newTeachSubject, proficiency: teachProficiency }
        ]
      };
      setProfile(updatedProfile);
      setNewTeachSubject('');
      setTeachProficiency(3);
    }
  };

  const handleRemoveTeachSubject = (subjectToRemove) => {
    const updatedProfile = {
      ...profile,
      subjectsToTeach: profile.subjectsToTeach.filter(s => s.subject !== subjectToRemove)
    };
    setProfile(updatedProfile);
  };

  const handleAddLearnSubject = () => {
    if (newLearnSubject && !profile.subjectsToLearn.some(s => s.subject === newLearnSubject)) {
      const updatedProfile = {
        ...profile,
        subjectsToLearn: [
          ...profile.subjectsToLearn,
          { subject: newLearnSubject, proficiency: learnProficiency }
        ]
      };
      setProfile(updatedProfile);
      setNewLearnSubject('');
      setLearnProficiency(1);
    }
  };

  const handleRemoveLearnSubject = (subjectToRemove) => {
    const updatedProfile = {
      ...profile,
      subjectsToLearn: profile.subjectsToLearn.filter(s => s.subject !== subjectToRemove)
    };
    setProfile(updatedProfile);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5001/api/users/profile',
        {
          bio: profile.bio,
          subjectsToTeach: profile.subjectsToTeach,
          subjectsToLearn: profile.subjectsToLearn
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
              {isOwnProfile && !isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
              {isEditing && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
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

export default Profile;
