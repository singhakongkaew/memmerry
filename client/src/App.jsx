import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import { useAuth } from './context/AuthContext'
import { useLanguage } from './context/LanguageContext'
import BottomSheet from './components/BottomSheet'
import { dateFromIsoDate, formatBuddhistDate, getCountdownDifferenceSeconds, normalizeDateInput } from './dateUtils'

const starterCards = [
  { id: 1, title: 'Our first hello', date: '2023-07-14', emoji: '💞', color: 'peach', pinned: true },
  { id: 2, title: 'Next little adventure', date: '2026-12-20', emoji: '✈️', color: 'yellow', pinned: false },
]
const starterMemories = [
  { id: 1, title: 'A slow Sunday together', date: '2025-08-18', tag: 'home', emoji: '☕', reaction: '💗' },
]
const legacyExampleTitles = new Set(['The night we got lost', 'Birthday cake disaster'])
function removeLegacyExamples(items) { return Array.isArray(items) ? items.filter((item) => !legacyExampleTitles.has(item.title)) : [] }
const starterTasks = [
  { id: 1, title: 'Make this space ours', category: 'Things to do', who: 'Both', done: false, isExample: true },
  { id: 2, title: 'Try the new pasta recipe', category: 'Things to do', who: 'You', done: false },
  { id: 3, title: 'Pick a movie for Friday', category: 'Watch list', who: 'Mew', done: false },
]
const dailyMessages = ['You are my favorite place to be.', 'Tiny moments, big love.', 'Today is better because it is ours.', 'Still choosing you, every day.']
const weatherLabels = { 0: ['Clear sky', 'Perfect for a walk', '☀️'], 1: ['Mostly clear', 'A gentle day outside', '🌤️'], 2: ['Cloudy', 'Good day for a cozy plan', '☁️'], 3: ['Rainy', 'Bring an umbrella', '🌧️'], 4: ['Snowy', 'Stay warm together', '❄️'], 5: ['Stormy', 'A movie day sounds nice', '⛈️'] }

function daysBetween(date) { return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)) }
function daysUntil(date) { return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)) }
function coupleStorageKey(user, key) { return `love:${user?.coupleId || 'unassigned'}:${key}` }
function compressImage(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 1200 / image.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', .78))
    }
    image.onerror = () => resolve(dataUrl)
    image.src = dataUrl
  })
}

