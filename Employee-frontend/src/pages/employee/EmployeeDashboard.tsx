import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format, isPast, parseISO } from 'date-fns';
import { formatDateTime } from '../../utils/dateFormatter';
import { timecardApi, taskApi } from '../../services/api';
import type { Task } from '../../types/index';
import { LocationSelectionDialog } from '../../components/LocationSelectionDialog';
import './styles/EmployeeDashboard.scss';

export const EmployeeDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [lastClockIn, setLastClockIn] = useState<string | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<'Home' | 'Office' | null>(null);
  const [isClockOutDialogOpen, setClockOutDialogOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const today = format(new Date(), 'yyyy-MM-dd');
      const [timecardResponse, tasksResponse] = await Promise.all([
        timecardApi.getTimecard(),
        taskApi.getTasks({ startDate: today, endDate: today })
      ]);

      // If we have a timecard response
      if (timecardResponse) {
        const clockInDate = format(new Date(timecardResponse.clockIn), 'yyyy-MM-dd');
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Check if the timecard is from today
        if (clockInDate === today) {
          // If there's no clockOut time, the user is still clocked in
          setIsClockedIn(!timecardResponse.clockOut);
          setLastClockIn(timecardResponse.clockIn);
          setCurrentLocation(timecardResponse.location || null);
        } else {
          // If timecard is from a different day, user is not clocked in
          setIsClockedIn(false);
          setLastClockIn(null);
          setCurrentLocation(null);
        }
      } else {
        // No timecard found
        setIsClockedIn(false);
        setLastClockIn(null);
        setCurrentLocation(null);
      }

      if (Array.isArray(tasksResponse)) {
        setTodaysTasks(tasksResponse);
      } else {
        setTodaysTasks([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClockInClick = () => {
    if (!isClockedIn) {
      setLocationDialogOpen(true);
    } else {
      handleClockOut();
    }
  };

  const handleLocationConfirm = async (location: 'Home' | 'Office') => {
    try {
      setError(null);
      setIsActionLoading(true);
      const response = await timecardApi.clockIn(location);
      if (response && response.clockIn) {
        setLastClockIn(response.clockIn);
        setIsClockedIn(true);
        setCurrentLocation(location);
      }
      setLocationDialogOpen(false);
      // Refresh dashboard data after successful clock in
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Error with clock in:', err);
      // If the error message indicates user is already clocked in
      if (err.response?.data?.message === "Already clocked in today") {
        setIsClockedIn(true);
        setError("You are already clocked in for today");
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to clock in. Please try again.';
        setError(errorMessage);
      }
      setLocationDialogOpen(false);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setError(null);
      setIsActionLoading(true);
      await timecardApi.clockOut();
      setIsClockedIn(false);
      setLastClockIn(null);
      setCurrentLocation(null);
      // Refresh dashboard data after successful clock out
      await fetchDashboardData();
    } catch (error) {
      console.error('Error with clock out:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clock out. Please try again.';
      setError(errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClockOutClick = () => {
    setClockOutDialogOpen(true);
  };

  const handleClockOutConfirm = async () => {
    setClockOutDialogOpen(false);
    await handleClockOut();
  };

  const handleClockOutCancel = () => {
    setClockOutDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Box className="employee-dashboard__loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="employee-dashboard">
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        className="employee-dashboard__snackbar"
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <LocationSelectionDialog
        open={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        onConfirm={handleLocationConfirm}
        isLoading={isActionLoading}
      />

      <Dialog
        open={isClockOutDialogOpen}
        onClose={handleClockOutCancel}
        aria-labelledby="clock-out-dialog-title"
        aria-describedby="clock-out-dialog-description"
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            padding: 1,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Confirm Clock-Out
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Are you sure you want to clock out for the day?
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box
            sx={{
              border: '2px solid',
              borderColor: 'error.main',
              borderRadius: 2,
              p: 2,
              mt: 1,
              backgroundColor: 'error.50',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LogoutIcon 
                sx={{ 
                  fontSize: 32, 
                  color: 'error.main' 
                }} 
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                  Clock Out
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This will end your work session
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, px: 1 }}>
            <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: '20px' }} />
            <Typography variant="body2" color="text.secondary">
              Current Time: <strong>{format(new Date(), 'hh:mm a')}</strong>
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button 
            onClick={handleClockOutCancel} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleClockOutConfirm}
            variant="contained"
            color="error"
            autoFocus
            sx={{ minWidth: 100 }}
          >
            Clock Out
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h4" className="employee-dashboard__header">
        Dashboard
      </Typography>
      <Box className="employee-dashboard__content">
        <Box className="employee-dashboard__grid">
          <Card className="employee-dashboard__card">
            <CardContent>
              <Typography variant="h6" className="employee-dashboard__card-title">
                Attendance
              </Typography>
              <Box className="employee-dashboard__attendance-content">
                <Typography variant="body1" className="employee-dashboard__status">
                  Status: {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                </Typography>
                {currentLocation && isClockedIn && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Location:
                    </Typography>
                    <Chip
                      icon={currentLocation === 'Home' ? <HomeIcon /> : <BusinessIcon />}
                      label={currentLocation}
                      color={currentLocation === 'Home' ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                )}
                {lastClockIn && (
                  <Typography variant="body2" className="employee-dashboard__last-action">
                    Last action: {formatDateTime(lastClockIn)}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  className={`employee-dashboard__clock-button ${
                    isClockedIn 
                      ? 'employee-dashboard__clock-button--clock-out' 
                      : (lastClockIn && format(new Date(lastClockIn), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                      ? 'employee-dashboard__clock-button--disabled'
                      : 'employee-dashboard__clock-button--clock-in'
                  }`}
                  onClick={isClockedIn ? handleClockOutClick : handleClockInClick}
                  disabled={Boolean(
                    isActionLoading || (
                      !isClockedIn && 
                      lastClockIn && 
                      format(new Date(lastClockIn), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
                      format(new Date(), 'HH:mm') > '17:00'
                    )
                  )}
                >
                  {isActionLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : isClockedIn ? (
                    'Clock Out'
                  ) : lastClockIn && format(new Date(lastClockIn), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? (
                    'Already Clocked Out'
                  ) : (
                    'Clock In'
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
          <Card className="employee-dashboard__card">
            <CardContent>
              <Box className="employee-dashboard__card-header">
                <Typography variant="h6" className="employee-dashboard__card-title">
                  Today's Tasks
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  className="employee-dashboard__view-all-btn"
                  onClick={() => window.location.href = '/tasks'}
                >
                  View All Tasks
                </Button>
              </Box>
              {todaysTasks.length === 0 ? (
                <Typography variant="body1" className="employee-dashboard__no-tasks">
                  No tasks for today
                </Typography>
              ) : (
                <Box className="employee-dashboard__tasks-list">
                  {todaysTasks.map((task) => {
                    const isDelayed = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'completed';
                    return (
                      <Box 
                        key={task.id} 
                        className={`employee-dashboard__task-item employee-dashboard__task-item--${task.status} ${isDelayed ? 'employee-dashboard__task-item--delayed' : ''}`}
                      >
                        <Box className="employee-dashboard__task-header">
                          <Typography variant="body1" className="employee-dashboard__task-title">
                            {task.title}
                          </Typography>
                          {isDelayed && (
                            <span className="employee-dashboard__task-delayed-badge">Delayed</span>
                          )}
                        </Box>
                        <Typography variant="body2" className="employee-dashboard__task-description">
                          {task.description}
                        </Typography>
                        <Box className="employee-dashboard__task-info">
                          <Typography variant="caption" className="employee-dashboard__task-date">
                            Created: {task.createdDate ? format(parseISO(task.createdDate), 'MMM dd, yyyy') : 'N/A'}
                          </Typography>
                          <Typography variant="caption" className="employee-dashboard__task-date">
                            Due: {task.dueDate ? format(parseISO(task.dueDate), 'MMM dd, yyyy') : 'N/A'}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          className={`employee-dashboard__task-status employee-dashboard__task-status--${task.status}`}
                        >
                          Status: {task.status === 'completed' ? 'Completed' : task.status === 'in_progress' || task.status === 'ongoing' ? 'In Progress' : 'To Do'}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};
