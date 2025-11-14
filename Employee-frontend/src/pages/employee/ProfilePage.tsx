import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import type { PodName } from '../../types/index';
import './styles/ProfilePage.scss';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [podNames, setPodNames] = useState<string[]>([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);

  // Fetch available PODs from backend
  useEffect(() => {
    const fetchPods = async () => {
      try {
        setIsLoadingPods(true);
        const pods = await authApi.getAvailablePods();
        setPodNames(pods);
      } catch (err) {
        console.error('Error fetching PODs:', err);
        // Fallback to hardcoded list if API fails
        setPodNames([
          "ADP1", "ADP2", "BALIC", "CF360", "Consent", "Corporate", 
          "CPR", "Horizontal", "Investments", "Loans1", "Loans2", "SME", "Wheels"
        ]);
      } finally {
        setIsLoadingPods(false);
      }
    };
    
    fetchPods();

    // Listen for POD updates from admin dashboard
    const handlePodsUpdated = () => {
      fetchPods();
    };
    window.addEventListener('pods:updated', handlePodsUpdated);

    return () => {
      window.removeEventListener('pods:updated', handlePodsUpdated);
    };
  }, []);

  useEffect(() => {
    // Clear success message after 3 seconds
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    // Clear success and error messages when switching modes
    setSuccess(null);
    setError(null);
  }, [isEditMode]);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    podName: user?.podName || '',
    position: user?.position || '',
    employeeId: user?.employeeId || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await updateProfile(formData);
      setSuccess('Profile updated successfully');
      setIsEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await updateProfile({ password: passwordData.newPassword, currentPassword: passwordData.currentPassword });
      setSuccess('Password changed successfully');
      setIsChangePasswordOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="profile-page">
      {/* Hero Profile Section */}
      <Card className="profile-page__hero-card">
        <CardContent className="profile-page__hero-content">
          <Box className="profile-page__hero-wrapper">
            <Avatar className="profile-page__avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box className="profile-page__hero-info">
              <Typography variant="h3" className="profile-page__hero-name">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="h6" className="profile-page__hero-email">
                {user?.email}
              </Typography>
              <Typography variant="body1" className="profile-page__hero-role">
                {user?.role === 'manager' ? 'Manager' : 'Employee'}
              </Typography>
            </Box>
            <Button
              startIcon={<EditIcon />}
              onClick={() => setIsEditMode(!isEditMode)}
              disabled={isLoading}
              variant="contained"
              className="profile-page__edit-button"
            >
            {isEditMode ? 'Cancel' : 'Edit Profile'}
          </Button>
        </Box>

        </CardContent>
      </Card>

      {/* Main Profile Form */}
      <Card className="profile-page__form-card">
        <CardContent className="profile-page__form-content">
          <Typography variant="h5" className="profile-page__form-title">
            Personal Information
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Box className="profile-page__form-grid">
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!isEditMode || isLoading}
              required
              className="profile-page__text-field"
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!isEditMode || isLoading}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditMode || isLoading}
              type="email"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            />
            <FormControl 
              fullWidth 
              required
              disabled={!isEditMode || isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            >
              <InputLabel id="pod-name-label">POD Name</InputLabel>
              <Select
                labelId="pod-name-label"
                id="podName"
                name="podName"
                value={formData.podName}
                label="POD Name"
                onChange={(e) => setFormData({ ...formData, podName: e.target.value as PodName })}
              >
                {podNames.map((pod) => (
                  <MenuItem key={pod} value={pod}>
                    {pod}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Your POD assignment</FormHelperText>
            </FormControl>
            <TextField
              fullWidth
              label="Employee ID"
              name="employeeId"
              value={formData.employeeId}
              disabled={true}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f5f5f5'
                }
              }}
            />
            <TextField
              fullWidth
              label="Position"
              name="position"
              value={formData.position}
              disabled={true}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f5f5f5'
                }
              }}
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditMode || isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditMode || isLoading}
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2'
                    }
                  }
                }}
              />
            </Box>
          </Box>

          <Box sx={{ 
            mt: 4, 
            mb: 2, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            borderTop: '1px solid #e0e0e0',
            pt: 3
          }}>
            <Button
              variant="outlined"
              onClick={() => setIsChangePasswordOpen(true)}
              disabled={isLoading}
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 3, sm: 4 },
                py: 1.5,
                minHeight: '48px',
                minWidth: { xs: '100%', sm: '180px' },
                order: { xs: 2, sm: 1 },
                '&:hover': {
                  borderColor: '#1565c0',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Change Password
            </Button>
            
            {isEditMode && (
              <Box sx={{ 
                display: 'flex',
                gap: 2,
                order: { xs: 1, sm: 2 },
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditMode(false)}
                  disabled={isLoading}
                  sx={{
                    borderColor: '#757575',
                    color: '#757575',
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: { xs: 3, sm: 4 },
                    py: 1.5,
                    minHeight: '48px',
                    minWidth: { xs: '100%', sm: '120px' },
                    '&:hover': {
                      borderColor: '#616161',
                      backgroundColor: 'rgba(117, 117, 117, 0.04)'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpdateProfile}
                  disabled={isLoading || !formData.firstName || !formData.lastName || !formData.email || !formData.podName}
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: { xs: 3, sm: 4 },
                    py: 1.5,
                    minHeight: '48px',
                    minWidth: { xs: '100%', sm: '140px' },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                      boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': {
                      background: '#e0e0e0',
                      color: '#9e9e9e'
                    }
                  }}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          fontSize: '1.5rem', 
          fontWeight: 600, 
          color: '#1976d2',
          borderBottom: '1px solid #e0e0e0'
        }}>
          Change Password
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              error={
                passwordData.confirmPassword !== '' &&
                passwordData.newPassword !== passwordData.confirmPassword
              }
              helperText={
                passwordData.confirmPassword !== '' &&
                passwordData.newPassword !== passwordData.confirmPassword
                  ? 'Passwords do not match'
                  : ''
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          gap: 2, 
          borderTop: '1px solid #e0e0e0' 
        }}>
          <Button 
            onClick={() => setIsChangePasswordOpen(false)}
            sx={{
              borderColor: '#757575',
              color: '#757575',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                borderColor: '#616161',
                backgroundColor: 'rgba(117, 117, 117, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={
              isLoading ||
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword ||
              passwordData.newPassword !== passwordData.confirmPassword
            }
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};