"use client"

import React, { useState, useEffect } from "react"
import {
  MessageSquare,
  Phone,
  Video,
  Mail,
  Search,
  Plus,
  ChevronRight,
  X,
  Check,
  MapPin,
  Calendar,
  Trash2
} from "lucide-react"
import { useSettings } from "@/app/context/settingContext"

interface Contact {
  _id?: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  workEmail?: string
  address?: string
  birthday?: string
  notes?: string
  gradient?: string
  avatar?: string
}

interface ContactsProps {
  userId?: string
}

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed="

export default function ContactsApp({ userId }: ContactsProps) {
  const { settings } = useSettings()
  const isDarkMode = settings?.darkMode ?? false
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [loading, setLoading] = useState(false)

  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [workEmail, setWorkEmail] = useState("")
  const [address, setAddress] = useState("")
  const [birthday, setBirthday] = useState("")
  const [notesField, setNotesField] = useState("")
  const [gradient, setGradient] = useState("from-blue-400 to-purple-500")

  // Gradient options
  const gradientOptions = [
    { name: "Blue", value: "from-blue-400 to-purple-500" },
    { name: "Green", value: "from-green-400 to-teal-500" },
    { name: "Orange", value: "from-orange-400 to-red-500" },
    { name: "Pink", value: "from-pink-400 to-rose-500" },
    { name: "Cyan", value: "from-cyan-400 to-blue-500" },
    { name: "Purple", value: "from-purple-400 to-indigo-500" },
    { name: "Yellow", value: "from-yellow-400 to-orange-500" },
    { name: "Gray", value: "from-gray-400 to-slate-500" },
  ]

  // Fetch contacts from database
  useEffect(() => {
    fetchContacts()
  }, [userId])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtered contacts based on search
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase()
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery)
    )
  })

  // Open create modal
  const handleNewContact = () => {
    setModalMode("create")
    setFirstName("")
    setLastName("")
    setPhone("")
    setEmail("")
    setWorkEmail("")
    setAddress("")
    setBirthday("")
    setNotesField("")
    setGradient("from-blue-400 to-purple-500")
    setShowModal(true)
  }

  // Open edit modal
  const handleEditContact = () => {
    if (!activeContact) return
    setModalMode("edit")
    setFirstName(activeContact.firstName)
    setLastName(activeContact.lastName)
    setPhone(activeContact.phone || "")
    setEmail(activeContact.email || "")
    setWorkEmail(activeContact.workEmail || "")
    setAddress(activeContact.address || "")
    setBirthday(activeContact.birthday || "")
    setNotesField(activeContact.notes || "")
    setGradient(activeContact.gradient || "from-blue-400 to-purple-500")
    setShowModal(true)
  }

  // Save contact
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const contactData: Contact = {
      firstName,
      lastName,
      phone,
      email,
      workEmail,
      address,
      birthday,
      notes: notesField,
      gradient,
      avatar: `${DEFAULT_AVATAR}${firstName}${lastName}`
    }

    try {
      const url = modalMode === "edit" && activeContact?._id 
        ? `/api/contacts/${activeContact._id}`
        : '/api/contacts'
      
      const method = modalMode === "edit" ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      })

      if (response.ok) {
        await fetchContacts()
        setShowModal(false)
        setActiveContact(null)
      } else {
        console.error('Failed to save contact')
      }
    } catch (error) {
      console.error('Error saving contact:', error)
    }
  }

  // Delete contact
  const handleDeleteContact = async () => {
    if (!activeContact?._id) return
    
    if (!confirm("Are you sure you want to delete this contact?")) return

    try {
      const response = await fetch(`/api/contacts/${activeContact._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchContacts()
        setShowModal(false)
        setActiveContact(null)
      } else {
        console.error('Failed to delete contact')
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  return (
    <div className={`flex h-full w-full overflow-hidden ${isDarkMode ? "bg-[#1E1E1E] text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Left Sidebar - Contact List */}
      <aside className={`w-[280px] border-r flex flex-col ${isDarkMode ? "bg-[#1E1E1E] border-white/10" : "bg-white border-black/10"}`}>
        {/* Search Bar */}
        <div className={`p-3 border-b ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? "bg-[#2A2A2A]" : "bg-gray-100"}`}>
            <Search size={14} className="opacity-60" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 bg-transparent text-sm outline-none ${isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400"}`}
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm opacity-60">
              Loading contacts...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-sm opacity-60">
              <span>No contacts found</span>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact._id || contact.email}
                onClick={() => setActiveContact(contact)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all ${
                  activeContact?._id === contact._id
                    ? isDarkMode
                      ? "bg-blue-500/20"
                      : "bg-blue-50"
                    : isDarkMode
                      ? "hover:bg-white/5"
                      : "hover:bg-gray-100"
                }`}
              >
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${contact.gradient || "from-blue-400 to-purple-500"} flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
                  {contact.firstName?.[0] || "?"}
                  {contact.lastName?.[0] || ""}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold">
                    {contact.firstName} {contact.lastName}
                  </div>
                  {contact.phone && (
                    <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {contact.phone}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Add Contact Button */}
        <div className={`p-3 border-t ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
          <button
            onClick={handleNewContact}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition"
          >
            <Plus size={16} />
            New Contact
          </button>
        </div>
      </aside>

      {/* Main Content - Contact Details */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeContact ? (
          <div className="flex-1 overflow-y-auto">
            {/* Contact Header */}
            <div className={`flex flex-col items-center py-8 ${isDarkMode ? "bg-[#2A2A2A]" : "bg-gray-100"}`}>
              {/* Poster/Avatar */}
              <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${activeContact.gradient || "from-blue-400 to-purple-500"} flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4`}>
                {activeContact.firstName?.[0] || "?"}
                {activeContact.lastName?.[0] || ""}
              </div>
              <h2 className="text-xl font-bold mb-1">
                {activeContact.firstName} {activeContact.lastName}
              </h2>
              {activeContact.notes && (
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} text-center max-w-md px-4`}>
                  {activeContact.notes}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/15 dark:bg-white/15 dark:hover:bg-white/25 backdrop-blur-md text-slate-800 dark:text-white flex items-center justify-center transition shadow-md active:scale-95" title="Message">
                  <MessageSquare size={16} />
                </button>
                <button className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/15 dark:bg-white/15 dark:hover:bg-white/25 backdrop-blur-md text-slate-800 dark:text-white flex items-center justify-center transition shadow-md active:scale-95" title="Call">
                  <Phone size={16} />
                </button>
                <button className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/15 dark:bg-white/15 dark:hover:bg-white/25 backdrop-blur-md text-slate-800 dark:text-white flex items-center justify-center transition shadow-md active:scale-95" title="FaceTime">
                  <Video size={16} />
                </button>
                <button className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/15 dark:bg-white/15 dark:hover:bg-white/25 backdrop-blur-md text-slate-800 dark:text-white flex items-center justify-center transition shadow-md active:scale-95" title="Email">
                  <Mail size={16} />
                </button>
                <button
                  onClick={handleEditContact}
                  className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition shadow-md active:scale-95"
                  title="Edit"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Poster Navigation */}
              <div className={`w-full ${isDarkMode ? "bg-white/10 border-white/15" : "bg-white border-black/5"} border backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm cursor-pointer hover:opacity-80 transition`}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full overflow-hidden border bg-black/10 flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${activeContact.gradient || "from-blue-400 to-purple-500"}`} />
                  </div>
                  <span className="text-xs font-semibold">Contact Photo & Poster</span>
                </div>
                <ChevronRight size={14} className="opacity-70" />
              </div>

              {/* Details Card */}
              <div className={`w-full ${isDarkMode ? "bg-white/10 border-white/15" : "bg-white border-black/5"} border backdrop-blur-md rounded-2xl p-4 flex flex-col gap-4 shadow-sm`}>
                {/* Phone */}
                {activeContact.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider font-semibold">mobile</span>
                      <span className="font-medium mt-0.5">{activeContact.phone}</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition shadow-sm" title="Call">
                      <Phone size={13} />
                    </button>
                  </div>
                )}

                {/* Email */}
                {activeContact.email && (
                  <div className={`flex items-center justify-between ${activeContact.phone ? "border-t border-black/5 dark:border-white/5 pt-3" : ""}`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider font-semibold">home</span>
                      <span className="font-medium mt-0.5">{activeContact.email}</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition shadow-sm" title="Mail">
                      <Mail size={13} />
                    </button>
                  </div>
                )}

                {/* Work Email */}
                {activeContact.workEmail && (
                  <div className={`flex items-center justify-between ${activeContact.phone || activeContact.email ? "border-t border-black/5 dark:border-white/5 pt-3" : ""}`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider font-semibold">work</span>
                      <span className="font-medium mt-0.5">{activeContact.workEmail}</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition shadow-sm" title="Mail">
                      <Mail size={13} />
                    </button>
                  </div>
                )}

                {/* Address */}
                {activeContact.address && (
                  <div className={`flex items-center justify-between ${activeContact.phone || activeContact.email || activeContact.workEmail ? "border-t border-black/5 dark:border-white/5 pt-3" : ""}`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider font-semibold">home</span>
                      <span className="font-medium mt-0.5">{activeContact.address}</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition shadow-sm" title="Location">
                      <MapPin size={13} />
                    </button>
                  </div>
                )}

                {/* Birthday */}
                {activeContact.birthday && (
                  <div className={`flex items-center justify-between ${activeContact.phone || activeContact.email || activeContact.workEmail || activeContact.address ? "border-t border-black/5 dark:border-white/5 pt-3" : ""}`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider font-semibold">birthday</span>
                      <span className="font-medium mt-0.5">{activeContact.birthday}</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition shadow-sm" title="Calendar">
                      <Calendar size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span>Select a contact to view details</span>
          </div>
        )}
      </main>

      {/* Modal - z-index below cursor (2147483647) */}
      {showModal && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-[2147483630]">
          <form
            onSubmit={handleSaveContact}
            className={`w-[380px] rounded-2xl p-5 border shadow-2xl flex flex-col gap-4 ${
              isDarkMode ? "bg-[#2A2A2A] border-white/10 text-white" : "bg-white border-black/10 text-gray-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[15px]">
                {modalMode === "create" ? "New Contact" : "Edit Contact"}
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={`p-1.5 rounded-full transition ${isDarkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-gray-500"}`}
              >
                <X size={15} />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto max-h-[380px] flex flex-col gap-3 pr-1">
              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="First"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                      isDarkMode
                        ? "bg-[#1E1E1E] border-white/10 text-white focus:border-blue-500"
                        : "bg-gray-50 border-black/10 text-gray-800 focus:border-blue-500"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                      isDarkMode
                        ? "bg-[#1E1E1E] border-white/10 text-white focus:border-blue-500"
                        : "bg-gray-50 border-black/10 text-gray-800 focus:border-blue-500"
                    }`}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Phone</label>
                <input
                  type="text"
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isDarkMode
                      ? "bg-[#1E1E1E] border-white/10 text-white focus:border-blue-500"
                      : "bg-gray-50 border-black/10 text-gray-800 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Home Email</label>
                <input
                  type="email"
                  placeholder="name@icloud.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isDarkMode
                      ? "bg-[#1E1E1E] border-white/10 text-white focus:border-blue-500"
                      : "bg-gray-50 border-black/10 text-gray-800 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Work Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Work Email</label>
                <input
                  type="email"
                  placeholder="work@company.com"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isDarkMode
                      ? "bg-[#1E1E1E] border-white/10 text-white focus:border-blue-500"
                      : "bg-gray-50 border-black/10 text-gray-800 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Address</label>
                <input
                  type="text"
                  placeholder="Street, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isDarkMode
                      ? "bg-[#1E1E1E] border-white/10 text-white focus:border-blue-500"
                      : "bg-gray-50 border-black/10 text-gray-800 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Birthday */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Birthday</label>
                <input
                  type="text"
                  placeholder="e.g. Sep 21"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isDarkMode
                      ? "bg-[#1E1E1E] border-white/10 text-white focus:border-blue-500"
                      : "bg-gray-50 border-black/10 text-gray-800 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Gradient Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase text-gray-400">Poster Color Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {gradientOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGradient(opt.value)}
                      className={`h-7 rounded-lg bg-gradient-to-br ${opt.value} border flex items-center justify-center relative shadow-sm ${
                        gradient === opt.value ? "border-blue-500 ring-2 ring-blue-500/50" : "border-transparent"
                      }`}
                      title={opt.name}
                    >
                      {gradient === opt.value && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Notes</label>
                <textarea
                  placeholder="Notes about contact..."
                  value={notesField}
                  onChange={(e) => setNotesField(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none resize-none h-16 ${
                    isDarkMode
                      ? "bg-[#1E1E1E] border-white/10 text-white focus:border-blue-500"
                      : "bg-gray-50 border-black/10 text-gray-800 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-black/5 dark:border-white/5">
              {modalMode === "edit" ? (
                <button
                  type="button"
                  onClick={handleDeleteContact}
                  className="flex items-center gap-1.5 text-red-500 hover:bg-red-500/10 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                    isDarkMode ? "hover:bg-white/5 text-gray-300" : "hover:bg-black/5 text-gray-600"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
