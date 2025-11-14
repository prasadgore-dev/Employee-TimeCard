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
} from '@mui/material';
import { format, subDays, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';
import { timecardApi } from '../../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import './styles/TimecardHistory.scss';
import { formatDate, formatTime } from '../../utils/dateFormatter';

interface Timecard {
  id: string;
  clockIn: string;
  clockOut: string | null;
  totalHours?: number;
  status: 'complete' | 'incomplete';
}

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
          <Box className="timecard-history__summary">
            <Typography variant="h6" className="timecard-history__summary-title">
              Total Hours: <span>{calculateTotalHours()}</span> hours
            </Typography>
          </Box>

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
        </>
      )}
    </Box>
  );
};