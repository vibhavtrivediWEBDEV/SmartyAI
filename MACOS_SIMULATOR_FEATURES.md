# Feature Comparison & Implementation Guide

## MacOS-Web-Simulator → SmartyAI Feature Mapping

### 🎯 Executive Summary

We're integrating UI components and UX patterns from the [MacOS-Web-Simulator](https://github.com/LikhithSP/MacOS-Web-Simulator) repository into SmartyAI. This document provides a detailed feature comparison, implementation strategy, and technical guidelines for integration.

---

## 📊 Feature Matrix

| Feature | MacOS-Web-Simulator | SmartyAI Implementation | Priority | Complexity | Est. Time |
|---------|---------------------|------------------------|----------|------------|-----------|
| **Lock Screen** | ✅ Apple animation | ✅ Resume extraction + Apple animation | CRITICAL | HIGH | 2 days |
| **Music App** | ✅ Spotify player | ✅ User playlists + Spotify | HIGH | MEDIUM | 1 day |
| **Phone App** | ✅ Dialer UI | ✅ User contacts + call history | MEDIUM | LOW | 1 day |
| **Contacts App** | ✅ Contact list | ✅ AI extraction + LinkedIn import | MEDIUM | MEDIUM | 2 days |
| **FaceTime App** | ✅ Call UI | ✅ WebRTC + call history | MEDIUM | HIGH | 2 days |
| **Calendar App** | ✅ Calendar UI | ✅ MongoDB events (already exists) | LOW | LOW | 0.5 day |
| **Widget System** | ✅ Widget gallery | ✅ Drag + drop + user data | HIGH | MEDIUM | 1.5 days |
| **Top Bar Widget Button** | ✅ Add widget button | ✅ Widget gallery dropdown | LOW | LOW | 0.5 day |
| **Reminders App** | ✅ Task list | ✅ User tasks + notifications | MEDIUM | MEDIUM | 1 day |

**Total Estimated Time:** 11.5 days

---

## 🔬 Detailed Feature Analysis

### 1. 🔒 Lock Screen

**Source:** `/tmp/macos-simulator/src/layouts/LockScreen.jsx`

#### MacOS-Web-Simulator Features:
- ✅ Apple-style unlock animation (blur + scale)
- ✅ User profile photo (manual upload)
- ✅ Display name (editable)
- ✅ Password input
- ✅ Clock display
- ✅ Wallpaper customization
- ✅ Depth effect (parallax)
- ✅ Media player controls (if music playing)

#### SmartyAI Enhancement:
```typescript
// ADD: Resume extraction on first load
// ADD: AI-generated profile photo option
// ADD: User profile from MongoDB
// KEEP: Apple unlock animation (perfect UX)
// KEEP: Wallpaper customization
// ADD: WebAuthn (FaceID/TouchID simulation)

interface SmartyLockScreen extends MacOSLockScreen {
  // New features
  onboarding: {
    step: 'upload' | 'extracting' | 'profile' | 'setup' | 'complete';
    resumeUploaded: boolean;
    aiExtractionComplete: boolean;
  };
  aiFeatures: {
    suggestedPhoto: string; // AI-generated based on name
    extractedName: string; // From resume
    extractedEmail: string;
    extractedPhone: string;
  };
  webauthn: {
    enabled: boolean;
    credentialId?: string;
  };
}
```

#### Implementation Plan:
```tsx
// 1. First-time user flow
<User arrives> 
  → <Upload Resume> 
  → <AI Extracts Profile> 
  → <Show Profile Photo + Name> 
  → <Set Password> 
  → <Lock Screen>

// 2. Returning user flow
<User arrives> 
  → <Fetch Profile from MongoDB> 
  → <Show Lock Screen> 
  → <Enter Password> 
  → <Apple Animation> 
  → <Desktop>
```

#### Code Adaptation Strategy:
```tsx
// FROM MacOS-Web-Simulator
const [profilePhoto, setProfilePhoto] = useState(() => 
  localStorage.getItem("lock_profile_photo") || "default.png"
);

// TO SmartyAI
import { useUser } from '@/lib/hooks/useUser';
import { getUserProfile } from '@/lib/db/models/user-lockscreen';

const { user } = useUser();
const [profilePhoto, setProfilePhoto] = useState('');

useEffect(() => {
  if (user) {
    getUserProfile(user.id).then(profile => {
      setProfilePhoto(profile.photo || generateInitialsAvatar(user.name));
    });
  }
}, [user]);
```

