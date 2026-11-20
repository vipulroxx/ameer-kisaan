import { createTheme } from '@mui/material/styles';

// One theme for the whole app (homepage and dashboard): farm green + harvest gold.
const theme = createTheme({
  palette: {
    primary: { main: '#1f4d2b', light: '#2e6b3c', dark: '#163a20', contrastText: '#ffffff' },
    secondary: { main: '#e3a51f', light: '#f0b632', dark: '#b9820f', contrastText: '#1b1300' },
    background: { default: '#fbf7ec', paper: '#ffffff' },
    text: { primary: '#1d2a1f', secondary: '#4f5d52' },
    divider: '#e7e0cc',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Roboto', 'Noto Sans Devanagari', Arial, sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, minHeight: 44, paddingLeft: 20, paddingRight: 20 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid #e7e0cc', borderRadius: 16 } },
    },
    MuiAppBar: { defaultProps: { elevation: 0 } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
  },
});

export default theme;
