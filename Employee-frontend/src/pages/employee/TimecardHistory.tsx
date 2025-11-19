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
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { format, subDays, parseISO, differenceInHours, differenceInMinutes, isWeekend } from 'date-fns';
import { timecardApi } from '../../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './styles/TimecardHistory.scss';
import { formatDate, formatTime } from '../../utils/dateFormatter';

interface Timecard {
  id: string;
  clockIn: string;
  clockOut: string | null;
  totalHours?: number;
  status: 'complete' | 'incomplete';
  location?: 'Office' | 'Home' | 'office' | 'home'; // Support both cases
}

const mapAttendanceToColor = (attendance: 'present_office' | 'present_home' | 'absent'): string => {
  switch (attendance) {
    case 'present_office':
      return '#4caf50';
    case 'present_home':
      return '#fff9c4';
    case 'absent':
      return '#f08080';
    default:
      return 'gray';
  }
};

const generateCalendarEvents = (timecards: Timecard[], startDate: Date, endDate: Date): { title: string; start: string; backgroundColor: string; allDay: boolean }[] => {
  const events: { title: string; start: string; backgroundColor: string; allDay: boolean }[] = [];

  // Create a map of dates with attendance
  const attendanceMap: Record<string, 'present_office' | 'present_home' | 'absent'> = {};

  timecards.forEach((timecard) => {
    const date = format(parseISO(timecard.clockIn), 'yyyy-MM-dd');
    // Check location and set attendance status (case-insensitive)
    const location = timecard.location?.toLowerCase();
    if (location === 'home') {
      attendanceMap[date] = 'present_home';
    } else if (location === 'office') {
      attendanceMap[date] = 'present_office';
    } else {
      // If location is not specified, default to office
      attendanceMap[date] = 'present_office';
    }
  });

  // Fill in absent days, excluding weekends
  let currentDate = startDate;
  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    if (!attendanceMap[dateStr] && !isWeekend(currentDate)) {
      attendanceMap[dateStr] = 'absent';
    }
    currentDate = new Date(currentDate.getTime() + 86400000); // Increment by one day
  }

  // Generate events
  Object.entries(attendanceMap).forEach(([date, attendance]) => {
    events.push({
      title: '',
      start: date,
      backgroundColor: mapAttendanceToColor(attendance),
      allDay: true,
    });
  });

  return events;
};

export const TimecardHistory = () => {
  const [timecards, setTimecards] = useState<Timecard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const fetchTimecards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await timecardApi.getTimecardHistory(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );

      const processedTimecards = response.map((timecard: Timecard) => ({
        ...timecard,
        totalHours: timecard.clockOut
          ? calculateHours(timecard.clockIn, timecard.clockOut)
          : undefined,
        status: timecard.clockOut ? 'complete' : 'incomplete'
      }));

      setTimecards(processedTimecards);
    } catch (err) {
      console.error('Error fetching timecard history:', err);
      setError('Failed to load timecard history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimecards();
  }, [startDate, endDate]);

  const calculateHours = (clockIn: string, clockOut: string) => {
    const startTime = parseISO(clockIn);
    const endTime = parseISO(clockOut);
    const hours = differenceInHours(endTime, startTime);
    const minutes = differenceInMinutes(endTime, startTime) % 60;
    return Number((hours + minutes / 60).toFixed(2));
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status'],
      ...timecards.map(timecard => [
        formatDate(timecard.clockIn),
        formatTime(timecard.clockIn),
        timecard.clockOut ? formatTime(timecard.clockOut) : 'N/A',
        timecard.totalHours?.toString() || 'N/A',
        timecard.status
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `timecard_history_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const calculateTotalHours = () => {
    return timecards
      .filter(timecard => timecard.totalHours)
      .reduce((total, timecard) => total + (timecard.totalHours || 0), 0)
      .toFixed(2);
  };

  return (
    <Box className="timecard-history">
      <Box className="timecard-history__header">
        <Typography variant="h4" className="timecard-history__title">
          Timecard History
        </Typography>
        <IconButton 
          onClick={handleExport} 
          title="Export to CSV"
          className="timecard-history__export-button"
        >
          <FileDownloadIcon />
        </IconButton>
      </Box>

      <Card className="timecard-history__filters-card">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#455a64' }}>
            Date Range
          </Typography>
          <Box className="timecard-history__filters">
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => newValue && setStartDate(newValue)}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => newValue && setEndDate(newValue)}
            />
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" className="timecard-history__error">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box className="timecard-history__loading">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card className="timecard-history__summary-card">
            <CardContent>
              <Typography variant="h6" className="timecard-history__summary-title">
                Total Hours: <span>{calculateTotalHours()}</span> hours
              </Typography>
            </CardContent>
          </Card>

          <Card className="timecard-history__calendar-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#455a64' }}>
                  Attendance Calendar
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label="Office" 
                    size="small"
                    sx={{ 
                      backgroundColor: '#4caf50',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label="Home" 
                    size="small"
                    sx={{ 
                      backgroundColor: '#fff9c4',
                      color: '#333',
                      fontWeight: 600,
                      border: '1px solid #f9d71c'
                    }}
                  />
                  <Chip 
                    label="Absent" 
                    size="small"
                    sx={{ 
                      backgroundColor: '#f08080',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={generateCalendarEvents(timecards, startDate, endDate)}
                height="auto"
                eventDisplay="block"
                headerToolbar={{
                  left: 'prev,next',
                  center: 'title',
                  right: ''
                }}
              />
            </CardContent>
          </Card>

          <Card className="timecard-history__table-card">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#455a64' }}>
                Detailed Records
              </Typography>
              <TableContainer component={Paper} className="timecard-history__table-container">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timecards.map((timecard) => (
                  <TableRow 
                    key={timecard.id}
                    className={timecard.status === 'incomplete' ? 'timecard-history__row--incomplete' : ''}
                  >
                    <TableCell>
                      {formatDate(timecard.clockIn)}
                    </TableCell>
                    <TableCell>
                      {formatTime(timecard.clockIn)}
                    </TableCell>
                    <TableCell>
                      {timecard.clockOut ? (
                        formatTime(timecard.clockOut)
                      ) : (
                        <span className="timecard-history__not-clocked-out">
                          Not clocked out
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {timecard.totalHours ? (
                        <span className="timecard-history__hours">
                          {timecard.totalHours} hours
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <span 
                        className={`timecard-history__status timecard-history__status--${timecard.status === 'complete' ? 'complete' : 'incomplete'}`}
                      >
                        {timecard.status === 'complete' ? 'Complete' : 'Incomplete'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};