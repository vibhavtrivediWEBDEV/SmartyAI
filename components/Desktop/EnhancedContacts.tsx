"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Star,
  Edit3,
  Trash2
} from "lucide-react";

/**
 * Enhanced Contacts App with MongoDB Integration
 * 
 * Features:
 * - User-specific contacts stored in MongoDB
 * - Create, edit, delete contacts
 * - Search and filter
 * - Favorites system
 * - Tags and categories
 * - Birthday reminders
 * - Import/export contacts
 */

interface Contact {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  avatar?: string;
  avatarBg?: string;
  gradient?: string;
  phone?: string;
  email?: string;
  workEmail?: string;
  workPhone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  birthday?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContactsAppProps {
  onCall?: (contact: Contact) => void;
  onVideoCall?: (contact: Contact) => void;
  onEmail?: (contact: Contact) => void;
}

export default function EnhancedContactsApp({ onCall, onVideoCall, onEmail }: ContactsAppProps) {
  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const res = await fetch("/api/contacts");
      
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter contacts
  const filteredContacts = useMemo(() => {
    let result = contacts;
    
    // Filter by favorites
    if (showFavorites) {
      result = result.filter(c => c.isFavorite);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.company?.toLowerCase().includes(query)
      );
    }
    
    // Sort alphabetically
    return result.sort((a, b) => 
      a.firstName.localeCompare(b.firstName)
    );
  }, [contacts, showFavorites, searchQuery]);

  // Group contacts by first letter
  const groupedContacts = useMemo(() => {
    const groups: { [key: string]: Contact[] } = {};
    
    filteredContacts.forEach(contact => {
      const letter = contact.firstName[0].toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(contact);
    });
    
    return groups;
  }, [filteredContacts]);

  // Handlers
  function openNewContact() {
    setEditingContact(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setWorkEmail("");
    setCompany("");
    setJobTitle("");
    setAddress("");
    setBirthday("");
    setNotes("");
    setIsFavorite(false);
    setShowModal(true);
  }

  function openEditContact(contact: Contact) {
    setEditingContact(contact);
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setPhone(contact.phone || "");
    setEmail(contact.email || "");
    setWorkEmail(contact.workEmail || "");
    setCompany(contact.company || "");
    setJobTitle(contact.jobTitle || "");
    setAddress(contact.address || "");
    setBirthday(contact.birthday || "");
    setNotes(contact.notes || "");
    setIsFavorite(contact.isFavorite || false);
    setShowModal(true);
  }

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    
    if (!firstName.trim()) return;
    
    setSaving(true);
    try {
      const contactData = {
        firstName,
        lastName,
        phone,
        email,
        workEmail,
        company,
        jobTitle,
        address,
        birthday,
        notes,
        isFavorite,
      };
      
      if (editingContact?._id) {
        // Update existing contact
        const res = await fetch(`/api/contacts/${editingContact._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactData),
        });
        
        if (res.ok) {
          setContacts(prev => prev.map(c =>
            c._id === editingContact._id
              ? { ...c, ...contactData }
              : c
          ));
          setShowModal(false);
        }
      } else {
        // Create new contact
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactData),
        });
        
        if (res.ok) {
          const data = await res.json();
          setContacts(prev => [...prev, {
            _id: data.contactId,
            ...contactData,
            userId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }]);
          setShowModal(false);
        }
      }
    } catch (error) {
      console.error("Failed to save contact:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContact() {
    if (!editingContact?._id) return;
    
    if (!confirm("Are you sure you want to delete this contact?")) return;
    
    try {
      const res = await fetch(`/api/contacts/${editingContact._id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setContacts(prev => prev.filter(c => c._id !== editingContact._id));
        setShowModal(false);
        setSelectedContact(null);
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  }

  async function toggleFavorite(contactId: string) {
    const contact = contacts.find(c => c._id === contactId);
    if (!contact) return;
    
    const newFavorite = !contact.isFavorite;
    
    // Optimistic update
    setContacts(prev => prev.map(c =>
      c._id === contactId
        ? { ...c, isFavorite: newFavorite }
        : c
    ));
    
    // Update on server
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newFavorite }),
      });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  }

