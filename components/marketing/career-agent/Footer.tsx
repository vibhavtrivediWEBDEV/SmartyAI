import Link from 'next/link'
import { ArrowUpRight, Command, LockKeyhole, Radio, ShieldCheck } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    Explore: [
      { name: 'OS automation', href: '#automation' },
      { name: 'Product system', href: '#product' },
      { name: 'How it works', href: '#how-it-works' },
    ],
    Career: [
      { name: 'Career Agent', href: '#career-agent' },
      { name: 'AI Teacher', href: '#teacher' },
      { name: 'Interview Agent', href: '#interviewer' },
      { name: 'Coding Workspace', href: '#workspace' },
    ],
    Start: [
      { name: 'Create account', href: '/sign-up' },
      { name: 'Sign in', href: '/sign-in' },
      { name: 'View plans', href: '#pricing' },
    ],
  }

  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-black">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/50 to-transparent" />
      <div className="mx-auto max-w-375 px-5 pt-16 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:px-8 lg:px-12 lg:pt-20 lg:pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr]">
          <div>
            <Link href="/" className="flex w-fit items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 text-white">
                <Command className="h-4 w-4" />
              </span>
              <span className="text-lg font-semibold text-white">SmartyAI</span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/40">
              A permission-controlled AI operating system that connects your work, career, apps, and files without taking control away from you.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/45">
              <span className="flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5 text-lime-300" /> Scoped access</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Explicit approval</span>
              <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-cyan-300" /> Remote execution</span>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-5 text-xs font-semibold uppercase text-white/30">{category}</h3>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="group inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white">
                      {link.name}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SmartyAI. All rights reserved.</p>
          <p>Your files remain yours. Every consequential action remains visible.</p>
        </div>
      </div>
    </footer>
  )
}
