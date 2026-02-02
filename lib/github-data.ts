// GitHub API utilities to fetch user repos and convert to desktop structure

export interface Repository {
  id: number;
  name: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
}

export interface RepositoryItem {
  label: string;
  value: string;
  type: 'url' | 'text';
}

export interface FolderIcon {
  id: number;
  name: string;
  type: 'folder';
  x: number;
  y: number;
  color: string;
  items: RepositoryItem[];
  repositories: Repository[];
}

export interface DesktopIcon {
  id: number;
  name: string;
  type: 'file' | 'folder' | 'trash';
  x: number;
  y: number;
  icon?: any;
}

const GITHUB_API_BASE = 'https://api.github.com';

export async function fetchGitHubUser(username: string) {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/users/${username}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    return null;
  }


  
}

export async function fetchGitHubRepositories(username: string): Promise<Repository[]> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=stars&order=desc`);
    if (!response.ok) throw new Error('Failed to fetch repos');
    
    const repos = await response.json();
    return repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
      stars: repo.stargazers_count,
      language: repo.language,
    }));
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return [];
  }
}

export function convertRepositoriesToFolderItems(repositories: Repository[]): RepositoryItem[] {
  return repositories.flatMap((repo) => [
    { label: 'Project', value: repo.name, type: 'text' as const },
    { label: 'GitHub', value: repo.url, type: 'url' as const },
    { label: 'Description', value: repo.description || 'No description', type: 'text' as const },
  ]);
}

export function createFolderIconsFromRepositories(repositories: Repository[]): FolderIcon[] {
  const folderColor = 'pink';
  
  return repositories.map((repo, index) => ({
    id: repo.id,
    name: repo.name,
    type: 'folder' as const,
    x: 100 + (index % 3) * 250,
    y: 100 + Math.floor(index / 3) * 150,
    color: folderColor,
    items: [
      { label: 'Project', value: repo.name, type: 'text' as const },
      { label: 'GitHub URL', value: repo.url, type: 'url' as const },
      { label: 'Stars', value: `${repo.stars}⭐`, type: 'text' as const },
      { label: 'Language', value: repo.language || 'Not specified', type: 'text' as const },
      { label: 'Description', value: repo.description || 'No description available', type: 'text' as const },
    ],
    repositories: [repo],
  }));
}
