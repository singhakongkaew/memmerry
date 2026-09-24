import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

function GoogleMark() {
  return <svg className="google-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" /><path fill="#34A853" d="M12 21.73c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.48-4.04H3.28v2.53A9.74 9.74 0 0 0 12 21.73Z" /><path fill="#FBBC05" d="M6.52 13.8a5.85 5.85 0 0 1 0-3.6V7.67H3.28a9.77 9.77 0 0 0 0 8.66l3.24-2.53Z" /><path fill="#EA4335" d="M12 6.16c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.28 14.63 2.27 12 2.27a9.74 9.74 0 0 0-8.72 5.4l3.24 2.53C7.29 7.88 9.45 6.16 12 6.16Z" /></svg>
}

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(() => searchParams.has('invite') ? 'signup' : 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = form.get('email')
    const password = form.get('password')
    if (mode === 'signup' && password !== form.get('confirmPassword')) { setMessage('Passwords do not match.'); return }
    setMessage(mode === 'signup' ? 'Creating your account...' : 'Signing you in...')
    try {
      if (mode === 'signup') await signup(email, password, form.get('inviteCode'))
      else await login(email, password, searchParams.get('invite'))
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (error) { setMessage(error.message) }
  }

  return <main className="login-shell"><div className="ambient-glow ambient-glow-left" /><div className="ambient-glow ambient-glow-right" /><section className="login-panel" aria-label="Sign in"><div className="brand-mark"><span className="brand-icon">♥</span><span className="brand-name">ours.</span></div><div className="login-copy"><p className="eyebrow">A LITTLE SPACE FOR TWO <span>✿</span></p><h1>{mode === 'login' ? <>Welcome<br /><em>back.</em></> : <>Start your<br /><em>story.</em></>}</h1><p className="intro">{mode === 'login' ? 'Sign in to continue your journey and keep everything in one place.' : 'Create a new space, or join your partner with an invite code.'}</p></div><form className="login-form" onSubmit={handleSubmit}><label htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required /><div className="field-heading"><label htmlFor="password">Password</label>{mode === 'login' && <button className="text-button" type="button" onClick={() => setMessage('Password reset is not configured yet.')}>Forgot password?</button>}</div><div className="password-field"><input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /><button className="visibility-button" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'HIDE' : 'SHOW'}</button></div>{mode === 'signup' && <><label className="confirm-label" htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" autoComplete="new-password" required /><label className="confirm-label" htmlFor="inviteCode">Partner invite code <small>(optional)</small></label><input id="inviteCode" name="inviteCode" defaultValue={searchParams.get('invite') || ''} placeholder="Leave empty to create a new space" /></>}<button className="submit-button" type="submit"><span>{mode === 'login' ? 'Enter workspace' : 'Create account'}</span><span className="arrow">→</span></button><div className="login-divider"><span>OR</span></div><button className="google-button" type="button" onClick={() => setMessage('Google sign-in needs OAuth configuration on the server.')}><GoogleMark /><span>Continue with Google</span></button>{message && <p className="form-message" role="status">{message}</p>}</form><p className="signup-prompt">{mode === 'login' ? 'New to ours?' : 'Already have an account?'} <button className="text-button" type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p></section><aside className="login-aside"><div className="grid-lines" /><div className="aside-content"><p className="aside-index">01 / 03</p><div className="orbit-graphic"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit-core">♥</span></div><p className="aside-quote">“Little moments,<br /><strong>ours forever.</strong>”</p><div className="aside-footer"><span>MADE WITH LOVE</span><span>JUST FOR TWO</span></div></div></aside></main>
}
