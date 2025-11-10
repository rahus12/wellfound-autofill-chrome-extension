import React from 'react';
import SettingsForm from './SettingsForm';
import ResumeForm from './ResumeForm';
import './Settings.css';

const Settings = ({ initialApiKey, onSave, onBack }) => {
  return (
    <div className="settings-container">
      <button className="back-button" onClick={onBack}>Back</button>
      <h1 className="settings-header">Settings</h1>
      <SettingsForm initialApiKey={initialApiKey} onSave={onSave} />
      <ResumeForm />
    </div>
  );
};

export default Settings;
