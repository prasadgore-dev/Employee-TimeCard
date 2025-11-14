import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './styles/DashboardLayout.scss';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  AccessTime,
  EventNote,
  Assignment,
  Person,
  ExitToApp,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = window.innerWidth < 650;

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

  // Handle window resize to reset states appropriately
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 650) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const employeeMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Tasks', icon: <Assignment />, path: '/tasks' },
    { text: 'Leave Requests', icon: <EventNote />, path: '/leave' },
    { text: 'Timecard', icon: <AccessTime />, path: '/timecard' }, 
    { text: 'Profile', icon: <Person />, path: '/profile' },
  ];

  const managerMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/manager' },
    { text: 'Employee Status', icon: <Person />, path: '/manager/employee-status' },
    { text: 'Leave Approval', icon: <EventNote />, path: '/manager/leave-approval' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
  ];

  const adminMenuItems = [
    { text: 'Admin Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
  ];

  const menuItems = 
    user?.role === 'admin' ? adminMenuItems :
    user?.role === 'manager' ? managerMenuItems : 
    employeeMenuItems;

  const drawer = (
    <Box className="dashboard-layout__drawer-content">
      {/* Removed Employee Portal text from sidebar */}
      <Box className="dashboard-layout__drawer-nav">
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton 
                onClick={() => navigate(item.path)}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box className="dashboard-layout">
      <CssBaseline />
      <AppBar position="fixed" className={`dashboard-layout__app-bar ${!desktopOpen && !isMobile ? 'sidebar-closed' : ''}`}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            className="dashboard-layout__menu-button"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" className="dashboard-layout__title">
            Employee Portal
          </Typography>
          <Typography variant="h6" noWrap component="div" className="dashboard-layout__welcome">
            {user?.firstName ? `Welcome, ${user.firstName} ${user.lastName || ''}` : 'Welcome'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" className="dashboard-layout__drawer">
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true
          }}
          className="dashboard-layout__drawer-temporary"
          sx={{
            display: { sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 280,
              top: '64px',
              height: 'calc(100% - 64px)',
              backgroundColor: '#fff'
            },
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="persistent"
          className="dashboard-layout__drawer-permanent"
          open={desktopOpen}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              marginTop: '64px',
              height: 'calc(100% - 64px)',
              width: '280px'
            }
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        className={`dashboard-layout__main-content ${!desktopOpen && !isMobile ? 'sidebar-closed' : ''}`}
      >
        <Outlet />
      </Box>
    </Box>
  );
};