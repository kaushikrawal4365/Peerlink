import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@mui/material';
import {
  School as SchoolIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { userId } = useParams();
  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = !userId || userId === currentUserId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5001/api/users/${userId || 'me'}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [userId]);

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading profile...</Typography>
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
            sx={{ width: 120, height: 120, mr: 3 }}
          >
            {profile.name[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" gutterBottom>
                {profile.name}
              </Typography>
              {isOwnProfile && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
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
            <Typography variant="body1" color="textSecondary" paragraph>
              {profile.bio || "No bio available"}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Rating value={profile.teachingScore || 0} readOnly precision={0.5} />
              <Typography variant="body2" color="textSecondary">
                ({profile.testimonials?.length || 0} reviews)
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Subjects Section */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon sx={{ mr: 1 }} color="primary" />
                  Teaching Subjects
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.subjectsToTeach?.map((subject, index) => (
                    <Chip
                      key={index}
                      label={subject}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                  {(!profile.subjectsToTeach || profile.subjectsToTeach.length === 0) && (
                    <Typography color="textSecondary">No subjects added yet</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <StarIcon sx={{ mr: 1 }} color="secondary" />
                  Learning Interests
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.subjectsToLearn?.map((subject, index) => (
                    <Chip
                      key={index}
                      label={subject}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                  {(!profile.subjectsToLearn || profile.subjectsToLearn.length === 0) && (
                    <Typography color="textSecondary">No subjects added yet</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
