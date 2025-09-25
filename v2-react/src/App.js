import React, { useState, useEffect } from 'react';
import Popup from './components/Popup';
import Options from './components/Options';

function App() {
  const [isOptionsPage, setIsOptionsPage] = useState(false);

  useEffect(() => {
    // Check if the current URL is the options page
    if (window.location.search.includes('page=options')) {
      setIsOptionsPage(true);
    }
  }, []);

  return (
    <div className="App">
      {isOptionsPage ? <Options /> : <Popup />}
    </div>
  );
}

export default App;