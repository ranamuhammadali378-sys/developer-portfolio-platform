'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ProjectItem } from '@portfolio/shared';
import { Search, Star, ArrowUpRight, Github, ExternalLink, FolderGit2 } from 'lucide-react';

const CATEGORIES = ['All', 'Mobile', 'Web', 'Full-Stack', 'Backend', 'AI/ML', 'Hardware/IoT'];

export function ProjectsSection({ projects }: { projects: ProjectItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        selectedCategory === 'All' || project.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        project.title.toLowerCase().includes(q) ||
        project.summary.toLowerCase().includes(q) ||
        project.technologies.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  return (
    <section id="projects" className="border-b border-slate-200/70 py-20 dark:border-slate-800/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Featured &amp; Engineering Projects
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Filter by architecture domain or search by technology stack.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Flutter, Next.js, API..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-7 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
            <FolderGit2 className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              No projects match your current filter.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center">
                        <span className="text-lg font-bold tracking-tight text-indigo-300/90">
                          {project.title}
                        </span>
                      </div>
                    )}

                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="rounded-md bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 backdrop-blur">
                        {project.category}
                      </span>
                      {project.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-1 text-[11px] font-bold text-slate-950">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex items-start justify-between gap-2 text-lg font-bold text-slate-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400"
                    >
                      <span>{project.title}</span>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0" />
                    </Link>

                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {project.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Links */}
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Case Study &amp; Details →
                  </Link>

                  <div className="flex items-center gap-3">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub Repository"
                        className="text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Live Demo"
                        className="text-slate-500 transition hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}