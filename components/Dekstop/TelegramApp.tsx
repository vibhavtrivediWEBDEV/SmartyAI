'use client'

import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Bot,
  CheckCheck,
  ChevronDown,
  MoreVertical,
  Paperclip,
  Phone,
  RefreshCw,
  Search,
  Send,
  Settings,
  Smile,
  SquarePen,
  Users,
  Video,
  Wifi,
  X,
} from 'lucide-react'
import { TelegramAccountPanel } from './TelegramAccountPanel'
import { TelegramLiveLogs } from './TelegramLiveLogs'
import { type TelegramConversation, type TelegramMessage, useTelegramAccount } from '@/hooks/useTelegramAccount'
import { playById } from '@/lib/sound'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'T'
}

function avatarColor(value: string) {
  const colors = ['#5b8def', '#e17076', '#5bbd8c', '#a27ae8', '#dc9448', '#42a8b8', '#d56fa4']
  const index = Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0)
  return colors[index % colors.length]
}

function formatConversationTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const dayDifference = Math.floor((today.getTime() - date.getTime()) / 86_400_000)
  if (dayDifference < 7) return date.toLocaleDateString([], { weekday: 'short' })
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' })
}

function isSmartyConversation(conversation: TelegramConversation) {
  return conversation.kind === 'user' && /^smarty(?:\s*ai)?$/i.test(conversation.title.trim())
}

