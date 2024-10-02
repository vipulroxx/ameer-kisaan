import React, { useState, useEffect } from 'react';
import { Container, Tab, Tabs, Box, Typography, AppBar, Toolbar } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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
import { FaCloudSun, FaLeaf, FaSeedling, FaTractor, FaLandmark, FaWarehouse, FaShoppingCart, FaBook } from 'react-icons/fa';
import logoImage from './Components/farmerapplogo.png';

const theme = createTheme({
  palette: {
    primary: { main: '#2196F3' },
    secondary: { main: '#8BC34A' },
    background: { default: '#F5F5DC' },
    text: { primary: '#333333' },
  },
});

const Footer = () => (
  <AppBar position="fixed" style={{ top: 'auto', bottom: 0, backgroundColor: theme.palette.primary.main }}>
    <Toolbar>
      <Typography variant="body1" color="inherit" style={{ flexGrow: 1, textAlign: 'center' }}>
        Ameer Kisaan © {new Date().getFullYear()}. All Rights Reserved.
      </Typography>
    </Toolbar>
  </AppBar>
);

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [currentTab, setCurrentTab] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
    setCurrentTab(null);
  };

  const handleMenuSelect = (menu) => {
    if (menu === 'Profile') {
      setCurrentTab('Profile');
    } else if (menu === 'Settings') {
      setCurrentTab('Settings');
    } else if (menu === 'Logout') {
      handleLogout();
    }
  };

  const handleLogout = () => {
    console.log('User logged out');
    // Clear user session here
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Fetch data logic
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <NavigationBar appName="Ameer Kisaan" onMenuSelect={handleMenuSelect} />
      <Box component="img" src={logoImage} alt="Logo" sx={{ position: 'absolute', top: 70, left: 0, width: '100px', zIndex: 1 }} />
      <Container style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '64px' }}>
        <Box position="relative" style={{ flex: 1 }}>
          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : (
            <>
              <Box display="flex" justifyContent="center" mb={3}>
                <Tabs value={activeTab} onChange={handleChange} variant="scrollable" scrollButtons="auto">
                  <Tab label={<><FaCloudSun /> Weather</>} />
                  <Tab label={<><FaLeaf /> Crops</>} />
                  <Tab label={<><FaSeedling /> Recommendations</>} />
                  <Tab label={<><FaTractor /> Pests</>} />
                  <Tab label={<><FaLandmark /> Schemes</>} />
                  <Tab label={<><FaWarehouse /> Inventory</>} />
                  <Tab label={<><FaShoppingCart /> Market</>} />
                  <Tab label={<><FaBook /> Community Forum</>} />
                </Tabs>
              </Box>
              <Box>
                {currentTab === 'Profile' && <Profile />}
                {currentTab === 'Settings' && <Settings />}
                {activeTab === 0 && !currentTab && <WeatherCard />}
                {activeTab === 1 && !currentTab && <CropSelection />}
                {activeTab === 2 && !currentTab && <CropRecommendation soilType="Loam" landSize="2 acres" />}
                {activeTab === 3 && !currentTab && <PestDetection />}
                {activeTab === 4 && !currentTab && <GovernmentSchemes />}
                {activeTab === 5 && !currentTab && <InventoryManagement />}
                {activeTab === 6 && !currentTab && <MarketPrices />}
                {activeTab === 7 && !currentTab && <Forum />}
              </Box>
            </>
          )}
        </Box>
      </Container>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
