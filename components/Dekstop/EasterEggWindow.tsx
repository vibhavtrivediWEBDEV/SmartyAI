"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Lightbulb } from "lucide-react"

export function EasterEggWindow() {
  const [showJokeModal, setShowJokeModal] = useState(true)
  const [currentJoke, setCurrentJoke] = useState({ type: 'joke' as const, content: '' })
  const [showFunFact, setShowFunFact] = useState(false)

  const jokes = [
    "Why do programmers prefer dark mode? Because light attracts bugs!",
    "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'",
    "Why do Java developers wear glasses? Because they can't C#!",
    "There are only 10 types of people in the world: those who understand binary and those who don't.",
    "Why did the developer go broke? Because he used up all his cache!",
    "A programmer's wife tells him: 'Go to the store and buy a loaf of bread. If they have eggs, buy a dozen.' He comes home with 12 loaves of bread.",
    "Why do programmers confuse Halloween with Christmas? Because Oct 31 = Dec 25!",
    "!false - It's funny because it's true!",
    "Why do programmers hate nature? It has too many bugs!",
    "A programmer walks into a bar and orders 0 beers. The bartender says, 'Sorry, we don't serve null values.'",
    "Why did the programmer quit his job? Because he didn't get arrays!",
    "There's a band called 1023MB. They haven't had any gigs yet.",
    "What's a programmer's favorite hangout place? Foo Bar!",
    "Why do developers hate nature? It has too many bugs!",
    "A programmer walks into a bar. The bartender asks, 'What can I get you?' The programmer says, 'I'll have a 404.' The bartender says, 'Sorry, we don't serve error messages.'"
  ]

  const funFacts = [
    "Fun Fact: The first computer programmer was Ada Lovelace, who wrote algorithms for Charles Babbage's Analytical Engine in the 1840s!",
    "Fun Fact: The term 'bug' in computing comes from an actual moth found in a Harvard Mark II computer in 1947!",
    "Fun Fact: The first website ever created is still online at info.cern.ch!",
    "Fun Fact: Wi-Fi doesn't stand for 'Wireless Fidelity' - it doesn't stand for anything!",
    "Fun Fact: The first computer mouse was made of wood in 1964!",
    "Fun Fact: The average programmer writes about 10-12 lines of code per hour that actually make it to production!",
    "Fun Fact: CAPTCHA stands for 'Completely Automated Public Turing test to tell Computers and Humans Apart'!"
  ]

  useEffect(() => {
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)]
    setCurrentJoke({ type: 'joke', content: randomJoke })
    
    // Show fun fact after 3 seconds
    const timer = setTimeout(() => {
      setShowFunFact(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="p-6 text-white relative">
      <AnimatePresence>
        {showJokeModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative"
          >
            {/* Header */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="flex items-center gap-2 mb-6"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </motion.div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-pink-300 bg-clip-text text-transparent">
                You Found Me!
              </h2>
            </motion.div>

            {/* Joke Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl mb-4"
            >
              <p className="text-lg leading-relaxed text-gray-100">
                {currentJoke.content}
              </p>
            </motion.div>

            {/* Fun Fact */}
            <AnimatePresence>
              {showFunFact && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                    <p className="text-sm text-gray-300">
                      {funFacts[Math.floor(Math.random() * funFacts.length)]}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-center"
            >
              <p className="text-xs text-gray-500">
                🎭 Keep exploring! There might be more surprises...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!showJokeModal && (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
          <Sparkles className="w-12 h-12 text-gray-600 mb-4" />
          <p className="text-gray-500">The mystery is gone... for now!</p>
        </div>
      )}
    </div>
  )
}
