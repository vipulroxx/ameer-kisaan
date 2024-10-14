import React, { useState } from 'react';
import { Container, Box, Typography, AppBar, Toolbar, Button, Tabs, Tab } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { FaCloudSun, FaLeaf, FaSeedling, FaTractor, FaLandmark, FaWarehouse, FaShoppingCart, FaBook } from 'react-icons/fa';
import CropRecommendation from './Components/dashboard/CropRecommendation';
import CropSelection from './Components/dashboard/CropSelection';
import NavigationBar from './Components/dashboard/NavigationBar';
import WeatherCard from './Components/dashboard/WeatherCard';
import MarketPrices from './Components/ecommerce/MarketPrices';
import PestDetection from './Components/risk_management/PestDetection';
import GovernmentSchemes from './Components/ecommerce/GovernmentSchemes';
import Forum from './Components/ecommerce/Forum';
import InventoryManagement from './Components/ecommerce/InventoryManagement';
import Profile from './Components/auth/Profile';
import Settings from './Components/auth/Settings';
import Registration from './Components/auth/Registration';
import Login from './Components/auth/Login';
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
  const [hoveredTab, setHoveredTab] = useState(null); // State for hovered tab
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [currentForm, setCurrentForm] = useState('login');
  const [loading, setLoading] = useState(false);

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
      setCurrentTab(8); // Profile tab index
    } else if (menu === 'Settings') {
      setCurrentTab(9); // Settings tab index
    } else if (menu === 'Logout') {
      handleLogout();
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    try {
      console.log("Registered User Data: ", userData);
      setUserDetails(userData);
      setIsAuthenticated(true);
      setCurrentForm('login');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      console.log('Logged in with:', credentials);
      setIsAuthenticated(true);
      setUserDetails(credentials);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserDetails(null);
    setCurrentTab(0); // Reset to first tab on logout
  };

  const toggleForm = () => {
    setCurrentForm(prevForm => (prevForm === 'register' ? 'login' : 'register'));
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
                    label={<><FaTractor className="icon" /> Pests</>} 
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
                    label={<><FaShoppingCart className="icon" /> Market</>} 
                    className={`tab ${hoveredTab === 6 ? 'hovered' : ''}`} 
                    onMouseEnter={() => handleMouseEnter(6)}
                    onMouseLeave={handleMouseLeave}
                  />
                  <Tab 
                    label={<><FaBook className="icon" /> Community Forum</>} 
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
                {currentTab === 3 && <PestDetection />}
                {currentTab === 4 && <GovernmentSchemes />}
                {currentTab === 5 && <InventoryManagement />}
                {currentTab === 6 && <MarketPrices />}
                {currentTab === 7 && <Forum />}
                {currentTab === 8 && <Profile userDetails={userDetails} />}
                {currentTab === 9 && <Settings />}
              </Box>
            </Box>
          ) : (
            <Box>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : currentForm === 'register' ? (
                <Registration onRegister={handleRegister} />
              ) : (
                <Login onLogin={handleLogin} />
              )}
              <Button variant="outlined" onClick={toggleForm} style={{ marginTop: '16px' }}>
                {currentForm === 'register' ? 'Already have an account? Login' : 'Need an account? Register'}
              </Button>
            </Box>
          )}
        </Box>
      </Container>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
