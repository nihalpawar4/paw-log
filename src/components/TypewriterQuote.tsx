"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TypewriterQuoteProps {
  text: string;
  /** Delay in ms before starting the animation */
  startDelay?: number;
  /** Speed in ms per character */
  speed?: number;
  className?: string;
}

/**
 * Typewriter animation for quotes.
 * Types out the text character by character with a blinking cursor.
 */
export default function TypewriterQuote({
  text,
  startDelay = 800,
  speed = 35,
  className = "",
}: TypewriterQuoteProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);
  const prevTextRef = useRef(text);

  useEffect(() => {
    // Reset if text changes
    if (prevTextRef.current !== text) {
      setDisplayedText("");
      setIsTyping(false);
      setIsDone(false);
      indexRef.current = 0;
      prevTextRef.current = text;
    }

    const startTimeout = setTimeout(() => {
      setIsTyping(true);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, startDelay]);

  useEffect(() => {
    if (!isTyping || isDone) return;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current++;
        setDisplayedText(text.slice(0, indexRef.current));
      } else {
        setIsDone(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [isTyping, isDone, text, speed]);

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: startDelay / 1000 - 0.2, duration: 0.3 }}
      className={className}
    >
      <span className="text-muted-foreground/30">&ldquo;</span>
      {displayedText}
      {/* Blinking cursor */}
      {!isDone && (
        <motion.span
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
          className="inline-block w-[2px] h-[1em] bg-foreground/40 ml-0.5 align-text-bottom"
        />
      )}
      <span className="text-muted-foreground/30">&rdquo;</span>
    </motion.p>
  );
}
