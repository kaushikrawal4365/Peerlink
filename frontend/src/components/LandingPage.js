import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Star as StarIcon,
} from '@mui/icons-material';

const services = [
  {
    title: 'Peer Learning',
    description: 'Connect with peers who can help you master subjects while you teach what you know best.',
    icon: <SchoolIcon fontSize="large" color="primary" />,
    color: '#6200ea',
  },
  {
    title: 'Smart Matching',
    description: 'Our intelligent algorithm matches you with the perfect study partners based on your interests and goals.',
    icon: <PeopleIcon fontSize="large" color="secondary" />,
    color: '#03dac6',
  },
  {
    title: 'Real-time Chat',
    description: 'Communicate seamlessly with your study partners through our integrated chat system.',
    icon: <ChatIcon fontSize="large" color="primary" />,
    color: '#6200ea',
  },
  {
    title: 'Track Progress',
    description: 'Monitor your learning progress and get feedback from your peers to improve continuously.',
    icon: <StarIcon fontSize="large" color="secondary" />,
    color: '#03dac6',
  },
];

const LandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          color: 'white',
          pt: { xs: 10, md: 20 },
          pb: { xs: 10, md: 20 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.75rem' },
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Learn & Teach Together
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    lineHeight: 1.5,
                  }}
                >
                  Find your perfect study partners. Share knowledge, grow together, and unlock your learning potential.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: alpha('#fff', 0.9),
                      },
                      px: 4,
                      py: 1.5,
                    }}
                    onClick={() => navigate('/signup')}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: alpha('#fff', 0.9),
                        bgcolor: alpha('#fff', 0.1),
                      },
                      px: 4,
                      py: 1.5,
                    }}
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/hero-image.png"
                alt="Students learning together"
                sx={{
                  width: '100%',
                  maxWidth: 600,
                  height: 'auto',
                  display: { xs: 'none', md: 'block' },
                }}
              />
            </Grid>
          </Grid>
        </Container>

        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            width: '50%',
            height: '120%',
            bgcolor: alpha('#fff', 0.1),
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
      </Box>

      {/* Services Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography
          variant="h2"
          align="center"
          sx={{
            fontSize: { xs: '2rem', md: '2.75rem' },
            fontWeight: 700,
            mb: { xs: 6, md: 8 },
          }}
        >
          Why Choose PeerLink?
        </Typography>
        <Grid container spacing={4}>
          {services.map((service, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: alpha(service.color, 0.05),
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ mb: 2 }}>{service.icon}</Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {service.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {service.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage;
