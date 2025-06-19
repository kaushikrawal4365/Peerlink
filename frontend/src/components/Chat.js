import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Divider,
  Badge,
} from '@mui/material';
import {
  Send as SendIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import io from 'socket.io-client';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    const token = localStorage.getItem('token');
    
    newSocket.emit('authenticate', token);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversations(response.data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:5001/api/messages/${selectedChat._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessages(response.data);
          scrollToBottom();
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message) => {
        if (selectedChat && message.conversation === selectedChat._id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });
    }
  }, [socket, selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/messages', {
        content: newMessage,
        conversationId: selectedChat._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 2, p: 2 }}>
      {/* Conversations List */}
      <Paper sx={{ width: 300, overflow: 'auto' }}>
        <List>
          {conversations.map((conv) => (
            <ListItem
              key={conv._id}
              button
              selected={selectedChat?._id === conv._id}
              onClick={() => setSelectedChat(conv)}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <CircleIcon
                      sx={{
                        color: conv.user.status === 'online' ? '#44b700' : '#ccc',
                        fontSize: 12
                      }}
                    />
                  }
                >
                  <Avatar src={conv.user.profileImage}>
                    {conv.user.name[0]}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={conv.user.name}
                secondary={conv.lastMessage?.content || 'No messages yet'}
                secondaryTypographyProps={{
                  noWrap: true,
                  style: { maxWidth: '180px' }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Chat Area */}
      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">{selectedChat.user.name}</Typography>
            </Box>

            {/* Messages */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.isSender ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Paper
                    sx={{
                      p: 1,
                      backgroundColor: message.isSender ? '#e3f2fd' : '#f5f5f5',
                      maxWidth: '70%',
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" color="textSecondary">
              Select a conversation to start chatting
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Chat;
