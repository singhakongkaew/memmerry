import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api`

function compressProfileImage(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 600 / image.width)
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

export default function ProfilePage({ section: routeSection = '' }) {
  const { token, user, updateUser, updateCouple, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState({ displayName: user?.displayName || '', email: user?.email || '', profileImage: user?.profileImage || '', currentPassword: '' })
  const [couple, setCouple] = useState(null)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const activeSection = routeSection || ({ personal: 'personal', couple: 'couple', password: 'password', 'couple-settings': 'couple-settings' }[location.pathname.split('/').pop()] || '')

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load profile.')
        const latest = await response.json()
        updateUser(latest, latest.token || token)
        setProfile({ displayName: latest.displayName || '', email: latest.email || '', profileImage: latest.profileImage || '', currentPassword: '' })
      })
      .catch((error) => setMessage(error.message))
  }, [token])

  useEffect(() => {
    if (activeSection) document.documentElement.dataset.profileSection = activeSection
    else delete document.documentElement.dataset.profileSection
    return () => delete document.documentElement.dataset.profileSection
  }, [activeSection])

  useEffect(() => {
    fetch(`${API_URL}/profile/couple`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then((data) => setCouple(data.couple))
      .catch(() => setMessage('Unable to load couple information.'))
  }, [token])

  useEffect(() => {
    const sectionMap = { personal: '.profile-section:nth-child(1)', couple: '.profile-section:nth-child(2)', password: '.profile-section:nth-child(3)', 'couple-settings': '.profile-section:nth-child(2)' }
    const target = location.hash ? sectionMap[location.hash.slice(1)] : sectionMap[activeSection]
    if (!target) return undefined
    const timer = window.setTimeout(() => document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    return () => window.clearTimeout(timer)
  }, [activeSection, location.hash, location.pathname])

  function notify(text) { setMessage(text); window.clearTimeout(window.profileToast); window.profileToast = window.setTimeout(() => setMessage(''), 2800) }
  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const image = await compressProfileImage(reader.result)
        const response = await fetch(`${API_URL}/media/profile-image`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ image }) })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Image upload failed.')
        setProfile((current) => ({ ...current, profileImage: data.imageUrl }))
      } catch (error) { notify(error.message) }
    }
    reader.readAsDataURL(file)
  }
  async function savePersonal(event) {
    event.preventDefault(); setSaving(true)
    try {
      const response = await fetch(`${API_URL}/profile/me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(profile) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      updateUser(data.user, data.token); setProfile((current) => ({ ...current, currentPassword: '' })); notify('Personal information saved.')
    } catch (error) { notify(error.message) } finally { setSaving(false) }
  }
  async function saveCouple(event) {
    event.preventDefault(); setSaving(true)
    try {
      const response = await fetch(`${API_URL}/profile/couple`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(couple) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setCouple(data.couple); updateCouple(data.couple); notify('Couple settings saved.')
    } catch (error) { notify(error.message) } finally { setSaving(false) }
  }
  async function changePassword(event) {
    event.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) { notify('New passwords do not match.'); return }
    try {
      const response = await fetch(`${API_URL}/profile/me/password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); notify(data.message)
    } catch (error) { notify(error.message) }
  }
  async function leaveCouple() {
    if (!window.confirm('Leave this couple space? Shared data will remain for the other member.')) return
    const response = await fetch(`${API_URL}/profile/couple/leave`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) { notify('Unable to leave couple space.'); return }
    logout(); navigate('/login', { replace: true })
  }
  const inviteLink = couple?.inviteCode ? `${window.location.origin}/login?invite=${encodeURIComponent(couple.inviteCode)}` : ''

  return <main className="profile-page"><header className="profile-header"><button className="back-home" onClick={() => navigate('/')}>← Home</button><div><p className="kicker">YOUR PRIVATE SPACE</p><h1>Profile & settings</h1><p className="subhead">Keep your details and your shared world up to date.</p></div><button className="logout-button" onClick={logout}>Log out</button></header>{message && <div className="profile-toast" role="status">{message}</div>}<div className="profile-grid"><form className="paper-panel profile-section" onSubmit={savePersonal}><p className="kicker">PERSONAL INFO</p><h2>About you</h2><div className="profile-photo-row"><div className="profile-photo">{profile.profileImage ? <img src={profile.profileImage} alt="Profile" /> : <span>{(profile.displayName || profile.email || '?')[0].toUpperCase()}</span>}</div><label className="photo-button">Change photo<input type="file" accept="image/*" onChange={choosePhoto} /></label></div><label>Display name<input value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} placeholder="Your name" /></label><label>Email<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} required /></label>{profile.email !== user?.email && <label>Current password to confirm email<input type="password" value={profile.currentPassword} onChange={(event) => setProfile({ ...profile, currentPassword: event.target.value })} required /></label>}<button className="primary-button" disabled={saving}>Save personal info</button></form><form className="paper-panel profile-section" onSubmit={saveCouple}><p className="kicker">COUPLE INFO</p><h2>Your shared universe</h2>{couple && <><label>Couple nickname<input value={couple.nickname || ''} onChange={(event) => setCouple({ ...couple, nickname: event.target.value })} placeholder="honey, my love..." /></label><label>Relationship start date<input type="date" value={couple.startDate ? couple.startDate.slice(0, 10) : ''} onChange={(event) => setCouple({ ...couple, startDate: event.target.value })} /></label><label>Space theme<select value={couple.theme || 'peach'} onChange={(event) => setCouple({ ...couple, theme: event.target.value })}><option value="peach">Peach day</option><option value="rose">Rose glow</option><option value="sunny">Sunny yellow</option></select></label><div className="invite-box"><span>Invite code</span><strong>{couple.inviteCode}</strong><button type="button" onClick={() => navigator.clipboard.writeText(inviteLink)}>Copy invite link</button></div><div className="partner-list"><span>Members</span>{couple.members?.map((member) => <p key={member._id}>{member.displayName || member.email}<small>joined {new Date(member.createdAt).toLocaleDateString()}</small></p>)}</div></>}<button className="primary-button" disabled={saving}>Save couple settings</button></form><form className="paper-panel profile-section" onSubmit={changePassword}><p className="kicker">ACCOUNT / SECURITY</p><h2>Password</h2><label>Current password<input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required /></label><label>New password<input type="password" minLength="8" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} required /></label><label>Confirm new password<input type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} required /></label><button className="primary-button">Change password</button><button className="danger-button" type="button" onClick={leaveCouple}>Leave this couple space</button></form></div></main>
}
