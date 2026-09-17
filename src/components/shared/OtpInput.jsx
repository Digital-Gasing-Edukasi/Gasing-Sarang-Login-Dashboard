import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

export function OtpInput({ onChange, onComplete, disabled, error }) {
  const [values, setValues] = useState(Array(6).fill(''))
  const refs = useRef([])

  const commit = (next) => {
    setValues(next)
    const code = next.join('')
    onChange?.(code)
    if (next.every(x => x !== '')) onComplete?.(code)
  }

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...values]; next[i] = v; commit(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (values[i]) { const n = [...values]; n[i] = ''; commit(n) }
      else if (i > 0) refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) { commit(paste.split('')); refs.current[5]?.focus() }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center">
      {values.map((v, i) => (
        <input key={i} ref={el => refs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1} value={v}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
          aria-label={`Digit OTP ${i + 1}`}
          className={cn(
            'h-14 w-14 rounded-xl border-[1.5px] bg-white text-center font-poppins text-xl font-semibold text-[#0033EC] outline-none transition-colors focus:border-[#0033EC] focus:ring-2 focus:ring-[#0033EC]/10',
            v && 'border-[#0033EC]',
            !v && !error && 'border-[#D1D3DA]',
            error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-red-500/10',
            disabled && 'opacity-50 cursor-not-allowed',
          )} />
      ))}
    </div>
  )
}
