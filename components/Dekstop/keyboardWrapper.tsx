"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Keyboard from "./keyboard";

interface KeyboardWrapperProps {
  initialX: number;
  initialY: number;
  desktopRef: React.RefObject<HTMLDivElement>;
}

export default function KeyboardWrapper({
  initialX,
  initialY,
  desktopRef,
}: KeyboardWrapperProps) {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [inactiveHidden, setInactiveHidden] = useState(false);
  const [coveredHidden, setCoveredHidden] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const resetTimerRef = useRef<() => void>(() => {});
  const hasInteractedRef = useRef(false);

  // ---------------- COVER CHECK (delayed start) ----------------
  const isCovered = useCallback(() => {
    if (!wrapperRef.current) return false;

    const rect = wrapperRef.current.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;

    const topEl = document.elementFromPoint(midX, midY);
    return topEl !== wrapperRef.current && !wrapperRef.current.contains(topEl);
  }, []);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        setCoveredHidden(isCovered());
      }, 700);

      return () => clearInterval(interval);
    }, 1000); // wait for layout

    return () => clearTimeout(startTimeout);
  }, [isCovered]);

  // ---------------- INACTIVITY TIMER ----------------
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      hasInteractedRef.current = true;
      setInactiveHidden(false);
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        if (hasInteractedRef.current) {
          setInactiveHidden(true);
        }
      }, 5000);
    };

    resetTimerRef.current = resetTimer;

    window.addEventListener("keydown", resetTimer);
    window.addEventListener("mousemove", resetTimer);

    return () => {
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("mousemove", resetTimer);
      clearTimeout(timeout);
    };
  }, []);

  // ---------------- VISIBILITY ----------------
  const visible = !(inactiveHidden || coveredHidden);

  // ---------------- DRAG ----------------
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isFullscreen || !wrapperRef.current) return;

      setIsDragging(true);

      dragOffset.current = {
        x: e.clientX - wrapperRef.current.getBoundingClientRect().left,
        y: e.clientY - wrapperRef.current.getBoundingClientRect().top,
      };

      resetTimerRef.current();
    },
    [isFullscreen]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !desktopRef.current || !wrapperRef.current) return;

      const desktopRect = desktopRef.current.getBoundingClientRect();

      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      newX = Math.max(
        0,
        Math.min(newX, desktopRect.width - wrapperRef.current.offsetWidth)
      );
      newY = Math.max(
        0,
        Math.min(newY, desktopRect.height - wrapperRef.current.offsetHeight)
      );

      setX(newX);
      setY(newY);
    },
    [isDragging, desktopRef]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ---------------- FULLSCREEN ----------------
  const toggleFullscreen = () => {
    resetTimerRef.current();
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      ref={wrapperRef}
      className={`keyboardWrapper ${isFullscreen ? "fullscreen" : ""}`}
      style={{
        position: "absolute",
        left: isFullscreen ? 0 : x,
        top: isFullscreen ? 0 : y,
        width: isFullscreen ? "fit-content" : 289,
        height: isFullscreen ? "fit-content" : 105,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.25s ease",
        zIndex: 9999,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={toggleFullscreen}
      onClick={() => resetTimerRef.current()}
    >
      <div
        className="keyboardContent"
        style={{ transform: `scale(${isFullscreen ? 1 : 0.33})` }}
      >
        <Keyboard
          isFullscreen={isFullscreen}
          onKeyPress={() => resetTimerRef.current()}
        />
      </div>
    </div>
  );
}
