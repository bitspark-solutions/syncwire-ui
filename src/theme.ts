'use client';
import { createTheme } from '@mui/material/styles';

// SyncWire brand: indigo primary, teal accent. CSS variables + a `data-*`
// selector keep SSR hydration flash-free with the App Router.
const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#4f46e5' },
        secondary: { main: '#0d9488' },
        background: { default: '#f8fafc' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#818cf8' },
        secondary: { main: '#2dd4bf' },
        background: { default: '#0b1120', paper: '#111827' },
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
});

export default theme;
