// chrome.runtime.onInstalled.addListener(()=>{
//     // this will prompt user to enter the api key
//     // sync stores across all sessions
//     chrome.storage.sync.get(["geminiApiKey"], (result)=>{
//         if (!result.geminiApiKey){
//             chrome.tabs.create({ url: "options.html"});
//         }
//     })
// })

// scraping for Ashby

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    scrapeWithTab(request.url).then(sendResponse);
    return true; // Keep channel open for async
  }
});

async function scrapeWithTab(url) {
  // Create hidden tab
  const tab = await chrome.tabs.create({ url: url, active: false });
  
  // Wait for page to load
  await new Promise(resolve => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
  
  // Extract content from the loaded page
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // This code runs in the actual page with JS executed!
      const elements = document.querySelectorAll('h1, p, li, span');
      
      return Array.from(elements).map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim()
      })).filter(item => item.text.length > 0);
    }
  });
  
  // Close the tab
  await chrome.tabs.remove(tab.id);
  
  return results[0].result;
}