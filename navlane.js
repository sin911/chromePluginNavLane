
/*
封装简化async await的报错
源码:
function to(p) { return p.then(v => [null, v], e => [e, null]); }
示例:
async function pullGist() {
  document.title = '拉取中';
  var rawUrlHome = "https://..."
  const [e1, homeRes] = await to(fetch(rawUrlHome).then(r => r.json()));
  if (e1) { console.log('err', e1); document.title='拉取失败'; return; }
  // ... 每个 await 都要 to 包裹，写起来更啰嗦
}
*/

document.getElementById('ipt_text').onkeydown = async function (e) {
  if (e.ctrlKey && e.key === 'Enter') {
    // window.open("https://www.baidu.com/s?wd=" + this.value, '_blank')
    var TABID = await getCurrentTab()
    chrome.tabs.create({ "url": "https://www.baidu.com/s?wd=" + this.value });
    chrome.tabs.remove(TABID);
  }
  if (e.key === 'Enter') {
    //window.open("https://www4.bing.com/search?q=" + this.value, '_blank');
    var TABID = await getCurrentTab()
    chrome.tabs.create({ "url": "https://www4.bing.com/search?q=" + this.value });
    chrome.tabs.remove(TABID);
  }
}
document.getElementById('btn_baidu').onclick = function (e) {
  var _val = document.getElementById('ipt_text').value
  if (_val) window.open("https://www.baidu.com/s?wd=" + _val, '_blank');
  else window.open("https://www.baidu.com/", '_blank');
}

document.getElementById('btn_bing').onclick = function (e) {
  var _val = document.getElementById('ipt_text').value
  if (_val) window.open("https://www4.bing.com/search?q=" + _val, '_blank');
  else window.open("https://www4.bing.com", '_blank');
}
async function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        var tabId = tabs[0].id;
        resolve(tabId)
      }
    });
  })

}
// 运行时实际使用的配置（从 storage 加载，首次使用需在 modal 中填写）
let MODES = []
let ghtoken = ''
let gistId = ''

let currentModeIdx = 0
let defaultModeIdx = 0
function curMode() { return MODES[currentModeIdx] }
function storageKey() { return curMode().storageKey }
function fileName() { return curMode().file }

function updateGopageText() {
  if (!MODES.length) return
  var curLabel = MODES[currentModeIdx].label
  var nextLabel = MODES[(currentModeIdx + 1) % MODES.length].label
  document.getElementById('gopage').innerHTML = `${curLabel}<span class="gopage-arrow">➤</span>${nextLabel}`
}

document.getElementById('gopage').onclick = async () => {
  if (!MODES.length) return
  currentModeIdx = (currentModeIdx + 1) % MODES.length
  updateGopageText()
  var { [storageKey()]: data } = await chrome.storage.local.get([storageKey()]);
  if (data) {
    render(data.arr_sites)
  } else {
    document.getElementById('ctx').innerHTML = '<div style="padding:20px;">暂无' + curMode().label + '数据，请先拉取</div>'
  }
}

// 从 storage 加载系统配置；若无配置返回 false，由调用方决定是否弹 modal
async function loadSystemSettings() {
  var { system_settings } = await chrome.storage.local.get(['system_settings']);
  if (system_settings && system_settings.MODES && system_settings.MODES.length) {
    MODES = system_settings.MODES
    ghtoken = system_settings.ghtoken || ''
    gistId = system_settings.gistId || ''
    defaultModeIdx = system_settings.defaultModeIdx || 0
    currentModeIdx = defaultModeIdx
    return true
  }
  return false
}


function tplSection(data, secIdx) {
  var ss = ''
  data.data.forEach((v, k) => {
    let { link, comment, favicon, text } = v
    let favHtml = favicon
      ? `<img src="${favicon}" alt="" class="link-item-favicon">`
      : `<div class="link-item-nofav"></div>`
    ss += `<a href="${link}" title="${comment}" class="link-item" data-sec="${secIdx}" data-idx="${k}">${favHtml}<span class="link-item-text">${text}</span></a>`
  })
  return (
    `<div class="box-wrap">
        <div class="panel-head">${data.title}</div>
        <div class="panel-body">${ss}</div>
    </div>`
  )
}

function render(data) {
  var cc = ''
  data.forEach((v, k) => {
    cc += tplSection(v, k)
  })
  document.getElementById('ctx').innerHTML = cc
}


