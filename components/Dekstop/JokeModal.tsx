"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { XIcon, SparklesIcon } from "lucide-react"

const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "Why did the AI break up with the internet? There was no connection! 💔",
  "I told my computer I needed a break... Now it won't stop sending me Kit-Kat ads! 🍫",
  "Why do Java developers wear glasses? Because they can't C#! 👓",
  "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?' 🍺",
  "There are only 10 types of people in the world: those who understand binary and those who don't! 🔢",
  "Why did the developer go broke? Because he used up all his cache! 💸",
  "I've got a really good UDP joke to tell you, but I don't know if you'll get it! 📡",
  "Why do programmers confuse Halloween with Christmas? Because OCT 31 = DEC 25! 🎃🎄",
  "A programmer's wife tells him: 'Go to the store and buy a loaf of bread. If they have eggs, buy a dozen.' He comes home with 12 loaves of bread. 🍞",
  "Why did the AI cross the road? To optimize the chicken's path-finding algorithm! 🐔",
  "I asked my AI assistant to tell me a joke... It said: 'I would, but I'm still training!' 🤖",
  "Why do frontend developers hate nature? Because it has too many bugs without a console! 🌿🐛",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡",
  "Why did the React component feel sad? Because it had too many dependencies! 😢",
]

const funFacts = [
  "Fun Fact: The first computer bug was an actual real bug - a moth! 🦋",
  "Fun Fact: The first programmer was a woman - Ada Lovelace! 👩‍💻",
  "Fun Fact: The first website is still online at info.cern.ch! 🌐",
  "Fun Fact: Programmers spend 90% of their time debugging and 10% creating bugs! 🐛",
  "Fun Fact: JavaScript was created in just 10 days! ⚡",
  "Fun Fact: The average project has 80% more code than needed! 📊",
  "Fun Fact: 'Lorem Ipsum' is from 45 BC! 📜",
]

interface JokeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function JokeModal({ isOpen, onClose }: JokeModalProps) {
  const [currentJoke, setCurrentJoke] = useState("")
  const [currentFact, setCurrentFact] = useState("")
  const [showFact, setShowFact] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)]
      const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)]
      setCurrentJoke(randomJoke)
      setCurrentFact(randomFact)
      setShowFact(false)

      // Show fact after 3 seconds
      const timer = setTimeout(() => setShowFact(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            className="relative max-w-2xl bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-purple-500/30"
            onClick={(e) => e.stopPropagation()}
            whileHover={{ scale: 1.02 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>

            {/* Sparkle icon */}
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="flex justify-center mb-6"
            >
              <SparklesIcon className="w-12 h-12 text-yellow-400" />
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              🎉 You found the Easter Egg!
            </h2>
            <p className="text-center text-purple-300 mb-6 text-sm">
              (You looked! Here's something to see...)
            </p>

            {/* Joke */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 rounded-xl p-6 mb-4"
            >
              <p className="text-white text-lg text-center leading-relaxed">
                {currentJoke}
              </p>
            </motion.div>

            {/* Fun Fact */}
            <AnimatePresence>
              {showFact && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-400/30"
                >
                  <p className="text-yellow-200 text-sm text-center">
                    {currentFact}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <p className="text-center text-purple-400 text-xs mt-6">
              Click anywhere to close • Click trash again for more jokes!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
