'use client';

import React, { useState, useEffect } from 'react';
import { SiteSettings, ActivityLogItem } from '@portfolio/shared';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Download, Upload, Save, History } from 'lucide-react';

const DEFAULT_VISIBILITY = {
  hero: true,
  about: true,
  skills: true,
  projects: true,
  education: true,
  certifications: true,
  experience: true,
  contact: true,
};

type SectionKey = keyof typeof DEFAULT_VISIBILITY;
const SECTION_KEYS: SectionKey[] = [
  'hero',
  'about',
  'skills',
  'projects',
  'education',
  'certifications',
  'experience',
  'contact',
];

export function AdminSystemTab({
  settings,
  logs,
  onRefresh,
  notify,
}: {
  settings: SiteSettings | null;
  logs: ActivityLogItem[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, isErr?: boolean) => void;
}) {
  const { adminFetch } = useAdminAuth();
  const [siteTitle, setSiteTitle] = useState(
    settings?.siteTitle || 'Software Engineer Rana M Ali | Developer Portfolio'
  );
  const [metaDescription, setMetaDescription] = useState(
    settings?.metaDescription ||
      'Full-stack web and cross-platform Flutter software engineer portfolio built with Next.js, TypeScript, and Firebase.'
  );
  const [ogImageUrl, setOgImageUrl] = useState(settings?.ogImageUrl || '');
  const [keywordsInput, setKeywordsInput] = useState(
    (settings?.keywords || ['Software Engineer', 'Next.js', 'Flutter', 'TypeScript', 'Firebase']).join(', ')
  );
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(
    Boolean(settings?.maintenanceMode)
  );
  const [vis, setVis] = useState<Record<SectionKey, boolean>>({
    hero: Boolean(settings?.sectionVisibility?.hero ?? true),
    about: Boolean(settings?.sectionVisibility?.about ?? true),
    skills: Boolean(settings?.sectionVisibility?.skills ?? true),
    projects: Boolean(settings?.sectionVisibility?.projects ?? true),
    education: Boolean(settings?.sectionVisibility?.education ?? true),
    certifications: Boolean(settings?.sectionVisibility?.certifications ?? true),
    experience: Boolean(settings?.sectionVisibility?.experience ?? true),
    contact: Boolean(settings?.sectionVisibility?.contact ?? true),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.siteTitle) setSiteTitle(settings.siteTitle);
      if (settings.metaDescription) setMetaDescription(settings.metaDescription);
      setOgImageUrl(settings.ogImageUrl || '');
      if (settings.keywords?.length) {
        setKeywordsInput(settings.keywords.join(', '));
      }
      setMaintenanceMode(Boolean(settings.maintenanceMode));
      setVis({
        hero: Boolean(settings.sectionVisibility?.hero ?? true),
        about: Boolean(settings.sectionVisibility?.about ?? true),
        skills: Boolean(settings.sectionVisibility?.skills ?? true),
        projects: Boolean(settings.sectionVisibility?.projects ?? true),
        education: Boolean(settings.sectionVisibility?.education ?? true),
        certifications: Boolean(settings.sectionVisibility?.certifications ?? true),
        experience: Boolean(settings.sectionVisibility?.experience ?? true),
        contact: Boolean(settings.sectionVisibility?.contact ?? true),
      });
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const parsedKeywords = keywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 25);

      const strictPayload = {
        siteTitle: siteTitle.trim() || 'Software Engineer Rana M Ali | Developer Portfolio',
        metaDescription:
          metaDescription.trim().length >= 10
            ? metaDescription.trim()
            : 'Full-stack web and mobile software engineer portfolio platform.',
        ogImageUrl: ogImageUrl.trim(),
        keywords: parsedKeywords.length > 0 ? parsedKeywords : ['Software Engineer', 'Portfolio'],
        maintenanceMode: Boolean(maintenanceMode),
        sectionVisibility: {
          hero: Boolean(vis.hero),
          about: Boolean(vis.about),
          skills: Boolean(vis.skills),
          projects: Boolean(vis.projects),
          education: Boolean(vis.education),
          certifications: Boolean(vis.certifications),
          experience: Boolean(vis.experience),
          contact: Boolean(vis.contact),
        },
      };

      await adminFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(strictPayload),
      });
      notify('Site settings & visibility updated!');
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save settings', true);
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const data = await adminFetch('/admin/backup/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify('Full JSON backup downloaded!');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Export failed', true);
    }
  };

  const handleRestoreBackup = async (file: File) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        notify('Backup file exceeds 5MB security limit', true);
        return;
      }
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        notify('Invalid backup JSON structure', true);
        return;
      }
      await adminFetch('/admin/backup/restore', {
        method: 'POST',
        body: JSON.stringify(parsed),
      });
      notify('Database restored from backup snapshot!');
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Invalid backup JSON file', true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Visibility, SEO & Maintenance */}
      <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-bold text-white">Section Visibility, SEO &amp; Maintenance Mode</h2>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm text-amber-300">
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(e) => setMaintenanceMode(e.target.checked)}
          />
          Enable Public Maintenance Mode (Hides public portfolio with maintenance screen)
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECTION_KEYS.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm capitalize text-slate-200 hover:border-slate-700"
            >
              <input
                type="checkbox"
                checked={Boolean(vis[key])}
                onChange={(e) => setVis({ ...vis, [key]: e.target.checked })}
              />
              {key}
            </label>
          ))}
        </div>

        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">
              SEO Site Title
            </label>
            <input
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="Software Engineer Rana M Ali | Developer Portfolio"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">
              SEO Keywords (Comma-Separated)
            </label>
            <input
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="Software Engineer, Next.js, Flutter, TypeScript"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-400">
              SEO Meta Description
            </label>
            <input
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Portfolio description for search engines..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Visibility & SEO Settings'}
        </button>
      </div>

      {/* Backup & Restore */}
 
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-bold text-white">Full Portfolio JSON Backup &amp; Restore</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            <Download className="h-4 w-4" />
            Download Full JSON Backup
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            <Upload className="h-4 w-4" />
            Restore from JSON Snapshot
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleRestoreBackup(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Recent Admin Activity Logs</h2>
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-3.5 py-2 text-xs"
            >
              <div>
                <span className="mr-2 rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] text-indigo-300">
                  {log.action}
                </span>
                <span className="text-slate-200">{log.summary}</span>
              </div>
              <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}