'use strict'

const invoke = window.__TAURI__.core.invoke

// ── State ──────────────────────────────────────────────────────────
let pages       = ['']
let currentPage = 0
let fontSize    = 18
let unsaved     = false
let histPaths   = []
let selHist     = -1
let advancing   = false

// ── DOM refs ───────────────────────────────────────────────────────
const editor      = document.getElementById('editor')
const pageNum     = document.getElementById('page-num')
const pageStatus  = document.getElementById('page-status')
const fontDisplay = document.getElementById('font-display')
const overlay     = document.getElementById('overlay')
const histList    = document.getElementById('hist-list')
const pageOuter   = document.querySelector('.page-outer')

// ── Lines per page (based on font size) ───────────────────────────
function linesPerPage() {
  if (fontSize <= 12) return 30
  if (fontSize <= 14) return 26
  if (fontSize <= 16) return 22
  if (fontSize <= 18) return 20
  if (fontSize <= 20) return 18
  if (fontSize <= 22) return 16
  if (fontSize <= 24) return 14
  if (fontSize <= 28) return 12
  return 10
}

// ── Line ruling CSS vars (aligns background lines with text) ──────
function updateRuling() {
  // line-height: 1.78em in px
  const lh = Math.round(fontSize * 1.78)
  // first ruled line starts after padding-top (28px)
  pageOuter.style.setProperty('--lh', lh + 'px')
  pageOuter.style.setProperty('--pt', '28px')
}

// ── Count newlines in editor ───────────────────────────────────────
function nlCount() {
  return editor.value.split('\n').length - 1
}

// ── Update status bar ─────────────────────────────────────────────
function refreshStatus() {
  const nl  = nlCount()
  const lpp = linesPerPage()
  const rem = lpp - nl
  pageStatus.className = 'page-status'
  if (rem <= 0) {
    pageStatus.textContent = 'ページが満杯です — Enter で次ページへ'
    pageStatus.classList.add('full')
  } else if (rem <= 3) {
    pageStatus.textContent = `残り ${rem} 行`
    pageStatus.classList.add('warn')
  } else {
    pageStatus.textContent = ''
  }
}

// ── Update page indicator ─────────────────────────────────────────
function refreshNav() {
  pageNum.textContent = `${currentPage + 1} / ${pages.length}`
}

// ── Mark unsaved state ────────────────────────────────────────────
function markUnsaved(val) {
  unsaved = val
  document.body.classList.toggle('unsaved', val)
}

// ── Save current textarea content to pages array ──────────────────
function saveCurrent() {
  while (pages.length <= currentPage) pages.push('')
  pages[currentPage] = editor.value
}

// ── Load a page into the textarea ─────────────────────────────────
function loadPage(idx) {
  saveCurrent()
  currentPage = Math.max(0, Math.min(idx, pages.length - 1))
  editor.value = pages[currentPage] || ''
  editor.focus()
  editor.setSelectionRange(editor.value.length, editor.value.length)
  refreshNav()
  refreshStatus()
  renderFreq()
}

// ── Auto-advance to next page ─────────────────────────────────────
function advancePage() {
  advancing = true
  saveCurrent()
  if (currentPage >= pages.length - 1) pages.push('')
  currentPage++
  editor.value = pages[currentPage]
  editor.focus()
  editor.setSelectionRange(0, 0)
  refreshNav()
  refreshStatus()
  markUnsaved(true)
  advancing = false
}

// ── Apply font size ───────────────────────────────────────────────
function applyFont() {
  editor.style.fontSize = fontSize + 'px'
  fontDisplay.textContent = fontSize + 'pt'
  updateRuling()
  refreshStatus()
}

// ── Key handlers ──────────────────────────────────────────────────
editor.addEventListener('keydown', e => {
  if (advancing) return
  if (e.key === 'Enter') {
    const nl  = nlCount()
    const lpp = linesPerPage()
    if (nl >= lpp) {
      e.preventDefault()
      advancePage()
    }
  }
})

editor.addEventListener('input', () => {
  if (!advancing) {
    markUnsaved(true)
    refreshStatus()
    scheduleFreq()
  }
})

// ── Character frequency counter ──────────────────────────────
let freqOpen = false
let freqTimer = null

function countChars() {
  // Read current page from editor directly (no side-effect)
  const snap = [...pages]
  while (snap.length <= currentPage) snap.push('')
  snap[currentPage] = editor.value

  const map = {}
  for (const ch of snap.join('')) {
    if (ch === '\n' || ch === '\r' || ch === ' ' || ch === '　') continue
    map[ch] = (map[ch] || 0) + 1
  }
  return map
}

function renderFreq() {
  if (!freqOpen) return
  const map = countChars()
  const total = Object.values(map).reduce((s, n) => s + n, 0)
  document.getElementById('freq-total').textContent = total.toLocaleString() + ' 字'
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
  document.getElementById('freq-list').innerHTML = sorted
    .map(([ch, cnt]) =>
      `<li class="freq-item"><span class="freq-ch">${escHtml(ch)}</span><span class="freq-cnt">${cnt}</span></li>`)
    .join('')
}

function scheduleFreq() {
  if (!freqOpen) return
  clearTimeout(freqTimer)
  freqTimer = setTimeout(renderFreq, 150)
}

document.getElementById('btn-freq').addEventListener('click', () => {
  freqOpen = !freqOpen
  document.getElementById('freq-panel').classList.toggle('open', freqOpen)
  document.getElementById('btn-freq').classList.toggle('active', freqOpen)
  document.body.classList.toggle('freq-open', freqOpen)
  if (freqOpen) renderFreq()
})

// ── Touch swipe for page navigation ──────────────────────────────
let touchStartX = 0
let touchStartY = 0

editor.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}, { passive: true })

