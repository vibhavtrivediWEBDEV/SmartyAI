/**
 * User AI Context - SERVER ONLY
 * 
 * This module provides server-side user context for API routes.
 * DO NOT import this in client components - it will cause MongoDB webpack errors.
 */

import { getCurrentUser } from '@/lib/actions/auth.action';
import { getDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import type { UserAIContext } from './userAIContext';
import { generateProfileContext } from './userAIContext';

/**
 * Get current user's AI context for the authenticated user (SERVER-SIDE)
 * Use this in API routes and server components only
 */
export async function getUserAIContextServer(): Promise<UserAIContext | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn('No current user found');
      return null;
    }

    // Import database functions (server-side only)
    const { getDatabase } = await import('@/lib/db/mongodb');
    const { ObjectId } = await import('mongodb');
    
    const db = await getDatabase();
    const userProfile = await db.collection('userProfiles').findOne({
      userId: new ObjectId(user.id),
    });

    if (!userProfile) {
      console.warn('No user profile found for user:', user.id);
      // Return minimal context
      const firstName = user.name?.split(' ')[0] || 'User';
      return {
        userId: user.id,
        username: firstName.toLowerCase(),
        displayName: firstName,
        firstName,
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        aiName: `${firstName} AI`,
        macName: `${firstName}'s Mac`,
        role: 'Developer',
        bio: '',
        skills: [],
        experience: [],
        projects: [],
        github: undefined,
        linkedin: undefined,
        website: undefined,
        plan: 'free',
        subscriptionStatus: 'active',
        isOwner: true,
        isPublicView: false,
        visibility: 'private',
        availableApps: ['Finder', 'About', 'Projects', 'Resume', 'Terminal', 'Settings', 'chrome', 'Mail', 'Excel Editor', 'AI Search', 'vscode', 'Spotify', 'Calendar', 'Maps', 'Youtube', 'Photos', 'App Store'],
        desktopTheme: 'dark',
        profileContext: `Name: ${firstName}\nYou are assisting ${firstName} with their desktop.`,
      };
    }

    // Use the profile data - similar logic to /api/user/ai-context route
    const fullName = userProfile?.personal?.fullName || 
                     userProfile?.resume?.extracted?.name || 
                     user.name;
    
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || fullName;
    const displayName = firstName;
    const username = userProfile?.terminalUsername || firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const resume = userProfile?.resume?.extracted || {};
    const skills = resume?.skills || userProfile?.professional?.skills || [];
    const experience = resume?.experience || [];
    const projects = (resume?.projects || []).map((p: any) => ({
      name: p.name,
      description: p.description,
      technologies: p.technologies || [],
      links: p.links || [],
    }));
    
    const bio = userProfile?.personal?.about || resume?.about || '';
    const role = userProfile?.resume?.extracted?.headline || userProfile?.professional?.headline || '';
    
    const socialLinks = userProfile?.socialLinks || [];
    const github = socialLinks.find((l: any) => l.platform?.toLowerCase() === 'github')?.url;
    const linkedin = socialLinks.find((l: any) => l.platform?.toLowerCase() === 'linkedin')?.url;
    const website = socialLinks.find((l: any) => l.platform?.toLowerCase() === 'website')?.url ||
                    userProfile?.personal?.website;

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
    });

    return {
      userId: user.id,
      username,
      displayName,
      firstName,
      lastName: nameParts.slice(1).join(' '),
      email: user.email,
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
      plan: userProfile?.plan || 'free',
      subscriptionStatus: userProfile?.subscriptionStatus || 'active',
      isOwner: true,
      isPublicView: false,
      visibility: 'private',
      availableApps: ['Finder', 'About', 'Projects', 'Resume', 'Terminal', 'Settings', 'chrome', 'Mail', 'Excel Editor', 'AI Search', 'vscode', 'Spotify', 'Calendar', 'Maps', 'Youtube', 'Photos', 'App Store'],
      desktopTheme: 'dark',
      profileContext,
    };
  } catch (error) {
    console.error('Error getting user AI context (server):', error);
    return null;
  }
}

/**
 * Get user AI context by userId directly (SERVER-SIDE ONLY)
 * Used by server processes like career executor that have userId from context
 * Does NOT require session authentication - uses userId directly
 */
export async function getUserAIContextById(userId: string): Promise<UserAIContext | null> {
  try {
    const db = await getDatabase();
    const userProfile = await db.collection('userProfiles').findOne({
      userId: new ObjectId(userId),
    });
    
    if (!userProfile) {
      console.warn('No user profile found for userId:', userId);
      return null;
    }
    
    // Build UserAIContext from profile
    const fullName = userProfile?.personal?.fullName || 
                     userProfile?.resume?.extracted?.name || 
                     'User';
    
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';
    const displayName = firstName;
    const username = userProfile?.terminalUsername || firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const resume = userProfile?.resume?.extracted || {};
    const skills = resume?.skills || userProfile?.professional?.skills || [];
    const experience = resume?.experience || userProfile?.professional?.experience?.map((e: any) => 
      `${e.title} at ${e.company}`) || [];
    const projects = (resume?.projects || userProfile?.professional?.projects || []).map((p: any) => ({
      name: p.name,
      description: p.description,
      technologies: p.technologies || [],
      links: p.links || [],
    }));
    
    const bio = userProfile?.personal?.about || resume?.about || '';
    const role = userProfile?.resume?.extracted?.headline || userProfile?.professional?.headline || 'Developer';
    
    const socialLinks = userProfile?.socialLinks || [];
    const github = socialLinks.find((l: any) => l.platform?.toLowerCase() === 'github')?.url;
    const linkedin = socialLinks.find((l: any) => l.platform?.toLowerCase() === 'linkedin')?.url;
    const website = socialLinks.find((l: any) => l.platform?.toLowerCase() === 'website')?.url ||
                    userProfile?.personal?.website;

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
    });

    return {
      userId: userId,
      username,
      displayName,
      firstName,
      lastName,
      email: userProfile.email || '',
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
      plan: userProfile?.plan || 'free',
      subscriptionStatus: userProfile?.subscriptionStatus || 'active',
      isOwner: true,
      isPublicView: false,
      visibility: 'private',
      availableApps: ['Finder', 'About', 'Projects', 'Resume', 'Terminal', 'Settings', 'chrome', 'Mail', 'Excel Editor', 'AI Search', 'vscode', 'Spotify', 'Calendar', 'Maps', 'Youtube', 'Photos', 'App Store'],
      desktopTheme: 'dark',
      profileContext,
    };
  } catch (error) {
    console.error('Error getting user AI context by ID:', error);
    return null;
  }
}
