/*global chrome*/
import React, { useState, useEffect } from 'react';

const SettingsForm = ({ initialApiKey, onSave }) => {
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setApiKey(initialApiKey || '');
  }, [initialApiKey]);

  const handleSaveClick = () => {
    if (apiKey) {
      onSave(apiKey);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 2000);
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
      <button onClick={handleSaveClick}>Save Settings</button>
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default SettingsForm;
