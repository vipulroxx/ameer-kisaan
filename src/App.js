import React, { useState } from 'react';
import { Container, Box, Typography, AppBar, Toolbar, Tabs, Tab } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { FaCloudSun, FaLeaf, FaSeedling, FaBug, FaLandmark, FaWarehouse, FaShoppingCart, FaBook } from 'react-icons/fa';
import CropRecommendation from './Components/dashboard/CropRecommendation';
import CropSelection from './Components/dashboard/CropSelection';
import NavigationBar from './Components/dashboard/NavigationBar';
import WeatherCard from './Components/dashboard/WeatherCard';
import MarketPrices from './Components/ecommerce/MarketPrices';
import GovernmentSchemes from './Components/ecommerce/GovernmentSchemes';
import Forum from './Components/ecommerce/Forum';
import InventoryManagement from './Components/ecommerce/InventoryManagement';
import Profile from './Components/auth/Profile';
import Settings from './Components/auth/Settings';
import Registration from './Components/auth/Registration';
import Login from './Components/auth/Login';
import RiskClassification from './Components/risk_management/RiskClassification';
import './App.css';

const theme = createTheme({
  palette: {
    primary: { main: '#2196F3' },
    secondary: { main: '#8BC34A' },
    background: { default: '#F5F5DC' },
    text: { primary: '#333333' },
  },
});

const Footer = () => (
  <AppBar position="fixed" className='app-bar' style={{ top: 'auto', bottom: 0, backgroundColor: theme.palette.primary.main }}>
    <Toolbar>
      <Typography variant="body1" color="inherit" style={{ flexGrow: 1, textAlign: 'center' }}>
        Ameer Kisaan © {new Date().getFullYear()}. All Rights Reserved.
      </Typography>
    </Toolbar>
  </AppBar>
);

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [currentForm, setCurrentForm] = useState('login');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleMouseEnter = (index) => {
    setHoveredTab(index);
  };

  const handleMouseLeave = () => {
    setHoveredTab(null);
  };

  const handleMenuSelect = (menu) => {
    if (menu === 'Profile') {
      setCurrentTab(7);
    } else if (menu === 'Settings') {
      setCurrentTab(8);
    } else if (menu === 'Logout') {
      handleLogout();
    }
  };

  // Save user to localStorage (keyed by email)
  const handleRegister = async (userData) => {
    setLoading(true);
    setRegisterError('');
    try {
      // Normalize email and password
      const normalizedEmail = userData.email.trim().toLowerCase();
      const normalizedPassword = userData.password.trim();
      const userWithType = {
        ...userData,
        email: normalizedEmail,
        password: normalizedPassword,
        userType: userData.userType || 'Farmer',
      };
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[normalizedEmail]) {
        setRegisterError('User with this email already exists.');
        setLoading(false);
        return;
      }
      users[normalizedEmail] = userWithType;
      localStorage.setItem('users', JSON.stringify(users));
      setCurrentForm('login');
    } catch (error) {
      setRegisterError('Registration failed.');
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate login against localStorage
  const handleLogin = async (credentials) => {
    setLoading(true);
    setLoginError('');
    try {
      // Normalize email and password
      const normalizedEmail = credentials.email.trim().toLowerCase();
      const normalizedPassword = credentials.password.trim();
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const user = users[normalizedEmail];
      if (user && user.password === normalizedPassword) {
        setIsAuthenticated(true);
        setUserDetails(user);
        setLoginError('');
      } else {
        setLoginError('Invalid email or password.');
        setIsAuthenticated(false);
      }
    } catch (error) {
      setLoginError('Login failed.');
      setIsAuthenticated(false);
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserDetails(null);
    setCurrentTab(0);
  };

  // Toggle between login and register forms
  const toggleForm = () => {
    setCurrentForm(prevForm => (prevForm === 'register' ? 'login' : 'register'));
    setLoginError('');
    setRegisterError('');
  };

  return (
    <ThemeProvider theme={theme}>
      <NavigationBar 
        appName="Ameer Kisaan" 
        onMenuSelect={handleMenuSelect} 
        onHomeClick={() => setCurrentTab(0)} 
        isAuthenticated={isAuthenticated} 
      />
      <Container className="main-container">
        <Box position="relative" className="content-box">
          {isAuthenticated ? (
            <Box>
              <Box display="flex" justifyContent="center" mb={3}>
                <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                  <Tab 
                    label={<><FaCloudSun className="icon" /> Weather</>} 
                    className={`tab ${hoveredTab === 0 ? 'hovered' : ''}`} 
                    onMouseEnter={() => handleMouseEnter(0)}
                    onMouseLeave={handleMouseLeave}
                  />
                  <Tab 
                    label={<><FaLeaf className="icon" /> Crops</>} 
                    className={`tab ${hoveredTab === 1 ? 'hovered' : ''}`} 
                    onMouseEnter={() => handleMouseEnter(1)}
                    onMouseLeave={handleMouseLeave}
                  />
                  <Tab 
                    label={<><FaSeedling className="icon" /> Recommendations</>} 
                    className={`tab ${hoveredTab === 2 ? 'hovered' : ''}`} 
                    onMouseEnter={() => handleMouseEnter(2)}
                    onMouseLeave={handleMouseLeave}
                  />
                  <Tab 
                    label={<><FaBug className="icon" /> Issues</>} 
                    className={`tab ${hoveredTab === 3 ? 'hovered' : ''}`} 
                    onMouseEnter={() => handleMouseEnter(3)}
                    onMouseLeave={handleMouseLeave}
                  />
                  <Tab 
                    label={<><FaLandmark className="icon" /> Schemes</>} 
                    className={`tab ${hoveredTab === 4 ? 'hovered' : ''}`} 
                    onMouseEnter={() => handleMouseEnter(4)}
                    onMouseLeave={handleMouseLeave}
                  />
                  <Tab 
                    label={<><FaWarehouse className="icon" /> Inventory</>} 
                    className={`tab ${hoveredTab === 5 ? 'hovered' : ''}`} 
                    onMouseEnter={() => handleMouseEnter(5)}
                    onMouseLeave={handleMouseLeave}
                  />
                  <Tab 
                    label={<><FaShoppingCart className="icon" /> Community Market</>} 
                    className={`tab ${hoveredTab === 7 ? 'hovered' : ''}`} 
                    onMouseEnter={() => handleMouseEnter(7)}
                    onMouseLeave={handleMouseLeave}
                  />
                </Tabs>
              </Box>
              <Box>
                {currentTab === 0 && <WeatherCard />}
                {currentTab === 1 && <CropSelection />}
                {currentTab === 2 && <CropRecommendation soilType="Loam" landSize="2 acres" />}
                {currentTab === 3 && <RiskClassification />}
                {currentTab === 4 && <GovernmentSchemes />}
                {currentTab === 5 && <InventoryManagement />}
                {currentTab === 6 && <Forum />}
                {currentTab === 7 && <Profile userDetails={userDetails} />}
                {currentTab === 8 && <Settings />}
              </Box>
            </Box>
          ) : (
            <Box>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : currentForm === 'register' ? (
                <Registration onRegister={handleRegister} error={registerError} toggleForm={toggleForm} />
              ) : (
                <Login onLogin={handleLogin} error={loginError} toggleForm={toggleForm} />
              )}
            </Box>
          )}
        </Box>
      </Container>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
