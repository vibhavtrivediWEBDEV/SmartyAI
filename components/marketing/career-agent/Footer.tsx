'use client'

import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    Product: [
      { name: 'Career Agent', href: '#career-agent' },
      { name: 'AI Teacher', href: '#teacher' },
      { name: 'Interview Agent', href: '#interviewer' },
      { name: 'Coding Workspace', href: '#workspace' },
    ],
    Company: [
      { name: 'About', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
    ],
    Resources: [
      { name: 'Documentation', href: '#' },
      { name: 'Help Center', href: '#' },
      { name: 'API', href: '#' },
      { name: 'Status', href: '#' },
    ],
    Legal: [
      { name: 'Privacy', href: '#' },
      { name: 'Terms', href: '#' },
      { name: 'Security', href: '#' },
    ],
  }

  return (
    <footer className="relative bg-black border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white font-semibold text-lg">SmartyAI</span>
            </div>
            <p className="text-white/40 text-sm mb-6 max-w-xs">
              Your AI Career Agent. From job description to interview ready.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                <Twitter className="w-4 h-4 text-white/50" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                <Github className="w-4 h-4 text-white/50" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                <Linkedin className="w-4 h-4 text-white/50" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                <Mail className="w-4 h-4 text-white/50" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} SmartyAI. All rights reserved.
            </p>
            <p className="text-xs text-white/30">
              Built for developers preparing for their next opportunity.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
