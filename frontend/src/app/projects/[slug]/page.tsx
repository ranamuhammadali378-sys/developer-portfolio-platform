import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ProjectItem } from '@portfolio/shared';
import { apiFetch } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { ArrowLeft, Github, ExternalLink, Calendar, Eye } from 'lucide-react';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let project: ProjectItem | null = null;
  try {
    project = await apiFetch<ProjectItem>(`/projects/${slug}`, {
      next: { revalidate: 60 },
    });
  } catch {
    notFound();
  }

  if (!project) notFound();

  return (
    <>
      <AnalyticsTracker
        eventType="project_view"
        path={`/projects/${project.slug}`}
        projectSlug={project.slug}
      />
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Projects
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-indigo-600/15 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {project.category}
          </span>
          {project.projectDate && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              {project.projectDate}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Eye className="h-3.5 w-3.5" />
            {project.viewCount || 0} views
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {project.title}
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          {project.summary}
        </p>

        {/* Action Links */}
        <div className="mt-6 flex flex-wrap gap-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
            >
              <Github className="h-4 w-4" />
              Source Code
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <ExternalLink className="h-4 w-4" />
              Live Deployment
            </a>
          )}
        </div>

        {/* Cover Image */}
        {project.thumbnailUrl && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Tech Stack */}
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Technologies &amp; Architecture
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Markdown Description */}
        <div className="prose prose-slate mt-10 max-w-none dark:prose-invert">
          <ReactMarkdown>{project.description}</ReactMarkdown>
        </div>

        {/* Screenshots Gallery */}
        {project.screenshots?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Application Screenshots
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {project.screenshots.map((shot, idx) => (
                <figure
                  key={idx}
                  className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <img src={shot.url} alt={shot.caption || project.title} className="w-full" />
                  {shot.caption && (
                    <figcaption className="p-2.5 text-xs text-slate-500">
                      {shot.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}