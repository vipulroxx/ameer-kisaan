import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Container, Box, Typography, AppBar, Toolbar, Tabs, Tab, CircularProgress } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { FaCloudSun, FaLeaf, FaSeedling, FaBug, FaLandmark, FaWarehouse, FaComments, FaRobot, FaUserShield } from 'react-icons/fa';
import CropRecommendation from './Components/dashboard/CropRecommendation';
import CropSelection from './Components/dashboard/CropSelection';
import NavigationBar from './Components/dashboard/NavigationBar';
import WeatherCard from './Components/dashboard/WeatherCard';
import GovernmentSchemes from './Components/ecommerce/GovernmentSchemes';
import Forum from './Components/ecommerce/Forum';
import InventoryManagement from './Components/ecommerce/InventoryManagement';
import Profile from './Components/auth/Profile';
import Settings from './Components/auth/Settings';
import Registration from './Components/auth/Registration';
import Login from './Components/auth/Login';
import RiskClassification from './Components/risk_management/RiskClassification';
import IssueReports from './Components/risk_management/IssueReports';
import KisaanAssistant from './Components/collaboration/KisaanAssistant';
import HomePage from './Components/landing/HomePage';
import AdminPanel from './Components/admin/AdminPanel';
import { authApi, onSessionChange } from './Components/services/api';
import './App.css';

const Footer = () => (
  <AppBar position="fixed" color="primary" className='app-bar' sx={{ top: 'auto', bottom: 0 }}>
    <Toolbar>
      <Typography variant="body1" color="inherit" style={{ flexGrow: 1, textAlign: 'center' }}>
        Ameer Kisaan © {new Date().getFullYear()}. All Rights Reserved.
      </Typography>
    </Toolbar>
  </AppBar>
);

// One list drives both the tab bar and what is rendered, so labels and
// screens can never drift out of step again.
const TABS = [
  { key: 'weather', label: 'Weather', icon: <FaCloudSun className="icon" />, render: () => <WeatherCard /> },
  { key: 'crops', label: 'Crops', icon: <FaLeaf className="icon" />, render: () => <CropSelection /> },
  {
    key: 'recommendations', label: 'Recommendations', icon: <FaSeedling className="icon" />,
    render: () => <CropRecommendation soilType="Loam" landSize="2 acres" />,
  },
  {
    key: 'issues', label: 'Issues', icon: <FaBug className="icon" />,
    render: () => (<><IssueReports /><Box mt={4}><RiskClassification /></Box></>),
  },
  { key: 'assistant', label: 'Kisaan AI', icon: <FaRobot className="icon" />, render: () => <KisaanAssistant /> },
  { key: 'schemes', label: 'Schemes', icon: <FaLandmark className="icon" />, render: () => <GovernmentSchemes /> },
  { key: 'inventory', label: 'Inventory', icon: <FaWarehouse className="icon" />, render: () => <InventoryManagement /> },
  { key: 'forum', label: 'Community Forum', icon: <FaComments className="icon" />, render: () => <Forum /> },
];

// Only shown to admins; the API also refuses every admin call from anyone else.
const ADMIN_TAB = { key: 'admin', label: 'Admin', icon: <FaUserShield className="icon" />, render: () => <AdminPanel /> };
const tabsFor = (user) => (user && user.role === 'admin' ? [...TABS, ADMIN_TAB] : TABS);

const PAGES = ['profile', 'settings'];

// Navigation bar + footer around the login, registration and dashboard pages.
function Shell({ user, children }) {
  const navigate = useNavigate();
  const handleMenuSelect = async (menu) => {
    if (menu === 'Profile') navigate('/app/profile');
    else if (menu === 'Settings') navigate('/app/settings');
    else if (menu === 'Logout') {
      await authApi.logout().catch(() => {});
      navigate('/');
    }
  };
  return (
    <>
      <NavigationBar
        appName="Ameer Kisaan"
        onMenuSelect={handleMenuSelect}
        onHomeClick={() => navigate('/')}
        isAuthenticated={!!user}
      />
      <Container className="main-container">
        <Box position="relative" className="content-box">{children}</Box>
      </Container>
      <Footer />
    </>
  );
}

function AuthPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const notice = location.state?.notice || '';
  const goTo = (path) => { setError(''); navigate(path); };

  const handleLogin = async ({ email, password }) => {
    setError('');
    try {
      // No navigate() here: once the session updates `user`, GuestOnly sends
      // the user on to where they were going.
      await authApi.login(email, password);
    } catch (e) {
      setError(e.message || 'Login failed.');
    }
  };

  const handleRegister = async (userData) => {
    setError('');
    try {
      await authApi.register(userData);
      navigate('/login', { state: { notice: 'Account created. Please log in.' } });
    } catch (e) {
      setError(e.message || 'Registration failed.');
    }
  };

  return (
    <Box>
      {notice && mode === 'login' && <Typography color="primary" align="center" sx={{ mt: 1 }}>{notice}</Typography>}
      {mode === 'register' ? (
        <Registration onRegister={handleRegister} error={error} toggleForm={() => goTo('/login')} />
      ) : (
        <Login onLogin={handleLogin} error={error} toggleForm={() => goTo('/register')} />
      )}
    </Box>
  );
}

function Dashboard({ user }) {
  const { view } = useParams();
  const navigate = useNavigate();
  const [hoveredTab, setHoveredTab] = useState(null);

  const tabs = tabsFor(user);
  const tabIndex = tabs.findIndex((t) => t.key === view);
  if (tabIndex === -1 && !PAGES.includes(view)) return <Navigate to="/app/weather" replace />;
  const activeTab = tabs[tabIndex];

  return (
    <Box>
      <Box display="flex" justifyContent="center" mb={3}>
        <Tabs
          value={tabIndex === -1 ? false : tabIndex}
          onChange={(e, i) => navigate(`/app/${tabs[i].key}`)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((t, i) => (
            <Tab
              key={t.key}
              label={<>{t.icon} {t.label}</>}
              className={`tab ${hoveredTab === i ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredTab(i)}
              onMouseLeave={() => setHoveredTab(null)}
            />
          ))}
        </Tabs>
      </Box>
      <Box>
        {activeTab && activeTab.render()}
        {view === 'profile' && <Profile userDetails={user} />}
        {view === 'settings' && <Settings />}
      </Box>
    </Box>
  );
}

// Login/registration pages: once logged in, continue to the page the user
// originally asked for (or the dashboard).
function GuestOnly({ user, children }) {
  const location = useLocation();
  if (user) return <Navigate to={location.state?.from || '/app'} replace />;
  return children;
}

function RequireAuth({ user, children }) {
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  // Resume an existing session (HttpOnly refresh cookie) and react to expiry.
  useEffect(() => {
    const off = onSessionChange((u) => setUser(u));
    authApi.restore().finally(() => setRestoring(false));
    return off;
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {restoring ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>
      ) : (
        <Routes>
          <Route path="/" element={<HomePage isAuthenticated={!!user} />} />
          <Route path="/login" element={<GuestOnly user={user}><Shell user={user}><AuthPage mode="login" /></Shell></GuestOnly>} />
          <Route path="/register" element={<GuestOnly user={user}><Shell user={user}><AuthPage mode="register" /></Shell></GuestOnly>} />
          <Route path="/app" element={<Navigate to="/app/weather" replace />} />
          <Route path="/app/:view" element={<RequireAuth user={user}><Shell user={user}><Dashboard user={user} /></Shell></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </ThemeProvider>
  );
}

export default App;
