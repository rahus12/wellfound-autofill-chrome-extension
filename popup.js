document.addEventListener('DOMContentLoaded', function() {
console.log("entered the extension")
  const myButton = document.getElementById('autofill');
  if (!myButton){
    console.log("no button found")
    return
  }
    myButton.addEventListener('click', async function() {
      // Your code to execute when the button is clicked
      console.log("button clicked")
      await handleClick();
    });
});

async function handleClick() {
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
        let geminiResponse = await generateResponse(extractedJobData, extractedQuestion);
        // console.log(geminiResponse)
        const geminiText = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log(geminiText)

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

function extractData() {
    const jobDetail = document.querySelector('[data-test="JobDetail"]')
    const h3s = jobDetail.querySelectorAll('h3');

    const result = [];

    h3s.forEach(h3 => {
        // creates a map for each h3 element
        const section = { title: h3.textContent.trim(), content: [] };
        let sibling = h3.nextElementSibling;

        while (sibling && sibling.tagName !== 'H3') {
            if (sibling.tagName === 'P') {
                section.content.push({ text: sibling.textContent.trim() });
            } else if (sibling.tagName === 'UL') {
                const items = Array.from(sibling.querySelectorAll('li')).map(li => li.textContent.trim());
                section.content.push({ items });
            } else if (sibling.tagName === 'LI') {
                section.content.push({ text: sibling.textContent.trim() });
            }
            sibling = sibling.nextElementSibling;
        }

        result.push(section);

    });
    console.log(result);
    return result
    
}

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
    let buttons = document.querySelectorAll('button');
    let applyButton;

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
function generateResponse(data, question){
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
        'X-goog-api-key' : ''
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