/**
 * FolderTreeVisualizer - Shows folder structure where files are located
 * 
 * Features:
 * - Displays folder hierarchy with indentation
 * - Shows files within their parent folders
 * - Collapsible folder nodes
 * - Theme-aware (dark/light mode)
 */

import React, { useState } from 'react';

interface FileNode {
  name: string;
  path: string;
  type: 'file';
  score?: number;
  description?: string;
}

interface FolderNode {
  name: string;
  path: string;
  type: 'folder';
  children: TreeNode[];
}

type TreeNode = FileNode | FolderNode;

interface FolderTreeVisualizerProps {
  files: Array<{
    path: string;
    name: string;
    score?: number;
    description?: string;
  }>;
  searchTerm: string;
  isDark: boolean;
  onSelectFile?: (filePath: string) => void;
}

// Apple-style design tokens
const tokens = (isDark: boolean) => ({
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
  mono: '"SF Mono", Menlo, monospace',
  text: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.9)',
  textSecondary: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
  textTertiary: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
  divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
  surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
  surfaceHover: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.035)',
  accent: isDark ? '#0A84FF' : '#007AFF',
  accentSoft: isDark ? 'rgba(10,132,255,0.14)' : 'rgba(0,122,255,0.08)',
});

// File row component with 3 action buttons
const FileRow = ({ node, isTopResult, isDark, indent, onSelectFile }: {
  node: FileNode;
  isTopResult: boolean;
  isDark: boolean;
  indent: number;
  onSelectFile?: (path: string) => void;
}) => {
  const [showButtons, setShowButtons] = useState(false);
  const t = tokens(isDark);

  return (
    <div>
      <div
        onClick={() => setShowButtons(!showButtons)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          marginLeft: indent,
          borderRadius: 8,
          cursor: 'pointer',
          background: showButtons ? t.surfaceHover : 'transparent',
          transition: 'background 0.12s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = t.surfaceHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = showButtons ? t.surfaceHover : 'transparent'; }}
      >
        <span style={{
          fontSize: 15,
          width: 20,
          textAlign: 'center',
          color: isTopResult ? t.accent : t.textTertiary
        }}>
          {isTopResult ? '●' : '▫'}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 500,
            fontSize: 13,
            color: t.text,
            marginBottom: 2
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.name}
            </span>
            {isTopResult && (
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: t.accent,
                letterSpacing: 0.2,
                flexShrink: 0
              }}>
                Best Match
              </span>
            )}
          </div>

          <div style={{
            fontSize: 11,
            color: t.textSecondary,
            fontFamily: t.mono,
            wordBreak: 'break-all',
          }}>
            {node.path}
          </div>
        </div>

        {node.score !== undefined && (
          <div style={{
            fontSize: 11,
            fontFamily: t.mono,
            color: t.textTertiary,
            flexShrink: 0
          }}>
            {node.score}
          </div>
        )}

        <span style={{
          color: t.textTertiary,
          fontSize: 10,
          flexShrink: 0
        }}>
          {showButtons ? '⌃' : '⌄'}
        </span>
      </div>

      {/* Action buttons — flat macOS list style */}
      {showButtons && (
        <div style={{
          marginLeft: indent + 30,
          marginBottom: 8,
          marginTop: 2,
          borderRadius: 8,
          overflow: 'hidden',
          border: `1px solid ${t.divider}`,
        }}>
          {[
            {
              label: '📁 Open in Smarty',
              action: async () => {
                const ext = node.path.split('.').pop()?.toLowerCase();
                let appName = 'Finder';
                
                if (ext === 'pdf') appName = 'PDF Viewer';
                else if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'md', 'txt', 'json', 'xml', 'yaml', 'yml', 'html', 'css', 'scss', 'sass'].includes(ext || '')) appName = 'vscode';
                else if (['mp3', 'mp4', 'wav', 'mov', 'avi'].includes(ext || '')) appName = 'Music';
                else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp'].includes(ext || '')) appName = 'Photos';
                
                // For PDF, use HTTP streaming endpoint instead of file:// (browser security)
                const fileUrl = appName === 'PDF Viewer' 
                  ? `/api/file/stream?path=${encodeURIComponent(node.path)}`
                  : node.path;
                
                // Dispatch event to open file in Smarty app window
                window.dispatchEvent(new CustomEvent('smarty:open-file', {
                  detail: {
                    appName,
                    filePath: node.path,
                    fileName: node.name,
                    fileUrl // Stream URL for browser-safe viewing
                  }
                }));
                
                setShowButtons(false);
              }
            },
            {
              label: '🖥️ Open in System App',
              action: async () => {
                try {
                  const ext = node.path.split('.').pop()?.toLowerCase();
                  let app: string | undefined;
                  if (ext === 'pdf') app = 'Preview';
                  else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs'].includes(ext || '')) {
                    app = 'Visual Studio Code';
                  }
                  const response = await fetch('/api/file/open', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: node.path, app })
                  });
                  if (response.ok) {
                    setShowButtons(false);
                  } else {
                    const error = await response.json();
                    console.error('Failed to open file:', error);
                  }
                } catch (err) {
                  console.error('Failed to open file:', err);
                }
              }
            },
            {
              label: '📥 Move to Downloads',
              action: async () => {
                try {
                  const response = await fetch('/api/file/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ source: node.path, destination: 'Downloads' })
                  });
                  const result = await response.json();
                  if (response.ok && result.success) {
                    window.dispatchEvent(new CustomEvent('smarty:toast', { detail: { type: 'success', message: `✅ File copied to ~/Downloads/Smarty` } }));
                    // Refresh Finder to show new file
                    window.dispatchEvent(new CustomEvent('finder-desktop-change'));
                    setShowButtons(false);
                  } else {
                    window.dispatchEvent(new CustomEvent('smarty:toast', { detail: { type: 'error', message: `❌ Failed to move: ${result.error || 'Unknown error'}` } }));
                    console.error('Failed to move file:', result);
                  }
                } catch (err) {
                  window.dispatchEvent(new CustomEvent('smarty:toast', { detail: { type: 'error', message: '❌ Failed to move file' } }));
                  console.error('Failed to move file:', err);
                }
              }
            },
            {
              label: '📤 Send to Telegram',
              action: async () => {
                try {
                  window.dispatchEvent(new CustomEvent('smarty:toast', { detail: { type: 'info', message: '📤 Sending to Telegram...' } }));
                  const response = await fetch('/api/telegram/send-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filePath: node.path })
                  });
                  const result = await response.json();
                  if (response.ok && result.success) {
                    window.dispatchEvent(new CustomEvent('smarty:toast', { detail: { type: 'success', message: '✅ File sent to Telegram!' } }));
                    setShowButtons(false);
                  } else {
                    const errorMsg = result.errorType === 'CONNECTION_REQUIRED' ? '❌ Connect Telegram first' :
                                     result.errorType === 'FILE_NOT_FOUND' ? '❌ File not found' :
                                     '❌ Failed to send file';
                    window.dispatchEvent(new CustomEvent('smarty:toast', { detail: { type: 'error', message: errorMsg } }));
                    console.error('Failed to send to Telegram:', result);
                  }
                } catch (err) {
                  window.dispatchEvent(new CustomEvent('smarty:toast', { detail: { type: 'error', message: '❌ Failed to send to Telegram' } }));
                  console.error('Failed to send to Telegram:', err);
                }
              }
            }
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={(e) => { e.stopPropagation(); item.action(); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '9px 14px',
                background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
                border: 'none',
                borderBottom: i < arr.length - 1 ? `1px solid ${t.divider}` : 'none',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 400,
                color: t.text,
                transition: 'background 0.12s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.accentSoft; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : '#fff'; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function buildFolderTree(files: FolderTreeVisualizerProps['files']): TreeNode[] {
  if (!files || files.length === 0) {
    return [];
  }
  const results: TreeNode[] = files.map((file) => ({
    name: file.name,
    path: file.path,
    type: 'file' as const,
    score: file.score,
    description: file.description
  }));
  return results;
}

/**
 * Render folder tree recursively
 */
const TreeNodeRenderer: React.FC<{
  node: TreeNode;
  depth: number;
  isDark: boolean;
  searchTerm: string;
  isTopResult?: boolean;
  onSelectFile?: (filePath: string) => void;
}> = ({ node, depth, isDark, searchTerm, isTopResult, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(depth < 2 || isTopResult);
  const indent = depth * 20;
  const t = tokens(isDark);

  if (node.type === 'folder') {
    const childCount = node.children.filter(c => c.type === 'file').length;

    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            marginLeft: indent,
            cursor: 'pointer',
            borderRadius: 6,
            userSelect: 'none',
            transition: 'background 0.12s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = t.surfaceHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{
            width: 10,
            color: t.textTertiary,
            fontSize: 9,
          }}>
            {isOpen ? '▾' : '▸'}
          </span>
          <span style={{
            fontWeight: 500,
            fontSize: 13,
            color: t.text,
            flex: 1
          }}>
            {node.name}
          </span>
          {childCount > 0 && (
            <span style={{
              fontSize: 11,
              color: t.textTertiary,
            }}>
              {childCount}
            </span>
          )}
        </div>

        {isOpen && node.children.map((child, idx) => (
          <TreeNodeRenderer
            key={`${child.path}-${idx}`}
            node={child}
            depth={depth + 1}
            isDark={isDark}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    );
  } else {
    return (
      <FileRow
        node={node}
        isTopResult={isTopResult || false}
        isDark={isDark}
        indent={indent}
        onSelectFile={onSelectFile}
      />
    );
  }
};

export const FolderTreeVisualizer: React.FC<FolderTreeVisualizerProps> = ({
  files,
  searchTerm,
  isDark,
  onSelectFile
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const t = tokens(isDark);

  if (!files || files.length === 0) {
    return (
      <div style={{
        padding: 24,
        textAlign: 'center',
        color: t.textTertiary,
        fontSize: 13,
        fontFamily: t.font
      }}>
        No files found
      </div>
    );
  }

  const tree = buildFolderTree(files);

  return (
    <div style={{
      fontFamily: t.font,
      padding: '4px 0'
    }}>
      <div style={{ maxHeight: 'calc(100vh - 320px)', minHeight: 160, overflowY: 'auto' }}>
        {tree.map((node, idx) => (
          <TreeNodeRenderer
            key={`${node.path}-${idx}`}
            node={node}
            depth={0}
            isDark={isDark}
            searchTerm={searchTerm}
            isTopResult={idx === 0 && node.type === 'file'}
            onSelectFile={(filePath) => {
              setSelectedFile(filePath);
              onSelectFile?.(filePath);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FolderTreeVisualizer;