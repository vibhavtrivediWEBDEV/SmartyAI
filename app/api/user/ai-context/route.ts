import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

interface ResumeProfileData {
  name?: string;
  headline?: string;
  about?: string;
  skills?: string[];
  experience?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    links?: string[];
  }>;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  externalLinks?: Array<{
    url: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const userProfile = await db.collection("userProfiles").findOne({
      userId: new ObjectId(user.id),
    });

    // Extract name - use MongoDB profile first
    const fullName = userProfile?.personal?.fullName || 
                     userProfile?.resume?.extracted?.name || 
                     user.name;
    
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';
    const displayName = firstName;

    // Get or generate terminal username
    let username = userProfile?.terminalUsername;
    if (!username) {
      username = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // Get resume data
    let skills: string[] = [];
    let experience: string[] = [];
    let projects: Array<{
      name: string;
      description: string;
      technologies?: string[];
      links?: string[];
    }> = [];
    let bio = '';
    let role = '';
    let github: string | undefined;
    let linkedin: string | undefined;
    let website: string | undefined;

    if (userProfile?.resume?.extracted) {
      const resume = userProfile.resume.extracted as ResumeProfileData;
      
      skills = resume.skills || userProfile.professional?.skills || [];
      experience = resume.experience || [];
      projects = (resume.projects || []).map(p => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        links: p.links,
      }));
      bio = resume.about || userProfile.personal?.summary || '';
      role = resume.headline || userProfile.personal?.headline || '';
      
      // Extract social links
      const socials = userProfile.socialLinks || [];
      const githubLink = socials.find(s => s.platform?.toLowerCase().includes('github'));
      const linkedinLink = socials.find(s => s.platform?.toLowerCase().includes('linkedin'));
      
      if (githubLink) github = githubLink.url;
      if (linkedinLink) linkedin = linkedinLink.url;
      
      if (resume.externalLinks && resume.externalLinks.length > 0) {
        website = resume.externalLinks[0].url;
      }
    } else if (userProfile?.personal) {
      bio = userProfile.personal.summary || '';
      role = userProfile.personal.headline || '';
      skills = userProfile.professional?.skills || [];
    }

    // Generate profile context
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

    // Available desktop apps
    const availableApps = [
      'Terminal', 'Settings', 'Safari', 'Chrome', 'VS Code', 
      'Spotify', 'Calendar', 'Maps', 'YouTube', 'Excel', 
      'Mail', 'PDF', 'Finder', 'Photos', 'Notes'
    ];

    return NextResponse.json({
      userId: user.id,
      username,
      displayName,
      firstName,
      lastName,
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
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      isOwner: true,
      isPublicView: false,
      visibility: 'private',
      availableApps,
      desktopTheme: 'dark',
      profileContext,
    });
  } catch (error) {
    console.error("Error getting user AI context:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateProfileContext(data: {
  displayName: string;
  role: string;
  bio: string;
  skills: string[];
  experience: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies?: string[];
    links?: string[];
  }>;
  github?: string;
  linkedin?: string;
  website?: string;
}): string {
  const sections: string[] = [];
  
  sections.push(`Name: ${data.displayName}`);
  
  if (data.role) {
    sections.push(`Role: ${data.role}`);
  }
  
  if (data.bio) {
    sections.push(`About: ${data.bio}`);
  }
  
  if (data.skills && data.skills.length > 0) {
    sections.push(`Skills: ${data.skills.join(', ')}`);
  }
  
  if (data.experience && data.experience.length > 0) {
    sections.push(`Experience:\n${data.experience.map(e => `  - ${e}`).join('\n')}`);
  }
  
  if (data.projects && data.projects.length > 0) {
    const projectLines = data.projects.map(p => {
      const tech = p.technologies?.length > 0 ? ` (${p.technologies.join(', ')})` : '';
      return `  - ${p.name}${tech}: ${p.description}`;
    });
    sections.push(`Projects:\n${projectLines.join('\n')}`);
  }
  
  const links: string[] = [];
  if (data.github) links.push(`GitHub: ${data.github}`);
  if (data.linkedin) links.push(`LinkedIn: ${data.linkedin}`);
  if (data.website) links.push(`Website: ${data.website}`);
  
  if (links.length > 0) {
    sections.push(`Links:\n${links.map(l => `  ${l}`).join('\n')}`);
  }
  
  return sections.join('\n\n');
}
