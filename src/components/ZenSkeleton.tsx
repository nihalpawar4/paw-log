"use client";

import React from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function ZenSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-5 sm:p-10 pt-24"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 bg-secondary rounded-xl" />
          <Skeleton className="h-5 w-72 bg-card rounded-lg" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-32 bg-card rounded-2xl border border-border"
            />
          ))}
        </div>

        {/* Chart skeleton */}
        <Skeleton className="h-52 bg-card rounded-2xl border border-border" />

        {/* Card skeletons */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-28 bg-card rounded-2xl border border-border"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
