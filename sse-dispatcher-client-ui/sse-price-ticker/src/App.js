import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import PriceTicker from './PriceTicker';
import theme from './theme';
import './App.css';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <div className="App">
                <header className="App-header">
                    <PriceTicker />
                </header>
            </div>
        </ThemeProvider>
    );
}

export default App;

