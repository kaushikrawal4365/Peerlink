import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

function MatchGraph({ matches }) {
  // Calculate match distribution
  const matchDistribution = matches?.reduce((acc, match) => {
    const score = Math.round(match.matchScore);
    if (score >= 80) acc.high++;
    else if (score >= 50) acc.medium++;
    else acc.low++;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  const total = matches?.length || 0;
  const getPercentage = (value) => ((value || 0) / total) * 100;

  const stats = [
    {
      label: 'High Match (>80%)',
      value: matchDistribution?.high || 0,
      color: '#4CAF50',
      percentage: getPercentage(matchDistribution?.high)
    },
    {
      label: 'Medium Match (50-80%)',
      value: matchDistribution?.medium || 0,
      color: '#FFC107',
      percentage: getPercentage(matchDistribution?.medium)
    },
    {
      label: 'Low Match (<50%)',
      value: matchDistribution?.low || 0,
      color: '#f44336',
      percentage: getPercentage(matchDistribution?.low)
    }
  ];

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom align="center">
        Match Distribution
      </Typography>
      
      <Box sx={{ position: 'relative', mt: 4 }}>
        {matches?.length > 0 ? (
          <>
            {stats.map((stat, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{stat.label}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stat.value} ({Math.round(stat.percentage)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stat.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: `${stat.color}22`,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: stat.color,
                      borderRadius: 4,
                    }
                  }}
                />
              </Box>
            ))}
            
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Matches
              </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            color: 'text.secondary',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <Typography>No matches yet</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default MatchGraph;
