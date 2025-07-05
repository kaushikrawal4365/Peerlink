import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Avatar,
  Grid
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { matchAPI } from '../services/api';

const Matches = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('potential'); // 'potential' or 'accepted'
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });

  useEffect(() => {
    if (activeTab === 'potential') {
      fetchPotentialMatches();
    } else {
      fetchAcceptedMatches();
    }
  }, [activeTab]);

  const fetchPotentialMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const matches = await matchAPI.getPotentialMatches();
      setPotentialMatches(matches);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch potential matches. Please try again.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const matches = await matchAPI.getAcceptedMatches();
      setPotentialMatches(matches);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch accepted matches. Please try again.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    try {
      await matchAPI.acceptMatch(userId);
      showSnackbar('Match accepted!', 'success');
      // Refresh the matches list
      if (activeTab === 'potential') {
        fetchPotentialMatches();
      } else {
        fetchAcceptedMatches();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to accept match. Please try again.';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleReject = async (userId) => {
    try {
      await matchAPI.rejectMatch(userId);
      showSnackbar('Match rejected', 'info');
      // Remove the rejected match from the list
      setPotentialMatches(potentialMatches.filter(match => match.userId !== userId));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to reject match. Please try again.';
      showSnackbar(errorMessage, 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderMatchCard = (match) => (
    <Card key={match.userId} sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar 
            sx={{ width: 56, height: 56, mr: 2 }}
            src={match.profileImage}
          >
            {match.name ? match.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography variant="h6">{match.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Match Score: <strong>{match.score}</strong>
            </Typography>
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle2" color="primary">
            I can teach you:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {match.commonSubjects?.teach?.map((subject, index) => (
              <Chip key={`teach-${index}`} label={subject} size="small" color="primary" variant="outlined" />
            ))}
          </Box>

          <Typography variant="subtitle2" color="secondary">
            I want to learn from you:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {match.commonSubjects?.learn?.map((subject, index) => (
              <Chip key={`learn-${index}`} label={subject} size="small" color="secondary" variant="outlined" />
            ))}
          </Box>
        </Box>

        {match.bio && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {match.bio}
          </Typography>
        )}
      </CardContent>

      {activeTab === 'potential' && (
        <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
          <Button 
            size="small" 
            color="error"
            onClick={() => handleReject(match.userId)}
          >
            Reject
          </Button>
          <Button 
            size="small" 
            variant="contained" 
            color="primary"
            onClick={() => handleAccept(match.userId)}
          >
            Accept
          </Button>
        </CardActions>
      )}
    </Card>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Button 
          variant={activeTab === 'potential' ? 'contained' : 'text'}
          onClick={() => setActiveTab('potential')}
          sx={{ mr: 2 }}
        >
          Potential Matches
        </Button>
        <Button 
          variant={activeTab === 'accepted' ? 'contained' : 'text'}
          onClick={() => setActiveTab('accepted')}
        >
          My Connections
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : potentialMatches.length === 0 ? (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="textSecondary">
            {activeTab === 'potential' 
              ? 'No potential matches found. Update your profile to get better matches!'
              : 'No accepted matches yet. Start connecting with others!'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {potentialMatches.map(match => (
            <Grid item xs={12} key={match.userId}>
              {renderMatchCard(match)}
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Matches;
