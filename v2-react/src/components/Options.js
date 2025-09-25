/*global chrome*/
import React, { useState, useEffect } from 'react';

const Options = () => {
  const [apiKey, setApiKey] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        setApiKey(result.geminiApiKey);
      }
    });
  }, []);

  const handleSave = () => {
    if (apiKey) {
      chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          window.close();
        }, 1000);
      });
    }
  };

  return (
    <div>
      <h1>AI Summary Settings</h1>
      <div className="form-group">
        <label htmlFor="api-key">Gemini API Key:</label>
        <input
          type="text"
          id="api-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Gemini API key"
        />
        <p>
          You can get an API key from{' '}
          <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer">
            Google AI Studio
          </a>
        </p>
      </div>
      <button onClick={handleSave}>Save Settings</button>
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default Options;