'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  ArrowDownRight,
  Sparkles,
  MapPin,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { ProfileData, ResumeData, SocialLinkItem } from '@portfolio/shared';

interface HeroProps {
  profile: ProfileData | null;
  resume: ResumeData | null;
  socials: SocialLinkItem[];
}

export function HeroSection({ profile, resume, socials }: HeroProps) {
  const rawRoles = profile?.animatedRoles?.length
    ? profile.animatedRoles
    : ['Software Engineer', 'Full-Stack Web Engineer', 'Flutter Mobile Engineer'];

  const roles = rawRoles.map((r) =>
    r.replace(/Software\s+Engineer(?:ing)?\s+Student/i, 'Software Engineer')
  );

  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roles.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [roles.length]);

  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 py-20 dark:border-slate-800/70 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-8"
        >
          {profile?.availabilityStatus && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              {profile.availabilityStatus}
            </div>
          )}

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Hi, I&apos;m{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              {profile?.fullName || 'Rana Muhammad Ali'}
            </span>
          </h1>

          <div className="mt-4 h-9 text-xl font-semibold text-indigo-600 dark:text-indigo-400 sm:text-2xl">
            {roles[roleIndex]}
          </div>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            {profile?.shortBio ||
              'Building reliable cross-platform mobile apps and scalable full-stack web platforms.'}
          </p>

          {/* Location, Email & Dynamic Social Links (Managed from Admin CMS) */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            {profile?.location && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-1.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900/70">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                {profile.location}
              </span>
            )}

            {profile?.email && (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-1.5 text-xs font-medium transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:text-indigo-400"
              >
                <Mail className="h-3.5 w-3.5 text-indigo-500" />
                {profile.email}
              </a>
            )}

            {socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-300"
              >
                {s.platform}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#projects"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
            >
              Explore Projects
              <ArrowDownRight className="h-4 w-4" />
            </a>

            {resume?.fileUrl && (
              <a
                href={resume.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Download CV
              </a>
            )}
          </div>
        </motion.div>

        {/* Avatar Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center lg:col-span-4"
        >
          <div className="relative h-64 w-64 overflow-hidden rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-cyan-500/20 p-2 shadow-2xl sm:h-72 sm:w-72">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-slate-900 text-center">
                <span className="text-5xl font-extrabold text-indigo-400">
                  {(profile?.fullName || 'RA')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <span className="mt-2 text-xs font-medium text-slate-400">
                  Software Engineer
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}