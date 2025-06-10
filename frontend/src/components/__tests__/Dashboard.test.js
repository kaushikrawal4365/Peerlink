import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from '../components/Dashboard';

// Mock axios
jest.mock('axios');

describe('Dashboard Subject Management', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'test-token');

    // Mock initial user data
    axios.get.mockResolvedValueOnce({
      data: {
        name: 'Test User',
        subjectsToTeach: [{ subject: 'Mathematics', proficiency: 5 }],
        subjectsToLearn: [{ subject: 'Physics', proficiency: 1 }]
      }
    });
  });

  test('displays existing subjects', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mathematics (5★)')).toBeInTheDocument();
      expect(screen.getByText('Physics (1★)')).toBeInTheDocument();
    });
  });

  test('adds new teaching subject', async () => {
    // Mock successful subject addition
    axios.post.mockResolvedValueOnce({
      data: {
        subjectsToTeach: [
          { subject: 'Mathematics', proficiency: 5 },
          { subject: 'Chemistry', proficiency: 4 }
        ]
      }
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Open add subject dialog
    fireEvent.click(screen.getByText('Add Teaching Subject'));

    // Select new subject and proficiency
    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Chemistry' } });

    const proficiencyRating = screen.getByLabelText('Teaching Proficiency');
    fireEvent.change(proficiencyRating, { target: { value: 4 } });

    // Submit
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Chemistry (4★)')).toBeInTheDocument();
    });
  });

  test('removes teaching subject', async () => {
    // Mock successful subject removal
    axios.delete.mockResolvedValueOnce({
      data: {
        subjectsToTeach: []
      }
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const deleteButton = screen.getByLabelText('Remove Mathematics');
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Mathematics (5★)')).not.toBeInTheDocument();
    });
  });

  test('displays error when adding duplicate subject', async () => {
    // Mock error for duplicate subject
    axios.post.mockRejectedValueOnce({
      response: {
        data: { error: 'Subject already exists' }
      }
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Try adding existing subject
    fireEvent.click(screen.getByText('Add Teaching Subject'));
    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Subject already exists')).toBeInTheDocument();
    });
  });

  test('handles network errors gracefully', async () => {
    // Mock network error
    axios.post.mockRejectedValueOnce({
      message: 'Network Error'
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Add Teaching Subject'));
    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Chemistry' } });
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Error: Could not add subject')).toBeInTheDocument();
    });
  });
});
