import React, { useState } from 'react';
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
import Settings from './Components/auth/Settings'; // Update the path for Settings
import { FaCloudSun, FaLeaf, FaSeedling, FaTractor, FaLandmark, FaWarehouse, FaShoppingCart, FaBook } from 'react-icons/fa';
import logoImage from './Components/farmerapplogo.png';

const theme = createTheme({
  palette: {
    primary: { main: '#2196F3' }, // Sky Blue
    secondary: { main: '#8BC34A' }, // Lime Green
    background: { default: '#F5F5DC' }, // Light Beige
    text: { primary: '#333333' }, // Dark Charcoal
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
  const [value, setValue] = useState(0);
  const [currentTab, setCurrentTab] = useState(null);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    setCurrentTab(null); // Reset currentTab when switching to tab
  };

  const handleMenuSelect = (menu) => {
    if (menu === 'Profile') {
      setCurrentTab('Profile');
    } else if (menu === 'Settings') {
      setCurrentTab('Settings');
    } else if (menu === 'Logout') {
      // Handle logout logic here
      console.log('Logout');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <NavigationBar appName="Ameer Kisaan" onMenuSelect={handleMenuSelect} />
      {/* Absolute positioned logo image */}
      <Box
        component="img"
        src={logoImage}
        alt="Logo"
        sx={{
          position: 'absolute',
          top: 70,
          left: 10,
          width: '120px', // Adjust size as needed
          height: 'auto',
          zIndex: 1,
          border: 'none'
        }}
      />
      {/* Container for the main content */}
      <Container style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '64px' }}>
        <Box position="relative" style={{ flex: 1 }}>
          <Box display="flex" justifyContent="center" mb={3}>
            <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto">
              <Tab label={<><FaCloudSun style={{ marginRight: 5 }} /> Weather</>} />
              <Tab label={<><FaLeaf style={{ marginRight: 5 }} /> Crops</>} />
              <Tab label={<><FaSeedling style={{ marginRight: 5 }} /> Recommendations</>} />
              <Tab label={<><FaTractor style={{ marginRight: 5 }} /> Pests</>} />
              <Tab label={<><FaLandmark style={{ marginRight: 5 }} /> Schemes</>} />
              <Tab label={<><FaWarehouse style={{ marginRight: 5 }} /> Inventory</>} />
              <Tab label={<><FaShoppingCart style={{ marginRight: 5 }} /> Market</>} />
              <Tab label={<><FaBook style={{ marginRight: 5 }} /> Community Forum</>} />
            </Tabs>
          </Box>

          {/* Main Content */}
          <Box>
            {currentTab === 'Profile' && <Profile />}
            {currentTab === 'Settings' && <Settings />}
            {value === 0 && !currentTab && <WeatherCard />}
            {value === 1 && !currentTab && <CropSelection />}
            {value === 2 && !currentTab && <CropRecommendation soilType="Loam" landSize="2 acres" />}
            {value === 3 && !currentTab && <PestDetection />}
            {value === 4 && !currentTab && <GovernmentSchemes />}
            {value === 5 && !currentTab && <InventoryManagement />}
            {value === 6 && !currentTab && <MarketPrices />}
            {value === 7 && !currentTab && <Forum />}
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Footer />
    </ThemeProvider>
  );
}

export default App;
