// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
// import Home from './pages/Home';
import About from './pages/About';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/about" element={<About />} />
        <Route path="/landingpage" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;