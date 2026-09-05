'use client'

import { useState } from 'react'
import { LoaderCircle, RefreshCw, ShieldCheck, Unplug } from 'lucide-react'
import { type TelegramPermissions, useTelegramAccount } from '@/hooks/useTelegramAccount'

const permissionLabels: Array<[keyof TelegramPermissions, string]> = [
  ['telegram.connect', 'Connect account'],
  ['telegram.sync', 'Sync contacts and messages'],
  ['telegram.send', 'Send messages'],
  ['telegram.disconnect', 'Disconnect and delete data'],
]

export function TelegramAccountPanel() {
  const telegram = useTelegramAccount()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<TelegramPermissions>({
    'telegram.connect': true,
    'telegram.sync': true,
    'telegram.send': true,
    'telegram.disconnect': true,
  })

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setFormError(null)
    try {
      await action()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Telegram request failed')
    } finally {
      setBusy(false)
    }
  }

  if (telegram.account.connected) {
    return (
      <section className="border-b border-black/10 bg-[#f4f8f7] px-4 py-3 text-gray-800 dark:border-white/10 dark:bg-[#17201e] dark:text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck size={18} className="shrink-0 text-[#168b6b]" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{telegram.account.displayName || 'Telegram connected'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {telegram.account.lastSyncAt ? `Synced ${new Date(telegram.account.lastSyncAt).toLocaleString()}` : 'Ready to sync'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => void run(telegram.sync)} disabled={busy || !telegram.account.permissions['telegram.sync']} className="rounded-md p-2 hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10" title="Sync Telegram">
              <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />
            </button>
            <button type="button" onClick={() => void run(telegram.disconnect)} disabled={busy || !telegram.account.permissions['telegram.disconnect']} className="rounded-md p-2 text-red-600 hover:bg-red-500/10 disabled:opacity-40" title="Disconnect and delete Telegram data">
              <Unplug size={15} />
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {permissionLabels.map(([scope, label]) => (
            <label key={scope} className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={telegram.account.permissions[scope]} onChange={(event) => void run(() => telegram.updatePermissions({ [scope]: event.target.checked }))} />
              {label}
            </label>
          ))}
        </div>
        {(formError || telegram.error) && <p className="mt-2 text-[11px] text-red-600">{formError || telegram.error}</p>}
      </section>
    )
  }

  const pendingCode = telegram.account.status === 'pending_code'
  const pendingPassword = telegram.account.status === 'pending_password'

  return (
    <section className="border-b border-black/10 bg-[#f4f8f7] px-4 py-3 text-gray-800 dark:border-white/10 dark:bg-[#17201e] dark:text-white">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck size={17} className="text-[#168b6b]" />
        <div>
          <p className="text-xs font-semibold">Connect your Telegram account</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Your encrypted session stays scoped to this SmartyAI account.</p>
        </div>
      </div>
      {!pendingCode && !pendingPassword && (
        <form onSubmit={(event) => {
          event.preventDefault()
          void run(async () => {
            await telegram.connect(phoneNumber, permissions)
            setPhoneNumber('')
          })
        }} className="space-y-2">
          <input aria-label="Telegram phone number" autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Phone number with country code" className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#168b6b] dark:border-white/10 dark:bg-black/20" required />
          <div className="grid grid-cols-2 gap-1.5">
            {permissionLabels.map(([scope, label]) => (
              <label key={scope} className="flex items-center gap-1.5 text-[10px]">
                <input type="checkbox" checked={permissions[scope]} onChange={(event) => setPermissions((current) => ({ ...current, [scope]: event.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
          <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-md bg-[#168b6b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {busy && <LoaderCircle size={14} className="animate-spin" />}
            Send login code
          </button>
        </form>
      )}
      {(pendingCode || pendingPassword) && (
        <form onSubmit={(event) => {
          event.preventDefault()
          const submittedCode = code
          const submittedPassword = password
          setCode('')
          setPassword('')
          void run(() => telegram.verify(pendingCode ? submittedCode : undefined, pendingPassword ? submittedPassword : undefined))
        }} className="flex items-center gap-2">
          <input aria-label={pendingPassword ? 'Telegram two-step verification password' : 'Telegram login code'} type={pendingPassword ? 'password' : 'text'} inputMode={pendingPassword ? undefined : 'numeric'} autoComplete="one-time-code" value={pendingPassword ? password : code} onChange={(event) => pendingPassword ? setPassword(event.target.value) : setCode(event.target.value)} placeholder={pendingPassword ? 'Two-step verification password' : 'Login code'} className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#168b6b] dark:border-white/10 dark:bg-black/20" required />
          <button type="submit" disabled={busy} className="rounded-md bg-[#168b6b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Verify</button>
        </form>
      )}
      {(formError || telegram.error) && <p className="mt-2 text-[11px] text-red-600">{formError || telegram.error}</p>}
    </section>
  )
}