function App() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('home')
  const [now, setNow] = useState(() => Date.now())
  const [unit, setUnit] = useState('days')
  const [cards, setCards] = useState(() => JSON.parse(localStorage.getItem(coupleStorageKey(user, 'cards')) || 'null') || starterCards)
  const [memories, setMemories] = useState(() => { const stored = JSON.parse(localStorage.getItem(coupleStorageKey(user, 'memories')) || 'null'); return stored ? removeLegacyExamples(stored) : starterMemories })
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem(coupleStorageKey(user, 'tasks')) || 'null') || starterTasks)
  const [moods, setMoods] = useState(() => JSON.parse(localStorage.getItem(coupleStorageKey(user, 'moods')) || '{}'))
  const [message, setMessage] = useState(() => localStorage.getItem(coupleStorageKey(user, 'customMessage')) || dailyMessages[new Date().getDate() % dailyMessages.length])
  const [anniversaryDate, setAnniversaryDate] = useState(() => normalizeDateInput(localStorage.getItem(coupleStorageKey(user, 'anniversaryDate'))) || '')
  const [anniversaryMessage, setAnniversaryMessage] = useState(() => localStorage.getItem(coupleStorageKey(user, 'anniversaryMessage')) || '')
  const [editingMessage, setEditingMessage] = useState(false)
  const [gallery, setGallery] = useState('timeline')
  const [tagFilter, setTagFilter] = useState('all')
  const [showCardForm, setShowCardForm] = useState(false)
  const [apiReady, setApiReady] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [selectedProfileAction, setSelectedProfileAction] = useState('')
  const [weather, setWeather] = useState({ temp: '--', condition: 'Checking the sky', suggestion: 'Finding a little weather note', icon: '🌤️' })

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => { localStorage.setItem(coupleStorageKey(user, 'cards'), JSON.stringify(cards)) }, [cards, user])
  useEffect(() => { localStorage.setItem(coupleStorageKey(user, 'memories'), JSON.stringify(memories)) }, [memories, user])
  useEffect(() => { localStorage.setItem(coupleStorageKey(user, 'tasks'), JSON.stringify(tasks)) }, [tasks, user])
  useEffect(() => { localStorage.setItem(coupleStorageKey(user, 'moods'), JSON.stringify(moods)) }, [moods, user])
  useEffect(() => { const key = coupleStorageKey(user, 'anniversaryDate'); if (anniversaryDate) localStorage.setItem(key, anniversaryDate); else localStorage.removeItem(key) }, [anniversaryDate, user])
  useEffect(() => { const key = coupleStorageKey(user, 'anniversaryMessage'); if (anniversaryMessage) localStorage.setItem(key, anniversaryMessage); else localStorage.removeItem(key) }, [anniversaryMessage, user])
  useEffect(() => {
    const token = localStorage.getItem('northstarToken')
    if (!token) { setApiReady(true); return undefined }
    const apiUrl = `${import.meta.env.VITE_API_URL || ''}/api`
    const loadHome = () => fetch(`${apiUrl}/home`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.cards?.length) setCards(data.cards)
        if (data?.memories?.length) setMemories(removeLegacyExamples(data.memories))
        if (data?.tasks?.length) setTasks(data.tasks)
        if (data?.moods && Object.keys(data.moods).length) setMoods(data.moods)
        if (data?.dailyMessage) setMessage(data.dailyMessage)
        if (typeof data?.anniversaryDate === 'string') setAnniversaryDate(normalizeDateInput(data.anniversaryDate) || '')
        if (typeof data?.anniversaryMessage === 'string') setAnniversaryMessage(data.anniversaryMessage)
      })
      .catch(() => {})
    loadHome().finally(() => setApiReady(true))
    const refreshTimer = setInterval(loadHome, 5000)
    return () => clearInterval(refreshTimer)
  }, [])
  useEffect(() => {
    let cancelled = false
    const loadWeather = async (latitude = 13.7563, longitude = 100.5018) => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`)
        const data = await response.json()
        const code = data.current?.weather_code ?? 0
        const type = code === 0 ? 0 : code <= 3 ? 1 : code <= 48 ? 2 : code <= 67 ? 3 : code <= 77 ? 4 : 5
        if (!cancelled) { const [condition, suggestion, icon] = weatherLabels[type]; setWeather({ temp: Math.round(data.current.temperature_2m), condition, suggestion, icon }) }
      } catch { if (!cancelled) setWeather({ temp: '--', condition: 'Weather unavailable', suggestion: 'A good day for whatever feels right', icon: '🌤️' }) }
    }
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition((position) => loadWeather(position.coords.latitude, position.coords.longitude), () => loadWeather())
    else loadWeather()
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    const token = localStorage.getItem('northstarToken')
    if (!apiReady || !token) return undefined
    const syncMemories = memories.map((memory) => memory.image?.startsWith('data:') ? { ...memory, image: '' } : memory)
    const apiUrl = `${import.meta.env.VITE_API_URL || ''}/api`
    const timer = setTimeout(() => fetch(`${apiUrl}/home`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ cards, memories: syncMemories, tasks, moods, dailyMessage: message, anniversaryDate, anniversaryMessage }) }).catch(() => {}), 300)
    return () => clearTimeout(timer)
  }, [apiReady, cards, memories, tasks, moods, message, anniversaryDate, anniversaryMessage])

  const togetherSeconds = Math.floor((now - new Date(user?.couple?.startDate || '2023-07-14T19:30:00').getTime()) / 1000)
  const totalDays = Math.floor(togetherSeconds / 86400)
  const timeValue = unit === 'days' ? totalDays : unit === 'months' ? Math.floor(totalDays / 30) : unit === 'weeks' ? Math.floor(totalDays / 7) : Math.floor(togetherSeconds / 3600)
  const nextMilestone = [100, 365, 1000, 1500, 2000].find((milestone) => milestone > totalDays) || totalDays + 365
  const progress = ((totalDays / nextMilestone) * 100).toFixed(0)
  const todayKey = new Date().toISOString().slice(0, 10)
  const filteredMemories = memories.filter((memory) => tagFilter === 'all' || memory.tag === tagFilter)
  const tags = ['all', ...new Set(memories.map((memory) => memory.tag))]
  const visibleCards = cards.filter((card) => card.title !== '..')
  const greetingHour = new Date(now).getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : greetingHour < 22 ? 'Good evening' : 'Good night'
  const fullDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(now))
  const latestMood = moods[`${todayKey}-you`] || moods[`${todayKey}-me`] || '♡'
  const partnerJoined = (user?.couple?.memberCount || 0) >= 2
  const customCards = visibleCards.filter((card) => card.title?.trim())
  const onlyExampleTasks = tasks.length > 0 && tasks.every((task) => task.isExample || task.title === 'Make this space ours')
  const isEmptySpace = customCards.length === 0 && memories.length === 0 && onlyExampleTasks
  let checkInStreak = 0
  for (let offset = 0; offset < 30; offset += 1) {
    const day = new Date(now - offset * 86400000).toISOString().slice(0, 10)
    if (moods[`${day}-you`] || moods[`${day}-me`]) checkInStreak += 1
    else break
  }
  const inviteLink = user?.couple?.inviteCode ? `${window.location.origin}/login?invite=${encodeURIComponent(user.couple.inviteCode)}` : ''

  async function copyInviteLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 1800)
  }

  function saveMessage(event) {
    const nextMessage = event.currentTarget.elements.message.value.trim()
    if (nextMessage) { setMessage(nextMessage); localStorage.setItem(coupleStorageKey(user, 'customMessage'), nextMessage) }
    setEditingMessage(false)
  }
  function addCard(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    setCards((items) => [...items, { id: Date.now(), title: form.get('title'), date: form.get('date'), emoji: form.get('emoji') || '💖', color: 'rose', pinned: false }]); setShowCardForm(false)
  }
  async function addMemory(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const file = form.get('photo')
    const add = (image) => setMemories((items) => [{ id: Date.now(), title: form.get('title'), date: form.get('date'), tag: form.get('tag') || 'other', emoji: '📸', image, reaction: '💗' }, ...items])
    if (file?.size) {
      const reader = new FileReader()
      reader.onload = async () => {
        const token = localStorage.getItem('northstarToken')
        try {
          const compressedImage = await compressImage(reader.result)
          const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/media/memory-image`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ image: compressedImage }) })
          const data = await response.json()
          if (!response.ok) throw new Error(data.message || 'Image upload failed')
          add(data.imageUrl)
        } catch (error) { window.alert(error.message) }
      }
      reader.readAsDataURL(file)
    } else add('')
    event.currentTarget.reset()
  }
  function chooseProfileAction(closeSheet, action, destination) {
    setSelectedProfileAction(action)
    const nextAction = () => { setSelectedProfileAction(''); if (destination) navigate(destination); else logout() }
    closeSheet(nextAction)
  }

  return <main className="app-shell">
    <header className="topbar"><button className="logo" onClick={() => setActiveView('home')}><span>♥</span> ours.</button><nav>{[['home', 'home'], ['memories', 'memories'], ['planner', 'planner']].map(([id, label]) => <button key={id} className={activeView === id ? 'active' : ''} onClick={() => setActiveView(id)}>{t(label)}</button>)}{user?.role === 'admin' && <a className="admin-link" href="/admin">Admin</a>}</nav><button className="avatar" aria-label="Open profile menu" title="Open profile menu" onClick={() => setProfileMenuOpen(true)}>{user?.profileImage ? <img src={user.profileImage} alt="" /> : `${(user?.displayName || 'Y')[0].toUpperCase()}${(user?.email || 'M')[0].toUpperCase()}`}</button></header>
    <section className="content page-enter" key={activeView}>
      {!apiReady ? <HomeSkeleton /> : <>
      {activeView === 'home' && <AnniversaryCountdown now={now} savedDate={anniversaryDate} onDateChange={setAnniversaryDate} anniversaryMessage={anniversaryMessage} onMessageChange={setAnniversaryMessage} />}
      {activeView === 'legacy-home' && <>
        <div className="welcome-row"><div><p className="kicker">{fullDate.toUpperCase()} <span>•</span> {user?.couple?.names || 'OUR LITTLE UNIVERSE'}</p><h1>{greeting}, {user?.displayName || 'you two'} <span>{latestMood}</span></h1><p className="subhead">A soft place for all the days we get to share.</p>{inviteLink && <div className="invite-chip"><span>{partnerJoined ? 'Partner joined' : 'Invite your partner'}</span><strong>{user.couple.inviteCode}</strong><button type="button" onClick={copyInviteLink}>{inviteCopied ? 'Copied!' : 'Copy invite link'}</button></div>}</div><div className="weather"><span className="weather-icon">{weather.icon}</span><strong>{weather.temp}°</strong><small>{weather.condition} · {weather.suggestion}</small></div></div>
        <section className="hero-card"><div className="hero-copy"><p className="kicker">THE MAIN EVENT</p><div className="counter-line"><strong>{timeValue}</strong><span>{unit} together</span></div><p>Since {new Date(user?.couple?.startDate || '2023-07-14T19:30:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} <i>·</i> and counting every second</p><div className="unit-switch">{['days', 'months', 'weeks', 'hours'].map((item) => <button className={unit === item ? 'selected' : ''} onClick={() => setUnit(item)} key={item}>{item}</button>)}</div></div><div className="hero-doodle">✦<div>you + me<br /><b>always</b></div>♡</div><div className="next-badge"><span>✦ NEXT MILESTONE</span><strong>{nextMilestone} days</strong><div><i style={{ width: `${progress}%` }} /></div><small>{nextMilestone - totalDays} days to go</small></div></section>
        <div className="section-heading"><div><p className="kicker">LITTLE LANDMARKS</p><h2>Moments worth counting</h2></div><button className="outline-button" onClick={() => setShowCardForm(!showCardForm)}>+ Add countdown</button></div>
        {isEmptySpace && <div className="onboarding-hint"><span>✦</span><div><strong>Start by naming your first milestone</strong><small>Your shared space is ready for a first little memory.</small></div><button className="text-link" onClick={() => setShowCardForm(true)}>Add one →</button></div>}
        {showCardForm && <form className="inline-form" onSubmit={addCard}><input name="title" placeholder="What are we counting down to?" required /><input name="date" type="date" required /><input name="emoji" placeholder="Emoji" maxLength="2" /><button className="primary-button">Add card</button></form>}
        <div className="countdown-grid">{[...visibleCards].sort((a, b) => b.pinned - a.pinned).map((card) => { const title = card.title?.trim() || 'Untitled countdown — tap to name it'; return <article className={`mini-card ${card.color}`} key={card.id}><button className="pin" onClick={() => setCards((items) => items.map((item) => item.id === card.id ? { ...item, pinned: !item.pinned } : item))}>{card.pinned ? '★' : '☆'}</button><span className="card-emoji">{card.emoji || '♡'}</span><p className="kicker">{new Date(card.date) > new Date() ? 'COUNTDOWN' : 'TOGETHER SINCE'}</p><h3 className={!card.title?.trim() ? 'untitled-card' : ''}>{title}</h3><strong>{new Date(card.date) > new Date() ? daysUntil(card.date) : daysBetween(card.date)} days</strong><small>{new Date(card.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small></article> })}</div>
        <div className="two-column"><section className="paper-panel message-panel"><div className="panel-title"><div><p className="kicker">A NOTE FOR TODAY</p><h2>Daily love note</h2></div><span>✎</span></div>{editingMessage ? <form onSubmit={saveMessage}><textarea name="message" defaultValue={message} autoFocus /><button className="primary-button">Save note</button></form> : <><p className="quote">“{message}”</p><button className="text-link" onClick={() => setEditingMessage(true)}>Write your own note →</button></>}</section><section className="paper-panel mood-panel"><div className="panel-title"><div><p className="kicker">CHECK IN</p><h2>How are we feeling?</h2></div><span>today</span></div><div className="mood-person"><b>You</b><div>{['😊', '😴', '😢', '🥰'].map((mood) => <button aria-label={`You feel ${mood}`} className={moods[`${todayKey}-you`] === mood ? 'mood-selected' : ''} onClick={() => setMoods({ ...moods, [`${todayKey}-you`]: mood })} key={mood}>{mood}</button>)}</div></div><div className="mood-person"><b>Me</b><div>{['😊', '😴', '😢', '🥰'].map((mood) => <button aria-label={`Partner feels ${mood}`} className={moods[`${todayKey}-me`] === mood ? 'mood-selected' : ''} onClick={() => setMoods({ ...moods, [`${todayKey}-me`]: mood })} key={mood}>{mood}</button>)}</div></div><button className="text-link mood-history-link" onClick={() => setActiveView('planner')}>View mood history →</button></section></div><div className="engagement-strip"><span>🔥</span><div><strong>{checkInStreak} day check-in streak</strong><small>{checkInStreak ? 'Keep showing up for each other.' : 'Choose a mood today to start your streak.'}</small></div></div>
      </>}
      {activeView === 'memories' && <MemoryView memories={filteredMemories} tags={tags} tagFilter={tagFilter} setTagFilter={setTagFilter} gallery={gallery} setGallery={setGallery} addMemory={addMemory} setMemories={setMemories} />}
      {activeView === 'planner' && <PlannerView moods={moods} setMoods={setMoods} todayKey={todayKey} now={now} />}
      </>}
    </section><footer><span>made with all our love</span><span>♡ {totalDays} days of us</span></footer>
    <BottomSheet open={profileMenuOpen} onClose={() => setProfileMenuOpen(false)} title="Edit your space">
      {(closeSheet) => <div className="sheet-options">
        {[['personal', '♙', 'Personal info', 'Name, email and profile photo', '/profile/personal'], ['couple', '♡', 'Couple info', 'Nickname, date and theme', '/profile/couple'], ['security', '⌁', 'Change password', 'Keep your account secure', '/profile/password'], ['space', '↗', 'Manage couple space', 'Invite code and partner details', '/profile/couple-settings']].map(([action, icon, label, description, destination]) => <button className={`sheet-option ${selectedProfileAction === action ? 'is-selected' : ''}`} onClick={() => chooseProfileAction(closeSheet, action, destination)} key={action}><span className="sheet-option-icon">{icon}</span><span><strong>{label}</strong><small>{description}</small></span><b>›</b></button>)}
        <button className={`sheet-option sheet-logout ${selectedProfileAction === 'logout' ? 'is-selected' : ''}`} onClick={() => chooseProfileAction(closeSheet, 'logout')}><span className="sheet-option-icon">↪</span><span><strong>Log out</strong><small>End this session</small></span></button>
      </div>}
    </BottomSheet>
  </main>
}

function AnniversaryCountdown({ now, savedDate, onDateChange, anniversaryMessage, onMessageChange }) {
  const { t } = useLanguage()
  const [draftDate, setDraftDate] = useState(savedDate)
  const [unit, setUnit] = useState('days')
  const [editing, setEditing] = useState(!savedDate)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(anniversaryMessage)
  const [dateError, setDateError] = useState('')
  const target = dateFromIsoDate(savedDate)
  const differenceSeconds = target ? getCountdownDifferenceSeconds(target, now) : 0
  const isPast = differenceSeconds >= 0
  const absoluteSeconds = Math.abs(differenceSeconds)
  const value = unit === 'days' ? Math.floor(absoluteSeconds / 86400) : unit === 'hours' ? Math.floor(absoluteSeconds / 3600) : Math.floor(absoluteSeconds / 60)
  const label = isPast ? t(`${unit}Together`) : t(`${unit}Until`)

  useEffect(() => {
    if (savedDate && !draftDate) { setDraftDate(savedDate); setEditing(false) }
  }, [draftDate, savedDate])

  useEffect(() => { if (!editingTitle) setTitleDraft(anniversaryMessage) }, [anniversaryMessage, editingTitle])

  useEffect(() => {
    if (target && Math.abs(differenceSeconds) > 100 * 366 * 86400) {
      console.warn('Anniversary countdown is more than 100 years from today.', { savedDate, differenceSeconds })
    }
  }, [differenceSeconds, savedDate, target])

  function saveDate(event) {
    event.preventDefault()
    const normalizedDate = normalizeDateInput(draftDate)
    if (!normalizedDate) {
      setDateError(t('validDate'))
      return
    }
    onDateChange(normalizedDate)
    setDraftDate(normalizedDate)
    setDateError('')
    setEditing(false)
  }
  function clearDate() { onDateChange(''); setDraftDate(''); setDateError(''); setEditing(true) }
  function saveTitle(event) { event.preventDefault(); onMessageChange(titleDraft.trim().slice(0, 120)); setEditingTitle(false) }

  const defaultTitle = savedDate ? (isPast ? t('together') : t('nextCelebration')) : t('startCountdown')
  return <section className="anniversary-page"><div className="anniversary-kicker">{t('specialDate')}</div>{editingTitle ? <form className="anniversary-title-form" onSubmit={saveTitle}><input value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} placeholder={defaultTitle} maxLength="120" autoFocus /><div><button className="primary-button">{t('saveDate')}</button><button className="text-link" type="button" onClick={() => { setTitleDraft(anniversaryMessage); setEditingTitle(false) }}>{t('cancel')}</button></div></form> : <><h1>{anniversaryMessage || defaultTitle}</h1><button className="text-link anniversary-title-edit" type="button" onClick={() => setEditingTitle(true)}>แก้ไขข้อความ</button></>}{savedDate && !editing ? <><div className="anniversary-counter"><strong>{value.toLocaleString()}</strong><span>{label}</span></div><p className="anniversary-date">{t(isPast ? 'since' : 'on')} {formatBuddhistDate(target)} <small>({savedDate})</small></p><div className="anniversary-units">{['days', 'hours', 'minutes'].map((item) => <button className={unit === item ? 'selected' : ''} onClick={() => setUnit(item)} key={item}>{t(item)}</button>)}</div><button className="text-link anniversary-edit" onClick={() => { setDraftDate(savedDate); setDateError(''); setEditing(true) }}>{t('editDate')}</button></> : <form className="anniversary-form" onSubmit={saveDate}><p>{t('addDate')}</p><input type="date" value={draftDate} onChange={(event) => { setDraftDate(event.target.value); setDateError('') }} min="1900-01-01" max="2100-12-31" required />{dateError && <p role="alert">{dateError}</p>}<div><button className="primary-button">{t('saveDate')}</button>{savedDate && <button type="button" className="text-link" onClick={() => { setDraftDate(savedDate); setDateError(''); setEditing(false) }}>{t('cancel')}</button>}</div></form>}{savedDate && !editing && <button className="anniversary-clear" onClick={clearDate}>{t('removeDate')}</button>}</section>
}

function HomeSkeleton() {
  return <div className="home-skeleton" aria-label="Loading home dashboard"><div className="skeleton-line skeleton-kicker" /><div className="skeleton-line skeleton-title" /><div className="skeleton-line skeleton-subtitle" /><div className="skeleton-hero" /><div className="skeleton-cards"><span /><span /></div></div>
}

function MemoryView({ memories, tags, tagFilter, setTagFilter, gallery, setGallery, addMemory, setMemories }) {
  function deleteMemory(memoryId) {
    if (window.confirm('Delete this memory? This cannot be undone.')) setMemories((items) => items.filter((item) => item.id !== memoryId))
  }
  useEffect(() => {
    const cards = document.querySelectorAll('.memory-card')
    cards.forEach((card) => {
      if (card.querySelector('.delete-memory')) return
      const title = card.querySelector('h2')?.textContent
      const memory = memories.find((item) => item.title === title)
      if (!memory) return
      const button = document.createElement('button')
      button.className = 'delete-memory'
      button.textContent = 'Delete'
      button.type = 'button'
      button.setAttribute('aria-label', `Delete ${title}`)
      button.onclick = () => deleteMemory(memory.id)
      card.querySelector('.memory-info')?.append(button)
    })
  }, [memories])
  return <><div className="page-heading"><div><p className="kicker">OUR STORY, IN LITTLE FRAMES</p><h1>Memory archive <span>✿</span></h1><p className="subhead">The places, meals, and ordinary magic we never want to forget.</p></div><div className="view-toggle"><button className={gallery === 'timeline' ? 'selected' : ''} onClick={() => setGallery('timeline')}>☷ Timeline</button><button className={gallery === 'grid' ? 'selected' : ''} onClick={() => setGallery('grid')}>⊞ Grid</button></div></div><form className="memory-form paper-panel" onSubmit={addMemory}><p className="kicker">ADD A NEW MEMORY</p><div><input name="photo" type="file" accept="image/*" /><input name="title" placeholder="What happened?" required /><input name="date" type="date" required /><input name="tag" placeholder="#tag" /><button className="primary-button">Save memory</button></div></form><div className="filter-row">{tags.map((tag) => <button className={tagFilter === tag ? 'filter-active' : ''} key={tag} onClick={() => setTagFilter(tag)}>#{tag}</button>)}</div><div className={`memory-list ${gallery}`}>{memories.map((memory) => <article className="memory-card" key={memory.id}>{memory.image ? <img src={memory.image} alt="" /> : <div className="memory-art">{memory.emoji}</div>}<div className="memory-info"><p className="kicker">{new Date(memory.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p><h2>{memory.title}</h2><span className="tag">#{memory.tag}</span><button className="reaction" onClick={() => setMemories((items) => items.map((item) => item.id === memory.id ? { ...item, reaction: item.reaction === '💗' ? '💖' : '💗' } : item))}>{memory.reaction}</button></div></article>)}</div></>
}

function PlannerView({ moods, setMoods, todayKey, now }) {
  const currentDate = new Date(now)
  const [calendarMonth, setCalendarMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate())
  const [streakPulse, setStreakPulse] = useState(false)
  const monthKey = `${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}`
  const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`
  const isCurrentMonth = monthKey === currentMonthKey
  const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayCount = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()
  const calendarEvents = { 10: 'You', 20: 'Mew' }
  const hasBothCheckins = Boolean(moods[`${todayKey}-you`] && moods[`${todayKey}-me`])
  let streak = 0
  for (let offset = 0; offset < 365; offset += 1) {
    const day = new Date(currentDate.getTime() - offset * 86400000).toISOString().slice(0, 10)
    if (moods[`${day}-you`] && moods[`${day}-me`]) streak += 1
    else break
  }
  function shiftMonth(amount) { setCalendarMonth((value) => new Date(value.getFullYear(), value.getMonth() + amount, 1)); setSelectedDay(null) }
  function checkInTogether() {
    if (hasBothCheckins) return
    setMoods({ ...moods, [`${todayKey}-you`]: '🥰', [`${todayKey}-me`]: '🥰' })
    setStreakPulse(true)
    window.setTimeout(() => setStreakPulse(false), 420)
  }
  return <div className="planner-focus"><section className="calendar paper-panel planner-calendar"><div className="calendar-head"><button aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button><h2 key={monthKey} className="calendar-month-label">{monthName}</h2><button aria-label="Next month" onClick={() => shiftMonth(1)}>›</button></div>{!isCurrentMonth && <button className="today-button" onClick={() => { setCalendarMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)); setSelectedDay(currentDate.getDate()) }}>Today</button>}<div className="weekdays">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <b key={`${day}-${index}`}>{day}</b>)}</div><div className="calendar-grid planner-calendar-grid">{Array.from({ length: firstDay + dayCount }, (_, index) => { if (index < firstDay) return <span className="calendar-empty" key={`empty-${index}`} />; const day = index - firstDay + 1; const isToday = isCurrentMonth && day === currentDate.getDate(); const person = calendarMonth.getMonth() === 8 ? calendarEvents[day] : null; return <button className={`calendar-day ${isToday ? 'today-day' : ''} ${selectedDay === day ? 'selected-day' : ''} ${person ? `event-${person.toLowerCase()}` : ''}`} onClick={() => setSelectedDay(day)} key={day}>{day}{person && <i aria-label={`Plan added by ${person}`} />}</button> })}</div><div className="calendar-legend"><span className="legend-you">You</span><span className="legend-me">Mew</span></div>{selectedDay && <div className="selected-plan"><p className="kicker">{monthName} {selectedDay}</p><strong>{calendarMonth.getMonth() === 8 && calendarEvents[selectedDay] ? `Plan added by ${calendarEvents[selectedDay]}` : 'No plans yet'}</strong></div>}</section><section className={`streak-card paper-panel ${streakPulse ? 'streak-pulse' : ''}`}><div className="streak-flame" style={{ '--flame-scale': `${Math.min(1.65, 1 + streak / 20)}` }}>🔥</div><strong>{streak}</strong><span>day streak</span><button className="streak-checkin" disabled={hasBothCheckins} onClick={checkInTogether}>{hasBothCheckins ? 'Checked in' : 'Check in together'}</button></section></div>
}

/* Legacy Planner implementation removed: the active Planner now contains only calendar and streak. */
/*
function LegacyPlannerView({ tasks, setTasks, completedTasks, dateIdea, randomIdea }) {
  const categories = [...new Set(tasks.map((task) => task.category))]
  const calendarEvents = { 10: 'You', 20: 'Mew' }
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 8, 1))
  const [selectedDay, setSelectedDay] = useState(null)
  const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayCount = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const shiftMonth = (amount) => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  return <><div className="page-heading"><div><p className="kicker">OUR SHARED PLAN</p><h1>Make a little room<br /><span>for fun.</span></h1><p className="subhead">Plans are better when they are ours.</p></div><button className="surprise-button" onClick={randomIdea}>✦ Surprise me</button></div><section className="idea-card"><span>DATE IDEA</span><strong>{dateIdea}</strong><button onClick={randomIdea}>another one ↗</button></section><div className="planner-layout"><section className="calendar paper-panel"><div className="calendar-head"><button aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button><h2>{monthName}</h2><button aria-label="Next month" onClick={() => shiftMonth(1)}>›</button></div><div className="weekdays">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <b key={`${day}-${index}`}>{day}</b>)}</div><div className="calendar-grid">{Array.from({ length: dayCount }, (_, index) => { const day = index + 1; const person = calendarMonth.getMonth() === 8 ? calendarEvents[day] : null; return <button className={`calendar-day ${selectedDay === day ? 'selected-day' : ''} ${person ? `event-${person.toLowerCase()}` : ''}`} onClick={() => setSelectedDay(day)} key={day}>{day}{person && <i aria-label={`Plan added by ${person}`} />}</button> })}</div><div className="calendar-legend"><span className="legend-you">You</span><span className="legend-me">Mew</span></div>{selectedDay && <div className="selected-plan"><p className="kicker">{monthName} {selectedDay}</p><strong>{calendarMonth.getMonth() === 8 && calendarEvents[selectedDay] ? `Plan added by ${calendarEvents[selectedDay]}` : 'No plans yet'}</strong><small>{calendarMonth.getMonth() === 8 && calendarEvents[selectedDay] ? 'Tap a task on the right to keep your shared plan moving.' : 'A free day is a good day for a little surprise.'}</small></div>}</section><section className="todo-panel"><div className="panel-title"><div><p className="kicker">THE LITTLE LIST</p><h2>{completedTasks}/{tasks.length} done together</h2></div><span>↗</span></div>{categories.map((category) => <div className="task-category" key={category}><div><b>{category}</b><small>{tasks.filter((task) => task.category === category && task.done).length}/{tasks.filter((task) => task.category === category).length}</small></div>{tasks.filter((task) => task.category === category).map((task) => { const isExample = task.isExample || task.title === 'Make this space ours'; return <label className={`${task.done ? 'task done' : 'task'} ${isExample ? 'task-example' : ''}`} key={task.id}><input type="checkbox" checked={task.done} onChange={() => setTasks((items) => items.map((item) => item.id === task.id ? { ...item, done: !item.done, isExample: false } : item))} /><span>{task.title}</span>{isExample && <em>example</em>}<i className={task.who === 'You' ? 'you-dot' : task.who === 'Mew' ? 'me-dot' : 'both-dot'}>{task.who}</i></label> })}</div>)}</section></div><div className="streak"><span>🔥</span><div><b>3 week shared streak</b><small>Keep showing up for each other. You are doing beautifully.</small></div><strong>+1</strong></div></>
}
*/

export default App