editor.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  // Horizontal swipe > 60px and more horizontal than vertical
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx < 0 && currentPage < pages.length - 1) loadPage(currentPage + 1)
    else if (dx > 0 && currentPage > 0)           loadPage(currentPage - 1)
  }
}, { passive: true })

// ── Toolbar buttons ───────────────────────────────────────────────
document.getElementById('btn-new').addEventListener('click', newSession)
document.getElementById('btn-save').addEventListener('click', saveSession)
document.getElementById('btn-history').addEventListener('click', openHistory)
document.getElementById('btn-font-inc').addEventListener('click', () => {
  if (fontSize < 36) { fontSize += 2; applyFont() }
})
document.getElementById('btn-font-dec').addEventListener('click', () => {
  if (fontSize > 10) { fontSize -= 2; applyFont() }
})

// ── Nav buttons ───────────────────────────────────────────────────
document.getElementById('btn-prev').addEventListener('click', () => {
  if (currentPage > 0) loadPage(currentPage - 1)
})
document.getElementById('btn-next').addEventListener('click', () => {
  if (currentPage < pages.length - 1) loadPage(currentPage + 1)
})
document.getElementById('btn-add').addEventListener('click', () => {
  saveCurrent()
  pages.push('')
  loadPage(pages.length - 1)
  markUnsaved(true)
})

// ── Keyboard shortcuts ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.ctrlKey) {
    if (e.key === 's')          { e.preventDefault(); saveSession() }
    if (e.key === 'n')          { e.preventDefault(); newSession() }
    if (e.key === 'h')          { e.preventDefault(); openHistory() }
    if (e.key === '=' || e.key === '+') {
      e.preventDefault()
      if (fontSize < 36) { fontSize += 2; applyFont() }
    }
    if (e.key === '-') {
      e.preventDefault()
      if (fontSize > 10) { fontSize -= 2; applyFont() }
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); if (currentPage < pages.length - 1) loadPage(currentPage + 1) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); if (currentPage > 0) loadPage(currentPage - 1) }
    if (e.key === 'k') { e.preventDefault(); document.getElementById('btn-freq').click() }
  }
})

// ── Session management ────────────────────────────────────────────
async function newSession() {
  if (unsaved) {
    if (!confirm('保存されていない変更があります。\n新規作成しますか？')) return
  }
  pages = ['']
  currentPage = 0
  editor.value = ''
  markUnsaved(false)
  refreshNav()
  refreshStatus()
}

async function saveSession() {
  saveCurrent()
  const data = {
    version: 1,
    created: new Date().toISOString(),
    fontSize,
    pages,
  }
  await invoke('save_note', { data })
  markUnsaved(false)
}

async function loadData(data) {
  pages    = data.pages    || ['']
  fontSize = data.fontSize || 18
  applyFont()
  currentPage = 0
  editor.value = pages[0] || ''
  markUnsaved(false)
  refreshNav()
  refreshStatus()
  renderFreq()
}

// ── History modal ─────────────────────────────────────────────────
async function openHistory() {
  selHist  = -1
  histPaths = []

  const notes = await invoke('list_notes')
  histList.innerHTML = ''

  if (!notes.length) {
    histList.innerHTML = '<li class="hist-empty">まだ保存された履歴はありません</li>'
  } else {
    notes.forEach((n, i) => {
      histPaths.push(n.path)
      const dt = new Date(n.created)
      const dtStr = `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
      const nPages = (n.pages || []).length
      const preview = ((n.pages && n.pages[0]) || '').replace(/\n/g, ' ').slice(0, 50)

      const li = document.createElement('li')
      li.className = 'hist-item'
      li.innerHTML = `<span class="hist-date">${dtStr}</span><span class="hist-pages">${nPages}ページ</span><div class="hist-prev">${escHtml(preview)}</div>`
      li.addEventListener('click', () => {
        document.querySelectorAll('.hist-item').forEach(el => el.classList.remove('selected'))
        li.classList.add('selected')
        selHist = i
      })
      li.addEventListener('dblclick', () => histOpenSelected())
      histList.appendChild(li)
    })
  }

  overlay.style.display = 'flex'
  editor.blur()
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

async function histOpenSelected() {
  if (selHist < 0 || selHist >= histPaths.length) return
  if (unsaved) {
    if (!confirm('保存されていない変更があります。\n別のノートを開きますか？')) return
  }
  try {
    const data = await invoke('load_note', { fp: histPaths[selHist] })
    await loadData(data)
    closeModal()
  } catch (e) {
    alert('読み込みに失敗しました: ' + e.message)
  }
}

async function histDeleteSelected() {
  if (selHist < 0 || selHist >= histPaths.length) return
  if (!confirm('この履歴を削除しますか？')) return
  await invoke('delete_note', { fp: histPaths[selHist] })
  histPaths.splice(selHist, 1)
  const items = histList.querySelectorAll('.hist-item')
  if (items[selHist]) items[selHist].remove()
  selHist = -1
  if (!histList.querySelector('.hist-item')) {
    histList.innerHTML = '<li class="hist-empty">まだ保存された履歴はありません</li>'
  }
}

function closeModal() {
  overlay.style.display = 'none'
  editor.focus()
}

document.getElementById('hist-open').addEventListener('click',  histOpenSelected)
document.getElementById('hist-del').addEventListener('click',   histDeleteSelected)
document.getElementById('hist-close').addEventListener('click', closeModal)
document.getElementById('modal-x').addEventListener('click',    closeModal)
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === overlay) closeModal()
})

// ── Init ──────────────────────────────────────────────────────────
;(async () => {
  applyFont()
  try {
    const last = await invoke('load_last')
    if (last) await loadData(last)
    else refreshNav()
  } catch {
    refreshNav()
  }
  editor.focus()
})()