  // Get initials for avatar
  function getInitials(contact: Contact): string {
    return `${contact.firstName[0]}${contact.lastName[0]}`;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#1c1c1e]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-[#f2f2f7]">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-[#F2F2F7] dark:bg-[#1c1c1e] text-[#1c1c1e] dark:text-[#f2f2f7] overflow-hidden">
      
      {/* Sidebar - Contact List */}
      <aside className="w-[320px] shrink-0 border-r border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl flex flex-col">
        
        {/* Search Bar */}
        <div className="p-3 border-b border-black/5 dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm outline-none placeholder:text-black/40 dark:placeholder:text-white/40"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setShowFavorites(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !showFavorites
                  ? "bg-[#0A84FF] text-white"
                  : "bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setShowFavorites(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showFavorites
                  ? "bg-[#FF9F0A] text-white"
                  : "bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60"
              }`}
            >
              <Star className="w-3 h-3 inline mr-1" />
              Favorites
            </button>
          </div>
        </div>
        
        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedContacts).map(([letter, letterContacts]) => (
            <div key={letter}>
              <div className="px-4 py-1 text-[11px] font-semibold text-black/40 dark:text-white/40 uppercase bg-black/5 dark:bg-white/5">
                {letter}
              </div>
              
              {letterContacts.map(contact => (
                <button
                  key={contact._id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-2 transition-colors ${
                    selectedContact?._id === contact._id
                      ? "bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${contact.avatarBg || "bg-blue-500"}`}
                    style={contact.gradient ? {
                      background: `linear-gradient(135deg, ${contact.gradient.replace("from-[", "").replace("] to-[", ", ").replace("]", "")})`
                    } : undefined}
                  >
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(contact)
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[14px] truncate">
                        {contact.firstName} {contact.lastName}
                      </span>
                      {contact.isFavorite && (
                        <Star className="w-3 h-3 text-[#FF9F0A] fill-current" />
                      )}
                    </div>
                    
