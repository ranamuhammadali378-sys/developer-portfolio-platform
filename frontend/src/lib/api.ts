import {
  ProfileData,
  ProjectItem,
  SkillItem,
  EducationItem,
  CertificationItem,
  ExperienceItem,
  ResumeData,
  SocialLinkItem,
  SiteSettings,
} from '@portfolio/shared';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: { code: string; message: string; details?: unknown };
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });

  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || `Request failed (${res.status})`);
  }
  return json.data;
}

export async function fetchPortfolioBundle() {
  const [
    profile,
    projects,
    skills,
    education,
    certifications,
    experience,
    resume,
    socials,
    settings,
  ] = await Promise.all([
    apiFetch<ProfileData>('/profile', { next: { revalidate: 60 } }).catch(() => null),
    apiFetch<ProjectItem[]>('/projects', { next: { revalidate: 60 } }).catch(() => []),
    apiFetch<SkillItem[]>('/skills', { next: { revalidate: 60 } }).catch(() => []),
    apiFetch<EducationItem[]>('/education', { next: { revalidate: 60 } }).catch(() => []),
    apiFetch<CertificationItem[]>('/certifications', { next: { revalidate: 60 } }).catch(() => []),
    apiFetch<ExperienceItem[]>('/experience', { next: { revalidate: 60 } }).catch(() => []),
    apiFetch<ResumeData | null>('/resume', { next: { revalidate: 60 } }).catch(() => null),
    apiFetch<SocialLinkItem[]>('/socials', { next: { revalidate: 60 } }).catch(() => []),
    apiFetch<SiteSettings>('/settings', { next: { revalidate: 60 } }).catch(() => null),
  ]);

  return {
    profile,
    projects,
    skills,
    education,
    certifications,
    experience,
    resume,
    socials,
    settings,
  };
}