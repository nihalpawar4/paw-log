"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  PawPrint,
  BarChart3,
  Clock,
  Flame,
  Download,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Track Every Edit",
    desc: "Log video duration, topic, and creative notes for each session.",
  },
  {
    icon: Flame,
    title: "Build Streaks",
    desc: "Stay consistent with daily streak tracking and motivational quotes.",
  },
  {
    icon: BarChart3,
    title: "Visual Insights",
    desc: "Charts, analytics, and weekly progress to see your growth over time.",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    desc: "Download your logs as CSV, PDF, or Excel — own your data.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Google sign-in with Firestore — your data stays yours, always.",
  },
  {
    icon: Zap,
    title: "Instant PWA",
    desc: "Install on your phone for a native app feel — works offline too.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <PawPrint className="h-8 w-8 text-foreground" />
        </motion.div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* ─── Background ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-foreground/[0.03] via-transparent to-transparent" />
      </div>

      {/* ─── Hero Section ─── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 sm:pt-28 sm:pb-20 min-h-[70vh]">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[32px] bg-gradient-to-b from-foreground/15 to-foreground/5 border border-foreground/10 shadow-[0_12px_40px_var(--foreground,white)/0.08] flex items-center justify-center">
            <PawPrint className="h-11 w-11 sm:h-13 sm:w-13 text-foreground drop-shadow-[0_2px_10px_var(--foreground,white)/0.3]" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-6xl sm:text-7xl md:text-8xl font-extralight tracking-[-0.04em] text-foreground mb-4"
        >
          Paw
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-base sm:text-lg md:text-xl text-muted-foreground italic font-light mb-4 leading-relaxed max-w-md"
        >
          Your calm video editing journal
        </motion.p>

        {/* Sub-tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-xs sm:text-sm text-muted-foreground/60 font-light mb-12 max-w-sm leading-relaxed"
        >
          Track your daily editing sessions, build creative streaks, and grow with beautiful insights — all in one minimal app.
        </motion.p>

        {/* Google Sign-In Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={signInWithGoogle}
          id="google-signin-btn"
          className="flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-2xl font-medium text-base tracking-wide transition-all duration-300 shadow-[0_0_40px_var(--foreground,white)/0.06] hover:shadow-[0_0_60px_var(--foreground,white)/0.12]"
        >
          {/* Google Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </motion.button>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-6 text-[11px] text-muted-foreground/40 font-light tracking-[0.15em] uppercase"
        >
          Track · Reflect · Grow
        </motion.p>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="relative z-10 px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="text-center text-xl sm:text-2xl font-extralight tracking-tight text-foreground mb-3"
          >
            Everything you need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center text-sm text-muted-foreground/60 font-light mb-12"
          >
            Built for video editors who care about consistency
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={fadeUp}
                className="group bg-card border border-border rounded-2xl p-5 sm:p-6 hover:border-foreground/15 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors duration-300">
                  <f.icon className="h-5 w-5 text-foreground/60 group-hover:text-foreground/80 transition-colors duration-300" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1.5 tracking-wide">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative z-10 px-6 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="text-center text-xl sm:text-2xl font-extralight tracking-tight text-foreground mb-12"
          >
            How it works
          </motion.h2>

          <div className="space-y-8">
            {[
              { step: "01", title: "Sign in with Google", desc: "One tap — no passwords, no forms. Your data syncs across devices instantly." },
              { step: "02", title: "Log your editing sessions", desc: "Record duration, topic, description, and notes for each video you edit." },
              { step: "03", title: "Watch yourself grow", desc: "Track streaks, hit daily goals, and see your progress through beautiful charts." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className="flex gap-5 items-start"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center">
                  <span className="text-xs font-medium text-foreground/50 tracking-wider">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="relative z-10 px-6 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-muted-foreground/50 text-xs font-light italic mb-6">
            &ldquo;Every masterpiece begins with a single frame.&rdquo;
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-3 bg-foreground text-background px-7 py-3.5 rounded-2xl font-medium text-sm tracking-wide transition-all duration-300 shadow-[0_0_30px_var(--foreground,white)/0.05]"
          >
            <PawPrint className="h-4 w-4" />
            Start Your Journal
          </motion.button>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 px-6 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/50 font-light tracking-wider">
              Paw
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/30 font-light">
            Built with ♡ for video editors
          </p>
        </div>
      </footer>
    </div>
  );
}
