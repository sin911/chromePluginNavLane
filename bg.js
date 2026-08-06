//var isCatNewTab = false; // 用来标记是否是新标签页  

// 监听新标签页的创建  
chrome.tabs.onCreated.addListener(function (tab) {
  // 标记此事件是由新建标签页触发的  
  // isCatNewTab = true;
  if (tab.pendingUrl === 'chrome://newtab/') {
    // chrome.tabs.update(tab.id, {
    //   url: chrome.runtime.getURL('webnav/work.html')
    // });
  }

  //chrome.tabs.create({ "url": "webnav/work.html" });

});

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