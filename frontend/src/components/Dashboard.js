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
  Card,
  CardContent,
  IconButton,
  Stack,
  Avatar,
  Divider,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './Dashboard.css';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import MessageIcon from '@mui/icons-material/Message';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot';

const MotionPaper = motion(Paper);

const heroSlides = [
  {
    title: "Welcome to PeerLink",
    description: "Your personalized learning journey begins here. Connect with peers, share knowledge, and grow together.",
    image: "hero1.jpg"
  },
  {
    title: "Find Your Perfect Match",
    description: "Our smart matching system connects you with ideal study partners based on your interests and goals.",
    image: "hero2.jpg"
  },
  {
    title: "Track Your Progress",
    description: "Monitor your learning journey and celebrate your achievements with our comprehensive tracking system.",
    image: "hero3.jpg"
  }
];

const features = [
  {
    title: 'Peer Learning',
    description: 'Learn from peers who excel in subjects you want to master',
    icon: <SchoolIcon fontSize="large" />,
    color: 'primary.main'
  },
  {
    title: 'Smart Matching',
    description: 'Get matched with the perfect study partners',
    icon: <PeopleIcon fontSize="large" />,
    color: 'secondary.main'
  },
  {
    title: 'Real-time Chat',
    description: 'Communicate seamlessly with your study partners',
    icon: <MessageIcon fontSize="large" />,
    color: 'success.main'
  },
  {
    title: 'Track Progress',
    description: 'Monitor your learning journey and achievements',
    icon: <TrendingUpIcon fontSize="large" />,
    color: 'error.main'
  }
];

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const userRes = await axios.get('http://localhost:5001/api/users/profile', config);
        setUser(userRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section with Carousel */}
      <Box sx={{ 
        position: 'relative',
        bgcolor: 'primary.dark',
        color: 'white',
        pt: 4,
        pb: 6,
        mb: 6
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: { xs: 4, md: 0 } }}>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                  Welcome back, {user.name}!
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
                  Ready to continue your learning journey?
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.dark',
                      '&:hover': { bgcolor: alpha('#fff', 0.9) }
                    }}
                  >
                    Find Study Partners
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: alpha('#fff', 0.9),
                        bgcolor: alpha('#fff', 0.1)
                      }
                    }}
                  >
                    View Matches
                  </Button>
                </Stack>
              </Box>
            </Grid>
            {/* Stats Cards */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: alpha('#fff', 0.1), color: 'white' }}>
                    <CardContent>
                      <Typography variant="overline">Teaching</Typography>
                      <Typography variant="h4">{user.subjectsToTeach.length}</Typography>
                      <Typography variant="body2">Subjects</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: alpha('#fff', 0.1), color: 'white' }}>
                    <CardContent>
                      <Typography variant="overline">Learning</Typography>
                      <Typography variant="h4">{user.subjectsToLearn.length}</Typography>
                      <Typography variant="body2">Subjects</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: alpha('#fff', 0.1), color: 'white' }}>
                    <CardContent>
                      <Typography variant="overline">Rating</Typography>
                      <Typography variant="h4">{user.teachingScore.toFixed(1)}</Typography>
                      <Typography variant="body2">Teaching Score</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: alpha('#fff', 0.1), color: 'white' }}>
                    <CardContent>
                      <Typography variant="overline">Matches</Typography>
                      <Typography variant="h4">
                        {user.matches.filter(m => m.status === 'accepted').length}
                      </Typography>
                      <Typography variant="body2">Active</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '30%',
            bgcolor: alpha('#fff', 0.1),
            transform: 'skewX(-12deg)',
            transformOrigin: '100%'
          }}
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        {/* Features Section */}
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          Explore Features
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: feature.color, mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Subjects Section */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" />
                  Subjects You Teach
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.subjectsToTeach.map((subject, index) => (
                    <Chip
                      key={index}
                      label={`${subject.subject} (${subject.proficiency}★)`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon color="secondary" />
                  Subjects You Learn
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.subjectsToLearn.map((subject, index) => (
                    <Chip
                      key={index}
                      label={`${subject.subject} (${subject.proficiency}★)`}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard;