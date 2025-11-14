import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import { managerApi } from '../../services/api';

interface EmployeeAttendance {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  status: 'clocked_in' | 'clocked_out' | 'on_leave';
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
}

export const TeamAttendanceScreen = () => {
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departments = await managerApi.getDepartments();
        setDepartments(departments);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        const data = await managerApi.getTeamAttendance({
          startDate: selectedDate,
          endDate: selectedDate,
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined
        });
        setAttendanceData(data);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendanceData();
  }, [selectedDate, selectedDepartment]);

  const getStatusColor = (status: 'clocked_in' | 'clocked_out' | 'on_leave') => {
    switch (status) {
      case 'clocked_in':
        return 'success';
      case 'clocked_out':
        return 'error';
      case 'on_leave':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Team Attendance
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          type="date"
          label="Date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={selectedDepartment}
            label="Department"
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Clock In</TableCell>
                <TableCell>Clock Out</TableCell>
                <TableCell>Total Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {record.firstName} {record.lastName}
                  </TableCell>
                  <TableCell>{record.department}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.status === 'clocked_in' ? 'Working' : record.status === 'clocked_out' ? 'Out' : 'On Leave'}
                      color={getStatusColor(record.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {record.clockIn
                      ? format(new Date(record.clockIn), 'HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {record.clockOut
                      ? format(new Date(record.clockOut), 'HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell>{record.totalHours?.toFixed(2) || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};