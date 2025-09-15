document.addEventListener("DOMContentLoaded", () => {
    // load saved API key if exists 
    chrome.storage.sync.get(["geminiApiKey"], (result) => {
        if (result.geminiApiKey){
            document.getElementById("api-key").value = result.geminiApiKey;
        }
    })
});

// Save Api Key when button clicked
document.getElementById("save-button").addEventListener("click", ()=> {
    const apiKey = document.getElementById("api-key").value.trim();

    // Set the key after getting it
    if (apiKey){
        chrome.storage.sync.set({ geminiApiKey: apiKey }, ()=> {
            const successMessage = document.getElementById("success-message");
            successMessage.style.display = "block";

            // close the tab after a short delay to show the success message
            setTimeout(() => {window.close()}, 1000)
        })
    }
})