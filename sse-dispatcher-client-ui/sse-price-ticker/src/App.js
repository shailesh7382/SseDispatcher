// src/App.js
import React from 'react';
import PriceTicker from './PriceTicker';
import './App.css';

function App() {
  return (
      <div className="App">
        <header className="App-header">
          <PriceTicker userId="user123" />
        </header>
      </div>
  );
}

export default App;