---

### 2. 🎵 Music App (Spotify Integration)

**Source:** `/tmp/macos-simulator/src/app/Spotify.jsx`

#### MacOS-Web-Simulator Features:
- ✅ Spotify web player
- ✅ Album art display
- ✅ Play/pause controls
- ✅ Skip next/previous
- ✅ Progress bar
- ✅ Volume control
- ✅ Shuffle/repeat modes
- ✅ Current track info

#### SmartyAI Enhancement:
```typescript
// ADD: User-specific playlists
// ADD: Recently played history
// ADD: Favorite tracks
// ADD: Playlist management
// KEEP: All Spotify UI controls
// ADD: AI recommendations

interface SmartyMusicApp extends MacOSMusic {
  userPlaylists: {
    id: string;
    name: string;
    tracks: number;
    cover: string;
    spotifyUrl: string;
    lastUpdated: Date;
  }[];
  recentlyPlayed: {
    track: SpotifyTrack;
    playedAt: Date;
  }[];
  favorites: string[]; // Track IDs
  aiRecommendations: boolean; // Premium feature
}
```

#### Implementation Plan:
```tsx
// 1. Connect Spotify (OAuth)
// 2. Fetch user playlists from Spotify API
// 3. Cache playlists in MongoDB
// 4. Display in Music App UI
// 5. Track play history

// Spotify OAuth Flow
<Button onClick={connectSpotify}>
  Connect Spotify
</Button>

// Redirect to Spotify
// Callback: /api/spotify/callback
// Store tokens in MongoDB
// Fetch and cache playlists
```

#### Code Adaptation Strategy:
```tsx
// FROM MacOS-Web-Simulator
const [currentTrack, setCurrentTrack] = useState(songs[0]);

// TO SmartyAI
import { useQuery } from '@tanstack/react-query';

const { data: playlists } = useQuery({
  queryKey: ['playlists', user.id],
  queryFn: () => fetch(`/api/music/playlists?userId=${user.id}`).then(r => r.json())
});

const { data: currentTrack } = useQuery({
  queryKey: ['currentTrack'],
  queryFn: () => fetch('/api/music/current').then(r => r.json()),
  refetchInterval: 1000 // Update every second
});
```

---

### 3. 📞 Phone App

**Source:** `/tmp/macos-simulator/src/app/Phone.jsx`

