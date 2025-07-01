import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  Badge,
  Paper,
  Divider,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleAction = async (notificationId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/notifications/${notificationId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh notifications
      fetchNotifications();
      
      // If accepting a match request, navigate to chat
      if (action === 'accept') {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  const renderNotificationContent = (notification) => {
    switch (notification.type) {
      case 'match_request':
        return {
          text: `${notification.from.name} wants to connect with you!`,
          showActions: true
        };
      case 'match_accepted':
        return {
          text: `${notification.from.name} accepted your connection request! You can now start chatting.`,
          showActions: false
        };
      case 'new_message':
        return {
          text: `New message from ${notification.from.name}`,
          showActions: false
        };
      default:
        return {
          text: notification.content,
          showActions: false
        };
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, px: 2 }}>
      <Paper elevation={2}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon sx={{ mr: 2 }} />
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <Divider />
        <List>
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const { text, showActions } = renderNotificationContent(notification);
              return (
                <React.Fragment key={notification._id}>
                  <ListItem
                    secondaryAction={
                      showActions && (
                        <Box>
                          <IconButton
                            edge="end"
                            aria-label="accept"
                            onClick={() => handleAction(notification._id, 'accept')}
                            sx={{ color: 'success.main', mr: 1 }}
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="decline"
                            onClick={() => handleAction(notification._id, 'decline')}
                            sx={{ color: 'error.main' }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={notification.from?.profileImage}>
                        {notification.from?.name?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={text}
                      secondary={new Date(notification.createdAt).toLocaleString()}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              );
            })
          ) : (
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary">
                      No notifications yet
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Notifications;
