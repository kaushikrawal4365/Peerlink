import React from 'react';
import { Card, CardContent, Typography, Button, Box, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)({
  maxWidth: 400,
  margin: 'auto',
  marginBottom: 20,
  borderRadius: 15,
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  position: 'relative',
  overflow: 'visible',
});

const MatchCard = ({ user, onLike, onPass }) => {
  const { name, profileImage, subjectsToTeach = [], subjectsToLearn = [] } = user;

  return (
    <StyledCard>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar 
          src={profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '')}&background=random`}
          sx={{ 
            width: 120, 
            height: 120, 
            margin: '0 auto -60px',
            border: '4px solid white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        />
        <CardContent sx={{ pt: 8 }}>
          <Typography variant="h6" component="div" gutterBottom>
            {name || 'Anonymous User'}
          </Typography>
          
          {subjectsToTeach.length > 0 && (
            <Box sx={{ mb: 2, textAlign: 'left' }}>
              <Typography variant="subtitle2" color="textSecondary">
                Can teach:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {subjectsToTeach.map((subject, index) => (
                  <Typography 
                    key={`teach-${index}`}
                    variant="caption"
                    sx={{
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {subject}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {subjectsToLearn.length > 0 && (
            <Box sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" color="textSecondary">
                Wants to learn:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {subjectsToLearn.map((subject, index) => (
                  <Typography 
                    key={`learn-${index}`}
                    variant="caption"
                    sx={{
                      bgcolor: 'secondary.light',
                      color: 'secondary.contrastText',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {subject}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              color="error" 
              onClick={onPass}
              sx={{ borderRadius: 5, textTransform: 'none', px: 3 }}
            >
              Pass
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onLike}
              sx={{ borderRadius: 5, textTransform: 'none', px: 4 }}
            >
              Like
            </Button>
          </Box>
        </CardContent>
      </Box>
    </StyledCard>
  );
};

export default MatchCard;
