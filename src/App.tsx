import React from 'react';
import Index from './page/index';

const App: React.FC = () => {
  return (
    <div
      className="App"
      style={{
        height: window.innerHeight,
        width: window.innerWidth,
        overflow: 'hidden'
      }}
    >
      <Index></Index>
    </div>
  );
};

export default App;