!async function init() {
  var hasSettings = await loadSystemSettings()
  if (hasSettings) {
    updateGopageText()
    var { [storageKey()]: data } = await chrome.storage.local.get([storageKey()]);
    if (data) {
      render(data.arr_sites)
    } else {
      pullGist()
    }
  } else {
    // 首次使用：弹 modal，保存后再初始化
    openSettingsModal(async function () {
      updateGopageText()
      var { [storageKey()]: data } = await chrome.storage.local.get([storageKey()]);
      if (data) {
        render(data.arr_sites)
      } else {
        pullGist()
      }
    })
  }
}();
async function pullGist() {
  //1:拉取所有模式的远程json数据
  //2:保存到chrome.storage.local
  //3:渲染当前模式页面
  try {
    document.title = '⏳️拉取中'
    let firstData = null
    for (const m of MODES) {
      const json = await fetch(m.gistUrl).then(r => r.json());
      var obj = {}; obj[m.storageKey] = json;
      await chrome.storage.local.set(obj);
      console.log('🟩 🟩 🟩数据已保存到 chrome.storage.local', json);
      if (m.key === curMode().key) firstData = json
    }
    if (firstData) render(firstData.arr_sites)
    document.title = '✅拉取成功'
  } catch (error) {
    console.log('🟩 🟩 🟩 error', error);
    document.title = '❌拉取失败'
  }
}
document.getElementById('btn_fetch_data').onclick = function () {
  pullGist();
}
document.getElementById('btn_fetch_data_show').onclick = async function () {
  const result = await chrome.storage.local.get(null);
  console.log('所有已存储的数据：', result);
}
document.getElementById('clear').onclick = async function () {
  chrome.storage.local.clear();
}

// 内存中缓存的 home_data，编辑时直接改这里，保存时写回 storage
let editing_home_data = null

document.getElementById('btn_edit_all').onclick = async function () {
  var { [storageKey()]: data } = await chrome.storage.local.get([storageKey()]);
  if (!data) { alert('暂无数据，请先拉取'); return; }
  editing_home_data = data
  document.querySelectorAll('#ctx .link-item').forEach(function (el) {
    if (el.querySelector('.btn-edit-item')) return
    var btn = document.createElement('button')
    btn.className = 'btn-edit-item'
    btn.textContent = '编辑'
    btn.style.marginLeft = '4px'
    btn.onclick = function (e) {
      e.preventDefault()
      e.stopPropagation()
      var sec = parseInt(el.getAttribute('data-sec'))
      var idx = parseInt(el.getAttribute('data-idx'))
      var item = editing_home_data.arr_sites[sec].data[idx]
      var link = prompt('link：', item.link || '')
      if (link === null) return
      var favicon = prompt('favicon：', item.favicon || '')
      if (favicon === null) return
      var text = prompt('text：', item.text || '')
      if (text === null) return
      var comment = prompt('comment：', item.comment || '')
      if (comment === null) return
      item.link = link
      item.favicon = favicon
      item.text = text
      item.comment = comment
      // 同步刷新该元素的显示
      el.setAttribute('href', link)
      el.setAttribute('title', comment)
      var fav = el.querySelector('.link-item-favicon')
      if (favicon) {
        if (fav) { fav.setAttribute('src', favicon) }
        else {
          var nofav = el.querySelector('.link-item-nofav')
          if (nofav) {
            var img = document.createElement('img')
            img.src = favicon
            img.alt = ''
            img.className = 'link-item-favicon'
            nofav.replaceWith(img)
          }
        }
      } else {
        if (fav) {
          var div = document.createElement('div')
          div.className = 'link-item-nofav'
          fav.replaceWith(div)
        }
      }
      var textEl = el.querySelector('.link-item-text')
      if (textEl) textEl.textContent = text
      // 保存最新数据到 chrome.storage.local（按当前模式写对应 key）
      var obj = {}; obj[storageKey()] = editing_home_data;
      chrome.storage.local.set(obj);
    }
    el.appendChild(btn)
  })
}

document.getElementById('btn_save_edit').onclick = async function () {
  var { [storageKey()]: data } = await chrome.storage.local.get([storageKey()]);
  // 把 #ipt_text 替换为 textarea，并显示当前模式数据的 JSON
  var oldEl = document.getElementById('ipt_text')
  var newEl = document.createElement('textarea')
  newEl.id = 'ipt_text'
  newEl.className = oldEl.className
  newEl.value = JSON.stringify(data, null, 2)
  newEl.rows = 16
  newEl.style.width = '100%'
  newEl.style.height = 'unset'
  newEl.style.boxSizing = 'border-box'
  oldEl.replaceWith(newEl)
  // 在 #ipt_text 下方新增"按json更新"按钮（已存在则不重复添加）
  if (!document.getElementById('btn_update_by_json')) {
    var btnUpdate = document.createElement('button')
    btnUpdate.id = 'btn_update_by_json'
    btnUpdate.textContent = '更新本地数据'
    newEl.insertAdjacentElement('afterend', btnUpdate)
    btnUpdate.onclick = async function () {
      var txt = document.getElementById('ipt_text').value
      try {
        var parsed = JSON.parse(txt)
      } catch (e) {
        alert('JSON 格式有误：' + e.message)
        return
      }
      var obj = {}; obj[storageKey()] = parsed;
      await chrome.storage.local.set(obj);
      render(parsed.arr_sites)
      alert('已按 JSON 更新')
    }
  }
}


