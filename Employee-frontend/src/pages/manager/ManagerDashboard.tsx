import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Assignment as AssignmentIcon,
  Business as BusinessIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { managerApi } from '../../services/api';
import { formatDate } from '../../utils/dateFormatter';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  podName: string;
  position: string;
}

interface PodStats {
  name: string;
  count: number;
}

interface EmployeeStats {
  totalEmployees: number;
  podStats: PodStats[];
  pendingLeaveRequests: number;
}

interface LeaveRequestData {
  id: string;
  employeeName: string;
  department?: string;
  podName: string;
  type: string;
  startDate: string;
  endDate: string;
  dayCount?: number;
  backupSpoke?: string;
  status: string;
  reason: string;
}

export const ManagerDashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    podStats: [],
    pendingLeaveRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPod, setSelectedPod] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<LeaveRequestData[]>([]);
  const [isLoadingLeaveRequests, setIsLoadingLeaveRequests] = useState(false);
  const [podDialogOpen, setPodDialogOpen] = useState(false);
  const [podEmployees, setPodEmployees] = useState<Employee[]>([]);
  const navigate = useNavigate();

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

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [employeesData, statsData] = await Promise.all([
        managerApi.getEmployeeStatuses(),
        managerApi.getDashboardStats(),
      ]);
      setEmployees(employeesData || []);
      setStats(statsData || {
        totalEmployees: 0,
        podStats: [],
        pendingLeaveRequests: 0
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      // Keep the state arrays initialized even on error
      setEmployees([]);
      setStats({
        totalEmployees: 0,
        podStats: [],
        pendingLeaveRequests: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDetails = (employeeId: string) => {
    navigate(`/manager/employee-status/${employeeId}`);
  };

  const handlePodCardClick = (podName: string) => {
    setSelectedPod(podName);
    const filteredEmps = employees.filter(emp => emp.podName === podName);
    setPodEmployees(filteredEmps);
    setPodDialogOpen(true);
  };

  const handleClosePodDialog = () => {
    setPodDialogOpen(false);
    setSelectedPod(null);
    setPodEmployees([]);
  };

  const handleLeaveRequestCardClick = async () => {
    setLeaveDialogOpen(true);
    setIsLoadingLeaveRequests(true);
    try {
      const leaveRequests = await managerApi.getLeaveRequests();
      // Filter only pending requests
      const pending = leaveRequests.filter(req => req.status === 'pending');
      setPendingLeaveRequests(pending);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests.');
    } finally {
      setIsLoadingLeaveRequests(false);
    }
  };

  const handleCloseLeaveDialog = () => {
    setLeaveDialogOpen(false);
  };

  const handleViewLeaveRequest = () => {
    setLeaveDialogOpen(false);
    navigate(`/manager/leave-approval`);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
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
    }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'left', width: '100%', mb: 3 }}>
          Manager Dashboard
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 2, 
          mb: 4,
          width: '100%'
        }}>
          <Card sx={{ 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', 
            borderRadius: '12px', 
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
            },
            background: 'linear-gradient(180deg, #01497c 0%, #012a4a 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ padding: '1.5rem' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ 
                    opacity: 1, 
                    mb: 1, 
                    fontSize: '1.02rem', 
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '0.5px'
                  }}>
                    Total Employees
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    fontSize: '2rem', 
                    lineHeight: 1,
                    color: 'white'
                  }}>
                    {stats.totalEmployees}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: '3rem', opacity: 0.8, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>

          <Card 
            onClick={handleLeaveRequestCardClick}
            sx={{ 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', 
              borderRadius: '12px', 
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
              },
              background: 'linear-gradient(135deg, #61a5c2 0%, #014f86 100%)',
              color: 'white'
            }}
          >
            <CardContent sx={{ padding: '1.5rem' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ 
                    opacity: 1, 
                    mb: 1, 
                    fontSize: '1.02rem', 
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '0.5px'
                  }}>
                    Pending Leave Requests
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    fontSize: '2rem', 
                    lineHeight: 1,
                    color: 'white'
                  }}>
                    {stats.pendingLeaveRequests}
                  </Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: '3rem', opacity: 0.8, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      
        {/* POD Statistics */}
        <Box sx={{ mb: 4, width: '100%' }}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'left', mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
            POD Statistics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
            {stats.podStats.map((pod, index) => {
              const colors = [
                'linear-gradient(135deg, #61a5c2 0%, #014f86 100%)',
                'linear-gradient(180deg, #01497c 0%, #012a4a 100%)',
                'linear-gradient(135deg, #61a5c2 0%, #014f86 100%)',
                'linear-gradient(180deg, #01497c 0%, #012a4a 100%)',
                'linear-gradient(135deg, #61a5c2 0%, #014f86 100%)',
              ];
              return (
                <Card 
                  key={pod.name} 
                  onClick={() => handlePodCardClick(pod.name)}
                  sx={{ 
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', 
                    borderRadius: '12px', 
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
                    },
                    background: colors[index % colors.length],
                    color: 'white'
                  }}
                >
                  <CardContent sx={{ padding: '1.5rem' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ 
                          opacity: 1, 
                          mb: 1, 
                          fontSize: '1.02rem', 
                          fontWeight: 700,
                          color: 'white',
                          letterSpacing: '0.5px'
                        }}>
                          {pod.name}
                        </Typography>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          fontSize: '2rem', 
                          lineHeight: 1,
                          color: 'white'
                        }}>
                          {pod.count}
                        </Typography>
                      </Box>
                      <BusinessIcon sx={{ fontSize: '3rem', opacity: 0.8, color: 'white' }} />
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        <TableContainer 
          id="employee-table"
          component={Paper} 
          sx={{ 
            width: '100%', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
        <Table>
          <TableHead>
            <TableRow sx={{ 
              background: 'linear-gradient(135deg, #455a64 0%, #37474f 100%)'
            }}>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Employee</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>POD Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Position</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Email</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600, py: 2 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No employees found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee, index) => (
              <TableRow key={employee.id} sx={{ 
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
                      {employee.firstName[0]}{employee.lastName[0]}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {employee.firstName} {employee.lastName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 2, fontWeight: 500 }}>{employee.podName}</TableCell>
                <TableCell sx={{ py: 2 }}>{employee.position}</TableCell>
                <TableCell sx={{ py: 2, color: '#1976d2' }}>{employee.email}</TableCell>
                <TableCell align="right" sx={{ py: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleViewDetails(employee.id)}
                    sx={{
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                      }
                    }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>

      {/* Pending Leave Requests Dialog */}
      <Dialog 
        open={leaveDialogOpen} 
        onClose={handleCloseLeaveDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(180deg, #01497c 0%, #012a4a 100%)',
          color: 'white',
          fontWeight: 600,
          fontSize: '1.5rem',
          py: 2
        }}>
          Pending Leave Requests
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {isLoadingLeaveRequests ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
            </Box>
          ) : pendingLeaveRequests.length === 0 ? (
            <Box py={4} textAlign="center">
              <Typography variant="body1" color="textSecondary">
                No pending leave requests found.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(135deg, #455a64 0%, #37474f 100%)' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Employee</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>POD Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Start Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>End Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Days</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Backup Spoke</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingLeaveRequests.map((request, index) => (
                    <TableRow 
                      key={request.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:nth-of-type(even)': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)'
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)'
                        }
                      }}
                      onClick={handleViewLeaveRequest}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ 
                            bgcolor: index % 3 === 0 ? '#1976d2' : index % 3 === 1 ? '#455a64' : '#d32f2f',
                            width: 32,
                            height: 32,
                            fontSize: '0.85rem'
                          }}>
                            {request.employeeName.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {request.employeeName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{request.podName || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.type}
                          size="small"
                          sx={{ 
                            backgroundColor: 
                              request.type === 'vacation' ? '#4caf50' :
                              request.type === 'sick' ? '#ff9800' :
                              request.type === 'personal' ? '#2196f3' : '#9e9e9e',
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(request.startDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(request.endDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {request.dayCount || calculateDayCount(request.startDate, request.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{request.backupSpoke || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status}
                          size="small"
                          sx={{ 
                            backgroundColor: '#ff9800',
                            color: 'white',
                            fontWeight: 500,
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseLeaveDialog}
            variant="outlined"
            sx={{ 
              borderColor: '#1976d2',
              color: '#1976d2',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#1565c0',
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              handleCloseLeaveDialog();
              navigate('/manager/leave-approval');
            }}
            variant="contained"
            sx={{ 
              background:'linear-gradient(180deg, #01497c 0%, #012a4a 100%)',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                background: 'linear-gradient(180deg, #01497c 0%, #01497c 100%)'
              }
            }}
          >
            View All Leave Requests
          </Button>
        </DialogActions>
      </Dialog>

      {/* POD Employees Dialog */}
      <Dialog
        open={podDialogOpen}
        onClose={handleClosePodDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon />
            <Typography variant="h6">
              {selectedPod ? `${selectedPod} POD Employees` : 'POD Employees'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2, border: '2px solid #1976d2' }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#1976d2' }}>
              Showing <strong>{podEmployees.length}</strong> employee{podEmployees.length !== 1 ? 's' : ''} from POD: <strong>{selectedPod}</strong>
            </Typography>
          </Box>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(135deg, #455a64 0%, #37474f 100%)' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>POD Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Position</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {podEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No employees found in this POD</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  podEmployees.map((employee, index) => (
                    <TableRow key={employee.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ 
                            bgcolor: index % 3 === 0 ? '#1976d2' : index % 3 === 1 ? '#455a64' : '#d32f2f',
                            width: 40,
                            height: 40
                          }}>
                            {employee.firstName[0]}{employee.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {employee.firstName} {employee.lastName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={employee.podName} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleViewDetails(employee.id)}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                            fontWeight: 500,
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a67d8 0%, #6b3fa0 100%)'
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClosePodDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};