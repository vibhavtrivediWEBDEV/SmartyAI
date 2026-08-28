export type DesktopAppCategory = 'System' | 'Productivity' | 'Creativity' | 'Developer' | 'Entertainment'

export interface DesktopAppDefinition {
  name: string
  displayName: string
  description: string
  category: DesktopAppCategory
  icon: string
  essential?: boolean
}

/**
 * Public desktop applications backed by openApplication() cases.
 * Internal windows such as Preview and aliases such as Resume are intentionally omitted.
 */
export const DESKTOP_APPS: DesktopAppDefinition[] = [
  { name: 'Finder', displayName: 'Finder', description: 'Browse projects, folders, and files.', category: 'System', icon: 'https://framerusercontent.com/images/wtQkw1jK0MlEDOrW0Q1kE5PBqc.png', essential: true },
  { name: 'App Store', displayName: 'App Store', description: 'Discover apps and customize your Dock.', category: 'System', icon: 'https://framerusercontent.com/images/KCaz69s4OvhKMUI25E1RBeuNIyA.png', essential: true },
  { name: 'Settings', displayName: 'System Settings', description: 'Personalize your Smarty desktop.', category: 'System', icon: 'https://framerusercontent.com/images/VbY44vBZlQp4srNQK6ohxpco.png' },
  { name: 'Terminal', displayName: 'Terminal', description: 'Run commands and desktop automations.', category: 'Developer', icon: 'https://cdn2.iconfinder.com/data/icons/web-application-icons-part-i/100/Artboard_18-512.png' },
  { name: 'vscode', displayName: 'Visual Studio Code', description: 'Create, edit, and preview source code.', category: 'Developer', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
  { name: 'figma', displayName: 'Figma', description: 'Design interfaces and creative projects.', category: 'Creativity', icon: '/assets/figmaicon.png' },
  { name: 'Excel Editor', displayName: 'Smarty Excel AI', description: 'Open Excel and CSV files, edit multiple sheets, generate formulas, clean data, and build complete workbooks with AI.', category: 'Productivity', icon: '/icons/excel.svg' },
  { name: 'Data Table', displayName: 'Table Studio', description: 'Generate rich AG Grid tables from data or natural language, then refine them live with AI.', category: 'Productivity', icon: '/grid.svg' },
  { name: 'ATS', displayName: 'ATS Resume', description: 'Build and score an applicant-ready resume.', category: 'Productivity', icon: '/assets/pdfIcon.png' },
  { name: 'Interview', displayName: 'Smarty Interview', description: 'Practice and review AI interview sessions. Terminal command: interview.', category: 'Productivity', icon: '/ai-avatar.png' },
  { name: 'Smarty Teacher', displayName: 'Smarty Teacher', description: 'Learn interactively with the AI teacher. Terminal command: smarty.', category: 'Productivity', icon: '/robot.png' },
  { name: 'Safari', displayName: 'AI Search', description: 'Search the web with AI assistance.', category: 'Productivity', icon: 'https://framerusercontent.com/images/qQISGOSSnz748TdrZn91l44R5u0.png' },
  { name: 'chrome', displayName: 'Google Chrome', description: 'Browse websites in a side panel.', category: 'Productivity', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg' },
  { name: 'Mail', displayName: 'Mail', description: 'Write and send email messages.', category: 'Productivity', icon: 'https://framerusercontent.com/images/fm90fwzWoBMCvK5C0MOyKdo94.png' },
  { name: 'Calendar', displayName: 'Calendar', description: 'View dates, schedules, and events.', category: 'Productivity', icon: 'https://framerusercontent.com/images/VeljykK560qBRDkQkYyhx8ChI.png' },
  { name: 'Notes', displayName: 'Notes', description: 'Capture ideas in a premium notes workspace.', category: 'Productivity', icon: 'https://framerusercontent.com/images/Z0d1XNe7wVINUiHydSL6noKho.png' },
  { name: 'PDF Viewer', displayName: 'Preview', description: 'Read PDF files and learning material.', category: 'Productivity', icon: '/assets/pdfIcon.png' },
  { name: 'Science Book', displayName: 'Science Book', description: 'Explore interactive NCERT science content.', category: 'Productivity', icon: '/app.svg' },
  { name: 'AI Book', displayName: 'AI Book', description: 'Study with the interactive AI science book. Terminal command: ai-book.', category: 'Productivity', icon: '/app.svg' },
  { name: 'Resume PDF', displayName: 'Resume', description: 'View or upload your professional resume.', category: 'Productivity', icon: '/assets/pdfIcon.png' },
  { name: 'About Me', displayName: 'About Me', description: 'View the profile and professional summary.', category: 'Productivity', icon: '/profile.svg' },
  { name: 'Projects', displayName: 'Projects', description: 'Browse portfolio projects and links.', category: 'Productivity', icon: '/app.svg' },
  { name: 'Maps', displayName: 'Maps', description: 'Explore locations with interactive maps, search, 3D view, and navigation. Terminal command: maps.', category: 'Productivity', icon: 'https://framerusercontent.com/images/YtLyrfz2kFN2QhkzBWG6TrATw.png' },
  { name: 'FaceTime', displayName: 'FaceTime', description: 'Make video and audio calls with contacts.', category: 'Productivity', icon: '/icons/facetime.svg' },
  { name: 'Contacts', displayName: 'Contacts', description: 'Manage your personal contacts and addresses.', category: 'Productivity', icon: '/icons/contacts.svg' },
  { name: 'Photos', displayName: 'Photos', description: 'View images in an immersive gallery.', category: 'Creativity', icon: 'https://framerusercontent.com/images/ogWIDEJmWxA8SVRZpEe7gk35FcM.png' },
  { name: 'website', displayName: 'Portfolio', description: 'Open the interactive portfolio website.', category: 'Creativity', icon: '/globe.svg' },
  { name: 'Music', displayName: 'Music', description: 'Listen to music with a beautiful player interface.', category: 'Entertainment', icon: '/icons/music.svg' },
  { name: 'Messages', displayName: 'Messages', description: 'Send and receive messages with contacts.', category: 'Productivity', icon: '/icons/messages.svg' },
  { name: 'Phone', displayName: 'Phone', description: 'Make calls and manage contacts.', category: 'Productivity', icon: '/icons/phone.svg' },
  { name: 'Youtube', displayName: 'YouTube', description: 'Watch videos and discover channels.', category: 'Entertainment', icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg' },
  { name: 'TV', displayName: 'Apple TV', description: 'Browse visual news and entertainment.', category: 'Entertainment', icon: 'https://framerusercontent.com/images/1pORyCnfgAxpXWyCa1l7s8IJeK0.png' },
  { name: 'game', displayName: 'Games', description: 'Launch the desktop game center.', category: 'Entertainment', icon: '/app.svg' },
  { name: 'Career', displayName: 'Career Agent', description: 'AI-powered interview preparation assistant. Manage career missions with step-by-step guidance.', category: 'Productivity', icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 96 96\'%3E%3ClinearGradient id=\'grad1\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'0%25\' style=\'stop-color:%2310B981\'/%3E%3Cstop offset=\'100%25\' style=\'stop-color:%23059669\'/%3E%3C/linearGradient%3E%3Crect width=\'96\' height=\'96\' rx=\'20\' fill=\'url(%23grad1)\'/%3E%3Cpath d=\'M48 20c-8.8 0-16 7.2-16 16v8c0 2.2 1.8 4 4 4h4c0 4.4 3.6 8 8 8s8-3.6 8-8h4c2.2 0 4-1.8 4-4v-8c0-8.8-7.2-16-16-16z\' fill=\'white\'/%3E%3Ccircle cx=\'48\' cy=\'36\' r=\'12\' fill=\'white\'/%3E%3Cpath d=\'M36 52v8c0 2.2 1.8 4 4 4h16c2.2 0 4-1.8 4-4v-8\' stroke=\'white\' stroke-width=\'3\' fill=\'none\'/%3E%3Cpath d=\'M32 68h32M40 68v8M56 68v8\' stroke=\'white\' stroke-width=\'3\' stroke-linecap=\'round\'/%3E%3C/svg%3E' },
  { name: "Don't Look", displayName: 'Trash', description: 'Open the mysterious Trash folder.', category: 'System', icon: '/file.svg' },
]

export const DEFAULT_DOCK_APPS = [
  'Finder',
  'Safari',
  'Maps',
  'FaceTime',
  'Messages',
  'Mail',
  'Calendar',
  'Career',
  'Music',
  'Terminal',
  'vscode',
  'App Store',
  'Settings',
]

export function getDesktopAppSlug(app: Pick<DesktopAppDefinition, 'displayName'>) {
  return app.displayName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getDesktopApp(name: string) {
  return DESKTOP_APPS.find((app) => app.name === name)
}

export function getDesktopAppBySlug(slug: string) {
  return DESKTOP_APPS.find((app) => getDesktopAppSlug(app) === slug)
}
