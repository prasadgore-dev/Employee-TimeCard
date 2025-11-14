import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
} from '@mui/material';
import './styles/LeaveApprovalPage.scss';
import { managerApi } from '../../services/api';
import { formatDate } from '../../utils/dateFormatter';
import type { ManagerLeaveRequest } from '../../types';

export const LeaveApprovalPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [leaveRequests, setLeaveRequests] = useState<ManagerLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateDayCount = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate difference in milliseconds
    const diffTime = Math.abs(end.getTime() - start.getTime());
    // Convert to days and add 1 to include both start and end date
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  const fetchLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const data = await managerApi.getLeaveRequests();
      setLeaveRequests(data);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const handleDialogOpen = (requestId: string, action: 'approve' | 'reject') => {
    setSelectedRequest(requestId);
    setActionType(action);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
    setNotes('');
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      await managerApi.reviewLeaveRequest(selectedRequest, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        comments: notes
      });
      fetchLeaveRequests();
      handleDialogClose();
    } catch (err) {
      console.error(`Error ${actionType}ing leave request:`, err);
      setError(`Failed to ${actionType} leave request`);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        p: { xs: 1, sm: 2, md: 3 },
        minHeight: 'calc(100vh - 88px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        width: '100%',
        maxWidth: '100%',
        margin: '0 !important',
        boxSizing: 'border-box'
      }} 
      className="leave-approval-page"
    >
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'left', width: '100%', mb: 3, color: '#1976d2', fontWeight: 600 }}>
        Leave Requests
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isMobile ? (
        <Stack spacing={3}>
          {leaveRequests.map((request, index) => (
            <Card key={request.id} sx={{ 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
              borderRadius: 3, 
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: index % 2 === 0 ? '#1976d2' : '#455a64',
                        width: 40, 
                        height: 40,
                        fontSize: '1rem',
                        fontWeight: 600
                      }}>
                        {request.employeeName.split(' ').map(name => name[0]).join('')}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>{request.employeeName}</Typography>
                    </Box>
                    <Chip
                      label={request.status.toUpperCase()}
                      sx={{
                        backgroundColor: 
                          request.status === 'approved' ? '#4caf50' :
                          request.status === 'rejected' ? '#f44336' :
                          request.status === 'pending' ? '#ff9800' : '#455a64',
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" className="leave-approval-page__field-label">POD Name</Typography>
                      <Typography>{request.podName || '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" className="leave-approval-page__field-label">Leave Type</Typography>
                      <Typography>{request.type}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" className="leave-approval-page__field-label">Start Date</Typography>
                      <Typography>{formatDate(request.startDate)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" className="leave-approval-page__field-label">End Date</Typography>
                      <Typography>{formatDate(request.endDate)}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" className="leave-approval-page__field-label">Days Count</Typography>
                      <Typography>{request.dayCount || calculateDayCount(request.startDate, request.endDate)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" className="leave-approval-page__field-label">Backup Spoke</Typography>
                      <Typography>{request.backupSpoke || '-'}</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" className="leave-approval-page__field-label">Reason</Typography>
                    <Typography>{request.reason}</Typography>
                  </Box>
                </Box>
              </CardContent>
              {request.status === 'pending' && (
                <CardActions className="leave-approval-page__card-actions">
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => handleDialogOpen(request.id, 'approve')}
                    fullWidth={isMobile}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={() => handleDialogOpen(request.id, 'reject')}
                    fullWidth={isMobile}
                  >
                    Reject
                  </Button>
                </CardActions>
              )}
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
            borderRadius: 3
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(135deg, #455a64 0%, #37474f 100%)'
              }}>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Employee</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>POD Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Leave Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Start Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>End Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Days</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Backup Spoke</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Reason</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 600, py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveRequests.map((request, index) => (
                <TableRow key={request.id} sx={{
                  '&:hover': { 
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    transition: 'background-color 0.3s ease'
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  }
                }}>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: index % 2 === 0 ? '#1976d2' : '#455a64',
                        width: 36, 
                        height: 36,
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}>
                        {request.employeeName.split(' ').map(name => name[0]).join('')}
                      </Avatar>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {request.employeeName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2, fontWeight: 500 }}>{request.podName || '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>{request.type}</TableCell>
                  <TableCell sx={{ py: 2 }}>{formatDate(request.startDate)}</TableCell>
                  <TableCell sx={{ py: 2 }}>{formatDate(request.endDate)}</TableCell>
                  <TableCell sx={{ py: 2, fontWeight: 500 }}>
                    {request.dayCount || calculateDayCount(request.startDate, request.endDate)}
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>{request.backupSpoke || '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={request.status.toUpperCase()}
                      sx={{
                        backgroundColor: 
                          request.status === 'approved' ? '#4caf50' :
                          request.status === 'rejected' ? '#f44336' :
                          request.status === 'pending' ? '#ff9800' : '#455a64',
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{request.reason}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>
                    {request.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleDialogOpen(request.id, 'approve')}
                          sx={{
                            background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 2,
                            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                            }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleDialogOpen(request.id, 'reject')}
                          sx={{
                            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 2,
                            boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)',
                            }
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        className="leave-approval-dialog"
      >
        <DialogTitle>
          {actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              id="notes"
              label="Notes"
              type="text"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleDialogClose} 
            variant="outlined"
            fullWidth={isMobile}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            fullWidth={isMobile}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};