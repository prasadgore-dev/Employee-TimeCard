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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Person as EmployeeIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import api, { authApi } from '../../services/api';
import type { PodName } from '../../types/index';
import './styles/AdminDashboard.scss';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  podName: string;
  position: string;
  employeeId: string;
}

interface Stats {
  totalUsers: number;
  totalEmployees: number;
  totalManagers: number;
  totalAdmins: number;
  podCount: number;
}

interface PodStats {
  name: string;
  count: number;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEmployees: 0,
    totalManagers: 0,
    totalAdmins: 0,
    podCount: 0,
  });
  const [podStats, setPodStats] = useState<PodStats[]>([]);
  const [availablePods, setAvailablePods] = useState<PodName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<'employee' | 'manager' | 'admin'>('employee');
  const [editPod, setEditPod] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [podDialogOpen, setPodDialogOpen] = useState(false);
  const [addPodDialogOpen, setAddPodDialogOpen] = useState(false);
  const [deletePodDialogOpen, setDeletePodDialogOpen] = useState(false);
  const [newPodName, setNewPodName] = useState('');
  const [selectedPodToDelete, setSelectedPodToDelete] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<'total' | 'admins' | 'managers' | 'employees'>('total');
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    podName: '',
    position: '',
    role: 'employee' as 'employee' | 'manager' | 'admin',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchPods = async () => {
    try {
      const pods = await authApi.getAvailablePods();
      setAvailablePods(pods as PodName[]);
    } catch (err) {
      console.error('Error fetching PODs:', err);
      // Fallback to hardcoded list if API fails
      setAvailablePods([
        "ADP1", "ADP2", "BALIC", "CF360", "Consent", "Corporate", 
        "CPR", "Horizontal", "Investments", "Loans1", "Loans2", "SME", "Wheels"
      ] as PodName[]);
    }
  };

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all users
      const response = await api.get('/api/employees');
      const usersData = response.data;
      
      setUsers(usersData);

      // Calculate stats
      const employeeCount = usersData.filter((u: User) => u.role === 'employee').length;
      const managerCount = usersData.filter((u: User) => u.role === 'manager').length;
      const adminCount = usersData.filter((u: User) => u.role === 'admin').length;
      
      // Calculate POD statistics
      const podMap = new Map<string, number>();
      usersData.forEach((u: User) => {
        if (u.podName) {
          podMap.set(u.podName, (podMap.get(u.podName) || 0) + 1);
        }
      });
      
      const podStatsData: PodStats[] = Array.from(podMap.entries()).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count);
      
      setPodStats(podStatsData);

      setStats({
        totalUsers: usersData.length,
        totalEmployees: employeeCount,
        totalManagers: managerCount,
        totalAdmins: adminCount,
        podCount: podMap.size,
      });
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.response?.data?.message || 'Failed to load admin data. Please try again.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPods();
    fetchAdminData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchAdminData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEditEmployee = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditPod(user.podName);
    setEditPosition(user.position);
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setEditRole('employee');
    setEditPod('');
    setEditPosition('');
  };

  const handleUpdateEmployee = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      setError(null);

      // Update employee with all changes
      await api.put(`/api/employees/${selectedUser.id}`, {
        role: editRole,
        podName: editPod,
        position: editPosition,
      });

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { 
          ...u, 
          role: editRole, 
          podName: editPod,
          position: editPosition 
        } : u
      ));

      // Recalculate stats
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? { 
          ...u, 
          role: editRole, 
          podName: editPod,
          position: editPosition 
        } : u
      );
      const employeeCount = updatedUsers.filter(u => u.role === 'employee').length;
      const managerCount = updatedUsers.filter(u => u.role === 'manager').length;
      const adminCount = updatedUsers.filter(u => u.role === 'admin').length;

      // Recalculate POD stats
      const podMap = new Map<string, number>();
      updatedUsers.forEach(u => {
        if (u.podName) {
          podMap.set(u.podName, (podMap.get(u.podName) || 0) + 1);
        }
      });
      
      const newPodStats: PodStats[] = Array.from(podMap.entries()).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count);
      
      setPodStats(newPodStats);

      setStats(prev => ({
        ...prev,
        totalEmployees: employeeCount,
        totalManagers: managerCount,
        totalAdmins: adminCount,
      }));

      handleCloseDialog();
    } catch (err: any) {
      console.error('Error updating employee:', err);
      setError(err.response?.data?.message || 'Failed to update employee. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddEmployee = () => {
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNewEmployee({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      employeeId: '',
      podName: '',
      position: '',
      role: 'employee',
    });
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNewEmployee({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      employeeId: '',
      podName: '',
      position: '',
      role: 'employee',
    });
  };

  const handleNewEmployeeChange = (e: any) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEmployee = async () => {
    try {
      setIsUpdating(true);
      setError(null);

      // Validate passwords match
      if (newEmployee.password !== newEmployee.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password length
      if (newEmployee.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Validate email domain
      const allowedDomains = ['@bajajfinserv.in', '@bizsupportc.com'];
      const emailDomain = newEmployee.email.substring(newEmployee.email.lastIndexOf('@'));
      if (!allowedDomains.includes(emailDomain)) {
        throw new Error('Email must be from @bajajfinserv.in or @bizsupportc.com domain');
      }

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...employeeData } = newEmployee;
      const response = await api.post('/api/auth/signup', employeeData);

      // Add new user to the list
      setUsers([...users, response.data.user]);

      // Update stats
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
        totalEmployees: newEmployee.role === 'employee' ? prev.totalEmployees + 1 : prev.totalEmployees,
        totalManagers: newEmployee.role === 'manager' ? prev.totalManagers + 1 : prev.totalManagers,
        totalAdmins: newEmployee.role === 'admin' ? prev.totalAdmins + 1 : prev.totalAdmins,
      }));

      handleCloseAddDialog();
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setError(err.response?.data?.message || 'Failed to add employee. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    setError(null);
  };

  const handleDeleteEmployee = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      setError(null);

      await api.delete(`/api/employees/${selectedUser.id}`);

      // Remove user from the list
      const updatedUsers = users.filter(u => u.id !== selectedUser.id);
      setUsers(updatedUsers);

      // Update stats
      const employeeCount = updatedUsers.filter(u => u.role === 'employee').length;
      const managerCount = updatedUsers.filter(u => u.role === 'manager').length;
      const adminCount = updatedUsers.filter(u => u.role === 'admin').length;

      setStats(prev => ({
        ...prev,
        totalUsers: updatedUsers.length,
        totalEmployees: employeeCount,
        totalManagers: managerCount,
        totalAdmins: adminCount,
      }));

      handleCloseDeleteDialog();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      setError(err.response?.data?.message || 'Failed to delete employee. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Card Click Handlers
  const handleCardClick = (cardType: 'total' | 'admins' | 'managers' | 'employees') => {
    setSelectedCardType(cardType);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
  };

  const getFilteredUsers = () => {
    switch (selectedCardType) {
      case 'admins':
        return users.filter(user => user.role === 'admin');
      case 'managers':
        return users.filter(user => user.role === 'manager');
      case 'employees':
        return users.filter(user => user.role === 'employee');
      case 'total':
      default:
        return users;
    }
  };

  const getDialogTitle = () => {
    switch (selectedCardType) {
      case 'admins':
        return 'Administrators';
      case 'managers':
        return 'Managers';
      case 'employees':
        return 'Employees';
      case 'total':
      default:
        return 'All Users';
    }
  };

  // POD Management Handlers
  const handleOpenPodManagement = () => {
    setPodDialogOpen(true);
  };

  const handleClosePodManagement = () => {
    setPodDialogOpen(false);
    setError(null);
  };

  const handleOpenAddPodDialog = () => {
    setNewPodName('');
    setAddPodDialogOpen(true);
  };

  const handleCloseAddPodDialog = () => {
    setAddPodDialogOpen(false);
    setNewPodName('');
    setError(null);
  };

  const handleAddPod = async () => {
    if (!newPodName.trim()) {
      setError('POD name cannot be empty');
      return;
    }
    
    if (availablePods.includes(newPodName as PodName)) {
      setError('POD already exists');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      // Call API to add POD to database
      await authApi.addPod(newPodName.trim());
      
      // Update local state
      setAvailablePods([...availablePods, newPodName.trim() as PodName].sort());
      
      // Notify other components that PODs have been updated
      window.dispatchEvent(new CustomEvent('pods:updated'));
      
      handleCloseAddPodDialog();
    } catch (err: any) {
      console.error('Error adding POD:', err);
      setError(err.response?.data?.message || 'Failed to add POD');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenDeletePodDialog = (podName: string) => {
    const employeesInPod = users.filter(u => u.podName === podName).length;
    if (employeesInPod > 0) {
      setError(`Cannot delete POD "${podName}". It has ${employeesInPod} employee(s) assigned. Please reassign them first.`);
      return;
    }
    setSelectedPodToDelete(podName);
    setDeletePodDialogOpen(true);
  };

  const handleCloseDeletePodDialog = () => {
    setDeletePodDialogOpen(false);
    setSelectedPodToDelete('');
    setError(null);
  };

  const handleDeletePod = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      // Call API to delete POD from database
      await authApi.deletePod(selectedPodToDelete);
      
      // Update local state
      setAvailablePods(availablePods.filter(p => p !== selectedPodToDelete));
      setPodStats(podStats.filter(p => p.name !== selectedPodToDelete));
      
      // Notify other components that PODs have been updated
      window.dispatchEvent(new CustomEvent('pods:updated'));
      
      handleCloseDeletePodDialog();
    } catch (err: any) {
      console.error('Error deleting POD:', err);
      // If status is 501 (not implemented), just update UI
      if (err.response?.status === 501) {
        // Update local state anyway since backend can't delete from enum
        setAvailablePods(availablePods.filter(p => p !== selectedPodToDelete));
        setPodStats(podStats.filter(p => p.name !== selectedPodToDelete));
        window.dispatchEvent(new CustomEvent('pods:updated'));
        handleCloseDeletePodDialog();
      } else {
        setError(err.response?.data?.message || 'Failed to delete POD');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminIcon fontSize="small" />;
      case 'manager':
        return <ManagerIcon fontSize="small" />;
      case 'employee':
        return <EmployeeIcon fontSize="small" />;
      default:
        return <EmployeeIcon fontSize="small" />;
    }
  };

  if (isLoading) {
    return (
      <Box className="admin-dashboard__loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="admin-dashboard">
      <Box className="admin-dashboard__header">
        <AdminIcon />
        <Typography variant="h4">
          Admin Dashboard
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className="admin-dashboard__error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box className="admin-dashboard__stats-grid">
        <Card 
          className="admin-dashboard__stat-card admin-dashboard__stat-card--total-users"
          onClick={() => handleCardClick('total')}
          sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s' } }}
        >
          <CardContent>
            <Box className="admin-dashboard__stat-content">
              <Box className="admin-dashboard__stat-info">
                <Typography variant="body2" className="admin-dashboard__stat-label">
                  Total Users
                </Typography>
                <Typography variant="h4" className="admin-dashboard__stat-value">
                  {stats.totalUsers}
                </Typography>
              </Box>
              <PeopleIcon className="admin-dashboard__stat-icon" />
            </Box>
          </CardContent>
        </Card>

        <Card 
          className="admin-dashboard__stat-card admin-dashboard__stat-card--admins"
          onClick={() => handleCardClick('admins')}
          sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s' } }}
        >
          <CardContent>
            <Box className="admin-dashboard__stat-content">
              <Box className="admin-dashboard__stat-info">
                <Typography variant="body2" className="admin-dashboard__stat-label">
                  Admins
                </Typography>
                <Typography variant="h4" className="admin-dashboard__stat-value">
                  {stats.totalAdmins}
                </Typography>
              </Box>
              <AdminIcon className="admin-dashboard__stat-icon" />
            </Box>
          </CardContent>
        </Card>

        <Card 
          className="admin-dashboard__stat-card admin-dashboard__stat-card--managers"
          onClick={() => handleCardClick('managers')}
          sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s' } }}
        >
          <CardContent>
            <Box className="admin-dashboard__stat-content">
              <Box className="admin-dashboard__stat-info">
                <Typography variant="body2" className="admin-dashboard__stat-label">
                  Managers
                </Typography>
                <Typography variant="h4" className="admin-dashboard__stat-value">
                  {stats.totalManagers}
                </Typography>
              </Box>
              <ManagerIcon className="admin-dashboard__stat-icon" />
            </Box>
          </CardContent>
        </Card>

        <Card 
          className="admin-dashboard__stat-card admin-dashboard__stat-card--employees"
          onClick={() => handleCardClick('employees')}
          sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s' } }}
        >
          <CardContent>
            <Box className="admin-dashboard__stat-content">
              <Box className="admin-dashboard__stat-info">
                <Typography variant="body2" className="admin-dashboard__stat-label">
                  Employees
                </Typography>
                <Typography variant="h4" className="admin-dashboard__stat-value">
                  {stats.totalEmployees}
                </Typography>
              </Box>
              <EmployeeIcon className="admin-dashboard__stat-icon" />
            </Box>
          </CardContent>
        </Card>

        <Card 
          className="admin-dashboard__stat-card admin-dashboard__stat-card--pods"
          onClick={handleOpenPodManagement}
          sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s' } }}
        >
          <CardContent>
            <Box className="admin-dashboard__stat-content">
              <Box className="admin-dashboard__stat-info">
                <Typography variant="body2" className="admin-dashboard__stat-label">
                  POD Groups
                </Typography>
                <Typography variant="h4" className="admin-dashboard__stat-value">
                  {stats.podCount}
                </Typography>
              </Box>
              <CategoryIcon className="admin-dashboard__stat-icon" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* User Management Table */}
      <Card className="admin-dashboard__management-card">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box className="admin-dashboard__management-header" sx={{ mb: 0 }}>
              <AssignmentIcon />
              <Typography variant="h6">
                User Management
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={handleOpenPodManagement}
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                Manage PODs
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddEmployee}
                sx={{
                  backgroundColor: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#45a049',
                  },
                }}
              >
                Add Employee
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} className="admin-dashboard__table-container" sx={{ boxShadow: 'none' }}>
            <Table className="admin-dashboard__table">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>POD Name</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box className="admin-dashboard__user-cell">
                        <Avatar
                          className="admin-dashboard__user-avatar"
                          sx={{
                            bgcolor: index % 3 === 0 ? '#1976d2' : index % 3 === 1 ? '#455a64' : '#d32f2f',
                          }}
                        >
                          {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Box className="admin-dashboard__user-info">
                          <Typography variant="body1" className="admin-dashboard__user-name">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" className="admin-dashboard__user-email" color="textSecondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="admin-dashboard__employee-id">
                        {user.employeeId || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.podName}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.position}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role.toUpperCase()}
                        className={`admin-dashboard__role-chip admin-dashboard__role-chip--${user.role}`}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Employee">
                        <IconButton
                          onClick={() => handleEditEmployee(user)}
                          className="admin-dashboard__action-button"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Employee">
                        <IconButton
                          onClick={() => handleOpenDeleteDialog(user)}
                          className="admin-dashboard__action-button"
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth className="admin-dialog">
        <DialogTitle className="admin-dialog__title">
          Edit Employee
        </DialogTitle>
        <DialogContent className="admin-dialog__content">
          {selectedUser && (
            <Box>
              <Box className="admin-dialog__user-info">
                <Typography variant="body2" className="admin-dialog__info-label">
                  Employee
                </Typography>
                <Typography variant="h6" className="admin-dialog__info-value">
                  {selectedUser.firstName} {selectedUser.lastName}
                </Typography>
                <Typography variant="body2" className="admin-dialog__info-email">
                  {selectedUser.email}
                </Typography>
              </Box>

              <FormControl fullWidth className="admin-dialog__role-select" sx={{ mb: 2 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'employee' | 'manager' | 'admin')}
                  label="Role"
                >
                  <MenuItem value="employee">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmployeeIcon fontSize="small" />
                      Employee
                    </Box>
                  </MenuItem>
                  <MenuItem value="manager">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ManagerIcon fontSize="small" />
                      Manager
                    </Box>
                  </MenuItem>
                  <MenuItem value="admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminIcon fontSize="small" />
                      Admin
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>POD Name</InputLabel>
                <Select
                  value={editPod}
                  onChange={(e) => setEditPod(e.target.value)}
                  label="POD Name"
                >
                  {availablePods.map((pod) => (
                    <MenuItem key={pod} value={pod}>
                      {pod}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Position</InputLabel>
                <Select
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  label="Position"
                >
                  {["Content OPS", "Developer", "DMT", "DMT Lead", "Principal Architect", "QA Lead", "Quality Analyst", "SDM", "Senior Developer", "Tech Architect", "Tech OPS"].map((position) => (
                    <MenuItem key={position} value={position}>
                      {position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="admin-dialog__actions">
          <Button onClick={handleCloseDialog} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateEmployee}
            variant="contained"
            disabled={isUpdating || !selectedUser || (editRole === selectedUser.role && editPod === selectedUser.podName && editPosition === selectedUser.position)}
          >
            {isUpdating ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="md" fullWidth className="admin-dialog">
        <DialogTitle className="admin-dialog__title">
          Add New Employee
        </DialogTitle>
        <DialogContent className="admin-dialog__content">
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
            <TextField
              label="First Name"
              name="firstName"
              value={newEmployee.firstName}
              onChange={handleNewEmployeeChange}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={newEmployee.lastName}
              onChange={handleNewEmployeeChange}
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={newEmployee.email}
              onChange={handleNewEmployeeChange}
              fullWidth
              required
              helperText="Must be @bajajfinserv.in or @bizsupportc.com"
            />
            <TextField
              label="Employee ID"
              name="employeeId"
              value={newEmployee.employeeId}
              onChange={handleNewEmployeeChange}
              fullWidth
              required
            />
            <TextField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={newEmployee.password}
              onChange={handleNewEmployeeChange}
              fullWidth
              required
              helperText="Minimum 6 characters"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={newEmployee.confirmPassword}
              onChange={handleNewEmployeeChange}
              fullWidth
              required
              error={newEmployee.confirmPassword !== '' && newEmployee.password !== newEmployee.confirmPassword}
              helperText={
                newEmployee.confirmPassword !== '' && newEmployee.password !== newEmployee.confirmPassword
                  ? 'Passwords do not match'
                  : 'Re-enter your password'
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth required>
              <InputLabel>POD Name</InputLabel>
              <Select
                name="podName"
                value={newEmployee.podName}
                label="POD Name"
                onChange={handleNewEmployeeChange}
              >
                {availablePods.map((pod) => (
                  <MenuItem key={pod} value={pod}>
                    {pod}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Position</InputLabel>
              <Select
                name="position"
                value={newEmployee.position}
                onChange={handleNewEmployeeChange}
                label="Position"
              >
                {["Content OPS", "Developer", "DMT", "DMT Lead", "Principal Architect", "QA Lead", "Quality Analyst", "SDM", "Senior Developer", "Tech Architect", "Tech OPS"].map((position) => (
                  <MenuItem key={position} value={position}>
                    {position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={newEmployee.role}
                onChange={handleNewEmployeeChange}
                label="Role"
              >
                <MenuItem value="employee">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmployeeIcon fontSize="small" />
                    Employee
                  </Box>
                </MenuItem>
                <MenuItem value="manager">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ManagerIcon fontSize="small" />
                    Manager
                  </Box>
                </MenuItem>
                <MenuItem value="admin">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminIcon fontSize="small" />
                    Admin
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions className="admin-dialog__actions">
          <Button onClick={handleCloseAddDialog} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEmployee}
            variant="contained"
            disabled={isUpdating}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#45a049',
              },
            }}
          >
            {isUpdating ? 'Adding...' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth className="admin-dialog">
        <DialogTitle className="admin-dialog__title" sx={{ color: '#d32f2f' }}>
          Delete Employee
        </DialogTitle>
        <DialogContent className="admin-dialog__content">
          {selectedUser && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This action cannot be undone. All data associated with this employee will be permanently deleted.
              </Alert>
              <Box className="admin-dialog__user-info">
                <Typography variant="body2" className="admin-dialog__info-label">
                  Employee to Delete
                </Typography>
                <Typography variant="h6" className="admin-dialog__info-value">
                  {selectedUser.firstName} {selectedUser.lastName}
                </Typography>
              </Box>
              <Box className="admin-dialog__user-info" sx={{ mt: 1 }}>
                <Typography variant="body2" className="admin-dialog__info-label">
                  Email
                </Typography>
                <Typography variant="body1" className="admin-dialog__info-value">
                  {selectedUser.email}
                </Typography>
              </Box>
              <Box className="admin-dialog__user-info" sx={{ mt: 1 }}>
                <Typography variant="body2" className="admin-dialog__info-label">
                  Employee ID
                </Typography>
                <Typography variant="body1" className="admin-dialog__info-value">
                  {selectedUser.employeeId || '-'}
                </Typography>
              </Box>
              <Box className="admin-dialog__user-info" sx={{ mt: 1 }}>
                <Typography variant="body2" className="admin-dialog__info-label">
                  Current Role
                </Typography>
                <Chip
                  icon={getRoleIcon(selectedUser.role)}
                  label={selectedUser.role.toUpperCase()}
                  className={`admin-dashboard__role-chip admin-dashboard__role-chip--${selectedUser.role}`}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions className="admin-dialog__actions">
          <Button onClick={handleCloseDeleteDialog} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteEmployee}
            variant="contained"
            color="error"
            disabled={isUpdating}
          >
            {isUpdating ? 'Deleting...' : 'Delete Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* POD Management Dialog */}
      <Dialog
        open={podDialogOpen}
        onClose={handleClosePodManagement}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <CategoryIcon />
          POD Management
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Available PODs ({availablePods.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddPodDialog}
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                }
              }}
            >
              Add POD
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            {availablePods.map((pod) => {
              const podStat = podStats.find(p => p.name === pod);
              const employeeCount = podStat ? podStat.count : 0;
              
              return (
                <Card 
                  key={pod}
                  sx={{ 
                    border: '2px solid',
                    borderColor: employeeCount > 0 ? '#1976d2' : '#e0e0e0',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          {pod}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employeeCount} employee{employeeCount !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Tooltip title={employeeCount > 0 ? "Cannot delete POD with employees" : "Delete POD"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeletePodDialog(pod)}
                            disabled={employeeCount > 0}
                            sx={{
                              color: employeeCount > 0 ? '#9e9e9e' : '#d32f2f',
                              '&:hover': {
                                backgroundColor: employeeCount > 0 ? 'transparent' : 'rgba(211, 47, 47, 0.04)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {availablePods.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No PODs available. Add a POD to get started.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClosePodManagement} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add POD Dialog */}
      <Dialog
        open={addPodDialogOpen}
        onClose={handleCloseAddPodDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New POD</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            label="POD Name"
            value={newPodName}
            onChange={(e) => setNewPodName(e.target.value.toUpperCase())}
            fullWidth
            placeholder="e.g., ADP3, NewPOD"
            helperText="Enter a unique name for the new POD"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddPodDialog}>Cancel</Button>
          <Button 
            onClick={handleAddPod} 
            variant="contained"
            disabled={!newPodName.trim()}
            sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
              }
            }}
          >
            Add POD
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete POD Confirmation Dialog */}
      <Dialog
        open={deletePodDialogOpen}
        onClose={handleCloseDeletePodDialog}
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: '#d32f2f' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            Confirm Delete POD
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete POD <strong>{selectedPodToDelete}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeletePodDialog}>Cancel</Button>
          <Button 
            onClick={handleDeletePod} 
            variant="contained" 
            color="error"
          >
            Delete POD
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedCardType === 'admins' && <AdminIcon />}
            {selectedCardType === 'managers' && <ManagerIcon />}
            {selectedCardType === 'employees' && <EmployeeIcon />}
            {selectedCardType === 'total' && <PeopleIcon />}
            <Typography variant="h6">{getDialogTitle()}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>POD</TableCell>
                  <TableCell>Position</TableCell>
                  {selectedCardType === 'total' && <TableCell>Role</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredUsers().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectedCardType === 'total' ? 6 : 5} align="center">
                      <Typography color="text.secondary">No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredUsers().map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {user.firstName[0]}{user.lastName[0]}
                          </Avatar>
                          {user.firstName} {user.lastName}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.employeeId}</TableCell>
                      <TableCell>
                        <Chip label={user.podName} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{user.position}</TableCell>
                      {selectedCardType === 'total' && (
                        <TableCell>
                          <Chip 
                            label={user.role.toUpperCase()} 
                            size="small"
                            color={
                              user.role === 'admin' ? 'error' : 
                              user.role === 'manager' ? 'warning' : 
                              'success'
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDetailsDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
