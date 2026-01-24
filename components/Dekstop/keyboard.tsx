"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import styles from "./keyboard.module.css"

interface KeyConfig {
  label: string
  width: number
}

const KEYBOARD_LAYOUT: KeyConfig[][] = [
  // Function row
  [
    { label: "esc", width: 50 },
    { label: "F1", width: 50 },
    { label: "F2", width: 50 },
    { label: "F3", width: 50 },
    { label: "F4", width: 50 },
    { label: "F5", width: 50 },
    { label: "F6", width: 50 },
    { label: "F7", width: 50 },
    { label: "F8", width: 50 },
    { label: "F9", width: 50 },
    { label: "F10", width: 50 },
    { label: "F11", width: 50 },
    { label: "F12", width: 50 },
    { label: "⏏", width: 50 },
  ],
  // Number row
  [
    { label: "§", width: 50 },
    { label: "1", width: 50 },
    { label: "2", width: 50 },
    { label: "3", width: 50 },
    { label: "4", width: 50 },
    { label: "5", width: 50 },
    { label: "6", width: 50 },
    { label: "7", width: 50 },
    { label: "8", width: 50 },
    { label: "9", width: 50 },
    { label: "0", width: 50 },
    { label: "+", width: 50 },
    { label: "´", width: 50 },
    { label: "delete", width: 100 },
  ],
  // Tab row
  [
    { label: "tab", width: 80 },
    { label: "Q", width: 50 },
    { label: "W", width: 50 },
    { label: "E", width: 50 },
    { label: "R", width: 50 },
    { label: "T", width: 50 },
    { label: "Y", width: 50 },
    { label: "U", width: 50 },
    { label: "I", width: 50 },
    { label: "O", width: 50 },
    { label: "P", width: 50 },
    { label: "[", width: 50 },
    { label: "]", width: 50 },
    { label: "\\", width: 80 },
  ],
  // Caps row
  [
    { label: "caps lock", width: 100 },
    { label: "A", width: 50 },
    { label: "S", width: 50 },
    { label: "D", width: 50 },
    { label: "F", width: 50 },
    { label: "G", width: 50 },
    { label: "H", width: 50 },
    { label: "J", width: 50 },
    { label: "K", width: 50 },
    { label: "L", width: 50 },
    { label: ";", width: 50 },
    { label: "'", width: 50 },
    { label: "return", width: 110 },
  ],
  // Shift row
  [
    { label: "shift", width: 130 },
    { label: "Z", width: 50 },
    { label: "X", width: 50 },
    { label: "C", width: 50 },
    { label: "V", width: 50 },
    { label: "B", width: 50 },
    { label: "N", width: 50 },
    { label: "M", width: 50 },
    { label: ",", width: 50 },
    { label: ".", width: 50 },
    { label: "/", width: 50 },
    { label: "shift", width: 130 },
  ],
  // Control row
  [
    { label: "ctrl", width: 70 },
    { label: "option", width: 70 },
    { label: "cmd", width: 80 },
    { label: " ", width: 380 },
    { label: "cmd", width: 80 },
    { label: "option", width: 70 },
    { label: "ctrl", width: 70 },
  ],
]

interface GlowEffect {
  id: string
  x: number
  y: number
  timestamp: number
}

const KEY_MAP: Record<string, string> = {
  // Number row
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "0": "0",
  "-": "+",
  "=": "´",
  Backspace: "delete",

  // QWERTY row
  q: "Q",
  w: "W",
  e: "E",
  r: "R",
  t: "T",
  y: "Y",
  u: "U",
  i: "I",
  o: "O",
  p: "P",
  "[": "[",
  "]": "]",
  "\\": "\\",

  // ASDF row
  a: "A",
  s: "S",
  d: "D",
  f: "F",
  g: "G",
  h: "H",
  j: "J",
  k: "K",
  l: "L",
  ";": ";",
  "'": "'",
  Enter: "return",

  // ZXCV row
  z: "Z",
  x: "X",
  c: "C",
  v: "V",
  b: "B",
  n: "N",
  m: "M",
  ",": ",",
  ".": ".",
  "/": "/",

  // Modifiers
  Tab: "tab",
  CapsLock: "caps lock",
  Shift: "shift",
  Control: "ctrl",
  Alt: "option",
  Meta: "cmd",
  " ": " ",
  Escape: "esc",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
}

export default function Keyboard() {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [glowEffects, setGlowEffects] = useState<GlowEffect[]>([])
  const glowIdRef = useRef(0)
  const keyRefsMap = useRef<Record<string, HTMLButtonElement>>({})
  const keyboardRef = useRef<HTMLDivElement>(null)

  const keyPositionMap = useRef<Record<string, { row: number; col: number }>>({})

  useEffect(() => {
    // Build position map on mount
    KEYBOARD_LAYOUT.forEach((row, rowIdx) => {
      row.forEach((key, colIdx) => {
        keyPositionMap.current[key.label] = { row: rowIdx, col: colIdx }
      })
    })
  }, [])

  const triggerGlow = (label: string) => {
    const keyElement = keyRefsMap.current[label]
    if (keyElement && keyboardRef.current) {
      const keyRect = keyElement.getBoundingClientRect()
      const keyboardRect = keyboardRef.current.getBoundingClientRect()

      const x = keyRect.left - keyboardRect.left + keyRect.width / 2
      const y = keyRect.top - keyboardRect.top + keyRect.height / 2

      const glowId = `glow-${glowIdRef.current++}`
      setGlowEffects((prev) => [...prev, { id: glowId, x, y, timestamp: Date.now() }])

      // Remove glow after animation completes
      setTimeout(() => {
        setGlowEffects((prev) => prev.filter((g) => g.id !== glowId))
      }, 800)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mappedKey = KEY_MAP[event.key]
      if (mappedKey) {
        setActiveKey(mappedKey)
        triggerGlow(mappedKey)
        // event.preventDefault()
      }
    }

    const handleKeyUp = () => {
      setActiveKey(null)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const handleKeyClick = (label: string) => {
    setActiveKey(label)
    triggerGlow(label)
    setTimeout(() => setActiveKey(null), 200)
  }

  return (
    <div className={styles.container}>
      <figure className={styles.keyboard} ref={keyboardRef}>
        <div className={styles.glowLayer}>
          {glowEffects.map((glow) => (
            <div
              key={glow.id}
              className={styles.glowWave}
              style={
                {
                  left: `${glow.x}px`,
                  top: `${glow.y}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {KEYBOARD_LAYOUT.map((row, rowIdx) => (
          <div key={rowIdx} className={styles.row}>
            {row.map((key, keyIdx) => (
              <button
                ref={(el) => {
                  if (el) keyRefsMap.current[key.label] = el
                }}
                key={`${rowIdx}-${keyIdx}`}
                onClick={() => handleKeyClick(key.label)}
                className={`${styles.key} ${activeKey === key.label ? styles.active : ""}`}
                style={{ width: `${key.width}px` }}
                title={key.label}
              >
                {key.label}
              </button>
            ))}
          </div>
        ))}
      </figure>
    </div>
  )
}
