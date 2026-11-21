import React from 'react';
import { SocialLinkItem } from '@portfolio/shared';

interface FooterProps {
  fullName?: string;
  socials?: SocialLinkItem[];
}

export function Footer({ socials = [] }: FooterProps) {
  return (
    <footer className="border-t border-slate-200/80 bg-white/50 py-10 dark:border-slate-800/80 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            © {new Date().getFullYear()}{' '}
            <span className="text-indigo-600 dark:text-indigo-400">
              Software Engineer Rana M Ali
            </span>
            . All rights reserved.
          </p>
          <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
            &ldquo;An investment in knowledge pays the best interest — and great software turns that knowledge into real-world impact.&rdquo;
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          {socials.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  {s.platform}
                </a>
              ))}
            </div>
          )}
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Engineered with Next.js, TypeScript &amp; Firebase
          </p>
        </div>
      </div>
    </footer>
  );
}