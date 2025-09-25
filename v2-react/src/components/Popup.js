/*global chrome*/
import React, { useState, useEffect } from 'react';
import Settings from './Settings';

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

  if (showSettings) {
    return <Settings initialApiKey={apiKey} onSave={handleSaveApiKey} />;
  }

  return (
    <div className="container">
      <h3>Click to Summarise page and autofill message</h3>
      <button onClick={handleAutofill}>Autofill</button>
      <button onClick={() => setShowSettings(true)}>Change/Update API Key</button>
    </div>
  );
};

// These functions are injected into the page, so they need to be self-contained.

function extractAllTextData() {
    const elements = document.querySelectorAll('h1, h2, h3, p, strong, li');
    const extractedText = [];
    elements.forEach(element => {
        extractedText.push(element.textContent.trim());
    });
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
    let question = textArea.parentElement.previousElementSibling.textContent;
    return question;
}

function generateResponse(data, question, apiKey, resumeContent){
    const jobData = JSON.stringify(data);

    const resumePrompt = resumeContent 
      ? `Use the following resume for context: ${resumeContent}`
      : 'There is no resume provided.';

    const fullPrompt = `${resumePrompt}\n\nYou are given a structured JSON input regarding a job in the form of 'title' and 'content'. \nJSON input: ${jobData}\n\nQuestion: ${question}\n\nAnswer the question in one paragraph only based on the provided resume and job data. DO NOT INCLUDE any citations or variables. Return a complete answer.`;

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