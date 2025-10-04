import React from 'react';

function AppSimple() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Atem Test</h1>
      <p>If you can see this, React is working!</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}

export default AppSimple;
