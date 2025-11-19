import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { ArrowBack, Today, History, FileDownload, DateRange, Close as CloseIcon } from '@mui/icons-material';
import { managerApi } from '../../services/api';
import * as XLSX from 'xlsx';
import { formatDate, formatTime } from '../../utils/dateFormatter';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  podName: string;
  position: string;
  status: 'clocked_in' | 'clocked_out';
  lastClockIn?: string;
  lastClockOut?: string;
  currentLocation?: 'Home' | 'Office' | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'todo' | 'blocked';
  dueDate: string;
  createdDate?: string;
  completedAt?: string;
}

interface Timecard {
  id: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number | null;
  date: string;
  location?: 'Home' | 'Office' | null;
}

interface EmployeeDetails extends Employee {
  tasks: Task[];
  timecards: Timecard[];
}

export const EmployeeStatusPage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const isManualClose = useRef(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timecardView, setTimecardView] = useState<'today' | 'all' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelectEmployee = useCallback(async (
    employeeId: string, 
    viewType: 'today' | 'all' | 'custom' = timecardView,
    customStart?: string,
    customEnd?: string
  ) => {
    try {
      setIsLoadingDetails(true);
      setError(null);
      
      // Calculate date range based on view type
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let start = viewType === 'today' ? today : thirtyDaysAgo;
      let end = today;
      
      if (viewType === 'custom' && customStart && customEnd) {
        start = customStart;
        end = customEnd;
      }
      
      const [details, tasks, timecards] = await Promise.all([
        managerApi.getEmployeeDetails(employeeId),
        managerApi.getEmployeeTasks(employeeId),
        managerApi.getEmployeeTimecards(employeeId, start, end)
      ]);

      setSelectedEmployee({
        ...details,
        tasks,
        timecards
      });
      setDialogOpen(true);
    } catch (err) {
      console.error('Error fetching employee details:', err);
      setError('Failed to load employee details');
    } finally {
      setIsLoadingDetails(false);
    }
  }, [timecardView]);

  const handleTimecardViewChange = (newView: 'today' | 'all' | 'custom') => {
    setTimecardView(newView);
    if (selectedEmployee) {
      if (newView === 'custom' && startDate && endDate) {
        handleSelectEmployee(selectedEmployee.id, newView, startDate, endDate);
      } else if (newView !== 'custom') {
        handleSelectEmployee(selectedEmployee.id, newView);
      }
    }
  };

  const handleDateRangeApply = () => {
    if (selectedEmployee && startDate && endDate) {
      handleSelectEmployee(selectedEmployee.id, 'custom', startDate, endDate);
    }
  };

  const handleCloseDialog = () => {
    isManualClose.current = true;
    setDialogOpen(false);
    setSelectedEmployee(null);
    setTimecardView('today');
    setStartDate('');
    setEndDate('');
    // If there's an employeeId in the URL, navigate back to the base employee status page
    if (employeeId) {
      navigate('/manager/employee-status');
    }
  };

  const getTaskCompletionStatus = (task: Task): string => {
    const dueDate = new Date(task.dueDate);
    const completedDate = task.completedAt ? new Date(task.completedAt) : null;
    const now = new Date();

    if (task.status === 'completed') {
      if (completedDate && completedDate <= dueDate) {
        return 'On Time';
      } else {
        return 'Delayed';
      }
    } else {
      if (now > dueDate) {
        return 'Delayed';
      } else {
        return 'In Progress';
      }
    }
  };

  const generateAllDatesWithAttendance = () => {
    if (!selectedEmployee) return [];

    // Calculate date range based on view type
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let rangeStartDate: Date;
    let rangeEndDate: Date = new Date(today);

    if (timecardView === 'today') {
      rangeStartDate = new Date(today);
    } else if (timecardView === 'custom' && startDate && endDate) {
      rangeStartDate = new Date(startDate);
      rangeEndDate = new Date(endDate);
    } else {
      // 'all' view - last 30 days
      rangeStartDate = new Date(today);
      rangeStartDate.setDate(today.getDate() - 29); // 30 days including today
    }

    // Generate all dates in range
    const allDates: Array<{
      date: string;
      timecard: Timecard | null;
      isPresent: boolean;
      isWeekend: boolean;
    }> = [];

    const currentDate = new Date(rangeStartDate);
    while (currentDate <= rangeEndDate) {
      // Use local date to avoid timezone issues
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 1; // 1 = Sunday, 0 = Saturday
      
      // Find matching timecard for this date
      const timecard = selectedEmployee.timecards.find(tc => {
        const tcDateStr = typeof tc.date === 'string' ? tc.date.split('T')[0] : new Date(tc.date).toISOString().split('T')[0];
        return tcDateStr === dateStr;
      });

      allDates.push({
        date: dateStr,
        timecard: timecard || null,
        isPresent: !!timecard,
        isWeekend
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort by date descending (most recent first)
    return allDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleExportToExcel = () => {
    if (!selectedEmployee) return;

    // Prepare employee details
    const employeeInfo = [
      ['Employee Report'],
      [''],
      ['Name', `${selectedEmployee.firstName} ${selectedEmployee.lastName}`],
      ['Email', selectedEmployee.email],
      ['POD Name', selectedEmployee.podName],
      ['Position', selectedEmployee.position],
      [''],
    ];

    // Prepare timecard data
    const timecardHeader = ['Date', 'Clock In', 'Clock Out', 'Location', 'Total Hours'];
    const timecardData = selectedEmployee.timecards
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(tc => [
        formatDate(tc.date),
        formatTime(tc.clockIn),
        tc.clockOut ? formatTime(tc.clockOut) : '-',
        tc.location || '-',
        tc.totalHours != null ? Number(tc.totalHours).toFixed(2) : '0.00'
      ]);

    // Prepare task data
    const taskHeader = ['Task', 'Description', 'Status', 'Created Date', 'Due Date', 'Completion Status'];
    const taskData = selectedEmployee.tasks.map(task => [
      task.title,
      task.description || '',
      task.status.replace('_', ' '),
      task.createdDate ? formatDate(task.createdDate) : '-',
      formatDate(task.dueDate),
      getTaskCompletionStatus(task)
    ]);

    // Combine all data
    const worksheetData = [
      ...employeeInfo,
      ['Timecards'],
      timecardHeader,
      ...timecardData,
      [''],
      ['Tasks'],
      taskHeader,
      ...taskData
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 }
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Report');

    // Generate filename with employee name and date range
    const dateRangeStr = timecardView === 'custom' && startDate && endDate
      ? `${startDate}_to_${endDate}`
      : timecardView === 'today'
      ? new Date().toISOString().split('T')[0]
      : 'last_30_days';
    
    const filename = `${selectedEmployee.firstName}_${selectedEmployee.lastName}_Report_${dateRangeStr}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const data = await managerApi.getEmployeeStatuses();
        setEmployees(data);
      } catch (err) {
        console.error('Error fetching employee statuses:', err);
        setError('Failed to load employee statuses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchEmployees, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Separate effect for initial employee selection from URL
  useEffect(() => {
    if (employeeId && employees.length > 0 && !selectedEmployee && !isManualClose.current) {
      handleSelectEmployee(employeeId);
    }
    // Reset manual close flag when employeeId changes (new navigation)
    if (!employeeId) {
      isManualClose.current = false;
    }
  }, [employeeId, employees, selectedEmployee, handleSelectEmployee]);

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
      boxSizing: 'border-box',
      backgroundColor: 'white'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        {employeeId && (
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/manager')}
            variant="outlined"
            size="small"
          >
            Back to Dashboard
          </Button>
        )}
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            mb: 0, 
            fontWeight: 600, 
            color: '#1a1a1a',
            fontSize: { xs: '1.75rem', sm: '2.125rem' }
          }}
        >
          Employee Status
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer 
          component={Paper} 
          sx={{ 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
            borderRadius: 3,
            overflow: 'auto',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(135deg, #455a64 0%, #37474f 100%)'
              }}>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Employee</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>POD Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Position</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Location</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Last Activity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee, index) => (
                <TableRow 
                  key={employee.id}
                  hover
                  onClick={() => handleSelectEmployee(employee.id)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      transition: 'background-color 0.3s ease'
                    },
                    '&:nth-of-type(even)': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
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
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {employee.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2, fontWeight: 500 }}>{employee.podName}</TableCell>
                  <TableCell sx={{ py: 2 }}>{employee.position}</TableCell>
                  <TableCell sx={{ py: 2, color: '#1976d2' }}>{employee.email}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={employee.status === 'clocked_in' ? 'Working' : 'Out'}
                      sx={{
                        backgroundColor: employee.status === 'clocked_in' ? '#4caf50' : '#455a64',
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    {employee.status === 'clocked_in' && employee.currentLocation ? (
                      <Chip
                        label={employee.currentLocation}
                        color={employee.currentLocation === 'Home' ? 'primary' : 'secondary'}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.status === 'clocked_in' && employee.lastClockIn
                      ? `Clocked in at ${new Date(employee.lastClockIn).toLocaleTimeString()}`
                      : employee.lastClockOut
                      ? `Clocked out at ${new Date(employee.lastClockOut).toLocaleTimeString()}`
                      : 'No activity today'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      {/* Employee Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        disableEscapeKeyDown={false}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            minHeight: '70vh',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: '#1976d2',
                width: 48, 
                height: 48,
                fontSize: '1.2rem',
                fontWeight: 600
              }}>
                {selectedEmployee?.firstName[0]}{selectedEmployee?.lastName[0]}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {selectedEmployee?.podName} • {selectedEmployee?.position}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedEmployee && (
            <>
            {isLoadingDetails ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                      {timecardView === 'today' 
                        ? "Today's Timecard" 
                        : timecardView === 'custom' 
                        ? "Custom Date Range" 
                        : "Timecard History (Last 30 Days)"}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <ToggleButtonGroup
                        value={timecardView}
                        exclusive
                        onChange={(_, newView) => newView && handleTimecardViewChange(newView)}
                        size="small"
                        sx={{
                          '& .MuiToggleButton-root': {
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            '&.Mui-selected': {
                              backgroundColor: '#1976d2',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#1565c0'
                              }
                            }
                          }
                        }}
                      >
                        <ToggleButton value="today" aria-label="today's timecard">
                          <Today fontSize="small" />
                          <Box sx={{ ml: 1 }}>Today</Box>
                        </ToggleButton>
                        <ToggleButton value="all" aria-label="full timecard history">
                          <History fontSize="small" />
                          <Box sx={{ ml: 1 }}>History</Box>
                        </ToggleButton>
                        <ToggleButton value="custom" aria-label="custom date range">
                          <DateRange fontSize="small" />
                          <Box sx={{ ml: 1 }}>Custom</Box>
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </Box>
                  
                  {timecardView === 'custom' && (
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      mb: 2, 
                      p: 2, 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: 2,
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <TextField
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ minWidth: 150 }}
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ minWidth: 150 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleDateRangeApply}
                        disabled={!startDate || !endDate}
                        size="small"
                      >
                        Apply
                      </Button>
                    </Box>
                  )}
                  {(() => {
                    const allDatesData = generateAllDatesWithAttendance();
                    return allDatesData.length > 0 ? (
                      <TableContainer component={Paper} sx={{ 
                        maxHeight: 400,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', 
                        borderRadius: 2,
                        overflow: 'auto',
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        '&::-webkit-scrollbar': {
                          height: '8px',
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#888',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: '#555',
                        },
                      }}>
                        <Table size="small" stickyHeader sx={{ minWidth: 750 }}>
                          <TableHead>
                            <TableRow>
                              {(timecardView === 'all' || timecardView === 'custom') && (
                                <TableCell 
                                  sx={{ 
                                    color: 'white', 
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #546e7a 0%, #455a64 100%)',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1
                                  }}
                                >
                                  Date
                                </TableCell>
                              )}
                              <TableCell 
                                sx={{ 
                                  color: 'white', 
                                  fontWeight: 600,
                                  background: 'linear-gradient(135deg, #546e7a 0%, #455a64 100%)',
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 1
                                }}
                              >
                                Status
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  color: 'white', 
                                  fontWeight: 600,
                                  background: 'linear-gradient(135deg, #546e7a 0%, #455a64 100%)',
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 1
                                }}
                              >
                                Clock In
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  color: 'white', 
                                  fontWeight: 600,
                                  background: 'linear-gradient(135deg, #546e7a 0%, #455a64 100%)',
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 1
                                }}
                              >
                                Clock Out
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  color: 'white', 
                                  fontWeight: 600,
                                  background: 'linear-gradient(135deg, #546e7a 0%, #455a64 100%)',
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 1
                                }}
                              >
                                Location
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  color: 'white', 
                                  fontWeight: 600,
                                  background: 'linear-gradient(135deg, #546e7a 0%, #455a64 100%)',
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 1
                                }}
                              >
                                Total Hours
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {allDatesData.map((dateData, index) => (
                              <TableRow 
                                key={`${dateData.date}-${index}`}
                                sx={{
                                  backgroundColor: dateData.isWeekend ? 'rgba(0, 0, 0, 0.02)' : 'inherit',
                                  '&:hover': { 
                                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                  }
                                }}
                              >
                                {(timecardView === 'all' || timecardView === 'custom') && (
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: dateData.isWeekend ? 400 : 500 }}>
                                      {formatDate(dateData.date)}
                                    </Typography>
                                  </TableCell>
                                )}
                                <TableCell>
                                  <Chip
                                    label={dateData.isWeekend ? 'Weekend' : (dateData.isPresent ? 'Present' : 'Absent')}
                                    sx={{
                                      backgroundColor: dateData.isWeekend ? '#9e9e9e' : (dateData.isPresent ? '#4caf50' : '#f44336'),
                                      color: 'white',
                                      fontWeight: 600,
                                      fontSize: '0.7rem'
                                    }}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {dateData.timecard ? formatTime(dateData.timecard.clockIn) : '-'}
                                </TableCell>
                                <TableCell>
                                  {dateData.timecard?.clockOut ? formatTime(dateData.timecard.clockOut) : '-'}
                                </TableCell>
                                <TableCell>
                                  {dateData.timecard?.location ? (
                                    <Chip
                                      label={dateData.timecard.location}
                                      color={dateData.timecard.location === 'Home' ? 'primary' : 'secondary'}
                                      size="small"
                                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                    />
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {dateData.timecard?.totalHours != null ? Number(dateData.timecard.totalHours).toFixed(2) : '0.00'}h
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="textSecondary">
                        {timecardView === 'today' ? 'No data available for today' : 'No data available for selected period'}
                      </Typography>
                    );
                  })()}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>Tasks</Typography>
                  {selectedEmployee.tasks.length > 0 ? (
                    <TableContainer component={Paper} sx={{ 
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', 
                      borderRadius: 2,
                      overflow: 'auto',
                      overflowX: 'auto',
                      WebkitOverflowScrolling: 'touch',
                      '&::-webkit-scrollbar': {
                        height: '8px',
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#888',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: '#555',
                      },
                    }}>
                      <Table size="small" sx={{ minWidth: 650 }}>
                        <TableHead>
                          <TableRow sx={{ 
                            background: 'linear-gradient(135deg, #546e7a 0%, #455a64 100%)'
                          }}>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Task</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Created Date</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Due Date</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Completion Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEmployee.tasks.map((task) => {
                            const completionStatus = getTaskCompletionStatus(task);
                            return (
                              <TableRow key={task.id} sx={{
                                '&:hover': { 
                                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                },
                                '&:nth-of-type(even)': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                }
                              }}>
                                <TableCell sx={{ py: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{task.title}</Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {task.description}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                  <Chip
                                    label={task.status.replace('_', ' ')}
                                    sx={{
                                      backgroundColor: 
                                        task.status === 'completed' ? '#4caf50' :
                                        task.status === 'in_progress' ? '#1976d2' : '#455a64',
                                      color: 'white',
                                      fontWeight: 500,
                                      fontSize: '0.75rem'
                                    }}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                  {task.createdDate ? formatDate(task.createdDate) : '-'}
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                  {formatDate(task.dueDate)}
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                  <Chip
                                    label={completionStatus}
                                    sx={{
                                      backgroundColor: 
                                        completionStatus === 'On Time' ? '#4caf50' :
                                        completionStatus === 'Delayed' ? '#f44336' : '#ff9800',
                                      color: 'white',
                                      fontWeight: 500,
                                      fontSize: '0.75rem'
                                    }}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="textSecondary">No tasks assigned</Typography>
                  )}
                </Box>
              </>
            )}
            </>
          )}
        </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog} variant="outlined">
              Close
            </Button>
            <Button 
              onClick={handleExportToExcel}
              variant="contained"
              startIcon={<FileDownload />}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                },
              }}
            >
              Export Employee Report
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};