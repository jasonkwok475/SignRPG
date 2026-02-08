import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import SignRPG from './game';
import TitleScreen from './title';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isPlaying) {
    return <TitleScreen onStart={() => setIsPlaying(true)} />;
  }

  return <SignRPG />; // Your current component
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);