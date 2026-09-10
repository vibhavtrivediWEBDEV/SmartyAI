'use client'

import { useEffect, useState } from 'react'
import { Bell, LoaderCircle, QrCode, RefreshCw, ShieldCheck, Unplug } from 'lucide-react'
import { type WhatsAppPermissions, useWhatsAppAccount } from '@/hooks/useWhatsAppAccount'

const permissionLabels: Array<[keyof WhatsAppPermissions, string]> = [
  ['whatsapp.connect', 'Connect account'],
  ['whatsapp.sync', 'Sync chats and messages'],
  ['whatsapp.send', 'Send messages and media'],
  ['whatsapp.disconnect', 'Disconnect and delete data'],
]

export function WhatsAppAccountPanel() {
  const whatsapp = useWhatsAppAccount()
  const [busy, setBusy] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [permissions, setPermissions] = useState<WhatsAppPermissions>({
    'whatsapp.connect': true,
    'whatsapp.sync': true,
    'whatsapp.send': true,
    'whatsapp.disconnect': true,
  })

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setFormError(null)
    try { await action() } catch (error) {
      setFormError(error instanceof Error ? error.message : 'WhatsApp request failed')
    } finally { setBusy(false) }
  }

  const refreshQr = async () => {
    const result = await whatsapp.getQr()
    setQrCode(result.qrCode)
  }

  useEffect(() => {
    if (whatsapp.account.status === 'qr_ready' && !qrCode) {
      // Automatically fetch QR when status becomes qr_ready
      void run(refreshQr)
    }
    // Also handle transition from connecting to qr_ready
    if (whatsapp.account.status === 'connecting') {
      setQrCode(null) // Clear stale QR while connecting
    }
  }, [whatsapp.account.status, qrCode])

  useEffect(() => {
    setNotificationPermission('Notification' in window ? Notification.permission : 'unsupported')
  }, [])

  const enableCallNotifications = async () => {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
  }

  if (whatsapp.account.connected) {
    return (
      <section className="border-b border-black/10 bg-[#f4f8f7] px-4 py-3 text-gray-800 dark:border-white/10 dark:bg-[#17201e] dark:text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2"><ShieldCheck size={18} className="shrink-0 text-[#168b6b]" /><div className="min-w-0"><p className="truncate text-xs font-semibold">{whatsapp.account.displayName || whatsapp.account.phone || 'WhatsApp connected'}</p><p className="text-[10px] text-gray-500 dark:text-gray-400">{whatsapp.account.lastSyncAt ? `Synced ${new Date(whatsapp.account.lastSyncAt).toLocaleString()}` : 'Ready to sync'}</p></div></div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => void run(whatsapp.sync)} disabled={busy || !whatsapp.account.permissions['whatsapp.sync']} className="rounded-md p-2 hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10" title="Sync WhatsApp"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /></button>
            <button type="button" onClick={() => void run(whatsapp.disconnect)} disabled={busy || !whatsapp.account.permissions['whatsapp.disconnect']} className="rounded-md p-2 text-red-600 hover:bg-red-500/10 disabled:opacity-40" title="Disconnect and delete WhatsApp data"><Unplug size={15} /></button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">{permissionLabels.map(([scope, label]) => <label key={scope} className="flex items-center gap-1.5 text-[10px]"><input type="checkbox" checked={whatsapp.account.permissions[scope]} onChange={(event) => void run(() => whatsapp.updatePermissions({ [scope]: event.target.checked }))} />{label}</label>)}</div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/10 pt-3 text-[11px] dark:border-white/10">
          <span><span className="block font-semibold">Incoming call notifications</span><span className="text-[10px] text-gray-500 dark:text-gray-400">{notificationPermission === 'granted' ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked in browser site settings' : notificationPermission === 'default' ? 'Permission not requested' : 'Not supported by this browser'}</span></span>
          <button type="button" onClick={() => void enableCallNotifications()} disabled={notificationPermission !== 'default'} className="flex items-center gap-1.5 rounded-md border border-[#168b6b] px-2.5 py-1.5 text-[10px] font-semibold text-[#168b6b] disabled:cursor-default disabled:opacity-60"><Bell size={12} />{notificationPermission === 'granted' ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked' : 'Enable'}</button>
        </div>
        <label className="mt-3 flex items-center justify-between gap-3 border-t border-black/10 pt-3 text-[11px] dark:border-white/10"><span><span className="block font-semibold">Auto-reject incoming calls</span><span className="text-[10px] text-gray-500 dark:text-gray-400">OpenWA still reports each incoming call.</span></span><input type="checkbox" checked={whatsapp.account.autoRejectCalls} disabled={busy || !whatsapp.account.permissions['whatsapp.send']} onChange={(event) => void run(() => whatsapp.updateAutoRejectCalls(event.target.checked))} /></label>
        {(formError || whatsapp.error) && <p className="mt-2 text-[11px] text-red-600">{formError || whatsapp.error}</p>}
      </section>
    )
  }

  return (
    <section className="border-b border-black/10 bg-[#f4f8f7] px-4 py-3 text-gray-800 dark:border-white/10 dark:bg-[#17201e] dark:text-white">
      <div className="mb-3 flex items-center gap-2"><QrCode size={18} className="text-[#168b6b]" /><div><p className="text-xs font-semibold">Link WhatsApp</p><p className="text-[10px] text-gray-500 dark:text-gray-400">Scan with WhatsApp under Linked devices.</p></div></div>
      {!qrCode ? (
        <><div className="grid grid-cols-2 gap-1.5">{permissionLabels.map(([scope, label]) => <label key={scope} className="flex items-center gap-1.5 text-[10px]"><input type="checkbox" checked={permissions[scope]} onChange={(event) => setPermissions((current) => ({ ...current, [scope]: event.target.checked }))} />{label}</label>)}</div><button type="button" onClick={() => void run(async () => { setQrCode(null); await whatsapp.connect(permissions) })} disabled={busy} className="mt-3 flex items-center gap-2 rounded-md bg-[#168b6b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy && <LoaderCircle size={14} className="animate-spin" />}Connect WhatsApp</button></>
      ) : (
        <div className="flex items-center gap-3"><div className="rounded-md bg-white p-2 shadow-sm"><img src={qrCode} alt="WhatsApp linking QR code" className="h-36 w-36" /></div><div><p className="max-w-[150px] text-[10px] leading-relaxed text-gray-600 dark:text-gray-300">Open WhatsApp, choose Linked devices, then scan this code.</p><button type="button" onClick={() => void run(refreshQr)} disabled={busy} className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#168b6b]"><RefreshCw size={12} className={busy ? 'animate-spin' : ''} />Refresh code</button></div></div>
      )}
      <p className="mt-2 text-[10px] text-gray-500">Status: {whatsapp.account.status.replace('_', ' ')}</p>
      {(formError || whatsapp.error) && <p className="mt-2 text-[11px] text-red-600">{formError || whatsapp.error}</p>}
    </section>
  )
}