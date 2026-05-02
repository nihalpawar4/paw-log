"use client";

import React from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Smooth page transition wrapper.
 * Wraps entire page content with a fade + slide animation
 * that plays on mount for silky route transitions.
 */
export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
      transition={{
        duration: 0.45,
        ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
