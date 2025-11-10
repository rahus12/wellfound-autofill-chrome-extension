/*global chrome*/
import React, { useState, useEffect } from 'react';
import Settings from './Settings';
import './Popup.css';

const Popup = () => {
  const [apiKey, setApiKey] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        setApiKey(result.geminiApiKey);
      } else {
        setShowSettings(true);
      }
    });
  }, []);

  const handleAutofill = async () => {
    const { resumeContent } = await chrome.storage.local.get('resumeContent');
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
        // Step 1: Execute extractData on the active tab to get the job description.
        const extractionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractAllTextData
        });
    
        const extractedJobData = extractionResults[0].result;

        // Step 2: Now that data is extracted, run a new script to click the button.
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: clickApply
        });

        // Step 3: Get the question
        let question = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractQuestion
        });

        const extractedQuestion = question[0].result;

        // Step 4: Get the required answer from Gemini
        let geminiResponse = await generateResponse(extractedJobData, extractedQuestion, apiKey, resumeContent);
        const geminiText = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

        // Step 5: Input the answer in the text area
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: writeResponse,
            args: [geminiText]
        });

    } catch (error) {
        console.error("Failed to execute script:", error);
    }
  };

  const handleSaveApiKey = (newApiKey) => {
    chrome.storage.sync.set({ geminiApiKey: newApiKey }, () => {
      setApiKey(newApiKey);
      setShowSettings(false);
    });
  };

  const handleBack = () => {
    setShowSettings(false);
  };

  if (showSettings) {
    return <Settings initialApiKey={apiKey} onSave={handleSaveApiKey} onBack={handleBack} />;
  }

  return (
    <div className="popup-container">
      <div className="popup-header-container">
        <img src={chrome.runtime.getURL('icon.png')} alt="logo" className="logo" />
        <h1 className="popup-title">Nah,Fr</h1>
      </div>
      <div className="main-content">
        <p className="popup-header">Click to Summarise page and autofill message</p>
        <div className="button-container">
          <button className="popup-button" onClick={handleAutofill}>🤖 Autofill</button>
          <button className="popup-button" onClick={() => setShowSettings(true)}>⚙️ Settings</button>
        </div>
      </div>
    </div>
  );
};

// These functions are injected into the page, so they need to be self-contained.

async function extractAllTextData() {
  const extractedText = [];

  // Check if current page is an Ashby application page
  const currentUrl = window.location.href;
  const isAshby = currentUrl.includes('ashbyhq.com') && currentUrl.includes('application');

  // If it's an Ashby application page, fetch the overview page instead
  // this is a bad way because there is toooo much content in html
  if (isAshby) {
    try {
      const overviewUrl = currentUrl.replace(/\/?application\/?$/, '');
      const response = await fetch(overviewUrl, { credentials: 'include' });
      const htmlText = await response.text();

      const lines = htmlText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0); // remove empty lines

  return lines;
      
    } catch (err) {
      console.error('Error fetching Ashby overview page:', err);
    }
  } else {
    // Regular case: extract from current document
    const elements = document.querySelectorAll('h1, h2, h3, p, strong, li');
    elements.forEach(el => {
      const text = el.textContent.trim();
      if (text) extractedText.push(text);
    });
  }

  return extractedText;
}

function clickApply(){
    const url = window.location.href;
    let buttons;
    let applyButton;
    if (url.includes("wellfound")){
         buttons = document.querySelectorAll('button');
    } else if (url.includes("workatastartup")){
         buttons = document.querySelectorAll('a');
    }

    else{
      return;
    }

    buttons.forEach(button => {
        if (button.textContent.trim().toLowerCase() === "apply"){
            applyButton = button;
        }
    });

    if (applyButton){
        applyButton.click();
    } else {
        console.log("could not find the apply button");
    }
}

function extractQuestion(){
    let textArea = document.querySelector('textarea');
    let question = textArea.previousElementSibling?.textContent || textArea.parentElement?.previousElementSibling?.textContent ||'';
    
    // console.log("Question: " +question)
    return question;
}

async function generateResponse(data, question, apiKey, resumeContent){
    const jobData = JSON.stringify(data);

    const resumePrompt = resumeContent 
      ? `Use the following resume for context: ${resumeContent}`
      : 'There is no resume provided.';

    const fullPrompt = `${resumePrompt}
    \n\nYOU are a Bot that Mimics a human to Answer application questions, You are given a structured JSON input regarding a job in the form of 'Input' and 'Question'. 
    \n{Input: ${jobData}\n\nQuestion: ${question}}\n
    \nAnswer the Question with the below points in mind \n
    - Always answer in First Person tone
    - If the Questions asks to contact someone, ONLY write the email to that person or Team WITHOUT giving any other instructions, DO NOT include a Subject line
    - DO NOT give suggestion, instead provide the actual answer
    - DO NOT ask to refer the resume, instead provide the needed details
    - DO NOT INCLUDE any citations or variables
    - DO NOT exceed a word count of 500
    - Return a complete answer.`;

    console.log(fullPrompt)

    const requestBody = {
        contents: [
        {
            parts: [
            {
                text: fullPrompt
            }
            ]
        }
        ]
    };
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key' : apiKey
      },
      body: JSON.stringify(requestBody)
    };
    
    return fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
}

function writeResponse(respData){
    let textArea = document.querySelector('textarea');
    textArea.textContent = respData;
}

export default Popup;