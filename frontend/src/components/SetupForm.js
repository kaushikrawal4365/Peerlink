import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Rating,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

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

const SetupForm = () => {
  const navigate = useNavigate();
  const [bio, setBio] = useState('');
  const [teachSubject, setTeachSubject] = useState('');
  const [learnSubject, setLearnSubject] = useState('');
  const [teachProficiency, setTeachProficiency] = useState(3);
  const [learnProficiency, setLearnProficiency] = useState(1);
  const [subjectsToTeach, setSubjectsToTeach] = useState([]);
  const [subjectsToLearn, setSubjectsToLearn] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddTeachSubject = () => {
    if (teachSubject && !subjectsToTeach.find(s => s.subject === teachSubject)) {
      setSubjectsToTeach([...subjectsToTeach, { subject: teachSubject, proficiency: teachProficiency }]);
      setTeachSubject('');
      setTeachProficiency(3);
    }
  };

  const handleAddLearnSubject = () => {
    if (learnSubject && !subjectsToLearn.find(s => s.subject === learnSubject)) {
      setSubjectsToLearn([...subjectsToLearn, { subject: learnSubject, proficiency: learnProficiency }]);
      setLearnSubject('');
      setLearnProficiency(1);
    }
  };

  const handleRemoveTeachSubject = (subjectToRemove) => {
    setSubjectsToTeach(subjectsToTeach.filter(s => s.subject !== subjectToRemove));
  };

  const handleRemoveLearnSubject = (subjectToRemove) => {
    setSubjectsToLearn(subjectsToLearn.filter(s => s.subject !== subjectToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/profile/setup',
        {
          bio,
          subjectsToTeach,
          subjectsToLearn,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate('/dashboard');
    } catch (error) {
      console.error('Error setting up profile:', error);
      setError(error.response?.data?.error || 'Failed to set up profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Set Up Your Profile
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Help us match you with the perfect study partners
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Bio"
            multiline
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            sx={{ mb: 4 }}
          />

          <Typography variant="h6" gutterBottom>
            Subjects You Can Teach
          </Typography>
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={teachSubject}
                  onChange={(e) => setTeachSubject(e.target.value)}
                  label="Subject"
                >
                  {SUBJECTS.filter(
                    (subject) => !subjectsToTeach.find((s) => s.subject === subject)
                  ).map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ minWidth: 200 }}>
                <Typography component="legend">Proficiency Level</Typography>
                <Rating
                  value={teachProficiency}
                  onChange={(_, value) => setTeachProficiency(value)}
                />
              </Box>
              <Button
                variant="contained"
                onClick={handleAddTeachSubject}
                disabled={!teachSubject}
              >
                <AddIcon />
              </Button>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {subjectsToTeach.map(({ subject, proficiency }) => (
                <Chip
                  key={subject}
                  label={`${subject} (${proficiency}★)`}
                  onDelete={() => handleRemoveTeachSubject(subject)}
                  color="primary"
                />
              ))}
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom>
            Subjects You Want to Learn
          </Typography>
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={learnSubject}
                  onChange={(e) => setLearnSubject(e.target.value)}
                  label="Subject"
                >
                  {SUBJECTS.filter(
                    (subject) => !subjectsToLearn.find((s) => s.subject === subject)
                  ).map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ minWidth: 200 }}>
                <Typography component="legend">Current Level</Typography>
                <Rating
                  value={learnProficiency}
                  onChange={(_, value) => setLearnProficiency(value)}
                />
              </Box>
              <Button
                variant="contained"
                onClick={handleAddLearnSubject}
                disabled={!learnSubject}
              >
                <AddIcon />
              </Button>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {subjectsToLearn.map(({ subject, proficiency }) => (
                <Chip
                  key={subject}
                  label={`${subject} (${proficiency}★)`}
                  onDelete={() => handleRemoveLearnSubject(subject)}
                  color="secondary"
                />
              ))}
            </Box>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading || (subjectsToTeach.length === 0 && subjectsToLearn.length === 0)}
          >
            {loading ? 'Setting up profile...' : 'Complete Setup'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default SetupForm;