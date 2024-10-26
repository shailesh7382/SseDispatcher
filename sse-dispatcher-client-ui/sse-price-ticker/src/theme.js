// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Blue
        },
        secondary: {
            main: '#dc004e', // Red
        },
        background: {
            default: '#f5f5f5', // Light grey
        },
    },
    typography: {
        h4: {
            fontWeight: 600,
        },
        body1: {
            fontSize: '1.1rem',
        },
    },
});

export default theme;