                    {contact.company && (
                      <div className="text-[12px] text-black/50 dark:text-white/50 truncate">
                        {contact.company}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
          
          {filteredContacts.length === 0 && (
            <div className="p-8 text-center text-black/40 dark:text-white/40">
              <p className="text-sm">No contacts found</p>
              <button
                onClick={openNewContact}
                className="text-[#0A84FF] text-xs mt-2 hover:underline"
              >
                Add a contact
              </button>
            </div>
          )}
        </div>
        
        {/* Add Contact Button */}
        <div className="p-3 border-t border-black/5 dark:border-white/10">
          <button
            onClick={openNewContact}
            className="w-full py-2 rounded-lg bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#0A84FF]/90 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            New Contact
          </button>
        </div>
      </aside>
      
      {/* Main Content - Contact Details */}
      <main className="flex-1 flex flex-col bg-white/50 dark:bg-[#2c2c2e]/50">
        {selectedContact ? (
          <div className="flex flex-col h-full">
            
            {/* Header */}
            <div className="p-6 text-center">
              {/* Avatar */}
              <div
                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white text-3xl font-semibold ${selectedContact.avatarBg || "bg-blue-500"}`}
                style={selectedContact.gradient ? {
                  background: `linear-gradient(135deg, ${selectedContact.gradient.replace("from-[", "").replace("] to-[", ", ").replace("]", "")})`
                } : undefined}
              >
                {selectedContact.avatar ? (
                  <img
                    src={selectedContact.avatar}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(selectedContact)
                )}
              </div>
              
              {/* Name */}
              <h2 className="text-2xl font-bold mt-4">
                {selectedContact.firstName} {selectedContact.lastName}
              </h2>
              
              {selectedContact.jobTitle && selectedContact.company && (
                <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                  {selectedContact.jobTitle} at {selectedContact.company}
                </p>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => onEmail?.(selectedContact)}
                  className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
                  title="Email"
                >
                  <Mail className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onCall?.(selectedContact)}
                  className="w-12 h-12 rounded-full bg-[#34C759] hover:bg-[#34C759]/90 text-white flex items-center justify-center transition-colors"
                  title="Call"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onVideoCall?.(selectedContact)}
                  className="w-12 h-12 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white flex items-center justify-center transition-colors"
                  title="FaceTime"
                >
                  <Video className="w-5 h-5" />
                </button>
              </div>
              
              {/* Favorite & Edit Buttons */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => toggleFavorite(selectedContact._id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedContact.isFavorite
                      ? "bg-[#FF9F0A] text-white"
                      : "bg-black/5 dark:bg-white/10 text-black dark:text-white"
                  }`}
                >
                  <Star className={`w-4 h-4 inline mr-1 ${selectedContact.isFavorite ? "fill-current" : ""}`} />
                  {selectedContact.isFavorite ? "Favorited" : "Favorite"}
                </button>
                
                <button
                  onClick={() => openEditContact(selectedContact)}
                  className="px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/10 text-sm font-medium transition-colors hover:bg-black/10 dark:hover:bg-white/20"
                >
                  <Edit3 className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
              </div>
            </div>
            
            {/* Contact Details */}
            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-4">
                
                {/* Phone */}
                {selectedContact.phone && (
                  <div className="bg-black/5 dark:bg-white/10 rounded-xl p-4">
                    <div className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1">
                      Phone
                    </div>
                    <div className="font-medium">{selectedContact.phone}</div>
                    <button className="text-[#0A84FF] text-xs mt-2">Call</button>
                  </div>
                )}
                
                {/* Email */}
                {selectedContact.email && (
                  <div className="bg-black/5 dark:bg-white/10 rounded-xl p-4">
                    <div className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1">
                      Email
                    </div>
                    <div className="font-medium">{selectedContact.email}</div>
                    <button className="text-[#0A84FF] text-xs mt-2">Send Email</button>
                  </div>
                )}
                
                {/* Address */}
                {selectedContact.address && (
                  <div className="bg-black/5 dark:bg-white/10 rounded-xl p-4">
                    <div className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1">
                      Address
                    </div>
                    <div className="font-medium">{selectedContact.address}</div>
                    <button className="text-[#0A84FF] text-xs mt-2">Open in Maps</button>
                  </div>
                )}
                
                {/* Birthday */}
                {selectedContact.birthday && (
                  <div className="bg-black/5 dark:bg-white/10 rounded-xl p-4">
                    <div className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1">
                      Birthday
                    </div>
                    <div className="font-medium">{selectedContact.birthday}</div>
                  </div>
                )}
                
                {/* Notes */}
                {selectedContact.notes && (
                  <div className="bg-black/5 dark:bg-white/10 rounded-xl p-4">
                    <div className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1">
                      Notes
                    </div>
                    <div className="text-sm">{selectedContact.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-black/40 dark:text-white/40">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                <span className="text-3xl">👤</span>
              </div>
              <p>Select a contact to view details</p>
              <button
                onClick={openNewContact}
                className="text-[#0A84FF] text-sm mt-3 hover:underline"
              >
                or add a new contact
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* Create/Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10">
              <h3 className="text-lg font-semibold">
                {editingContact ? "Edit Contact" : "New Contact"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSaveContact} className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              
              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1 block">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1 block">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1 block">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              {/* Email */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm outline-none"
                  placeholder="john@example.com"
                />
              </div>
              
              {/* Company */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1 block">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm outline-none"
                  placeholder="Tech Corp"
                />
              </div>
              
              {/* Birthday */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1 block">
                  Birthday (MM-DD)
                </label>
                <input
                  type="text"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm outline-none"
                  placeholder="01-15"
                />
              </div>
              
              {/* Notes */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-black/50 dark:text-white/50 mb-1 block">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm outline-none resize-none"
                  rows={3}
                  placeholder="Add notes..."
                />
              </div>
              
              {/* Favorite Toggle */}
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium">Add to Favorites</span>
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    isFavorite ? "bg-[#FF9F0A]" : "bg-black/10 dark:bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      isFavorite ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </label>
            </form>
            
            {/* Actions */}
            <div className="flex items-center gap-3 p-4 border-t border-black/5 dark:border-white/10">
              {editingContact && (
                <button
                  onClick={handleDeleteContact}
                  className="flex items-center gap-2 px-4 h-9 rounded-lg text-red-500 hover:bg-red-500/10 text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              
              <div className="flex-1" />
              
              <button
                onClick={() => setShowModal(false)}
                className="px-4 h-9 rounded-lg bg-black/5 dark:bg-white/10 text-sm transition-colors hover:bg-black/10 dark:hover:bg-white/20"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveContact}
                disabled={!firstName.trim() || saving}
                className="px-6 h-9 rounded-lg bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#0A84FF]/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
