/**
 * Get User AI Context by User ID (for Telegram and other non-session contexts)
 * Similar to getUserAIContextServer but uses userId instead of session
 */

import { getDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { generateProfileContext, type UserAIContext } from './userAIContext'

export async function getUserAIContextByUserId(userId: string): Promise<UserAIContext | null> {
  try {
    console.log('🎯 Loading user context for userId:', userId)
    
    const db = await getDatabase()
    
    // Try ObjectId first
    let userProfile = null
    try {
      userProfile = await db.collection('userProfiles').findOne({
        userId: new ObjectId(userId)
      })
    } catch (e) {
      // Try string userId
      userProfile = await db.collection('userProfiles').findOne({
        userId: userId
      })
    }
    
    // Also get basic user info
    let user = null
    try {
      user = await db.collection('users').findOne({
        _id: new ObjectId(userId)
      })
    } catch (e) {
      user = await db.collection('users').findOne({
        _id: userId
      })
    }
    
    if (!userProfile && !user) {
      console.warn('No user or profile found for userId:', userId)
      return null
    }
    
    // Build context
    const fullName = userProfile?.personal?.fullName || 
                     userProfile?.resume?.extracted?.name || 
                     user?.name || 'User'
    
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0] || fullName
    const displayName = firstName
    const username = userProfile?.terminalUsername || firstName.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    const resume = userProfile?.resume?.extracted || {}
    const skills = resume?.skills || userProfile?.professional?.skills || []
    const experience = resume?.experience || []
    const projects = (resume?.projects || []).map((p: any) => ({
      name: p.name,
      description: p.description,
      technologies: p.technologies || [],
      links: p.links || [],
    }))
    
    const bio = userProfile?.personal?.about || resume?.about || ''
    const role = userProfile?.resume?.extracted?.headline || userProfile?.professional?.headline || user?.role || 'Developer'
    
    const socialLinks = userProfile?.socialLinks || []
    const github = socialLinks.find((l: any) => l.platform?.toLowerCase() === 'github')?.url
    const linkedin = socialLinks.find((l: any) => l.platform?.toLowerCase() === 'linkedin')?.url
    const website = socialLinks.find((l: any) => l.platform?.toLowerCase() === 'website')?.url ||
                    userProfile?.personal?.website
    
    const profileContext = generateProfileContext({
      displayName,
      role,
      bio,
      skills,
      experience,
      projects,
      github,
      linkedin,
      website,
    })
    
    console.log(`✅ Loaded context for ${displayName}: ${skills.length} skills, ${projects.length} projects`)
    
    return {
      userId,
      username,
      displayName,
      firstName,
      lastName: nameParts.slice(1).join(' '),
      email: user?.email || 'user@example.com',
      aiName: `${displayName} AI`,
      macName: `${displayName}'s Mac`,
      role,
      bio,
      skills,
      experience,
      projects,
      github,
      linkedin,
      website,
      plan: 'free',
      subscriptionStatus: 'active',
      isOwner: true,
      isPublicView: false,
      visibility: 'private',
      availableApps: ['Finder', 'About', 'Projects', 'Resume', 'Terminal', 'Settings', 'chrome', 'Mail', 'Excel Editor', 'AI Search', 'vscode', 'Spotify', 'Calendar', 'Maps', 'Youtube', 'Photos', 'App Store'],
      desktopTheme: 'dark',
      profileContext,
    }
  } catch (error) {
    console.error('❌ Error loading user context by userId:', error)
    return null
  }
}
