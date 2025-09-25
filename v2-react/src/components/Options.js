/*global chrome*/
import React, { useState, useEffect } from 'react';
import Settings from './Settings';

const Options = () => {
  const [initialApiKey, setInitialApiKey] = useState('');

  useEffect(() => {
    // For the options page, we also need to get the API key for the SettingsForm
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        setInitialApiKey(result.geminiApiKey);
      }
    });
  }, []);

  const handleSave = (newApiKey) => {
    chrome.storage.sync.set({ geminiApiKey: newApiKey }, () => {
      // Optional: add a success message or close the window
      // The SettingsForm already shows a message, so we might not need more here.
    });
  };

  return <Settings initialApiKey={initialApiKey} onSave={handleSave} />;
};

export default Options;