document.getElementById('upload').onclick = async function () {
  document.title = '⏳️上传中'
  try {
    for (const m of MODES) {
      var { [m.storageKey]: data } = await chrome.storage.local.get([m.storageKey]);
      var body = {
        files: {
          [m.file]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      };
      var res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${ghtoken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        var errText = await res.text();
        console.log('🟩 🟩 🟩 上传失败', m.file, res.status, errText);
        alert('上传 ' + m.file + ' 失败：' + res.status + ' ' + errText);
        return;
      }
      console.log('🟩 🟩 🟩 已上传', m.file, res.status);
    }
    document.title = '✅上传成功'
  } catch (error) {
    console.log('🟩 🟩 🟩 upload error', error);
    document.title = '❌上传失败'
    alert('上传失败：' + error.message);
  }
}

// ===== 系统设置 Modal =====
document.getElementById('edit_system_settings').onclick = function () {
  openSettingsModal()
}

function openSettingsModal(onSaved) {
  // 遮罩层
  var overlay = document.createElement('div')
  overlay.id = 'settings_overlay'
  Object.assign(overlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.5)', zIndex: '9999',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  })

  // 弹窗容器
  var modal = document.createElement('div')
  Object.assign(modal.style, {
    background: '#fff', padding: '20px', borderRadius: '8px',
    width: '600px', maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box'
  })

  modal.innerHTML = `
    <h3 style="margin:0 0 12px;">系统设置</h3>
    <label style="display:block;margin-bottom:8px;">GitHub Token(一次性展示,若丢失,只能重新生成<br />创建方法:右上角头像→Settings→Developer settings→Personal access tokens→Tokens(classic→勾选gist)</label>
    <input id="set_ghtoken" type="text" style="width:100%;margin-bottom:12px;box-sizing:border-box;" value="${ghtoken}">
    <label style="display:block;margin-bottom:8px;">Gist ID(如https://gist.github.com/nickname/{gistIdxxxxxxxxx})</label>
    <input id="set_gistId" type="text" style="width:100%;margin-bottom:12px;box-sizing:border-box;" value="${gistId}">
    <label style="display:block;margin-bottom:8px;">默认展示的 MODES 索引（数字，从 0 开始）</label>
    <input id="set_default_idx" type="number" min="0" style="width:100%;margin-bottom:12px;box-sizing:border-box;" value="${defaultModeIdx}">
    <label style="display:block;margin-bottom:8px;">MODES（JSON 格式）</label>
    <textarea id="set_modes" style="width:100%;height:260px;margin-bottom:12px;box-sizing:border-box;font-family:monospace;">${JSON.stringify(MODES, null, 2)}</textarea>
    <div style="text-align:right;">
      ${onSaved ? '' : '<button id="set_cancel" style="margin-right:8px;">取消</button>'}
      <button id="set_save">保存</button>
    </div>
  `
  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  // 非首次使用时显示取消按钮
  var cancelBtn = document.getElementById('set_cancel')
  if (cancelBtn) {
    cancelBtn.onclick = function () {
      document.body.removeChild(overlay)
    }
  }
  overlay.onclick = function (e) {
    if (e.target === overlay && document.getElementById('set_cancel')) {
      document.body.removeChild(overlay)
    }
  }

  document.getElementById('set_save').onclick = async function () {
    var token = document.getElementById('set_ghtoken').value
    var id = document.getElementById('set_gistId').value
    var modesTxt = document.getElementById('set_modes').value
    try {
      var parsedModes = JSON.parse(modesTxt)
    } catch (e) {
      alert('MODES JSON 格式有误：' + e.message)
      return
    }
    if (!Array.isArray(parsedModes)) { alert('MODES 必须是数组'); return }
    if (!parsedModes.length) { alert('MODES 至少需要一项'); return }
    var idx = parseInt(document.getElementById('set_default_idx').value)
    if (isNaN(idx) || idx < 0 || idx >= parsedModes.length) {
      alert('默认索引无效，应为 0 到 ' + (parsedModes.length - 1) + ' 的数字')
      return
    }
    ghtoken = token
    gistId = id
    MODES = parsedModes
    defaultModeIdx = idx
    currentModeIdx = idx
    await chrome.storage.local.set({ system_settings: { MODES: parsedModes, ghtoken: token, gistId: id, defaultModeIdx: idx } });
    updateGopageText()
    document.body.removeChild(overlay)
    if (onSaved) await onSaved()
    alert('设置已保存')
  }
}

// #menu 默认隐藏，点击 #popicon 切换显示/隐藏
document.getElementById('popicon').onclick = function () {
  var menu = document.getElementById('menu')
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex'
}

