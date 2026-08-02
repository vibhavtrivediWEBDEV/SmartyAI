"use client"

import { motion } from "framer-motion"
import { ExternalLinkIcon, FolderIcon } from "lucide-react"

interface ProjectItem {
  label: string
  value: string
  type: 'url' | 'text'
}

interface ProjectsFolderProps {
  folderItems?: ProjectItem[]
  folderColor?: string
}

export function ProjectsFolder({ folderItems = [], folderColor = '#644AFB' }: ProjectsFolderProps) {
  const projects = folderItems

  const handleItemClick = (item: ProjectItem) => {
    if (item.type === 'url') {
      window.open(item.value, '_blank')
    }
  }

  return (
    <div className="p-6 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <FolderIcon 
            className="w-10 h-10" 
            style={{ color: folderColor }}
          />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-gray-400 text-sm">Click to open project links</p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-2 gap-4">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleItemClick(project)}
            className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 cursor-pointer transition-all hover:border-white/30"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-2">
              <FolderIcon 
                className="w-6 h-6" 
                style={{ color: folderColor }}
              />
              <ExternalLinkIcon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </div>

            {/* Project Name */}
            <h3 className="font-semibold text-lg mb-1">{project.label}</h3>

            {project.type === 'text' && project.value && (
              <p className="mb-2 line-clamp-3 text-xs leading-5 text-gray-300">{project.value}</p>
            )}

            {/* Project Type Badge */}
            <div className="inline-block px-2 py-1 rounded-md text-xs bg-white/10 text-gray-300">
              {project.type === 'url' ? 'Open Project' : 'Resume Project'}
            </div>

            {/* Hover Effect Overlay */}
            <motion.div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${folderColor}20 0%, transparent 100%)`
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center py-8">
          <FolderIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-500">No projects found</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500">
          💡 Projects open in new browser tabs
        </p>
      </div>
    </div>
  )
}
