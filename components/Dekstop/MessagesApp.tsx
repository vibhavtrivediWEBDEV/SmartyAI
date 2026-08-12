'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Video, SquarePen, Smile, Volume2, Send, Plus, ChevronRight, Phone, Camera } from 'lucide-react'

interface Message {
  id: number
  sender: string
  text: string
  time: string
  isRead?: boolean
  image?: string
}

interface Conversation {
  id: string
  name: string
  avatar: string
  avatarBg: string
  isImage: boolean
  date: string
  isGroup: boolean
  colorTheme: string
  messages: Message[]
}

interface PinnedContact {
  id: string
  name: string
  avatar: string
  bg: string
  isImage: boolean
  badge?: string
  hasUnread?: boolean
  tip?: string
}

// Helper to resolve avatar background colors
const resolveAvatarBg = (bg: string) => {
  const colorMap: Record<string, string> = {
    'bg-blue-100': 'bg-blue-100 dark:bg-blue-950/40',
    'bg-green-100': 'bg-green-100 dark:bg-green-950/40',
    'bg-purple-100': 'bg-purple-100 dark:bg-purple-950/40',
    'bg-pink-100': 'bg-pink-100 dark:bg-pink-950/40',
    'bg-amber-100': 'bg-amber-100 dark:bg-amber-950/40',
    'bg-rose-100': 'bg-rose-100 dark:bg-rose-950/40',
    'bg-teal-100': 'bg-teal-100 dark:bg-teal-950/40',
    'bg-indigo-100': 'bg-indigo-100 dark:bg-indigo-950/40',
  }
  return colorMap[bg] || bg
}

