// 监听新标签页的创建  
chrome.tabs.onCreated.addListener(function (tab) {
  /*  
   const url = tab.pendingUrl ?? tab.url;
    if (url === 'chrome://newtab/') {
      chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL('home.html')
      });
    } 
      */
});

//不要在onCreated事件中使用chrome.tabs.create({ "url": "webnav/work.html" });会造成死循环

// 监听标签页的更新  
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // console.log('======打开新标签了changeInfo', changeInfo);

  // if (changeInfo.status === 'complete' && tab.url === 'chrome://newtab/' && isCatNewTab) {
  //   isCatNewTab = false;//避免其他插件干扰
  //   chrome.tabs.update(tabId, {
  //     url: chrome.runtime.getURL('webnav/work.html')
  //   });
  // }

});

chrome.runtime.onStartup.addListener(async () => {
  /*   const tabs = await chrome.tabs.query({
      url: "chrome://newtab/"
    });
    for (const tab of tabs) {
      chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL("home.html")
      });
    } */
});