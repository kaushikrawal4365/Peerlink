import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import SetupForm from '../components/SetupForm';

// Mock axios
jest.mock('axios');

describe('SetupForm Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    // Reset localStorage
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
  });

  test('adds teaching subject with proficiency', async () => {
    render(
      <BrowserRouter>
        <SetupForm />
      </BrowserRouter>
    );

    // Select Mathematics from dropdown
    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    // Set proficiency to 5
    const proficiencyRating = screen.getByLabelText('Teaching Proficiency');
    fireEvent.change(proficiencyRating, { target: { value: 5 } });

    // Click add button
    const addButton = screen.getByText('Add Subject');
    fireEvent.click(addButton);

    // Verify subject chip appears
    expect(screen.getByText('Mathematics (5★)')).toBeInTheDocument();
  });

  test('removes teaching subject', async () => {
    render(
      <BrowserRouter>
        <SetupForm />
      </BrowserRouter>
    );

    // Add a subject first
    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });
    const addButton = screen.getByText('Add Subject');
    fireEvent.click(addButton);

    // Click delete button on chip
    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);

    // Verify subject chip is removed
    expect(screen.queryByText('Mathematics (5★)')).not.toBeInTheDocument();
  });

  test('submits profile setup successfully', async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({ data: { message: 'Profile setup completed successfully' } });

    render(
      <BrowserRouter>
        <SetupForm />
      </BrowserRouter>
    );

    // Add teaching and learning subjects
    const teachSubjectSelect = screen.getByLabelText('Subject (Teach)');
    fireEvent.change(teachSubjectSelect, { target: { value: 'Mathematics' } });
    fireEvent.click(screen.getByText('Add Teaching Subject'));

    const learnSubjectSelect = screen.getByLabelText('Subject (Learn)');
    fireEvent.change(learnSubjectSelect, { target: { value: 'Physics' } });
    fireEvent.click(screen.getByText('Add Learning Subject'));

    // Add bio
    const bioInput = screen.getByLabelText('Bio');
    fireEvent.change(bioInput, { target: { value: 'Test bio' } });

    // Submit form
    const submitButton = screen.getByText('Complete Setup');
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Verify API was called with correct data
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/users/profile',
        {
          bio: 'Test bio',
          subjectsToTeach: [{ subject: 'Mathematics', proficiency: 5 }],
          subjectsToLearn: [{ subject: 'Physics', proficiency: 1 }],
        },
        expect.any(Object)
      );

      // Verify navigation to dashboard
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles errors during submission', async () => {
    // Mock API error
    const errorMessage = 'Failed to set up profile';
    axios.post.mockRejectedValueOnce({ response: { data: { error: errorMessage } } });

    render(
      <BrowserRouter>
        <SetupForm />
      </BrowserRouter>
    );

    // Submit form
    const submitButton = screen.getByText('Complete Setup');
    fireEvent.click(submitButton);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
