/*global chrome*/
import React, { useState, useEffect } from 'react';
import './ResumeForm.css';

const ResumeForm = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [resumeName, setResumeName] = useState(null);
  const [resumeContent, setResumeContent] = useState(null);

  useEffect(() => {
    chrome.storage.local.get(['resumeName'], (result) => {
      if (result.resumeName) {
        setResumeName(result.resumeName);
      }
    });
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeContent(event.target.result);
        setResumeName(file.name);
      };
      reader.readAsText(file);
    } else {
        setSuccessMessage('Please select a .txt file.');
        setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleResumeUpload = () => {
    if (resumeContent && resumeName) {
      chrome.storage.local.set({ resumeContent, resumeName }, () => {
        setSuccessMessage('Resume uploaded successfully!');
        setTimeout(() => setSuccessMessage(''), 2000);
      });
    }
  };

  const handleResumeRemove = () => {
    chrome.storage.local.remove(['resumeContent', 'resumeName'], () => {
      setResumeName(null);
      setResumeContent(null);
      const fileInput = document.getElementById('resume-upload');
      if(fileInput) fileInput.value = '';
      setSuccessMessage('Resume removed successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    });
  };

  return (
    <div className="resume-form-container">
      <hr style={{ margin: '20px 0' }} />
      <h2 className="resume-form-header">Resume Management</h2>
      <div className="resume-form-group">
        <label htmlFor="resume-upload" className="resume-form-label">Upload Resume (.txt only):</label>
        <input type="file" id="resume-upload" accept=".txt" onChange={handleFileChange} className="resume-form-input"/>
      </div>
      {resumeName && <p>Current resume: {resumeName}</p>}
      <button onClick={handleResumeUpload} className="resume-form-button">Upload Resume</button>
      {resumeName && <button onClick={handleResumeRemove} className="resume-form-button remove-button">Remove Resume</button>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default ResumeForm;
