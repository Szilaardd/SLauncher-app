import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom'; // ✅ HashRouter!

// Mock electronAPI, ha nincs definiálva (fejlesztéshez böngészőben)
const electronAPI = window.electronAPI || {
  onDownloadProgress: () => {},
  onDownloadCompleted: () => {},
  downloadGame: (gameId) => console.log('Mock downloadGame:', gameId),
  openGame: (gameId) => console.log('Mock openGame:', gameId),
};


function Navbar() {
  const navStyle = {
    padding: '1rem 2rem',
    background: 'rgba(255 255 255 / 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    gap: '1.5rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const linkStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    color: 'white',
    textDecoration: 'none',
    fontWeight: '600',
    background: 'rgba(123, 104, 238, 0.6)',
    boxShadow: '0 4px 15px rgba(123,104,238,0.5)',
    transition: 'background-color 0.3s ease',
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: 'rgba(123, 104, 238, 0.9)',
    boxShadow: '0 6px 20px rgba(123,104,238,0.8)',
  };

  return (
    <nav style={navStyle}>
      <NavLink to="/" end style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        Start
      </NavLink>
      <NavLink to="/library" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        Library
      </NavLink>
      <NavLink to="/news" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        News
      </NavLink>
      <NavLink to="/login" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        Login Admin
      </NavLink>
    </nav>
  );
}

function ProgressBar({ progress }) {
  return (
    <div
      style={{
        height: '8px',
        width: '100%',
        background: 'rgba(255 255 255 / 0.2)',
        borderRadius: '4px',
        marginTop: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          background: 'rgba(123, 104, 238, 0.8)',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

function GameCard({ game }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onProgress(data) {
      if (data.gameId === game.id) {
        setProgress(data.progress);
      }
    }

    function onCompleted(gameId) {
      if (gameId === game.id) {
        setDownloading(false);
        setInstalled(true);
        setProgress(100);
      }
    }

    electronAPI.onDownloadProgress(onProgress);
    electronAPI.onDownloadCompleted(onCompleted);

    return () => {
      // ha támogatott, itt törölheted az eventeket
    };
  }, [game.id]);

  const handleDownload = () => {
    if (installed) return alert(`${game.title} már telepítve van!`);
    setDownloading(true);
    setProgress(0);
    electronAPI.downloadGame(game.id);
  };

  const handleOpenGame = () => {
    if (!installed) return alert('Előbb le kell töltened a játékot!');
    electronAPI.openGame(game.id);
  };

  const cardStyle = {
    background: 'rgba(255 255 255 / 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    color: 'white',
    padding: '1rem',
    maxWidth: '320px',
    margin: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const btnStyle = {
    background: 'rgba(123, 104, 238, 0.7)',
    border: 'none',
    padding: '0.5rem 1.2rem',
    margin: '0.5rem',
    borderRadius: '10px',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.3s ease',
  };

  const btnDisabledStyle = {
    ...btnStyle,
    background: 'rgba(100, 100, 100, 0.5)',
    cursor: 'not-allowed',
  };

  return (
    <div style={cardStyle}>
      <h3>{game.title}</h3>
      <img
        src={game.image}
        alt={game.title}
        style={{ width: '100%', borderRadius: '10px', marginBottom: '0.7rem' }}
      />
      <p>{game.description}</p>
      <small>Engine: {game.engine}</small>
      <h6>{game.version}</h6>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        <button
          style={downloading || installed ? btnDisabledStyle : btnStyle}
          onClick={handleDownload}
          disabled={downloading || installed}
        >
          {installed ? 'Installed' : downloading ? 'Downloading...' : 'Download'}
        </button>
        <button
          style={installed ? btnStyle : btnDisabledStyle}
          onClick={handleOpenGame}
          disabled={!installed}
        >
          Open Game
        </button>
      </div>
      {downloading && <ProgressBar progress={progress} />}
    </div>
  );
}

function Library() {
  const games = [
    {
      id: 'fm',
      title: 'Fantasztikus Márkó',
      image: './screenshots/fm1.png',
      description: 'Just a simple platformer game',
      engine: 'Gdevelop',
      version: 'V1.2.1',
    },
    {
      id: 'sfe',
      title: 'Spidey - Flies eater',
      image: './screenshots/sfe1.png',
      description: 'Catch all the flies in a short time!!',
      engine: 'Gdevelop',
      version: 'V1.0',
    },
    {
      id: 'jt',
      title: 'Jump Together',
      image: './screenshots/jt1.png',
      description: 'Jump and collect all of apple!',
      engine: 'Gdevelop',
      version: 'V1.0',
    },
    {
      id: 'ss',
      title: 'Project SS',
      image: './screenshots/ss1.png',
      description: 'Escape from the Unidentified Monsters across 4 dimension',
      engine: 'Unreal Engine 5.6',
      version: 'V1.0',
    },
  ];

  return (
    <div
      style={{
        padding: '2rem',
        color: 'white',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1rem',
      }}
    >
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}

function Start() {
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>Welcome to SLauncher</h1>
      <p>This is your start page, where you can highlight games, offers, news and more.</p>
    </div>
  );
}

function News() {
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>News</h1>
      <p>Latest news and updates.</p>
    </div>
  );
}

function Login() {
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>Admin Login</h1>
      <p>Restricted area for administrators.</p>
    </div>
  );
}

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
