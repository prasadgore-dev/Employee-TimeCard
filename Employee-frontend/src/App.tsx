import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import { Provider } from 'react-redux';
import { store } from './features/store';
import { DashboardLayout } from './components/DashboardLayout';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';
import { LoginPage } from './pages/common/LoginPage';
import { ProfilePage } from './pages/employee/ProfilePage';
import { LeaveRequestScreen } from "./pages/employee/LeaveRequestScreen";
import { TaskManagementScreen } from "./pages/employee/TaskManagementScreen";
import { TimecardHistory } from "./pages/employee/TimecardHistory";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { EmployeeStatusPage } from "./pages/manager/EmployeeStatusPage";
import { LeaveApprovalPage } from "./pages/manager/LeaveApprovalPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";

// Date picker provider
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              {/* Role-based redirect for root path */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RoleBasedRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Dashboard Layout wrapper for all authenticated routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Employee Routes */}
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="timecard" element={<TimecardHistory />} />
                <Route path="leave" element={<LeaveRequestScreen />} />
                <Route path="tasks" element={<TaskManagementScreen />} />

                {/* Manager Routes */}
                <Route 
                  path="manager" 
                  element={
                    <ProtectedRoute requiredRole="manager">
                      <ManagerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="manager/employee-status"
                  element={
                    <ProtectedRoute requiredRole="manager">
                      <EmployeeStatusPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="manager/employee-status/:employeeId"
                  element={
                    <ProtectedRoute requiredRole="manager">
                      <EmployeeStatusPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="manager/leave-approval"
                  element={
                    <ProtectedRoute requiredRole="manager">
                      <LeaveApprovalPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
