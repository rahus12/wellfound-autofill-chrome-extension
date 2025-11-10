import React, { useState, useEffect } from 'react';
import './SettingsForm.css';

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
    <div className="settings-form-container">
      <h2 className="settings-form-header">AI Summary Settings</h2>
      <div className="settings-form-group">
        <label htmlFor="api-key" className="settings-form-label">Gemini API Key:</label>
        <input
          type="text"
          id="api-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Gemini API key"
          className="settings-form-input"
        />
        <p>
          You can get an API key from{' '}
          <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer">
            Google AI Studio
          </a>
        </p>
      </div>
      <button onClick={handleSaveClick} className="settings-form-button">Save Settings</button>
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default SettingsForm;