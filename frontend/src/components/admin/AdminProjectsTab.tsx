'use client';

import React, { useState } from 'react';
import { ProjectItem } from '@portfolio/shared';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Plus, Trash2, RotateCcw, Upload, Eye, EyeOff, Star, Edit3 } from 'lucide-react';

const CATEGORIES = ['Mobile', 'Web', 'Full-Stack', 'Backend', 'AI/ML', 'Hardware/IoT'];

export function AdminProjectsTab({
  projects,
  onRefresh,
  notify,
}: {
  projects: ProjectItem[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, isErr?: boolean) => void;
}) {
  const { adminFetch } = useAdminAuth();
  const [showTrash, setShowTrash] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Full-Stack');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Full-Stack');
    setSummary('');
    setDescription('');
    setTechnologies('');
    setGithubUrl('');
    setLiveUrl('');
    setIsFeatured(false);
    setStatus('published');
  };

  const startEdit = (p: ProjectItem) => {
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setSummary(p.summary);
    setDescription(p.description);
    setTechnologies(p.technologies.join(', '));
    setGithubUrl(p.githubUrl || '');
    setLiveUrl(p.liveUrl || '');
    setIsFeatured(p.isFeatured);
    setStatus(p.status);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        category,
        summary,
        description,
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
        githubUrl: githubUrl || null,
        liveUrl: liveUrl || null,
        isFeatured,
        status,
      };

      if (editingId) {
        await adminFetch(`/projects/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        notify('Project updated!');
      } else {
        await adminFetch('/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        notify('New project created!');
      }
      resetForm();
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save project', true);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadThumbnail = async (id: string, file: File) => {
    try {
      const fd = new FormData();
      fd.append('image', file);
      await adminFetch(`/projects/${id}/media?type=thumbnail`, {
        method: 'POST',
        body: fd,
      });
      notify('Cover image uploaded!');
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Image upload failed', true);
    }
  };

  const togglePublish = async (p: ProjectItem) => {
    try {
      await adminFetch(`/projects/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: p.status === 'published' ? 'draft' : 'published' }),
      });
      notify(`Project ${p.status === 'published' ? 'moved to Draft' : 'Published'}!`);
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Status update failed', true);
    }
  };

  const handleDelete = async (id: string, permanent = false) => {
    try {
      await adminFetch(`/projects/${id}${permanent ? '?permanent=true' : ''}`, {
        method: 'DELETE',
      });
      notify(permanent ? 'Permanently deleted!' : 'Moved to Trash');
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Delete failed', true);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await adminFetch(`/projects/${id}/restore`, { method: 'POST' });
      notify('Project restored!');
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Restore failed', true);
    }
  };

  const visibleProjects = projects.filter((p) => (showTrash ? Boolean(p.deletedAt) : !p.deletedAt));

  return (
    <div className="space-y-8">
      {/* Add / Edit Form */}
      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {editingId ? 'Edit Project' : 'Add New Project'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project Title (e.g., Driver Fatigue Warning System)"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <input
          required
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Short 1-2 line summary for project card..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />

        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed case study & architecture description (Markdown supported)..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <input
            required
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
            placeholder="Tech stack (comma separated: Flutter, Python, ESP32)"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
          />
          <input
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="GitHub Repo URL (optional)"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
          />
          <input
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            placeholder="Live Demo URL (optional)"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-5 text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              Featured Project
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
            >
              <option value="published">Published (Live)</option>
              <option value="draft">Draft (Hidden)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>

      {/* Active vs Trash Switcher */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">
          {showTrash ? 'Deleted Projects (Trash)' : `Active Projects (${visibleProjects.length})`}
        </h3>
        <button
          onClick={() => setShowTrash(!showTrash)}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
        >
          {showTrash ? '← Back to Active Projects' : 'View Trash / Recovery'}
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {visibleProjects.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white">{p.title}</span>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[11px] text-indigo-300">
                  {p.category}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                    p.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {p.status}
                </span>
                {p.isFeatured && <Star className="h-3.5 w-3.5 text-amber-400" />}
              </div>
              <p className="mt-1 text-xs text-slate-400">{p.summary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!showTrash ? (
                <>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                    <Upload className="h-3.5 w-3.5" />
                    Cover
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] && handleUploadThumbnail(p.id, e.target.files[0])
                      }
                    />
                  </label>
                  <button
                    onClick={() => togglePublish(p)}
                    title="Toggle Publish/Draft"
                    className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
                  >
                    {p.status === 'published' ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded-lg border border-slate-700 p-2 text-indigo-400 hover:bg-slate-800"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, false)}
                    className="rounded-lg border border-slate-700 p-2 text-rose-400 hover:bg-slate-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleRestore(p.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, true)}
                    className="rounded-lg bg-rose-600/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-600/30"
                  >
                    Delete Forever
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}