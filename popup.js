document.addEventListener('DOMContentLoaded', function() {
    checkAndSetInitialUI();
});

// Function to handle UI state based on API key presence
function showAutofillSection() {
    document.getElementById('autofill-container').style.display = 'block';
    document.getElementById('settings-container').style.display = 'none';
}

function showSettingsSection() {
    document.getElementById('autofill-container').style.display = 'none';
    document.getElementById('settings-container').style.display = 'block';
}

async function checkAndSetInitialUI() {
    const items = await chrome.storage.sync.get('apiKey');
    const apiKey = items.apiKey;
    
    // Check if an API key is already in storage
    if (apiKey) {
        // If a key exists, show the autofill button and attach its event listener
        showAutofillSection();
        const autofillButton = document.getElementById('autofill');
        if (autofillButton) {
            autofillButton.addEventListener('click', async () => {
                await handleClick(apiKey);
            });
        }
    } else {
        // If no key exists, show the settings form
        showSettingsSection();
    }
    
    // Attach event listeners for the buttons that are always present
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', handleSaveButtonClick);
    }

    const changeKeyButton = document.getElementById('change-key-button');
    if (changeKeyButton) {
        changeKeyButton.addEventListener('click', () => {
            showSettingsSection();
            const apiKeyInput = document.getElementById('api-key');
            if (apiKeyInput) {
                // Pre-fill the input with the current key for editing
                apiKeyInput.value = apiKey || ''; 
            }
        });
    }
}

async function handleSaveButtonClick() {
    const apiKeyInput = document.getElementById('api-key');
    const successMessage = document.getElementById('success-message');
    const apiKey = apiKeyInput.value.trim();

    if (apiKey) {
        // Here, you could add a validity check for the API key if you want
        // For example:
        // const isValid = await validateApiKey(apiKey);
        // if (isValid) { ... }

        await chrome.storage.sync.set({ 'apiKey': apiKey });
        successMessage.textContent = 'Settings saved successfully!';
        
        // Hide message after 2 seconds
        setTimeout(() => {
            successMessage.textContent = '';
        }, 2000);
        
        // Switch to the autofill section after saving
        showAutofillSection();
    } else {
        successMessage.textContent = 'Please enter a valid key.';
    }
}

async function checkApiKeyAndHandleClick() {
    // Check if the API key is set in storage
    const items = await chrome.storage.sync.get('apiKey');
    console.log(items)
    const apiKey = items.apiKey;

    if (!apiKey) {
        // If no API key is found, redirect to options.html
        console.log("API key not found, redirecting to options page.");
        chrome.tabs.create({
            url: 'options.html',
            active: true
        });
        return;
    }

    // If API key is found, proceed with the original handleClick logic
    console.log("API key found, proceeding with autofill.");
    await handleClick(apiKey);
}

async function handleClick(apiKey) {
    console.log("handle click called")
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
}



// Call handleClick to attach the event listener

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