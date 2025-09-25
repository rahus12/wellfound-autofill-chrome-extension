/*global chrome*/
import React, { useState, useEffect } from 'react';
import SettingsForm from './SettingsForm';

const Options = () => {
  const [initialApiKey, setInitialApiKey] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        setInitialApiKey(result.geminiApiKey);
      }
    });
  }, []);

  const handleSave = (newApiKey) => {
    chrome.storage.sync.set({ geminiApiKey: newApiKey }, () => {
      setTimeout(() => {
        window.close();
      }, 1000);
    });
  };

  return <SettingsForm initialApiKey={initialApiKey} onSave={handleSave} />;
};

export default Options;
