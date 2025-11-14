import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { leaveApi } from '../../services/api';
import type { LeaveRequest } from '../../types/index';
import './styles/LeaveRequestScreen.scss';
import { formatDate } from '../../utils/dateFormatter';

export const LeaveRequestScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [newRequest, setNewRequest] = useState({
    leaveType: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
    backupSpoke: '',
  });

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

  const fetchLeaveData = async () => {
    try {
      setIsLoading(true);
      const requests = await leaveApi.getRequests();
      setLeaveRequests(requests);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Validate dates
      if (!newRequest.startDate || !newRequest.endDate) {
        throw new Error('Start date and end date are required');
      }

      // Ensure end date is not before start date
      if (new Date(newRequest.endDate) < new Date(newRequest.startDate)) {
        throw new Error('End date cannot be before start date');
      }

      await leaveApi.submitRequest({
        leaveType: newRequest.leaveType as 'vacation' | 'sick' | 'personal' | 'other',
        startDate: new Date(newRequest.startDate).toISOString(),
        endDate: new Date(newRequest.endDate).toISOString(),
        reason: newRequest.reason,
        backupSpoke: newRequest.backupSpoke,
        dayCount: calculateDayCount(newRequest.startDate, newRequest.endDate),
      });
      
      setOpenDialog(false);
      fetchLeaveData();
      setNewRequest({
        leaveType: 'personal',
        startDate: '',
        endDate: '',
        reason: '',
        backupSpoke: '',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit leave request';
      setError(errorMessage);
      console.error('Error submitting leave request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="leave-request">
      <Box className="leave-request__header">
        <Typography variant="h4" className="leave-request__title">
          Leave Requests
        </Typography>
        <Button
          variant="contained"
          className="leave-request__new-button"
          onClick={() => setOpenDialog(true)}
        >
          New Leave Request
        </Button>
      </Box>

      {isLoading ? (
        <Box className="leave-request__loading">
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <TableContainer component={Paper} className="leave-request__table-container">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Backup Spoke</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Comments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell style={{ textTransform: 'capitalize' }}>
                      {request.leaveType}
                    </TableCell>
                    <TableCell>
                      {formatDate(request.startDate)}
                    </TableCell>
                    <TableCell>
                      {formatDate(request.endDate)}
                    </TableCell>
                    <TableCell>
                      {request.dayCount || calculateDayCount(request.startDate, request.endDate)}
                    </TableCell>
                    <TableCell>
                      {request.backupSpoke || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`leave-request__status leave-request__status--${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {request.managerNotes ? (
                        <Box>
                          <Typography variant="body2">{request.managerNotes}</Typography>
                          {request.approvedBy && (
                            <Typography variant="caption" color="text.secondary">
                              - {request.approvedBy.firstName} {request.approvedBy.lastName}
                            </Typography>
                          )}
                        </Box>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        className="leave-request__dialog"
      >
        <DialogTitle className="leave-request__dialog-title">
          New Leave Request
        </DialogTitle>
        <DialogContent className="leave-request__dialog-content">
          <Box className="leave-request__form-fields">
            {error && (
              <Typography className="leave-request__error">
                {error}
              </Typography>
            )}
            <FormControl fullWidth className="leave-request__form-control">
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={newRequest.leaveType}
                label="Leave Type"
                onChange={(e) =>
                  setNewRequest({ ...newRequest, leaveType: e.target.value })
                }
              >
                <MenuItem value="vacation">Vacation</MenuItem>
                <MenuItem value="sick">Sick Leave</MenuItem>
                <MenuItem value="personal">Personal Leave</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              required
              type="date"
              label="Start Date"
              value={newRequest.startDate}
              onChange={(e) =>
                setNewRequest({ ...newRequest, startDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              className="leave-request__text-field"
            />
            <TextField
              required
              type="date"
              label="End Date"
              value={newRequest.endDate}
              onChange={(e) =>
                setNewRequest({ ...newRequest, endDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              className="leave-request__text-field"
            />
            <TextField
              label="Days Count"
              value={calculateDayCount(newRequest.startDate, newRequest.endDate)}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
              className="leave-request__text-field"
            />
            <TextField
              required
              label="Backup Spoke"
              placeholder="Who will handle your responsibilities?"
              value={newRequest.backupSpoke}
              onChange={(e) =>
                setNewRequest({ ...newRequest, backupSpoke: e.target.value })
              }
              fullWidth
              className="leave-request__text-field"
              helperText="Name of person who will answer questions on your behalf"
            />
            <TextField
              required
              label="Reason"
              multiline
              rows={4}
              value={newRequest.reason}
              onChange={(e) =>
                setNewRequest({ ...newRequest, reason: e.target.value })
              }
              fullWidth
              className="leave-request__text-field"
            />
          </Box>
        </DialogContent>
        <DialogActions className="leave-request__dialog-actions">
          <Button 
            onClick={() => setOpenDialog(false)}
            className="leave-request__cancel-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isLoading}
            className="leave-request__submit-button"
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};