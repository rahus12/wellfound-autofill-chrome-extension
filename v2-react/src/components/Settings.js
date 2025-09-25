import React from 'react';
import SettingsForm from './SettingsForm';
import ResumeForm from './ResumeForm';

const Settings = ({ initialApiKey, onSave }) => {
  return (
    <div>
      <SettingsForm initialApiKey={initialApiKey} onSave={onSave} />
      <ResumeForm />
    </div>
  );
};

export default Settings;