export default function MessagesApp() {
  const [activeChatId, setActiveChatId] = useState('mom')
  const [inputVal, setInputVal] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Pinned contacts for the grid
  const [pinnedContacts] = useState<PinnedContact[]>([
    { id: 'mom', name: 'Mom', avatar: '👩', bg: 'bg-rose-100', isImage: false, hasUnread: true },
    { id: 'dad', name: 'Dad', avatar: '👨', bg: 'bg-blue-100', isImage: false },
    { id: 'alex', name: 'Alex', avatar: '👨‍💼', bg: 'bg-green-100', isImage: false, tip: 'Office buddy' },
    { id: 'sarah', name: 'Sarah', avatar: '👩‍🦰', bg: 'bg-purple-100', isImage: false, badge: '🎉' },
    { id: 'team', name: 'Team', avatar: '👥', bg: 'bg-indigo-100', isImage: false, hasUnread: true },
    { id: 'mike', name: 'Mike', avatar: '🎮', bg: 'bg-teal-100', isImage: false },
    { id: 'emma', name: 'Emma', avatar: '👩‍🎨', bg: 'bg-pink-100', isImage: false },
    { id: 'john', name: 'John', avatar: '💼', bg: 'bg-amber-100', isImage: false },
    { id: 'lisa', name: 'Lisa', avatar: '👩‍💻', bg: 'bg-blue-100', isImage: false },
  ])

  // Active conversations
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'mom',
      name: 'Mom',
      avatar: '👩',
      avatarBg: 'bg-rose-100 dark:bg-rose-950/40',
      isImage: false,
      date: 'Just Now',
      isGroup: false,
      colorTheme: 'blue',
      messages: [
        { id: 1, sender: 'Mom', text: "Hey honey! How's everything going?", time: '2:30 PM', isRead: true },
        { id: 2, sender: 'me', text: "Everything's great, Mom! Working on some exciting projects.", time: '2:32 PM' },
        { id: 3, sender: 'Mom', text: "That's wonderful! Don't forget to eat properly 🍎", time: '2:33 PM' },
      ]
    },
    {
      id: 'team',
      name: 'Team Project',
      avatar: '👥',
      avatarBg: 'bg-indigo-100 dark:bg-indigo-950/40',
      isImage: false,
      date: 'Today',
      isGroup: true,
      colorTheme: 'blue',
      messages: [
        { id: 1, sender: 'Alex', text: 'Meeting at 3 PM today!', time: '11:00 AM' },
        { id: 2, sender: 'Sarah', text: "I'll bring the presentation slides", time: '11:05 AM' },
        { id: 3, sender: 'me', text: 'Great! I will prepare the demo.', time: '11:10 AM' },
      ]
    },
    {
      id: 'alex',
      name: 'Alex Johnson',
      avatar: '👨‍💼',
      avatarBg: 'bg-green-100 dark:bg-green-950/40',
      isImage: false,
      date: 'Yesterday',
      isGroup: false,
      colorTheme: 'blue',
      messages: [
        { id: 1, sender: 'Alex', text: "Hey! Did you see the new designs?", time: 'Yesterday 5:20 PM' },
        { id: 2, sender: 'me', text: 'Yes! They look amazing. Great work! 🎨', time: 'Yesterday 5:25 PM' },
      ]
    },
  ])

  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return

    const newMsg: Message = {
      id: Date.now(),
      sender: 'me',
      text: inputVal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    }

    setConversations(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMsg],
          date: 'Just Now'
        }
      }
      return chat
    }))

    setInputVal('')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat.messages])

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="messages-container flex h-full w-full select-none text-[13px] rounded-xl overflow-hidden bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-white">
      
      {/* Sidebar */}
      <aside className="w-[290px] flex flex-col shrink-0 border-r rounded-xl overflow-hidden border-[#E5E5E5] dark:border-white/10 bg-[#F6F6F6] dark:bg-[#1E1E1E]">
        {/* Title bar */}
        <div className="h-11 flex items-center px-4 shrink-0 justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-[#ff5f57] rounded-full cursor-pointer hover:bg-[#ff4136] transition-all shadow-sm" title="Close" />
            <div className="w-3 h-3 bg-[#febc2e] rounded-full cursor-pointer hover:bg-[#ff9500] transition-all shadow-sm" title="Minimize" />
            <div className="w-3 h-3 bg-[#28c840] rounded-full cursor-pointer hover:bg-[#1aab29] transition-all shadow-sm" title="Maximize" />
          </div>
          <button className="w-7 h-7 flex items-center justify-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300" title="New Message">
            <SquarePen size={15} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-3.5 pb-3 shrink-0">
          <div className="relative flex items-center rounded-full px-3 py-1.5 border bg-[#E3E3E5] dark:bg-[#2A2A2A] dark:border-white/5 border-transparent dark:focus-within:border-blue-500/50 focus-within:bg-white focus-within:border-blue-500/30 transition-all">
            <Search size={14} className="text-gray-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[13px] outline-none placeholder-gray-500 text-inherit"
            />
          </div>
        </div>

        {/* Pinned Grid Section */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-y-4 gap-x-3 shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
          {pinnedContacts.slice(0, 9).map(contact => {
            const isSelected = activeChatId === contact.id
            return (
              <div 
                key={contact.id} 
                onClick={() => {
                  if (conversations.some(c => c.id === contact.id)) {
                    setActiveChatId(contact.id)
                  } else {
                    const newChat: Conversation = {
                      id: contact.id,
                      name: contact.name,
                      avatar: contact.avatar,
                      avatarBg: resolveAvatarBg(contact.bg),
                      isImage: contact.isImage,
                      date: 'Just Now',
                      isGroup: false,
                      colorTheme: 'blue',
                      messages: [
                        { id: 1, sender: contact.name, text: contact.tip || 'Hey there!', time: 'Just Now' }
                      ]
                    }
                    setConversations(prev => [newChat, ...prev])
                    setActiveChatId(contact.id)
                  }
                }}
                className="flex flex-col items-center cursor-pointer relative group text-center"
              >
                <div className="relative w-[72px] h-[72px]">
                  <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-all duration-200 ${resolveAvatarBg(contact.bg)} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#1E1E1E]' : 'group-hover:scale-105'} shadow-md p-1`}>
                    {contact.isImage ? (
                      <img src={contact.avatar} alt={contact.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[30px]">{contact.avatar}</span>
                    )}
                  </div>
                  {contact.badge && (
                    <span className="absolute -bottom-1.5 -right-1.5 text-[11px] bg-white dark:bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center border border-black/10 z-10 shadow-md">
                      {contact.badge}
                    </span>
                  )}
                  {contact.hasUnread && (
                    <span className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 bg-[#007AFF] rounded-full border-2 border-[#F6F6F6] dark:border-[#1E1E1E] z-10 shadow-md" />
                  )}
                </div>
                <span className="text-[11px] font-medium truncate w-full mt-1.5 text-gray-600 dark:text-gray-300">
                  {contact.name.split(' ')[0]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {filteredConversations.map(chat => {
            const isSelected = activeChatId === chat.id
            const lastMsg = chat.messages[chat.messages.length - 1]
            
            return (
              <div 
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-white/5 ${isSelected ? 'bg-[#007AFF] text-white' : 'hover:bg-black/[0.02] dark:hover:bg-white/5'}`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${chat.avatarBg} shadow-sm p-0.5`}>
                  {chat.isImage ? (
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[20px]">{chat.avatar}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[13px] truncate">{chat.name}</span>
                    <span className={`text-[10px] shrink-0 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{chat.date}</span>
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                    {lastMsg?.image ? '📷 Photo' : lastMsg?.text || ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Chat header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#E5E5E5] dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shadow-sm p-0.5 bg-gradient-to-br from-blue-100 to-purple-100">
              <span className="text-[18px]">{activeChat.avatar}</span>
            </div>
            <div>
              <h2 className="font-semibold text-[14px]">{activeChat.name}</h2>
              {activeChat.isGroup && <p className="text-[10px] text-gray-500">3 participants</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition text-gray-600 dark:text-gray-300">
              <Video size={16} />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition text-gray-600 dark:text-gray-300">
              <Phone size={16} />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition text-gray-600 dark:text-gray-300">
              <Search size={16} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'none' }}>
          {activeChat.messages.map((msg) => {
            const isMe = msg.sender === 'me'
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{msg.sender}</span>
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-2xl ${isMe ? 'bg-[#007AFF] text-white rounded-br-md' : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-md'}`}>
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mt-0.5`}>
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-[#E5E5E5] dark:border-white/10 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition text-gray-600 dark:text-gray-300">
              <Plus size={18} />
            </button>
            <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition text-gray-600 dark:text-gray-300">
              <Camera size={18} />
            </button>
            <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition text-gray-600 dark:text-gray-300">
              <Smile size={18} />
            </button>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="iMessage"
              className="flex-1 bg-gray-100 dark:bg-white/5 rounded-full px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500"
            />
            <button 
              type="submit" 
              className={`w-9 h-9 rounded-full flex items-center justify-center transition ${inputVal.trim() ? 'bg-[#007AFF] text-white hover:bg-blue-600' : 'bg-gray-200 dark:bg-white/10 text-gray-400'}`}
              disabled={!inputVal.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
