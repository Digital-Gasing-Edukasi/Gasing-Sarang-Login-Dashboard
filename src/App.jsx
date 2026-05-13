import { useState, useEffect } from 'react'
import { tokenStorage } from '@/lib/api'
import { LeftPanel }    from '@/components/layout/LeftPanel'

import { LoginPage }        from '@/pages/auth/LoginPage'
import { SignUpPage }       from '@/pages/auth/SignUpPage'
import { SignUpOtpPage }    from '@/pages/auth/SignUpOtpPage'
import { SignUpReviewPage } from '@/pages/auth/SignUpReviewPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { CheckEmailPage }   from '@/pages/auth/CheckEmailPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { SsoCallbackPage }  from '@/pages/auth/SsoCallbackPage'

import SubscriptionPage     from '@/pages/SubscriptionPage'
import PaymentSuccessPage   from '@/pages/PaymentSuccessPage'
import PaymentFinishPage    from '@/pages/PaymentFinishPage'
import PaymentUnfinishPage  from '@/pages/PaymentUnfinishPage'
import PaymentErrorPage     from '@/pages/PaymentErrorPage'
import AdminDashboardPage   from '@/pages/AdminDashboardPage'
import MidtransTestPage     from '@/pages/MidtransTestPage'

export default function App() {
  const [page, setPage]             = useState('login')
  const [otpToken, setOtpToken]     = useState('')
  const [regEmail, setRegEmail]     = useState('')
  const [fpEmail, setFpEmail]       = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [ssoParams, setSsoParams]   = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [activePlanName, setActivePlanName] = useState('')

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search)
    const pathname = window.location.pathname

    // ── Snap Redirect landing pages (Midtrans redirects browser ke sini) ────
    if (pathname.includes('/payment/finish')) {
      setPage('payment-finish')
      return
    }
    if (pathname.includes('/payment/unfinish')) {
      setPage('payment-unfinish')
      return
    }
    if (pathname.includes('/payment/error')) {
      setPage('payment-error')
      return
    }

    // ── Query param routing ───────────────────────────────────────────────
    const paymentStatus = params.get('payment')
    const token         = params.get('token')
    const emailParam    = params.get('email')
    const adminParam    = params.get('admin')
    const midtransTest  = params.get('midtrans-test')
    const ssoParam      = params.get('sso')
    const sigParam      = params.get('sig')

    if (midtransTest === 'true') {
      setPage('midtrans-test')
    } else if (ssoParam && sigParam) {
      setSsoParams({ sso: ssoParam, sig: sigParam })
      window.history.replaceState({}, '', window.location.pathname)
      setPage(tokenStorage.getAccess() ? 'sso-callback' : 'login')
    } else if (adminParam === 'true') {
      setPage('admin-dashboard')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (paymentStatus === 'success') {
      const planName = params.get('plan')
      if (planName) setActivePlanName(decodeURIComponent(planName))
      setPage('payment-success')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (token) {
      setResetToken(token)
      if (emailParam) setResetEmail(decodeURIComponent(emailParam))
      setPage('reset-password')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleOtpToken = (token, email) => {
    setOtpToken(token); setRegEmail(email)
  }

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    if (user?.superadmin === true || user?.superAdmin === true) {
      setPage('admin-dashboard')
    } else if (ssoParams) {
      setPage('sso-callback')
    } else {
      setPage('subscription')
    }
  }

  const handleSignOut = () => {
    tokenStorage.clear(); setCurrentUser(null); setPage('login')
  }

  const handleEmailSent = (email) => {
    setFpEmail(email); setPage('check-email')
  }

  const handlePaymentSuccess = (planName) => {
    if (planName) setActivePlanName(planName)
    setPage('payment-success')
  }

  // ── Full-screen pages ─────────────────────────────────────────────────────
  if (page === 'payment-finish')   return <PaymentFinishPage />
  if (page === 'payment-unfinish') return <PaymentUnfinishPage />
  if (page === 'payment-error')    return <PaymentErrorPage />
  if (page === 'midtrans-test')    return <MidtransTestPage />
  if (page === 'subscription')    return <SubscriptionPage user={currentUser} onSignOut={handleSignOut} onPaymentSuccess={handlePaymentSuccess} onPaymentPending={() => setPage('admin-dashboard')} />
  if (page === 'payment-success') return <PaymentSuccessPage user={currentUser} onSignOut={handleSignOut} activePlanName={activePlanName} />
  if (page === 'forgot-password') return <ForgotPasswordPage onNavigate={setPage} onEmailSent={handleEmailSent} />
  if (page === 'check-email')     return <CheckEmailPage email={fpEmail} onNavigate={setPage} />
  if (page === 'reset-password')  return <ResetPasswordPage token={resetToken} email={resetEmail} onNavigate={setPage} />
  if (page === 'admin-dashboard') return <AdminDashboardPage user={currentUser} onSignOut={handleSignOut} />

  // ── Split-layout pages (login / signup) ───────────────────────────────────
  const authPages = {
    'login':         <LoginPage onNavigate={setPage} onLoginSuccess={handleLoginSuccess} isSsoMode={!!ssoParams} />,
    'signup':        <SignUpPage onNavigate={setPage} onOtpToken={handleOtpToken} />,
    'signup-otp':    <SignUpOtpPage onNavigate={setPage} otpToken={otpToken} email={regEmail} />,
    'signup-review': <SignUpReviewPage onNavigate={setPage} />,
    'sso-callback':  ssoParams ? <SsoCallbackPage sso={ssoParams.sso} sig={ssoParams.sig} onNavigate={setPage} /> : null,
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />
      {authPages[page] ?? authPages['login']}
    </div>
  )
}
