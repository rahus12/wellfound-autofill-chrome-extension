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
    
        // to select the inner tab
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractData
        }).then(injectionResults => {
            const data = injectionResults[0].result
            console.log(data)
        })

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



// unsafe function
function generateResponse(){

}