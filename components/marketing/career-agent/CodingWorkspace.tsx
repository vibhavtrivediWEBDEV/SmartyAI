'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Code, FileCode, Folder, Play } from 'lucide-react'

export default function CodingWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const fileTree = {
    'react-performance/': ['App.tsx', 'components/', 'hooks/', 'package.json'],
    'nextjs-app/': ['page.tsx', 'layout.tsx', 'api/', 'public/'],
    'typescript/': ['utils.ts', 'types.ts', 'index.ts'],
    'python/': ['solution.py', 'test_solution.py'],
    'java/': ['Main.java', 'Solution.java'],
  }

  return (
    <section
      id="workspace"
      ref={containerRef}
      className="relative py-32 lg:py-48 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#050508]" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-900/10 via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            Your interview coding environment.
          </h2>
          <p className="max-w-3xl mx-auto text-xl text-white/60 font-light">
            Practice directly inside your development workspace. Real files, real folders, real code.
          </p>
        </motion.div>

        {/* VS Code-like Interface */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-white/10">
            {/* Title Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#323233] border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/40 font-mono">react-performance - SmartyAI Workspace</span>
              </div>
              <div className="w-16" />
            </div>
            
            {/* Main Content */}
            <div className="flex h-[500px]">
              {/* Sidebar */}
              <div className="w-64 bg-[#252526] border-r border-white/5 flex flex-col">
                {/* Explorer Header */}
                <div className="px-4 py-3 text-xs text-white/50 uppercase tracking-wider border-b border-white/5">
                  Explorer
                </div>
                
                {/* File Tree */}
                <div className="flex-1 overflow-auto p-2">
                  {Object.entries(fileTree).map(([folder, files]) => (
                    <div key={folder} className="mb-2">
                      <div className="flex items-center gap-1 px-2 py-1 text-white/70 hover:bg-white/5 rounded cursor-pointer">
                        <Folder className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-mono">{folder}</span>
                      </div>
                      <div className="ml-4">
                        {files.map((file) => (
                          <div key={file} className="flex items-center gap-1 px-2 py-1 text-white/50 hover:bg-white/5 rounded cursor-pointer">
                            {file.endsWith('/') ? (
                              <Folder className="w-3 h-3 text-blue-400" />
                            ) : (
                              <FileCode className="w-3 h-3 text-cyan-400" />
                            )}
                            <span className="text-xs font-mono">{file}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Editor */}
              <div className="flex-1 flex flex-col">
                {/* Tabs */}
                <div className="flex items-center bg-[#252526] border-b border-white/5">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border-r border-white/5">
                    <FileCode className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs text-white/70 font-mono">App.tsx</span>
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 text-white/40 hover:bg-[#1e1e1e] cursor-pointer">
                    <FileCode className="w-3 h-3" />
                    <span className="text-xs font-mono">usePerformance.ts</span>
                  </div>
                </div>
                
                {/* Code Editor */}
                <div className="flex-1 bg-[#1e1e1e] p-4 font-mono text-sm overflow-auto">
                  <pre className="text-white/80">
                    <code>
{`import React, { useMemo, useCallback, memo } from 'react';

// Performance-optimized component
const PerformanceDemo = memo(({ data, onUpdate }) => {
  // Memoized expensive computation
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveCalculation(item)
    }));
  }, [data]);

  // Stable callback reference
  const handleClick = useCallback((id) => {
    onUpdate(id);
  }, [onUpdate]);

  return (
    <div className="performance-container">
      {processedData.map(item => (
        <Item
          key={item.id}
          data={item}
          onClick={handleClick}
        />
      ))}
    </div>
  );
});`}
                    </code>
                  </pre>
                </div>
                
                {/* Terminal */}
                <div className="h-32 bg-[#1e1e1e] border-t border-white/5 flex flex-col">
                  <div className="flex items-center gap-2 px-4 py-1 bg-[#252526] text-xs text-white/50">
                    <span className="text-white/70 font-medium">Terminal</span>
                    <Play className="w-3 h-3 text-emerald-400" />
                    <span className="ml-auto text-xs text-white/30">bash</span>
                  </div>
                  <div className="flex-1 px-4 py-2 font-mono text-xs text-emerald-400">
                    <div>$ npm run dev</div>
                    <div className="text-white/50 mt-1">
                      <span className="text-cyan-400">✓</span> Compiled successfully.
                    </div>
                    <div className="text-white/50">
                      <span className="text-cyan-400">→</span> Local: http://localhost:3000
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview Panel */}
              <div className="w-80 bg-white/[0.02] border-l border-white/5 flex flex-col">
                <div className="px-4 py-2 text-xs text-white/50 uppercase tracking-wider border-b border-white/5">
                  Live Preview
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-center gap-4 text-gray-800">
                    <div className="text-4xl">📊</div>
                    <div className="text-sm font-medium">Performance Metrics</div>
                    <div className="text-xs text-gray-500">Render time: 12ms</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Supported Languages */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-white/40 mb-4">Supported languages & technologies:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['React', 'TypeScript', 'TSX', 'Next.js', 'Python', 'Java', 'HTML', 'CSS', 'JavaScript', 'Node.js'].map((lang) => (
              <span key={lang} className="px-4 py-2 bg-white/[0.02] rounded-lg border border-white/[0.04] text-sm text-white/60">
                {lang}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
