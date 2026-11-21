'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ProfileData,
  ProjectItem,
  ResumeData,
  SiteSettings,
  ActivityLogItem,
} from '@portfolio/shared';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import { AdminProjectsTab } from '@/components/admin/AdminProjectsTab';
import { AdminCrudTab } from '@/components/admin/AdminCrudTab';
import { AdminSystemTab } from '@/components/admin/AdminSystemTab';
import {
  LogOut,
  ExternalLink,
  Upload,
  Save,
  BarChart3,
  Mail,
  Trash2,
  CheckCircle,
} from 'lucide-react';

type TabKey =
  | 'overview'
  | 'profile'
  | 'projects'
  | 'skills'
  | 'education'
  | 'experience'
  | 'certifications'
  | 'socials'
  | 'inbox'
  | 'system';

function DashboardContent() {
  const router = useRouter();
  const { user, loading, logout, adminFetch } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [toast, setToast] = useState<{ text: string; isErr?: boolean } | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rolesInput, setRolesInput] = useState<string>('');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [skills, setSkills] = useState<Array<Record<string, unknown>>>([]);
  const [education, setEducation] = useState<Array<Record<string, unknown>>>([]);
  const [experience, setExperience] = useState<Array<Record<string, unknown>>>([]);
  const [certifications, setCertifications] = useState<Array<Record<string, unknown>>>([]);
  const [socials, setSocials] = useState<Array<Record<string, unknown>>>([]);
  const [messages, setMessages] = useState<Array<Record<string, unknown>>>([]);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalSiteVisits: number;
    visitsLast7Days: number;
    topProjects: Array<{ id: string; title: string; viewCount: number }>;
  } | null>(null);

  const notify = (text: string, isErr = false) => {
    setToast({ text, isErr });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAll = useCallback(async () => {
    try {
      const [
        profRes,
        projRes,
        skillRes,
        eduRes,
        expRes,
        certRes,
        socRes,
        msgRes,
        resData,
        setData,
        logData,
        anaData,
      ] = await Promise.all([
        adminFetch<ProfileData>('/profile').catch(() => null),
        adminFetch<ProjectItem[]>('/projects?includeDeleted=true').catch(() => []),
        adminFetch<Array<Record<string, unknown>>>('/skills').catch(() => []),
        adminFetch<Array<Record<string, unknown>>>('/education').catch(() => []),
        adminFetch<Array<Record<string, unknown>>>('/experience').catch(() => []),
        adminFetch<Array<Record<string, unknown>>>('/certifications').catch(() => []),
        adminFetch<Array<Record<string, unknown>>>('/socials').catch(() => []),
        adminFetch<Array<Record<string, unknown>>>('/contact/admin/messages').catch(() => []),
        adminFetch<ResumeData | null>('/resume').catch(() => null),
        adminFetch<SiteSettings>('/settings').catch(() => null),
        adminFetch<ActivityLogItem[]>('/admin/activity-logs').catch(() => []),
        adminFetch<{
          totalSiteVisits: number;
          visitsLast7Days: number;
          topProjects: Array<{ id: string; title: string; viewCount: number }>;
        }>('/analytics/overview').catch(() => null),
      ]);

      setProfile(profRes);
      if (profRes?.animatedRoles) {
        setRolesInput(profRes.animatedRoles.join(', '));
      }
      setProjects(projRes);
      setSkills(skillRes);
      setEducation(eduRes);
      setExperience(expRes);
      setCertifications(certRes);
      setSocials(socRes);
      setMessages(msgRes);
      setResume(resData);
      setSettings(setData);
      setLogs(logData);
      setAnalytics(anaData);
    } catch {
      notify('Error loading dashboard data', true);
    }
  }, [adminFetch]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin/login');
    } else if (user) {
      loadAll();
    }
  }, [user, loading, router, loadAll]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Verifying Admin Session...
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const parsedRoles = rolesInput
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length >= 2);

    if (parsedRoles.length === 0) {
      notify('Please enter at least one animated role (e.g., Software Engineer)', true);
      return;
    }

    try {
      await adminFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...profile,
          animatedRoles: parsedRoles,
        }),
      });
      notify('Profile & animated roles updated on live site!');
      await loadAll();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Profile update failed', true);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await adminFetch('/profile/avatar', { method: 'POST', body: fd });
      notify('Profile picture uploaded!');
      await loadAll();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Avatar upload failed', true);
    }
  };

  const handleUploadResume = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append('resume', file);
      await adminFetch('/resume', { method: 'POST', body: fd });
      notify('New PDF Resume uploaded & live!');
      await loadAll();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Resume upload failed', true);
    }
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Overview & Analytics' },
    { key: 'profile', label: 'Profile & Resume' },
    { key: 'projects', label: 'Projects' },
    { key: 'skills', label: 'Skills' },
    { key: 'education', label: 'Education' },
    { key: 'experience', label: 'Experience' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'socials', label: 'Social Links' },
    { key: 'inbox', label: `Inbox (${messages.filter((m) => !m.isRead).length})` },
    { key: 'system', label: 'Settings & Backup' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/70 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Developer Portfolio CMS</h1>
            <p className="text-xs text-slate-400">Logged in as {user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              View Live Site
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={async () => {
                await logout();
                router.push('/admin/login');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-600/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${
            toast.isErr ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* Navigation Tabs */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === t.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs text-slate-400">30-Day Site Visits</p>
                <p className="mt-2 text-3xl font-extrabold text-white">
                  {analytics?.totalSiteVisits || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs text-slate-400">Active Projects</p>
                <p className="mt-2 text-3xl font-extrabold text-indigo-400">
                  {projects.filter((p) => !p.deletedAt).length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs text-slate-400">Total Skills</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-400">{skills.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs text-slate-400">Unread Inquiries</p>
                <p className="mt-2 text-3xl font-extrabold text-amber-400">
                  {messages.filter((m) => !m.isRead).length}
                </p>
              </div>
            </div>

            {analytics?.topProjects && analytics.topProjects.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">Most Viewed Projects</h2>
                </div>
                <div className="mt-4 space-y-2">
                  {analytics.topProjects.map((tp) => (
                    <div
                      key={tp.id}
                      className="flex items-center justify-between rounded-lg bg-slate-950 px-4 py-2.5 text-sm"
                    >
                      <span>{tp.title}</span>
                      <span className="font-bold text-indigo-400">{tp.viewCount} views</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE & RESUME */}
        {activeTab === 'profile' && profile && (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h3 className="font-bold text-white">Profile Picture</h3>
                <div className="mt-4 flex items-center gap-4">
                  {profile.avatarUrl && (
                    <img
                      src={profile.avatarUrl}
                      alt="Avatar"
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                    <Upload className="h-4 w-4" />
                    Upload New Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUploadAvatar(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h3 className="font-bold text-white">Resume / CV (PDF)</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Current: {resume?.fileName || 'No CV uploaded yet'}
                </p>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">
                  <Upload className="h-4 w-4" />
                  Upload PDF Resume
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUploadResume(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h2 className="text-lg font-bold text-white">Edit Profile &amp; Bio</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Full Name
                  </label>
                  <input
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Primary Headline
                  </label>
                  <input
                    value={profile.headline}
                    onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                    placeholder="Headline"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Availability Status
                  </label>
                  <input
                    value={profile.availabilityStatus}
                    onChange={(e) => setProfile({ ...profile, availabilityStatus: e.target.value })}
                    placeholder="Availability Badge"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Location
                  </label>
                  <input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="Location"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Animated Hero Roles (Comma-Separated)
                  </label>
                  <input
                    value={rolesInput}
                    onChange={(e) => setRolesInput(e.target.value)}
                    placeholder="Software Engineer, Full-Stack Web Engineer, Flutter Mobile Engineer"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">
                  Short Hero Bio
                </label>
                <textarea
                  rows={2}
                  value={profile.shortBio}
                  onChange={(e) => setProfile({ ...profile, shortBio: e.target.value })}
                  placeholder="Short Hero Bio"
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">
                  Detailed About Bio
                </label>
                <textarea
                  rows={4}
                  value={profile.detailedBio}
                  onChange={(e) => setProfile({ ...profile, detailedBio: e.target.value })}
                  placeholder="Detailed About Bio"
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">
                  Career Objective
                </label>
                <textarea
                  rows={2}
                  value={profile.careerObjective}
                  onChange={(e) => setProfile({ ...profile, careerObjective: e.target.value })}
                  placeholder="Career Objective"
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                <Save className="h-4 w-4" />
                Save Profile Changes
              </button>
            </form>
          </div>
        )}

        {/* PROJECTS */}
        {activeTab === 'projects' && (
          <AdminProjectsTab projects={projects} onRefresh={loadAll} notify={notify} />
        )}

        {/* SKILLS */}
        {activeTab === 'skills' && (
          <AdminCrudTab
            title="Skill"
            endpoint="/skills"
            items={skills}
            onRefresh={loadAll}
            notify={notify}
            fields={[
              { name: 'name', label: 'Skill Name', placeholder: 'e.g., Docker', required: true },
              {
                name: 'category',
                label: 'Category',
                placeholder: 'e.g., Development Tools',
                required: true,
              },
            ]}
          />
        )}

        {/* EDUCATION */}
        {activeTab === 'education' && (
          <AdminCrudTab
            title="Education"
            endpoint="/education"
            items={education}
            onRefresh={loadAll}
            notify={notify}
            fields={[
              { name: 'degree', label: 'Degree', placeholder: 'Bachelor of Science (BS)', required: true },
              { name: 'fieldOfStudy', label: 'Field', placeholder: 'Software Engineering', required: true },
              { name: 'institution', label: 'Institution', placeholder: 'COMSATS University', required: true },
              { name: 'startDate', label: 'Start Year', placeholder: '2024', required: true },
              { name: 'endDate', label: 'End Year', placeholder: 'Present', required: true },
              { name: 'description', label: 'Notes', placeholder: 'Relevant coursework...' },
            ]}
          />
        )}

        {/* EXPERIENCE */}
        {activeTab === 'experience' && (
          <AdminCrudTab
            title="Experience"
            endpoint="/experience"
            items={experience}
            onRefresh={loadAll}
            notify={notify}
            fields={[
              { name: 'role', label: 'Role / Title', placeholder: 'Flutter Developer Intern', required: true },
              { name: 'organization', label: 'Organization', placeholder: 'Tech Lab', required: true },
              { name: 'startDate', label: 'Start Date', placeholder: 'Jan 2026', required: true },
              { name: 'endDate', label: 'End Date', placeholder: 'Present' },
              { name: 'description', label: 'Responsibilities', placeholder: 'Built REST APIs...' },
            ]}
          />
        )}

        {/* CERTIFICATIONS */}
        {activeTab === 'certifications' && (
          <AdminCrudTab
            title="Certification"
            endpoint="/certifications"
            items={certifications}
            onRefresh={loadAll}
            notify={notify}
            fields={[
              { name: 'title', label: 'Certificate Title', placeholder: 'AWS Cloud Practitioner', required: true },
              { name: 'issuingOrganization', label: 'Issuer', placeholder: 'Amazon Web Services', required: true },
              { name: 'issueDate', label: 'Issue Date', placeholder: 'Nov 2026', required: true },
              { name: 'credentialUrl', label: 'Verification URL', placeholder: 'https://...' },
            ]}
          />
        )}

        {/* SOCIAL LINKS */}
        {activeTab === 'socials' && (
          <AdminCrudTab
            title="Social Link"
            endpoint="/socials"
            items={socials}
            onRefresh={loadAll}
            notify={notify}
            fields={[
              {
                name: 'platform',
                label: 'Platform',
                placeholder: 'LinkedIn / GitHub / Facebook',
                required: true,
              },
              {
                name: 'url',
                label: 'Profile URL',
                placeholder: 'https://linkedin.com/in/...',
                required: true,
              },
            ]}
          />
        )}

        {/* INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Contact Form Inquiries ({messages.length})</h2>
            {messages.length === 0 ? (
              <p className="text-sm text-slate-400">No messages received yet.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={String(m.id)}
                  className={`rounded-2xl border p-5 ${
                    m.isRead
                      ? 'border-slate-800 bg-slate-900/40'
                      : 'border-indigo-500/40 bg-indigo-950/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Mail className="h-4 w-4 text-indigo-400" />
                      <span className="font-bold text-white">{String(m.senderName)}</span>
                      <span className="text-xs text-slate-400">({String(m.senderEmail)})</span>
                      {Boolean(m.senderPhone) && (
                        <a
                          href={`https://wa.me/${String(m.senderPhone).replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
                        >
                          📞 {String(m.senderPhone)}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!m.isRead && (
                        <button
                          onClick={async () => {
                            try {
                              setMessages((prev) =>
                                prev.map((item) =>
                                  item.id === m.id ? { ...item, isRead: true } : item
                                )
                              );
                              await adminFetch(`/contact/admin/messages/${m.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ isRead: true }),
                              });
                              notify('Marked as read');
                            } catch (err) {
                              notify(err instanceof Error ? err.message : 'Failed to update', true);
                              await loadAll();
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-600/30"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            setMessages((prev) => prev.filter((item) => item.id !== m.id));
                            await adminFetch(`/contact/admin/messages/${m.id}`, {
                              method: 'DELETE',
                            });
                            notify('Message deleted permanently');
                          } catch (err) {
                            notify(err instanceof Error ? err.message : 'Delete failed', true);
                            await loadAll();
                          }
                        }}
                        className="rounded-lg border border-slate-700 p-1.5 text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-indigo-300">{String(m.subject)}</p>
                  <p className="mt-1 text-sm text-slate-300">{String(m.message)}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* SYSTEM & BACKUP */}
        {activeTab === 'system' && (
          <AdminSystemTab
            settings={settings}
            logs={logs}
            onRefresh={loadAll}
            notify={notify}
          />
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminAuthProvider>
      <DashboardContent />
    </AdminAuthProvider>
  );
}