/*global chrome*/
import React, { useState, useEffect } from 'react';

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
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("Entered the handle function")
    try {
        // Step 1: Execute extractData on the active tab to get the job description.
        const extractionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractAllTextData
        });
    
        const extractedJobData = extractionResults[0].result;
        console.log(extractedJobData);

        // Step 2: Now that data is extracted, run a new script to click the button.
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: clickApply
        });

        //step 3: Get the question
        let question = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractQuestion
        });

        // Assuming 'extractQuestionInPage' returns an object from the page
        // The result is an array of objects, so we need to access the first element.
        const extractedQuestion = question[0].result;

        // Step 4: get the required answer from Gemini
        // this must not be done via execute script
        let geminiResponse = await generateResponse(extractedJobData, extractedQuestion, apiKey);
        // console.log(geminiResponse)
        const geminiText = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
        // console.log(geminiText)

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
    return (
      <div>
        <h1>AI Summary Settings</h1>
        <div className="form-group">
          <label htmlFor="api-key">Gemini API Key:</label>
          <input
            type="text"
            id="api-key"
            placeholder="Enter your Gemini API key"
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p>
            You can get an API key from{' '}
            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>
          </p>
        </div>
        <button onClick={() => handleSaveApiKey(apiKey)}>Save Settings</button>
      </div>
    );
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
    // Select all the desired elements at once using a comma-separated list
    const elements = document.querySelectorAll('h1, h2, h3, p, strong, li');
    
    // Create an empty array to store the extracted text
    const extractedText = [];

    // Loop through each element in the NodeList
    elements.forEach(element => {
        // Extract the trimmed text content and add it to the array
        extractedText.push(element.textContent.trim());
    });
    
    // Log and return the array of extracted text
    console.log(extractedText);
    return extractedText;
}

function clickApply(){
    // need to add a function to check for "a" tag for y combinator
    const url = window.location.href
    let buttons;
    let applyButton;
    if (url.includes("wellfound")){
         buttons = document.querySelectorAll('button');
    } else if (url.includes("workatastartup")){
         buttons = document.querySelectorAll('a')
    }

    buttons.forEach(button => {
        if (button.textContent.trim().toLowerCase() === "apply"){
            applyButton = button
            
        }
    })

    if (applyButton){
        applyButton.click();
    } else {
        console.log("could not find the apply button")
    }

}

// get the question
function extractQuestion(){
    // lets assume only one text area
    // we use textArea as its a fixed/ stable element
    let textArea = document.querySelector('textarea')
    let question = textArea.parentElement.previousElementSibling.textContent
    return question
}

// unsafe function - get response from gemini
function generateResponse(data, question, apiKey){
    const jobData = JSON.stringify(data)

    
    const fullPrompt = `You are given a structured JSON input regarding a job in the form of 'title' and 'content'. 
    JSON input: ${jobData}
    Question: ${question}
    Answer the question in one paragraph only. DO NOT INCLUDE any citations or variables. Return a complete answer.`;

    console.log(fullPrompt)

    // Construct the request body in the format the Gemini API expects
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
        // Handle the response
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Or response.text() if expecting text
      })
      
}

function writeResponse(respData){
    let textArea = document.querySelector('textarea')
    textArea.textContent = respData
}


export default Popup;
