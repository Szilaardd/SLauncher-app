import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';

// Navbar komponens
function Navbar() {
  const navStyle = {
    padding: '1rem 2rem',
    background: 'rgba(255 255 255 / 0.1)', // áttetsző, üveg hatás alapja lehet
    backdropFilter: 'blur(10px)', // blur, üveghatás
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    gap: '1.5rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const activeStyle = {
    fontWeight: 'bold',
    borderBottom: '2px solid white',
  };

  return (
    <nav style={navStyle}>
      <NavLink to="/" style={({ isActive }) => (isActive ? activeStyle : undefined)} end>
        Start
      </NavLink>
      <NavLink to="/library" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        Library
      </NavLink>
      <NavLink to="/news" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        News
      </NavLink>
      <NavLink to="/login" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        Login Admin
      </NavLink>
    </nav>
  );
}

// Start oldal, benne gomb az átirányításhoz
function Start() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>Welcome to SLauncher</h1>
      <p>This is your start page, where you can highlight games, offers, news and more.</p>
      <button
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          cursor: 'pointer',
          marginTop: '20px',
        }}
        onClick={() => navigate('/library')}
      >
        Go to Library
      </button>
    </div>
  );
}

// Library oldal (példa, ezt cseréld a sajátodra)
function Library() {
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>Library</h1>
      <p>Your game collection will appear here.</p>
    </div>
  );
}

// News oldal
function News() {
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>News</h1>
      <p>Latest news and updates.</p>
    </div>
  );
}

// Login Admin oldal
function Login() {
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>Admin Login</h1>
      <p>Restricted area for administrators.</p>
    </div>
  );
}

// App komponens
function App() {
  const appStyle = {
    minHeight: '100vh',
    background:
      'linear-gradient(135deg, rgba(25,25,112,1) 0%, rgba(72,61,139,1) 35%, rgba(123,104,238,1) 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  return (
    <Router>
      <div style={appStyle}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/library" element={<Library />} />
          <Route path="/news" element={<News />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
