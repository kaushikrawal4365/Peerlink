import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Rating,
  IconButton,
  styled,
  Stack,
  CircularProgress,
  Container,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  School as SchoolIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';

const SwipeContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '32px 16px',
  height: '100vh',
  backgroundColor: '#f5f7fa',
});

const CardContainer = styled(Box)({
  width: '100%',
  maxWidth: 600,
  height: 600,
  position: 'relative',
});

const SwipeCard = styled(Card)({
  width: '100%',
  height: '100%',
  borderRadius: 20,
  background: '#fff',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
});

const ActionButtons = styled(Stack)({
  display: 'flex',
  justifyContent: 'center',
  gap: '24px',
  marginTop: '32px',
});

const ActionButton = styled(IconButton)({
  backgroundColor: 'white',
  width: '64px',
  height: '64px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  '&:hover': {
    transform: 'scale(1.1)',
  },
});

function MatchesSwipe() {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('left');

  useEffect(() => {
    fetchPotentialMatches();
  }, []);

  const fetchPotentialMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/matches/potential', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPotentialMatches(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError(error.response?.data?.error || 'Failed to fetch matches');
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    const currentMatch = potentialMatches[currentIndex];
    if (!currentMatch) return;

    setSlideDirection(action === 'like' ? 'left' : 'right');

    if (action === 'like') {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:5001/api/matches/like/${currentMatch._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error liking match:', error);
      }
    }

    // Wait for slide animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSlideDirection(action === 'like' ? 'right' : 'left');
    }, 200);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  const currentMatch = potentialMatches[currentIndex];

  return (
    <SwipeContainer>
      <CardContainer>
        {currentMatch ? (
          <Slide direction={slideDirection} in={true} mountOnEnter unmountOnExit>
            <SwipeCard>
              <Box
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${
                    currentMatch.matchScore > 80 ? '#4CAF50' :
                    currentMatch.matchScore > 50 ? '#FFC107' : '#f44336'
                  }, #2196f3)`,
                  position: 'relative',
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h4" color="white" gutterBottom>
                    {currentMatch.name}
                  </Typography>
                  
                  <Chip
                    icon={<SchoolIcon />}
                    label={`${currentMatch.matchScore}% Match`}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.9)', 
                      fontWeight: 'bold',
                      mb: 2 
                    }}
                  />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="white" gutterBottom>
                      Teaching:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {currentMatch.subjectsToTeach?.map(({ subject, proficiency }) => (
                        <Chip
                          key={subject}
                          size="small"
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {subject}
                              <Rating value={proficiency} readOnly size="small" />
                            </Box>
                          }
                          sx={{ bgcolor: 'rgba(255,255,255,0.9)', mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="h6" color="white" gutterBottom>
                      Learning:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {currentMatch.subjectsToLearn?.map(({ subject, proficiency }) => (
                        <Chip
                          key={subject}
                          size="small"
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {subject}
                              <Rating value={proficiency} readOnly size="small" />
                            </Box>
                          }
                          sx={{ bgcolor: 'rgba(255,255,255,0.9)', mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Box>

                <ActionButtons direction="row">
                  <ActionButton
                    onClick={() => handleAction('dislike')}
                    sx={{ color: '#f44336' }}
                  >
                    <CloseIcon sx={{ fontSize: 32 }} />
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleAction('like')}
                    sx={{ color: '#4CAF50' }}
                  >
                    <FavoriteIcon sx={{ fontSize: 32 }} />
                  </ActionButton>
                </ActionButtons>
              </Box>
            </SwipeCard>
          </Slide>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No more potential matches
            </Typography>
            <Button
              variant="contained"
              onClick={fetchPotentialMatches}
              sx={{ mt: 2 }}
            >
              Refresh Matches
            </Button>
          </Box>
        )}
      </CardContainer>
    </SwipeContainer>
  );
}

export default MatchesSwipe;