export default function TelegramApp() {
  const telegram = useTelegramAccount()
  const [activeView, setActiveView] = useState<'chats' | 'smarty'>('chats')
  const [selectedPeerKey, setSelectedPeerKey] = useState<string | null>(null)
  const [messages, setMessages] = useState<TelegramMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAccount, setShowAccount] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const personalConversations = telegram.conversations.filter((conversation) => !isSmartyConversation(conversation))
  const filteredConversations = personalConversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  )
  const selectedConversation = personalConversations.find(
    (conversation) => conversation.peerKey === selectedPeerKey,
  )
  const pinnedConversations = personalConversations.slice(0, 6)

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 640px)').matches
    if (isDesktop && !selectedPeerKey && personalConversations[0]) {
      setSelectedPeerKey(personalConversations[0].peerKey)
      void playById('anime-ahh').catch(() => {})
    }
  }, [personalConversations, selectedPeerKey])

  useEffect(() => {
    if (!selectedPeerKey || activeView !== 'chats') return
    let active = true
    setLoadingMessages(true)
    setError(null)
    void telegram.loadMessages(selectedPeerKey)
      .then((result) => {
        if (active) setMessages(result.messages)
       
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Messages could not be loaded')
          void playById('nahi-nahi-saluke-yaha-kuchh-to-gadbad-hai').catch(() => {})
      })
      .finally(() => {
        if (active) setLoadingMessages(false)
             
      })
    return () => { active = false }
  }, [activeView, selectedPeerKey, telegram.account.lastSyncAt])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
  }, [photoPreviewUrl])

  const selectConversation = (conversation: TelegramConversation) => {
    setSelectedPeerKey(conversation.peerKey)
    setActiveView('chats')
    setMessages([])
    setError(null)
  }

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = inputValue.trim()
    if ((!text && !selectedPhoto) || !selectedConversation || selectedConversation.kind !== 'user' || sending) return
   
    setSending(true)
    setError(null)
    setInputValue('')
    try {
      if (selectedPhoto) {
        await telegram.sendPhoto(selectedConversation.telegramPeerId, selectedPhoto, text)
        setSelectedPhoto(null)
        setPhotoPreviewUrl(null)
      } else {
        await telegram.sendMessage(selectedConversation.telegramPeerId, text)
      }
      const result = await telegram.loadMessages(selectedConversation.peerKey)
      setMessages(result.messages)
      await telegram.refresh()

  void playById('punch-gaming-sound-effect-hd_RzlG1GE').catch(() => {})

    } catch (sendError) {
      setInputValue(text)
      setError(sendError instanceof Error ? sendError.message : 'Message could not be sent')
      void playById('nahi-nahi-saluke-yaha-kuchh-to-gadbad-hai').catch(() => {})
    } finally {
      setSending(false)
    }
  }

  const choosePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0]
    event.target.value = ''
    if (!photo) return
    if (!photo.type.startsWith('image/')) {
      setError('Please choose an image file')
      return
    }
    if (photo.size > 10 * 1024 * 1024) {
      setError('Photo must be 10 MB or smaller')
      return
    }
    setError(null)
    setSelectedPhoto(photo)
    setPhotoPreviewUrl(URL.createObjectURL(photo))
  }

  const removeSelectedPhoto = () => {
    setSelectedPhoto(null)
    setPhotoPreviewUrl(null)
  }

  const syncChats = async () => {
    setError(null)
    try {
      await telegram.sync()
       void playById('anime-ahh').catch(() => {})
      
      
    } catch (syncError) {
      void playById('nahi-nahi-saluke-yaha-kuchh-to-gadbad-hai').catch(() => {})
      setError(syncError instanceof Error ? syncError.message : 'Chats could not be synced')
    }
  }

  const showMobileSidebar = activeView === 'chats' && !selectedConversation

  return (
    <div
      className="flex h-full min-h-[500px] w-full select-none overflow-hidden rounded-lg border border-white/50 bg-white/80 text-[13px] text-[#202124] shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#111820]/88 dark:text-white"
      style={{ '--telegram-accent': 'var(--theme-primary-color, #229ed9)', '--telegram-accent-soft': 'var(--theme-primary-soft, rgba(34, 158, 217, 0.14))' } as React.CSSProperties}
    >
      <aside className={`${showMobileSidebar ? 'flex' : 'hidden'} relative w-full shrink-0 flex-col overflow-hidden border-r border-white/70 bg-white/55 backdrop-blur-2xl dark:border-white/10 dark:bg-[#17212b]/78 sm:flex sm:w-[326px]`}>
        <div className="flex h-12 shrink-0 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white shadow-[0_6px_18px_rgba(0,0,0,0.14)]" style={{ backgroundColor: 'var(--telegram-accent)' }}>
              <Send size={13} className="-translate-x-px translate-y-px" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-none">Chats</p>
              <p className="mt-1 text-[9px] font-medium uppercase text-[#89939d]">Telegram</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => void syncChats()} disabled={!telegram.account.connected || telegram.loading} className="grid h-8 w-8 place-items-center rounded-full border border-white/60 bg-white/45 text-[#66717c] shadow-sm transition hover:bg-white/80 hover:text-[var(--telegram-accent)] disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" title="Sync chats">
              <RefreshCw size={14} className={telegram.loading ? 'animate-spin' : ''} />
            </button>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-white/60 bg-white/45 text-[#66717c] shadow-sm transition hover:bg-white/80 hover:text-[var(--telegram-accent)] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" title="New message">
              <SquarePen size={15} />
            </button>
          </div>
        </div>

        <div className="px-3.5 pb-3">
          <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl border border-white/70 bg-white/60 px-3 text-[#7d8994] shadow-[0_4px_16px_rgba(33,47,61,0.06)] backdrop-blur-xl transition focus-within:border-[var(--telegram-accent)] focus-within:bg-white/90 dark:border-white/10 dark:bg-white/[0.07] dark:focus-within:bg-white/10">
            <Search size={17} />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-[13px] text-[#17212b] outline-none placeholder:text-[#7d8994] dark:text-white" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={14} /></button>}
          </label>
        </div>

        <div className="mx-3 grid shrink-0 grid-cols-4 gap-x-2 gap-y-3 rounded-xl border border-white/65 bg-white/40 px-2 py-3 shadow-[0_8px_24px_rgba(31,45,58,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035]">
          <button type="button" onClick={() => { setActiveView('smarty'); setShowAccount(false) }} className="group flex min-w-0 flex-col items-center text-center">
            <div className={`relative grid h-13 w-13 place-items-center rounded-full text-white shadow-md transition group-hover:scale-105 ${activeView === 'smarty' ? 'ring-2 ring-[var(--telegram-accent)] ring-offset-2 ring-offset-white/70 dark:ring-offset-[#17212b]' : ''}`} style={{ backgroundColor: 'var(--telegram-accent)' }}>
              <Bot size={23} className="text-white" />
              <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#f6f6f6] bg-emerald-500 dark:border-[#1e1e1e]" />
            </div>
            <span className="mt-1.5 w-full truncate text-[10px] font-medium">Smarty</span>
          </button>
          {pinnedConversations.slice(0, 3).map((conversation) => (
            <button key={conversation.peerKey} type="button" onClick={() => selectConversation(conversation)} className="group flex min-w-0 flex-col items-center text-center">
              <div className={`relative grid h-13 w-13 place-items-center rounded-full text-sm font-semibold text-white shadow-md transition group-hover:scale-105 ${selectedPeerKey === conversation.peerKey && activeView === 'chats' ? 'ring-2 ring-[var(--telegram-accent)] ring-offset-2 ring-offset-white/70 dark:ring-offset-[#17212b]' : ''}`} style={{ backgroundColor: avatarColor(conversation.peerKey) }}>
                {conversation.kind === 'user' ? initials(conversation.title) : <Users size={20} />}
                {conversation.unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-white/90 px-1 text-[9px] font-bold text-white dark:border-[#17212b]" style={{ backgroundColor: 'var(--telegram-accent)' }}>{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>}
              </div>
              <span className="mt-1.5 w-full truncate text-[10px] font-medium">{conversation.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="mx-2 mt-3 min-h-0 flex-1 overflow-y-auto rounded-t-xl border-x border-t border-white/55 bg-white/30 shadow-[0_-2px_20px_rgba(31,45,58,0.035)] dark:border-white/[0.06] dark:bg-black/10" style={{ scrollbarWidth: 'thin' }}>
          {telegram.loading && personalConversations.length === 0 && (
            <div className="space-y-1 p-2">
              {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-[66px] animate-pulse rounded-lg bg-[#f1f3f4] dark:bg-white/5" />)}
            </div>
          )}
          {!telegram.loading && telegram.account.connected && filteredConversations.length === 0 && (
            <div className="px-8 py-12 text-center text-[#7d8994]"><Search size={24} className="mx-auto mb-3 opacity-50" /><p className="text-xs">No chats found</p></div>
          )}
          {filteredConversations.map((conversation) => {
            const selected = activeView === 'chats' && selectedPeerKey === conversation.peerKey
            return (
              <button key={conversation.peerKey} type="button" onClick={() => selectConversation(conversation)} className={`my-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${selected ? 'text-white shadow-[0_8px_22px_rgba(15,23,42,0.16)]' : 'hover:bg-white/75 dark:hover:bg-white/[0.07]'}`} style={selected ? { backgroundColor: 'var(--telegram-accent)' } : undefined}>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-semibold text-white shadow-sm" style={{ backgroundColor: avatarColor(conversation.peerKey) }}>
                  {conversation.kind === 'user' ? initials(conversation.title) : <Users size={20} />}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{conversation.title}</span>
                    <span className={`shrink-0 text-[10px] ${selected ? 'text-white/80' : conversation.unreadCount ? 'font-semibold text-[var(--telegram-accent)]' : 'text-[#8d99a4]'}`}>{formatConversationTime(conversation.lastMessageAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className={`truncate text-[11px] ${selected ? 'text-white/90' : 'text-[#6f7780] dark:text-[#a1a7ad]'}`}>{conversation.lastMessage || (conversation.kind === 'user' ? 'Telegram contact' : conversation.kind)}</span>
                    {conversation.unreadCount > 0 && <span className={`grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${selected ? 'bg-white text-[var(--telegram-accent)]' : 'text-white'}`} style={selected ? undefined : { backgroundColor: 'var(--telegram-accent)' }}>{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button type="button" onClick={() => setShowAccount((current) => !current)} className="flex h-14 shrink-0 items-center gap-3 border-t border-[#dce3e8] px-4 text-left transition hover:bg-[#f1f3f4] dark:border-white/10 dark:hover:bg-white/10">
          <div className={`grid h-8 w-8 place-items-center rounded-full ${telegram.account.connected ? 'bg-emerald-500 text-white' : 'bg-[#dce3e8] text-[#7d8994] dark:bg-white/10'}`}>
            {telegram.account.connected ? <Wifi size={15} /> : <Settings size={15} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{telegram.account.displayName || 'Telegram account'}</p>
            <p className="text-[10px] text-[#7d8994]">{telegram.account.connected ? 'Connected securely' : 'Connect account'}</p>
          </div>
          <ChevronDown size={15} className={`text-[#7d8994] transition ${showAccount ? 'rotate-180' : ''}`} />
        </button>
        {showAccount && <div className="absolute inset-x-0 bottom-14 z-20 max-h-[75%] overflow-y-auto border-t border-[#dce3e8] bg-white shadow-[0_-18px_50px_rgba(23,33,43,0.18)] dark:border-white/10 dark:bg-[#17212b]"><TelegramAccountPanel /></div>}
      </aside>

      <main className={`${showMobileSidebar ? 'hidden' : 'flex'} min-w-0 flex-1 flex-col sm:flex`}>
        {activeView === 'smarty' ? (
          <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-[#17212b]">
            <div className="flex h-[58px] shrink-0 items-center gap-3 border-b border-[#dce3e8] px-4 dark:border-white/10 sm:hidden">
              <button type="button" onClick={() => { setActiveView('chats'); setSelectedPeerKey(null) }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label="Back to chats"><ArrowLeft size={19} /></button>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#3390ec] text-white"><Bot size={18} /></div>
              <div><p className="font-semibold">Smarty</p><p className="text-[10px] text-emerald-500">automation online</p></div>
            </div>
            <TelegramLiveLogs maxLogs={100} />
          </div>
        ) : selectedConversation ? (
          <>
            <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-white/70 bg-white/65 px-3 shadow-[0_6px_24px_rgba(31,45,58,0.05)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#17212b]/72 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => setSelectedPeerKey(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#3390ec] hover:bg-[#f1f3f4] sm:hidden" aria-label="Back to chats"><ArrowLeft size={20} /></button>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-semibold text-white" style={{ backgroundColor: avatarColor(selectedConversation.peerKey) }}>
                  {selectedConversation.kind === 'user' ? initials(selectedConversation.title) : <Users size={18} />}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-[14px] font-semibold">{selectedConversation.title}</h2>
                  <p className="truncate text-[11px] text-[#7d8994]">{selectedConversation.kind === 'user' ? 'last seen recently' : selectedConversation.kind}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#707b85]">
                <button type="button" onClick={() => setError('Telegram video calls are not available in this web client')} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f1f3f4] dark:hover:bg-white/10" aria-label="Video call unavailable" title="Video calls require the native Telegram app"><Video size={17} /></button>
                <button type="button" onClick={() => setError('Telegram voice calls are not available in this web client')} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f1f3f4] dark:hover:bg-white/10" aria-label="Audio call unavailable" title="Voice calls require the native Telegram app"><Phone size={17} /></button>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f1f3f4] dark:hover:bg-white/10" aria-label="Search conversation"><Search size={18} /></button>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f1f3f4] dark:hover:bg-white/10" aria-label="Conversation options"><MoreVertical size={18} /></button>
              </div>
            </header>

            <div className="relative min-h-0 flex-1 overflow-y-auto bg-[var(--telegram-accent-soft)] px-3 py-5 dark:bg-[#0e1621] sm:px-6" style={{ scrollbarWidth: 'thin' }}>
              <div className="pointer-events-none absolute inset-0 opacity-55 dark:opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.52), rgba(255,255,255,0.18)), radial-gradient(circle at 1px 1px, rgba(52,72,88,0.12) 1px, transparent 0)', backgroundSize: 'auto, 22px 22px' }} />
              <div className="relative flex min-h-full w-full flex-col justify-end gap-1.5">
                {loadingMessages && <div className="mx-auto rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-[#60717f] shadow-sm dark:bg-[#182533]/90 dark:text-[#9ba7b2]">Loading messages...</div>}
                {!loadingMessages && messages.length === 0 && !error && <div className="mx-auto rounded-full bg-[#7994a4]/75 px-3 py-1.5 text-[11px] font-medium text-white">No messages in this conversation</div>}
                {messages.map((message) => {
                  const outgoing = message.direction === 'outgoing'
                  return (
                    <div key={message._id || message.telegramMessageId} className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[86%] rounded-2xl border px-3.5 py-2 shadow-[0_5px_18px_rgba(23,33,43,0.10)] backdrop-blur-xl sm:max-w-[74%] ${outgoing ? 'rounded-br-md border-white/20 text-white' : 'rounded-bl-md border-white/70 bg-white/78 dark:border-white/10 dark:bg-[#202b36]/88'}`} style={outgoing ? { backgroundColor: 'var(--telegram-accent)' } : undefined}>
                        {!outgoing && selectedConversation.kind !== 'user' && <p className="mb-0.5 text-[11px] font-semibold text-[#3390ec]">{message.senderName}</p>}
                        {message.mediaType === 'photo' && message.mediaUrl && (
                          <Image src={message.mediaUrl} alt={message.mediaFileName || 'Telegram photo'} width={420} height={320} unoptimized className="mb-1.5 max-h-80 w-auto max-w-full rounded-xl object-contain" />
                        )}
                        <div className="flex items-end gap-2">
                          {message.text && <p className="min-w-0 whitespace-pre-wrap break-words text-[13px] leading-[1.38]">{message.text}</p>}
                          <span className={`flex shrink-0 translate-y-0.5 items-center gap-0.5 text-[9px] ${outgoing ? 'text-white/75' : 'text-[#8d99a4]'}`}>
                            {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {outgoing && <CheckCheck size={13} />}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <footer className="shrink-0 border-t border-white/70 bg-white/65 px-3 py-3 shadow-[0_-8px_28px_rgba(31,45,58,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#17212b]/78 sm:px-5">
              {error && <p className="mb-2 w-full text-[11px] text-red-500">{error}</p>}
              {selectedPhoto && photoPreviewUrl && (
                <div className="relative mb-2 inline-flex max-w-48 overflow-hidden rounded-lg border border-white/70 bg-white/80 p-1.5 shadow-lg dark:border-white/10 dark:bg-[#202b36]">
                  <Image src={photoPreviewUrl} alt="Selected photo" width={180} height={120} unoptimized className="max-h-28 w-auto rounded-md object-contain" />
                  <button type="button" onClick={removeSelectedPhoto} className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white" aria-label="Remove selected photo"><X size={14} /></button>
                </div>
              )}
              <form onSubmit={sendMessage} className="flex w-full items-end gap-2">
                <input ref={photoInputRef} type="file" accept="image/*" onChange={choosePhoto} className="hidden" />
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={sending || selectedConversation.kind !== 'user' || !telegram.account.permissions['telegram.send']} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#707b85] hover:bg-[#f1f3f4] disabled:opacity-40 dark:hover:bg-white/10" aria-label="Attach photo" title="Attach photo"><Paperclip size={20} /></button>
                <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-xl border border-white/80 bg-white/72 px-3 shadow-[0_5px_18px_rgba(31,45,58,0.07)] backdrop-blur-xl focus-within:border-[var(--telegram-accent)] dark:border-white/10 dark:bg-white/[0.07]">
                  <input value={inputValue} onChange={(event) => setInputValue(event.target.value)} placeholder={selectedConversation.kind === 'user' ? 'Write a message...' : 'Group sending is not available yet'} disabled={selectedConversation.kind !== 'user' || sending || !telegram.account.permissions['telegram.send']} className="min-w-0 flex-1 bg-transparent py-2.5 text-[13px] outline-none placeholder:text-[#8d99a4] disabled:cursor-not-allowed" />
                  <button type="button" className="grid h-8 w-8 place-items-center text-[#7d8994]" aria-label="Choose emoji"><Smile size={19} /></button>
                </div>
                <button type="submit" disabled={(!inputValue.trim() && !selectedPhoto) || selectedConversation.kind !== 'user' || sending || !telegram.account.permissions['telegram.send']} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-[0_8px_22px_rgba(15,23,42,0.2)] transition hover:brightness-105 disabled:bg-[#b8c2ca] disabled:shadow-none dark:disabled:bg-white/10" style={{ backgroundColor: 'var(--telegram-accent)' }} aria-label={selectedPhoto ? 'Send photo' : 'Send message'}><Send size={18} /></button>
              </form>
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center bg-[#dfe7e2] p-8 text-center dark:bg-[#0e1621]">
            <div>
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-[#3390ec] text-white shadow-[0_16px_40px_rgba(51,144,236,0.3)]"><Send size={34} /></div>
              <h2 className="text-lg font-semibold">Telegram</h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#70808d]">Select a conversation to start messaging from your connected Telegram account.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
