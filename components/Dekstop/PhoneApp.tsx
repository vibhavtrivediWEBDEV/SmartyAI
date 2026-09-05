'use client'

import React, { useState } from 'react'
import { Phone, MessageSquare, Video, Mail, Search, ChevronRight, Plus, ArrowUpRight, ArrowDownLeft, ChevronDown, Grid, Delete, X } from 'lucide-react'
import { useTelegramAccount } from '@/hooks/useTelegramAccount'

interface Contact {
  id: string
  name: string
  avatar: string
  phone: string
  type: 'outgoing' | 'incoming'
  device: string
  time: string
  isFavorite?: boolean
  source?: 'local' | 'telegram'
}

// Helper for avatar background colors
const getAvatarBg = (contact: Contact) => {
  const colors = [
    'bg-blue-100 dark:bg-blue-950/40',
    'bg-green-100 dark:bg-green-950/40',
    'bg-purple-100 dark:bg-purple-950/40',
    'bg-pink-100 dark:bg-pink-950/40',
    'bg-amber-100 dark:bg-amber-950/40',
    'bg-teal-100 dark:bg-teal-950/40',
  ]
  const index = Math.abs(contact.name.charCodeAt(0) - 65) % colors.length
  return colors[index]
}

export default function PhoneApp() {
  const telegram = useTelegramAccount()
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDialer, setShowDialer] = useState(false)
  const [dialerInput, setDialerInput] = useState('')
  const [activeTab, setActiveTab] = useState<'recents' | 'contacts' | 'voicemail'>('recents')

  // Sample contacts
  const [recentContacts] = useState<Contact[]>([
    { id: '1', name: 'Mom', avatar: '👩', phone: '+1 (555) 123-4567', type: 'incoming', device: 'iPhone', time: '12:30 PM', isFavorite: true },
    { id: '2', name: 'Dad', avatar: '👨', phone: '+1 (555) 234-5678', type: 'outgoing', device: 'iPhone', time: '11:15 AM', isFavorite: true },
    { id: '3', name: 'Alex Johnson', avatar: '👨‍💼', phone: '+1 (555) 345-6789', type: 'incoming', device: 'mobile', time: 'Yesterday' },
    { id: '4', name: 'Sarah Smith', avatar: '👩‍🦰', phone: '+1 (555) 456-7890', type: 'outgoing', device: 'mobile', time: 'Yesterday' },
    { id: '5', name: 'Office', avatar: '🏢', phone: '+1 (555) 567-8901', type: 'incoming', device: 'work', time: 'Monday' },
    { id: '6', name: 'Mike Wilson', avatar: '🎮', phone: '+1 (555) 678-9012', type: 'outgoing', device: 'mobile', time: 'Monday' },
    { id: '7', name: 'Emma Davis', avatar: '👩‍🎨', phone: '+1 (555) 789-0123', type: 'incoming', device: 'iPhone', time: 'Sunday' },
    { id: '8', name: 'John Brown', avatar: '💼', phone: '+1 (555) 890-1234', type: 'incoming', device: 'mobile', time: 'Saturday' },
  ])
  const telegramContacts: Contact[] = telegram.contacts.map((contact) => ({
    id: `telegram:${contact.telegramUserId}`,
    name: contact.displayName,
    avatar: contact.firstName?.[0] || 'T',
    phone: contact.phone || (contact.username ? `@${contact.username}` : 'Telegram'),
    type: 'incoming',
    device: 'Telegram',
    time: '',
    source: 'telegram',
  }))
  const visibleContacts = activeTab === 'contacts' ? telegramContacts : recentContacts

  // Favorites
  const favorites = recentContacts.filter(c => c.isFavorite)

  const handleSelectContact = (contact: Contact) => {
    setSelectedContactId(contact.id)
    setShowDialer(false)
  }

  const handlePlaceCall = (contact: Contact) => {
    console.log('Calling:', contact.name)
  }

  const handleDialerInput = (value: string) => {
    if (value === 'delete') {
      setDialerInput(prev => prev.slice(0, -1))
    } else if (value === 'clear') {
      setDialerInput('')
    } else {
      setDialerInput(prev => prev + value)
    }
  }

  const filteredRecents = recentContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  )
  const filteredContacts = visibleContacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const selectedContact = [...recentContacts, ...telegramContacts].find((contact) => contact.id === selectedContactId)

  const DialPad = () => {
    const buttons = [
      ['1', ''],
      ['2', 'ABC'],
      ['3', 'DEF'],
      ['4', 'GHI'],
      ['5', 'JKL'],
      ['6', 'MNO'],
      ['7', 'PQRS'],
      ['8', 'TUV'],
      ['9', 'WXYZ'],
      ['*', ''],
      ['0', '+'],
      ['#', ''],
    ]

    return (
      <div className="grid grid-cols-3 gap-3 px-8 py-6">
        {buttons.map(([num, letters]) => (
          <button
            key={num}
            onClick={() => handleDialerInput(num)}
            className="flex flex-col items-center justify-center h-16 bg-white dark:bg-white/5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95"
          >
            <span className="text-[28px] font-light text-gray-900 dark:text-white">{num}</span>
            {letters && <span className="text-[9px] text-gray-500 dark:text-gray-400">{letters}</span>}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="phone-container flex h-full w-full select-none text-[13px] rounded-xl overflow-hidden bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-white">
      
      {/* Sidebar */}
      <aside className="w-[300px] flex flex-col shrink-0 border-r border-[#E5E5E5] dark:border-white/10 bg-[#F6F6F6] dark:bg-[#1E1E1E]">
        {/* Header */}
        <div className="h-11 flex items-center px-4 shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-[#ff5f57] rounded-full cursor-pointer hover:bg-[#ff4136] transition-all shadow-sm" />
            <div className="w-3 h-3 bg-[#febc2e] rounded-full cursor-pointer hover:bg-[#ff9500] transition-all shadow-sm" />
            <div className="w-3 h-3 bg-[#28c840] rounded-full cursor-pointer hover:bg-[#1aab29] transition-all shadow-sm" />
          </div>
        </div>

        {/* Search */}
        <div className="px-3.5 pb-2 shrink-0">
          <div className="relative flex items-center rounded-full px-3 py-1.5 border bg-[#E3E3E5] dark:bg-[#2A2A2A] dark:border-white/5 border-transparent">
            <Search size={14} className="text-gray-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[13px] outline-none placeholder-gray-500"
            />
          </div>
        </div>

        {/* Favorites Section */}
        {activeTab === 'recents' && (
          <div className="px-3 pb-3 shrink-0">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Favorites</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {favorites.map(contact => (
                <div 
                  key={contact.id}
                  onClick={() => handlePlaceCall(contact)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-gray-200 dark:bg-white/10 shadow-sm group-hover:scale-105 transition-transform">
                    <span className="text-[24px]">{contact.avatar}</span>
                  </div>
                  <span className="text-[11px] text-gray-700 dark:text-gray-300 mt-1 truncate w-full text-center">{contact.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: 'none' }}>
          {activeTab === 'recents' && filteredRecents.map((contact, index) => {
            const isSelected = selectedContactId === contact.id
            return (
              <div key={contact.id}>
                <div 
                  onClick={() => handleSelectContact(contact)}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl mb-0.5 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-black/[0.08] dark:bg-white/[0.12] text-gray-900 dark:text-white'
                      : 'hover:bg-black/[0.03] dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm p-0.5 ${getAvatarBg(contact)}`}>
                      <span className="text-[18px]">{contact.avatar}</span>
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-[13.5px] truncate">
                        {contact.name}
                      </span>
                      <div className="flex items-center text-[10.5px] mt-0.5 text-gray-400">
                        {contact.type === 'outgoing' ? (
                          <ArrowUpRight size={11} className="mr-0.5 text-blue-400" />
                        ) : (
                          <ArrowDownLeft size={11} className="mr-0.5 text-green-400" />
                        )}
                        <span>{contact.device}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-gray-400">{contact.time}</span>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlaceCall(contact)
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.08] dark:hover:bg-white/10 text-blue-500 dark:text-blue-400"
                    >
                      <Phone size={12} className="fill-current" />
                    </button>
                  </div>
                </div>
                {index < filteredRecents.length - 1 && (
                  <div className="border-b border-black/[0.05] dark:border-white/[0.05] mx-3 my-0.5" />
                )}
              </div>
            )
          })}

          {activeTab === 'contacts' && (telegram.loading ? (
            <div className="flex h-full items-center justify-center text-[13px] text-gray-500">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-gray-500 dark:text-gray-400">
              <p className="text-[13px]">No Telegram contacts</p>
              <p className="mt-1 text-[10px]">Connect and sync Telegram from Messages.</p>
            </div>
          ) : filteredContacts.map((contact) => {
            const isSelected = selectedContactId === contact.id
            return (
              <button key={contact.id} type="button" onClick={() => handleSelectContact(contact)} className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left transition ${isSelected ? 'bg-black/[0.08] dark:bg-white/[0.12]' : 'hover:bg-black/[0.03] dark:hover:bg-white/5'}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarBg(contact)}`}>{contact.avatar}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold">{contact.name}</span>
                  <span className="block truncate text-[10.5px] text-[#168b6b]">{contact.device}</span>
                </span>
                <ChevronRight size={13} className="text-gray-400" />
              </button>
            )
          }))}

          {activeTab === 'voicemail' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p className="text-[13px]">No voicemails</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header */}
        <div className="h-14 flex items-center px-4 shrink-0 justify-between border-b border-black/[0.03] dark:border-white/[0.03]">
          <div />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setShowDialer(!showDialer)
                setSelectedContactId(null)
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full border transition ${
                showDialer 
                  ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                  : 'border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10'
              }`}
              title="Keypad Dialer"
            >
              <Grid size={15} />
            </button>
          </div>
        </div>

        {/* Dialer */}
        {showDialer ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <input
                type="text"
                value={dialerInput}
                onChange={(e) => setDialerInput(e.target.value.replace(/[^0-9*#+]/g, ''))}
                placeholder="Enter number"
                className="text-[32px] font-light text-center bg-transparent outline-none text-gray-900 dark:text-white w-64"
              />
            </div>

            <DialPad />

            <div className="flex items-center gap-4 mt-4">
              <button 
                onClick={() => handleDialerInput('delete')}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-600 dark:text-gray-400"
              >
                <Delete size={22} />
              </button>
              
              <button className="w-16 h-16 rounded-full bg-[#34C759] flex items-center justify-center hover:bg-green-600 transition shadow-lg">
                <Phone size={26} className="fill-current text-white" />
              </button>
              
              <button 
                onClick={() => handleDialerInput('clear')}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-600 dark:text-gray-400"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-6 text-center text-[11px] text-gray-500">
              <p>Enter a number to call</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-100 dark:bg-white/10">
                {selectedContactId ? (
                  <span className="text-[48px]">
                    {selectedContact?.avatar}
                  </span>
                ) : (
                  <Phone size={40} className="text-gray-400" />
                )}
              </div>
              
              {selectedContactId ? (
                <>
                  <h2 className="text-[18px] font-semibold mb-2">
                    {selectedContact?.name}
                  </h2>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4">
                    {selectedContact?.phone}
                  </p>
                  
                  <div className="flex items-center gap-4 justify-center">
                    <button className="w-12 h-12 rounded-full bg-[#34C759] flex items-center justify-center hover:bg-green-600 transition shadow-lg">
                      <Phone size={20} className="fill-current text-white" />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-[#007AFF] flex items-center justify-center hover:bg-blue-600 transition shadow-lg">
                      <Video size={20} className="text-white" />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-[#34C759] flex items-center justify-center hover:bg-green-600 transition shadow-lg">
                      <MessageSquare size={20} className="text-white" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-[18px] font-semibold mb-2 text-gray-900 dark:text-white">Select a Contact</h2>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">
                    Choose a recent call or use the keypad
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="h-12 flex items-center justify-around border-t border-[#E5E5E5] dark:border-white/10 shrink-0 bg-[#F6F6F6] dark:bg-[#1E1E1E]">
          <button 
            onClick={() => setActiveTab('recents')}
            className={`flex flex-col items-center ${activeTab === 'recents' ? 'text-[#007AFF]' : 'text-gray-500'}`}
          >
            <ClockIcon size={20} />
            <span className="text-[10px] mt-0.5">Recents</span>
          </button>
          <button 
            onClick={() => setActiveTab('contacts')}
            className={`flex flex-col items-center ${activeTab === 'contacts' ? 'text-[#007AFF]' : 'text-gray-500'}`}
          >
            <ContactsIcon size={20} />
            <span className="text-[10px] mt-0.5">Contacts</span>
          </button>
          <button 
            onClick={() => setActiveTab('voicemail')}
            className={`flex flex-col items-center ${activeTab === 'voicemail' ? 'text-[#007AFF]' : 'text-gray-500'}`}
          >
            <Mail size={20} />
            <span className="text-[10px] mt-0.5">Voicemail</span>
          </button>
        </div>
      </main>
    </div>
  )
}

// Custom icons for tab bar
function ClockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

function ContactsIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
