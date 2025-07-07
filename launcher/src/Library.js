import React, { useState, useEffect } from 'react';

// Mock electronAPI fejlesztéshez böngészőben
const electronAPI = window.electronAPI || {
  onDownloadProgress: () => {},
  onDownloadCompleted: () => {},
  downloadGame: (gameId) => console.log('Mock downloadGame:', gameId),
  openGame: (gameId) => console.log('Mock openGame:', gameId),
};

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
      // Itt le lehet törölni az event listener-eket, ha electronAPI támogatja
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

export default function Library() {
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
