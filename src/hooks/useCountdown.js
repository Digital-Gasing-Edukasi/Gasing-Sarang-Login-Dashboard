import { useState, useEffect } from 'react'

export function useCountdown(initialSeconds) {
  const [remaining, setRemaining] = useState(initialSeconds)

  useEffect(() => {
    if (remaining <= 0) return
    const t = setTimeout(() => setRemaining(x => x - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return {
    display: `${mm}:${ss}`,
    expired: remaining === 0,
    reset: () => setRemaining(initialSeconds),
  }
}