#### MacOS-Web-Simulator Features:
- ✅ Dialer pad (0-9, *, #)
- ✅ Contact list
- ✅ Recent calls (static)
- ✅ Favorites
- ✅ Voicemail tab
- ✅ Search contacts
- ✅ Call UI simulation

#### SmartyAI Enhancement:
```typescript
// ADD: User-specific contacts (from Resume AI)
// ADD: Call history in MongoDB
// ADD: Voicemail storage
// ADD: Import from LinkedIn/GitHub
// KEEP: All dialer UI
// ADD: Real WebRTC calls (future)

interface SmartyPhoneApp extends MacOSPhone {
  contacts: Contact[]; // From MongoDB, auto-populated from resume
  recentCalls: Call[]; // Stored in MongoDB
  voicemails: Voicemail[]; // Stored in MongoDB
}

interface Call {
  id: string;
  contactId: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number; // seconds
  timestamp: Date;
  notes?: string;
}

interface Voicemail {
  id: string;
  contactId: string;
  duration: number;
  audioUrl: string;
  transcript?: string; // AI transcription
  timestamp: Date;
  isRead: boolean;
}
```

#### Implementation Plan:
```tsx
// 1. Auto-populate contacts from Resume AI
// 2. Display contact list with search
// 3. Dialer pad with call simulation
// 4. Store call history in MongoDB
// 5. Display recent calls
// 6. Voicemail list (future: WebRTC)

// Contact Auto-Population
const { data: contacts } = useQuery({
  queryKey: ['contacts', user.id],
  queryFn: async () => {
    const res = await fetch(`/api/contacts/get?userId=${user.id}`);
    const data = await res.json();
    
    // If no contacts, extract from resume
    if (data.contacts.length === 0) {
      const extracted = await fetch('/api/ai/extract-contacts', {
        method: 'POST',
        body: JSON.stringify({ resumeUrl: user.resumeUrl })
      });
      return extracted.json();
    }
    
    return data;
  }
});
```

---

### 4. 👥 Contacts App

**Source:** `/tmp/macos-simulator/src/app/Contacts.jsx`

#### MacOS-Web-Simulator Features:
- ✅ Contact list with avatars
- ✅ Contact details sidebar
- ✅ Search functionality
- ✅ Edit/delete contacts
- ✅ Multiple contact groups
- ✅ Contact card view

#### SmartyAI Enhancement:
```typescript
// ADD: AI extraction from Resume
// ADD: Import from LinkedIn API
// ADD: Import from GitHub API
// ADD: Smart tags (auto-categorize)
// ADD: Contact enrichment (company info, social links)
// KEEP: All contact UI
// ADD: Export to CSV/vCard

interface SmartyContactsApp extends MacOSContacts {
  contacts: Contact[];
  importSources: ('resume' | 'linkedin' | 'github' | 'manual')[];
  smartTags: string[]; // AI-generated tags
  enrichment: {
    company?: string;
    title?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  avatar?: string;
  source: 'resume' | 'linkedin' | 'github' | 'manual';
  tags: string[];
  notes?: string;
  lastContacted?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Implementation Plan:
```tsx
// 1. AI Extract contacts from Resume
// 2. LinkedIn import (if connected)
// 3. GitHub import (if connected)
// 4. Deduplicate contacts
// 5. Enrich with social links
// 6. Smart tag generation
// 7. Contact list UI

// Contact Extraction Pipeline
async function extractContactsFromResume(resumeText: string) {
  const prompt = `
    Extract all professional contacts from this resume:
    - Name
    - Email
    - Phone (if available)
    - Company/Organization
    - Role/Title
    
    Resume: ${resumeText}
  `;
  
  const contacts = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(contacts.choices[0].message.content);
}

// LinkedIn Import
async function importFromLinkedIn(accessToken: string) {
  const profile = await fetch('https://api.linkedin.com/v2/connections', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  return profile.json();
}

// GitHub Import
async function importFromGitHub(username: string) {
  const followers = await fetch(`https://api.github.com/users/${username}/followers`);
  const following = await fetch(`https://api.github.com/users/${username}/following`);
  
  return [...followers, ...following];
}
```

---

### 5. 📹 FaceTime App

**Source:** `/tmp/macos-simulator/src/app/FaceTime.jsx`

#### MacOS-Web-Simulator Features:
- ✅ Video call UI
- ✅ Sidebar with contacts
- ✅ Recent calls
- ✅ Favorites
- ✅ Create link
- ✅ Webcam preview

#### SmartyAI Enhancement:
```typescript
// ADD: WebRTC real calls
// ADD: Call history in MongoDB
// ADD: Screen sharing
// ADD: Call recording (premium)
// KEEP: All FaceTime UI
// ADD: Group calls (premium)

interface SmartyFaceTimeApp extends MacOSFaceTime {
  recentCalls: VideoCall[];
  favorites: Contact[];
  features: {
    screenSharing: boolean;
    recording: boolean;
    groupCalls: boolean;
    virtualBackground: boolean;
  };
}

interface VideoCall {
  id: string;
  type: 'video' | 'audio';
  contactId: string;
  duration: number;
  timestamp: Date;
  quality: 'sd' | 'hd';
  recording?: string; // URL to recording (premium)
}
```

#### Implementation Plan:
```tsx
// Phase 1: UI + Call History
// Phase 2: WebRTC Implementation
// Phase 3: Premium Features

// WebRTC Setup (Phase 2)
import { createPeerConnection, addMediaTracks } from '@/lib/webrtc';

async function startVideoCall(contactId: string) {
  const pc = createPeerConnection();
  
  // Get user media
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
  
  // Add tracks to connection
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
  
  // Create offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  
  // Send offer to signaling server
  await sendSignalingMessage({
    type: 'offer',
    offer: offer,
    contactId: contactId,
    userId: user.id
  });
}
```

---

### 6. 🗓️ Calendar App (Enhanced)

**Source:** `/tmp/macos-simulator/src/app/Calendar.jsx`

*Note: SmartyAI already has a calendar app, we're enhancing it.*

#### MacOS-Web-Simulator Features:
- ✅ Month/Week/Day views
- ✅ Event creation/editing
- ✅ Color-coded calendars
- ✅ Sidebar calendar
- ✅ All-day events
- ✅ Event search

#### SmartyAI Enhancement:
```typescript
// ADD: MongoDB event persistence (already exists)
// ADD: Event reminders
// ADD: Recurring events
// ADD: Calendar sharing
// ADD: ICS export/import
// KEEP: All calendar UI
// ADD: AI event suggestions

interface SmartyCalendarApp extends MacOSCalendar {
  events: CalendarEvent[];
  reminders: Reminder[];
  recurring: RecurrenceRule[];
  sharing: {
    publicUrl?: string;
    sharedWith: string[];
    teamCalendars: string[];
  };
  aiFeatures: {
    smartSuggestions: boolean;
    conflictDetection: boolean;
    autoSchedule: boolean;
  };
}
```

---

### 7. 🎛️ Widget System

**Source:** `/tmp/macos-simulator/src/components/widgets/`

#### MacOS-Web-Simulator Features:
- ✅ Glass calendar widget
- ✅ Weather widget
- ✅ Clock widget
- ✅ Reminders widget
- ✅ Photo widget
- ✅ World clock widget

#### SmartyAI Enhancement:
```typescript
// ADD: User-specific data
// ADD: Drag-and-drop positioning
// ADD: Widget customization
// ADD: Widget preferences in MongoDB
// ADD: AI chat widget
// ADD: GitHub activity widget
// KEEP: Glass morphism styling

interface SmartyWidgets {
  calendar: CalendarWidget;
  weather: WeatherWidget;
  clock: ClockWidget;
  reminders: RemindersWidget;
  photo: PhotoWidget;
  github: GitHubWidget; // NEW
  ai: AIWidget; // NEW
}

interface WidgetInstance {
  id: string;
  type: WidgetType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  userId: string;
}
```

---

## 🔧 Technical Implementation Guidelines

### Step 1: Setup MongoDB Models

```typescript
// lib/db/models/user-contacts.ts
import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  company: String,
  role: String,
  avatar: String,
  source: { type: String, enum: ['resume', 'linkedin', 'github', 'manual'], default: 'manual' },
  tags: [String],
  notes: String,
  lastContacted: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserContactsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  contacts: [ContactSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const UserContacts = mongoose.models.UserContacts || 
  mongoose.model('UserContacts', UserContactsSchema);
```

### Step 2: Create API Endpoints

```typescript
// pages/api/contacts/[action].ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { UserContacts } from '@/lib/db/models/user-contacts';
import { dbConnect } from '@/lib/db/client';

export default async function handler(req, res) {
  await dbConnect();
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { action } = req.query;
  const userId = session.user.id;
  
  switch (action) {
    case 'get':
      const userContacts = await UserContacts.findOne({ userId })
        .sort({ 'contacts.lastName': 1 });
      return res.json(userContacts || { userId, contacts: [] });
    
    case 'add':
      const newContact = req.body;
      await UserContacts.findOneAndUpdate(
        { userId },
        { $push: { contacts: newContact } },
        { new: true, upsert: true }
      );
      return res.json({ success: true });
    
    case 'update':
      const { contactId, updates } = req.body;
      await UserContacts.findOneAndUpdate(
        { userId, 'contacts._id': contactId },
        { $set: { 'contacts.$': updates } },
        { new: true }
      );
      return res.json({ success: true });
    
    case 'delete':
      await UserContacts.findOneAndUpdate(
        { userId },
        { $pull: { contacts: { _id: contactId } } },
        { new: true }
      );
      return res.json({ success: true });
    
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}
```

### Step 3: Adapt UI Components

```tsx
// src/app/desktop/apps/ContactsApp.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

export default function ContactsApp({ windowId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  
  // Fetch contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => fetch('/api/contacts/get').then(r => r.json())
  });
  
  // Add contact mutation
  const addMutation = useMutation({
    mutationFn: (contact) => 
      fetch('/api/contacts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });
  
  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: ({ contactId, updates }) =>
      fetch('/api/contacts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, updates })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });
  
  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: (contactId) =>
      fetch('/api/contacts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });
  
  const contacts = contactsData?.contacts || [];
  
  const filteredContacts = contacts.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Sidebar - Contact List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
            />
          </div>
        </div>
        
        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p>No contacts found</p>
              <button className="mt-2 text-blue-500 hover:underline">
                Import from Resume
              </button>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div
                key={contact._id}
                onClick={() => setSelectedContact(contact)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                  selectedContact?._id === contact._id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {contact.avatar ? (
                    <img src={contact.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    `${contact.firstName[0]}${contact.lastName[0]}`
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {contact.email}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Right Panel - Contact Details */}
      {selectedContact && (
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-semibold">
                {selectedContact.avatar ? (
                  <img src={selectedContact.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  `${selectedContact.firstName[0]}${selectedContact.lastName[0]}`
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedContact.firstName} {selectedContact.lastName}
                </h2>
                {selectedContact.role && (
                  <p className="text-gray-500">{selectedContact.role}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Edit2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => deleteMutation.mutate(selectedContact._id)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a href={`mailto:${selectedContact.email}`} className="text-blue-500 hover:underline">
                  {selectedContact.email}
                </a>
              </div>
            </div>
            
            {/* Phone */}
            {selectedContact.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${selectedContact.phone}`} className="text-blue-500 hover:underline">
                    {selectedContact.phone}
                  </a>
                </div>
              </div>
            )}
            
            {/* Company */}
            {selectedContact.company && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{selectedContact.company}</p>
                </div>
              </div>
            )}
            
            {/* Tags */}
            {selectedContact.tags.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Notes */}
            {selectedContact.notes && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <StickyNote className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-sm">{selectedContact.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/macos-simulator-integration
```

### 2. Copy UI Components
```bash
# Create apps directory if needed
mkdir -p src/app/desktop/apps

# Copy components (manually adapt)
# Read MacOS-Web-Simulator code
# Extract UI patterns
# Adapt to SmartyAI architecture
```

### 3. Implement MongoDB Models
```bash
# Create model files
touch lib/db/models/user-contacts.ts
touch lib/db/models/user-phone.ts
touch lib/db/models/user-facetime.ts
touch lib/db/models/user-music.ts
touch lib/db/models/user-widgets.ts
```

### 4. Create API Endpoints
```bash
# Create API routes
touch pages/api/contacts/[action].ts
touch pages/api/phone/[action].ts
touch pages/api/facetime/[action].ts
touch pages/api/music/[action].ts
touch pages/api/widgets/[action].ts
```

### 5. Build and Test
```bash
npm run dev
npm run build
npm run test
```

---

## 📝 Checklist

### Pre-Implementation
- [x] Analyze MacOS-Web-Simulator repository
- [x] Identify reusable components
- [x] Create integration plan
- [x] Define MongoDB schemas
- [x] Document architecture

### Implementation (Per Feature)
- [ ] Create MongoDB model
- [ ] Build API endpoint
- [ ] Adapt UI component
- [ ] Add user context
- [ ] Test functionality
- [ ] Write documentation

### Post-Implementation
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Security review
- [ ] Documentation update
- [ ] Deploy to production

---

## 🎯 Success Metrics

1. **User Onboarding Time:** < 5 minutes (Resume → Desktop)
2. **Contact Extraction Accuracy:** > 90%
3. **App Load Time:** < 2 seconds
4. **User Satisfaction:** > 4.5/5 rating
5. **Feature Adoption:** > 80% users try new apps

---

## 📚 Resources

- [MacOS-Web-Simulator GitHub](https://github.com/LikhithSP/MacOS-Web-Simulator)
- [MacOS-Web-Simulator Demo](https://os-portfolio.vercel.app/)
- [SmartyAI Architecture Docs](./ARCHITECTURE.md)
- [MongoDB Schema Design Best Practices](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)

---

## 🤝 Team Collaboration

### Roles & Responsibilities

1. **Frontend Developer:**
   - Adapt UI components from MacOS-Web-Simulator
   - Implement React components
   - Handle state management

2. **Backend Developer:**
   - Create MongoDB models
   - Implement API endpoints
   - Handle authentication

3. **AI Engineer:**
   - Implement resume extraction
   - Contact enrichment AI
   - Smart features

4. **UI/UX Designer:**
   - Review design consistency
   - User testing
   - Accessibility audit

### Communication Channels
- **Daily Standups:** Review progress
- **Weekly Demos:** Show implemented features
- **Slack Channel:** #macos-integration
- **GitHub Issues:** Track bugs and features

---

## 🎉 Conclusion

This implementation plan provides a comprehensive roadmap for integrating MacOS-Web-Simulator features into SmartyAI while maintaining:

✅ User-specific data persistence (MongoDB)
✅ AI-powered features
✅ Multi-tenant architecture
✅ Modern authentication
✅ Real-time capabilities
✅ Scalable infrastructure

**Next Step:** Start with Lock Screen implementation (critical path for onboarding).
