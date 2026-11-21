'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

export interface FieldConfig {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}

interface AdminCrudTabProps {
  title: string;
  endpoint: string;
  items: Array<Record<string, unknown>>;
  fields: FieldConfig[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, isErr?: boolean) => void;
}

export function AdminCrudTab({
  title,
  endpoint,
  items,
  fields,
  onRefresh,
  notify,
}: AdminCrudTabProps) {
  const { adminFetch } = useAdminAuth();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...formData };
      if (endpoint === '/skills') {
        payload.proficiencyLevel = 'Proficient';
        payload.iconName = 'Code2';
      }
      if (endpoint === '/experience') {
        payload.employmentType = 'Internship';
        payload.location = 'Pakistan';
        payload.responsibilities = formData.description
          ? [formData.description]
          : ['Contributed to software engineering deliverables'];
      }
      if (endpoint === '/education') {
        payload.location = 'Pakistan';
      }

      await adminFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setFormData({});
      notify(`${title} added successfully!`);
      await onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to add ${title}`;
      notify(
        msg.includes('validation')
          ? `${msg}: Please enter a valid URL starting with https:// (e.g., https://linkedin.com/in/username)`
          : msg,
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminFetch(`${endpoint}/${id}`, { method: 'DELETE' });
      notify(`${title} permanently deleted!`);
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Delete failed', true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Form */}
      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
      >
        <h3 className="text-lg font-bold text-white">Add {title}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-semibold text-slate-400">
                {f.label}
              </label>
              <input
                type={f.type || (f.name.toLowerCase().includes('url') ? 'url' : 'text')}
                required={f.required}
                value={formData[f.name] || ''}
                onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {saving ? 'Adding...' : `Add ${title}`}
        </button>
      </form>

      {/* Existing Items List with Permanent Delete Button */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Saved {title}s ({items.length})
        </h3>

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 p-5 text-sm text-slate-500">
            No {title.toLowerCase()}s added yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const id = String(item.id || '');
              const primaryLabel = String(
                item.platform || item.name || item.title || item.degree || item.role || 'Item'
              );
              const secondaryLabel = String(
                item.url ||
                  item.credentialUrl ||
                  item.category ||
                  item.institution ||
                  item.organization ||
                  ''
              );
              const isLink = secondaryLabel.startsWith('http');

              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{primaryLabel}</p>
                    {secondaryLabel &&
                      (isLink ? (
                        <a
                          href={secondaryLabel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-indigo-400 hover:underline"
                        >
                          <span className="truncate">{secondaryLabel}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <p className="truncate text-xs text-slate-400">{secondaryLabel}</p>
                      ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(id)}
                    title={`Permanently delete ${primaryLabel}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}