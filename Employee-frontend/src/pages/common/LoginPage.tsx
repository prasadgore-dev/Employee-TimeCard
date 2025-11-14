import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import type { PodName } from '../../types/index';
import './styles/LoginPage.scss';

export const LoginPage = () => {
  const { login, signup, isAuthenticated, isLoading, error: authError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [podName, setPodName] = useState<PodName | ''>('');
  const [position, setPosition] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [podNames, setPodNames] = useState<string[]>([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Position options in alphabetical order
  const positions = [
    "Content OPS",
    "Developer",
    "DMT",
    "DMT Lead",
    "Principal Architect",
    "QA Lead",
    "Quality Analyst",
    "SDM",
    "Senior Developer",
    "Tech Architect",
    "Tech OPS"
  ];

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validateForm = () => {
    if (isSignup) {
      // Validate email domain
      const allowedDomains = ['@bajajfinserv.in', '@bizsupportc.com'];
      const emailDomain = email.substring(email.lastIndexOf('@'));
      if (!allowedDomains.includes(emailDomain)) {
        throw new Error('Email must be from @bajajfinserv.in or @bizsupportc.com domain');
      }

      // Validate required fields
      if (!employeeId.trim()) {
        throw new Error('Employee ID is required');
      }

      // Validate phone number (if provided)
      if (phone && !phone.match(/^\d{10}$/)) {
        throw new Error('Phone number must be 10 digits');
      }

      // Validate password length
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate POD Name
      if (!podName) {
        throw new Error('POD Name is required');
      }

      // Validate required fields
      if (!firstName.trim() || !lastName.trim() || !position.trim()) {
        throw new Error('All fields except phone are required');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    
    try {
      if (isSignup) {
        // Validate form before submission
        validateForm();
        
        // Format employeeId to ensure correct format
        const formattedEmployeeId = employeeId.toUpperCase();
        
        await signup({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          employeeId: formattedEmployeeId,
          podName: podName as PodName,
          position: position.trim(),
          phone: phone ? phone.trim() : undefined,
        });
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      let errorMessage: string;
      
      if (!isSignup) {
        // For login, only show simple "Invalid credentials" message
        errorMessage = 'Invalid credentials. Please try again.';
      } else {
        // For signup, show specific error messages
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else {
          errorMessage = 'Registration failed. Please try again.';
        }
      }
      
      setError(errorMessage);
      console.error('Auth error:', err);
    }
  };

  // Combine local error and auth error
  const displayError = error || authError;

  return (
    <Box className="login-page">
      <Container component="main" maxWidth="sm" className="login-page__container">
        <Paper elevation={0} className="login-page__card">
          <Box className="login-page__header">
            <Typography component="h1" variant="h4" className="login-page__title">
              {isSignup ? 'Create Account' : 'Employee Portal Login'}
            </Typography>
            <Typography variant="body2" className="login-page__subtitle">
              {isSignup ? 'Join our team today' : 'Welcome back! Please sign in to continue'}
            </Typography>
          </Box>
          
          {displayError && (
            <Alert severity="error" className="login-page__alert">
              {displayError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} className="login-page__form">
            {isSignup && (
              <>
                <Box className="login-page__name-fields">
                  <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="login-page__text-field"
                  />
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="login-page__text-field"
                  />
                </Box>
                <TextField
                  required
                  fullWidth
                  id="employeeId"
                  label="Employee ID"
                  name="employeeId"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  helperText="Enter a unique employee ID"
                  className="login-page__text-field"
                />
                <FormControl fullWidth required className="login-page__text-field">
                  <InputLabel id="pod-name-label">POD Name</InputLabel>
                  <Select
                    labelId="pod-name-label"
                    id="podName"
                    name="podName"
                    value={podName}
                    label="POD Name"
                    onChange={(e) => setPodName(e.target.value as PodName)}
                  >
                    {podNames.map((pod) => (
                      <MenuItem key={pod} value={pod}>
                        {pod}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select your POD assignment</FormHelperText>
                </FormControl>
                <FormControl fullWidth required className="login-page__text-field">
                  <InputLabel id="position-label">Position</InputLabel>
                  <Select
                    labelId="position-label"
                    id="position"
                    name="position"
                    value={position}
                    label="Position"
                    onChange={(e) => setPosition(e.target.value)}
                  >
                    {positions.map((pos) => (
                      <MenuItem key={pos} value={pos}>
                        {pos}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select your position</FormHelperText>
                </FormControl>
                <TextField
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  helperText="10 digits required"
                  error={phone !== '' && !phone.match(/^\d{10}$/)}
                  inputProps={{ maxLength: 10 }}
                  className="login-page__text-field"
                />
              </>
            )}
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus={!isSignup}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-page__text-field"
              helperText={isSignup ? "Must be @bajajfinserv.in or @bizsupportc.com" : ""}
            />
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-page__text-field"
              helperText={isSignup ? "Minimum 6 characters" : ""}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {isSignup && (
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="login-page__text-field"
                error={confirmPassword !== '' && password !== confirmPassword}
                helperText={
                  confirmPassword !== '' && password !== confirmPassword
                    ? 'Passwords do not match'
                    : 'Re-enter your password'
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              className="login-page__submit-button"
            >
              {isLoading ? (
                <Box className="login-page__loading">
                  <CircularProgress size={20} color="inherit" />
                  <span>{isSignup ? 'Creating Account...' : 'Signing in...'}</span>
                </Box>
              ) : (
                isSignup ? 'Sign Up' : 'Sign In'
              )}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => {
                setIsSignup(!isSignup);
                setConfirmPassword('');
                setShowPassword(false);
                setShowConfirmPassword(false);
                setError(null);
              }}
              className="login-page__toggle-button"
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};