import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api`

export default function AdminPage() {
  const { token, user } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [home, setHome] = useState(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { if (!response.ok) throw new Error((await response.json()).message); return response.json() })
      .then((data) => { setUsers(data); if (data[0]) setSelectedId(String(data[0].id)) })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    const selected = users.find((item) => String(item.id) === selectedId)
    if (!selected) return
    setEmail(selected.email)
    setRole(selected.role)
    fetch(`${API_URL}/admin/users/${selected.id}/home`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then(setHome)
      .catch(() => setMessage('Unable to load this user home data.'))
  }, [selectedId, users, token])

  async function saveUser(event) {
    event.preventDefault()
    const response = await fetch(`${API_URL}/admin/users/${selectedId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email, role }) })
    const data = await response.json()
    if (!response.ok) { setMessage(data.message || 'Unable to update user.'); return }
    setUsers((items) => items.map((item) => String(item.id) === selectedId ? data : item))
    setMessage('User account updated.')
  }

  async function saveHome(event) {
    event.preventDefault()
    const response = await fetch(`${API_URL}/admin/users/${selectedId}/home`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ dailyMessage: home.dailyMessage, cards: home.cards, tasks: home.tasks }) })
    const data = await response.json()
    setMessage(response.ok ? 'Home data updated.' : data.message || 'Unable to update home data.')
  }

  if (loading) return <main className="admin-page"><p className="kicker">ADMIN CONSOLE</p><h1>Loading users...</h1></main>
  return <main className="admin-page"><header className="admin-header"><div><p className="kicker">NORTHSTAR / ADMIN CONSOLE</p><h1>Manage your universe.</h1><p className="subhead">Signed in as {user?.email}</p></div><a href="/" className="back-home">← Back home</a></header><div className="admin-layout"><aside className="user-list paper-panel"><div className="panel-title"><h2>Accounts</h2><span>{users.length}</span></div>{users.map((item) => <button className={String(item.id) === selectedId ? 'user-row selected' : 'user-row'} key={item.id} onClick={() => setSelectedId(String(item.id))}><span>{item.email}</span><small>{item.role}</small></button>)}</aside><section className="admin-editor">{selectedId && <><form className="paper-panel admin-form" onSubmit={saveUser}><p className="kicker">ACCOUNT DETAILS</p><h2>Edit account</h2><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option value="user">User</option><option value="admin">Admin</option></select></label><button className="primary-button">Save account</button></form>{home && <form className="paper-panel admin-form" onSubmit={saveHome}><p className="kicker">HOME CONTENT</p><h2>Edit daily message</h2><label>Daily love note<textarea value={home.dailyMessage || ''} onChange={(event) => setHome({ ...home, dailyMessage: event.target.value })} /></label><label>Countdown cards JSON<textarea value={JSON.stringify(home.cards || [], null, 2)} onChange={(event) => { try { setHome({ ...home, cards: JSON.parse(event.target.value) }) } catch { /* keep typing until valid JSON */ } }} /></label><label>Tasks JSON<textarea value={JSON.stringify(home.tasks || [], null, 2)} onChange={(event) => { try { setHome({ ...home, tasks: JSON.parse(event.target.value) }) } catch { /* keep typing until valid JSON */ } }} /></label><button className="primary-button">Save home data</button></form>}</>}</section></div>{message && <p className="admin-message" role="status">{message}</p>}</main>
}
