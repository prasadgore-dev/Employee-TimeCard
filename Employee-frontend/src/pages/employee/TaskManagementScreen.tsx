import { useState, useEffect } from 'react';
import './styles/TaskManagementScreen.scss';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { taskApi } from '../../services/api';
import type { Task } from '../../types/index';
import { isPast, parseISO } from 'date-fns';
import { formatDate } from '../../utils/dateFormatter';

export const TaskManagementScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'completed'>('all');
  const [confirmCompleteDialog, setConfirmCompleteDialog] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    estimatedHours: '',
    startDate: new Date().toISOString().split('T')[0], // Default to today
    dueDate: new Date().toISOString().split('T')[0], // Default to today
  });

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      // Fetch all tasks without date filter
      const data = await taskApi.getTasks();
      
      // Auto-update tasks to in-progress if start date has passed and status is todo
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const updatedTasks = await Promise.all(
        data.map(async (task: Task) => {
          if (task.status === 'todo' && task.startDate) {
            const startDate = new Date(task.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            // If start date is today or in the past, update to ongoing
            if (startDate <= today) {
              try {
                await taskApi.updateTaskStatus(task.id, 'ongoing');
                return { ...task, status: 'ongoing' as const };
              } catch (error) {
                console.error('Error auto-updating task status:', error);
                return task;
              }
            }
          }
          return task;
        })
      );
      
      setTasks(updatedTasks);
      applyFilter(updatedTasks, filterStatus);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (taskList: Task[], status: 'all' | 'todo' | 'completed') => {
    if (status === 'all') {
      setFilteredTasks(taskList);
    } else if (status === 'todo') {
      setFilteredTasks(taskList.filter(task => task.status === 'todo' || task.status === 'ongoing'));
    } else {
      setFilteredTasks(taskList.filter(task => task.status === 'completed'));
    }
  };

  const handleFilterChange = (status: 'all' | 'todo' | 'completed') => {
    setFilterStatus(status);
    applyFilter(tasks, status);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      if (editingTask) {
        // Update existing task
        await taskApi.updateTask(editingTask.id, {
          title: newTask.title,
          description: newTask.description,
          estimatedHours: Number(newTask.estimatedHours),
          startDate: newTask.startDate,
          dueDate: newTask.dueDate,
        });

        // Check if start date changed and update status accordingly
        if (newTask.startDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = new Date(newTask.startDate);
          startDate.setHours(0, 0, 0, 0);

          // Only update status for todo or ongoing tasks (not completed)
          if (editingTask.status !== 'completed') {
            if (startDate <= today && editingTask.status === 'todo') {
              // Start date has arrived or passed - make it ongoing
              await taskApi.updateTaskStatus(editingTask.id, 'ongoing');
            } else if (startDate > today && editingTask.status === 'ongoing') {
              // Start date is in the future - revert to todo
              await taskApi.updateTaskStatus(editingTask.id, 'todo');
            }
          }
        }
      } else {
        // Create new task
        await taskApi.createTask({
          title: newTask.title,
          description: newTask.description,
          estimatedHours: Number(newTask.estimatedHours),
          startDate: newTask.startDate,
          dueDate: newTask.dueDate,
        });
      }
      setOpenDialog(false);
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        estimatedHours: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
      });
      await fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: 'ongoing' | 'completed') => {
    // If marking as completed, show confirmation dialog
    if (newStatus === 'completed') {
      setTaskToComplete(task);
      setConfirmCompleteDialog(true);
      return;
    }

    // For other status changes, proceed directly
    try {
      setIsLoading(true);
      await taskApi.updateTaskStatus(task.id, newStatus);
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!taskToComplete) return;

    try {
      setIsLoading(true);
      await taskApi.updateTaskStatus(taskToComplete.id, 'completed');
      setConfirmCompleteDialog(false);
      setTaskToComplete(null);
      await fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelComplete = () => {
    setConfirmCompleteDialog(false);
    setTaskToComplete(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      estimatedHours: task.estimatedHours?.toString() || '',
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setOpenDialog(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      setIsLoading(true);
      await taskApi.deleteTask(taskId);
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="task-management">
      <Box className="task-management__header">
        <Typography variant="h4" className="task-management__header-title">
          Task History
        </Typography>
        <Box className="task-management__header-controls">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTask(null);
              setNewTask({
                title: '',
                description: '',
                estimatedHours: '',
                startDate: new Date().toISOString().split('T')[0],
                dueDate: new Date().toISOString().split('T')[0],
              });
              setOpenDialog(true);
            }}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      <Box className="task-management__filters">
        <Button
          variant={filterStatus === 'all' ? 'contained' : 'outlined'}
          onClick={() => handleFilterChange('all')}
          className="task-management__filter-btn"
        >
          All Tasks ({tasks.length})
        </Button>
        <Button
          variant={filterStatus === 'todo' ? 'contained' : 'outlined'}
          onClick={() => handleFilterChange('todo')}
          className="task-management__filter-btn"
        >
          Pending ({tasks.filter(t => t.status === 'todo' || t.status === 'ongoing').length})
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'contained' : 'outlined'}
          onClick={() => handleFilterChange('completed')}
          className="task-management__filter-btn"
          color="success"
        >
          Completed ({tasks.filter(t => t.status === 'completed').length})
        </Button>
      </Box>

      {isLoading ? (
        <Box className="task-management__loading">
          <CircularProgress />
        </Box>
      ) : (
        <Box className="task-management__tasks-grid">
          {filteredTasks.length === 0 ? (
            <Card className="task-management__empty">
              <CardContent>
                <Typography align="center">
                  {filterStatus === 'all' 
                    ? 'No tasks available' 
                    : filterStatus === 'todo'
                    ? 'No pending tasks'
                    : 'No completed tasks'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="task-management__task-card">
                <CardContent className="task-management__task-card-content">
                  <Box className="task-management__task-card-header">
                    <IconButton
                      onClick={() =>
                        handleStatusChange(
                          task,
                          task.status === 'completed' ? 'ongoing' : 'completed'
                        )
                      }
                      color={task.status === 'completed' ? 'success' : 'default'}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircleIcon />
                      ) : (
                        <RadioButtonUncheckedIcon />
                      )}
                    </IconButton>
                    <Box style={{ flexGrow: 1 }}>
                      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" className="task-management__task-card-title">
                          {task.title}
                        </Typography>
                        <Box className="task-management__task-card-actions">
                          <IconButton onClick={() => handleEditTask(task)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteTask(task.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      {task.description && (
                        <Typography className="task-management__task-card-description">
                          {task.description}
                        </Typography>
                      )}
                      <Box className="task-management__task-card-dates">
                        <Typography variant="body2" className="task-management__task-card-date">
                          <strong>Created:</strong> {task.createdDate ? formatDate(task.createdDate) : 'N/A'}
                        </Typography>
                        <Typography variant="body2" className="task-management__task-card-date">
                          <strong>Start:</strong> {task.startDate ? formatDate(task.startDate) : 'N/A'}
                        </Typography>
                        <Typography variant="body2" className="task-management__task-card-date">
                          <strong>Due:</strong> {task.dueDate ? formatDate(task.dueDate) : 'N/A'}
                        </Typography>
                      </Box>
                      <Box className="task-management__task-card-chips">
                        {task.estimatedHours && (
                          <Chip
                            label={`${task.estimatedHours} hour${
                              task.estimatedHours !== 1 ? 's' : ''
                            }`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        <Chip
                          label={task.status === 'completed' ? 'Completed' : task.status === 'in_progress' || task.status === 'ongoing' ? 'In Progress' : 'To Do'}
                          color={task.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                        {task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'completed' && (
                          <Chip
                            label="Delayed"
                            color="error"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        className="task-management__dialog"
      >
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'New Task'}
        </DialogTitle>
        <DialogContent>
          <Box className="task-management__dialog-form">
            <TextField
              label="Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              fullWidth
              required
              error={!newTask.title}
              helperText={!newTask.title ? 'Title is required' : ''}
            />
            <TextField
              label="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
              required
              error={!newTask.description}
              helperText={!newTask.description ? 'Description is required' : ''}
            />
            <TextField
              label="Start Date"
              type="date"
              value={newTask.startDate}
              onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
              fullWidth
              required
              error={!newTask.startDate}
              helperText={!newTask.startDate ? 'Start date is required' : ''}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="Due Date"
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              fullWidth
              required
              error={!newTask.dueDate}
              helperText={!newTask.dueDate ? 'Due date is required' : ''}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="Estimated Hours"
              type="number"
              value={newTask.estimatedHours}
              onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
              fullWidth
              required
              error={!newTask.estimatedHours || Number(newTask.estimatedHours) <= 0}
              helperText={!newTask.estimatedHours || Number(newTask.estimatedHours) <= 0 ? 'Estimated hours must be greater than 0' : ''}
              inputProps={{ min: 0.1, step: 0.5 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !newTask.title || 
              !newTask.description || 
              !newTask.startDate ||
              !newTask.dueDate || 
              !newTask.estimatedHours || 
              Number(newTask.estimatedHours) <= 0 ||
              isLoading
            }
          >
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Complete Dialog */}
      <Dialog
        open={confirmCompleteDialog}
        onClose={handleCancelComplete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Complete Task
        </DialogTitle>
        <DialogContent>
          {taskToComplete && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to mark this task as completed?
              </Typography>
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#1976d2' }}>
                  {taskToComplete.title}
                </Typography>
                {taskToComplete.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {taskToComplete.description}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Estimated Hours:</strong> {taskToComplete.estimatedHours || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Due Date:</strong> {taskToComplete.dueDate ? formatDate(taskToComplete.dueDate) : 'N/A'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelComplete} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmComplete}
            variant="contained"
            color="success"
            disabled={isLoading}
          >
            {isLoading ? 'Completing...' : 'Mark as Completed'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};