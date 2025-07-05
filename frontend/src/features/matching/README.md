# Matching Feature

This feature handles the matching functionality between users based on their teaching and learning subjects.

## Components

### MatchCard
A card component that displays a potential match with their information and action buttons.

### Matches
Main component that displays a list of potential matches and handles the matching logic.

## API Integration

The matching feature uses the following API endpoints:

- `GET /api/matches/potential` - Get potential matches
- `POST /api/matches/like/:userId` - Like a user
- `POST /api/matches/pass/:userId` - Pass on a user
- `GET /api/matches/check-match/:userId` - Check for mutual match
- `GET /api/matches` - Get all matches

## State Management

- Uses React hooks for local state management
- Uses AuthContext for authentication state
- Uses custom API service for data fetching

## Styling

- Uses Material-UI components and styling
- Responsive design for different screen sizes
- Loading and error states for better UX

## Setup

1. Make sure the backend API is running and accessible
2. Copy `.env.example` to `.env` and update the API URL if needed
3. The component requires the user to be authenticated

## Usage

1. The component will automatically fetch potential matches on mount
2. Users can like or pass on potential matches
3. If there's a mutual like, a success message will be shown
4. Users can refresh the list of potential matches if needed
