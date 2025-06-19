import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import Person from '@mui/icons-material/Person';
import Message from '@mui/icons-material/Message';
import Timeline from '@mui/icons-material/Timeline';
import Block from '@mui/icons-material/Block';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5001');

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    newUsersToday: 0,
    subjectStats: []
  });
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch initial data
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, logsRes] = await Promise.all([
          axios.get('http://localhost:5001/admin/stats', { headers }),
          axios.get('http://localhost:5001/admin/users', { headers }),
          axios.get('http://localhost:5001/admin/logs', { headers })
        ]);

        setStats(statsRes.data);
        setUsers(usersRes.data);
        setActivityLogs(logsRes.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    fetchData();

    // Socket.io event listeners
    socket.on('user_status_changed', ({ userId, status }) => {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, status } : user
        )
      );
    });

    return () => {
      socket.off('user_status_changed');
    };
  }, []);

  const toggleUserStatus = async (userId, currentStatus) => {
    const token = localStorage.getItem('token');
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    
    try {
      await axios.put(
        `http://localhost:5001/admin/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === userId ? { ...user, status: newStatus } : user
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4">{stats.totalUsers}</Typography>
              <Person />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4">{stats.activeUsers}</Typography>
              <CheckCircle />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Messages
              </Typography>
              <Typography variant="h4">{stats.totalMessages}</Typography>
              <Message />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                New Users Today
              </Typography>
              <Typography variant="h4">{stats.newUsersToday}</Typography>
              <Timeline />
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Activity
            </Typography>
            <LineChart
              width={900}
              height={300}
              data={activityLogs}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="messageCount" stroke="#8884d8" />
            </LineChart>
          </Paper>
        </Grid>

        {/* Users Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Users
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          color: user.status === 'online' ? 'success.main' : 'text.secondary'
                        }}
                      >
                        {user.status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(user.lastActive).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => toggleUserStatus(user._id, user.status)}
                        color={user.status === 'blocked' ? 'primary' : 'default'}
                      >
                        <Block />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AdminDashboard;
