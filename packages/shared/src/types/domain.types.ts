export type PublishStatus = 'draft' | 'published';

export type ProjectCategory =
  | 'Mobile'
  | 'Web'
  | 'Backend'
  | 'Full-Stack';

export type SkillCategory =
  | 'Programming Languages'
  | 'Frontend Development'
  | 'Mobile Application Development'
  | 'Backend Development'
  | 'Databases'
  | 'Development Tools';

export type ProficiencyLevel = 'Core' | 'Proficient' | 'Familiar';

export type EmploymentType =
  | 'Internship'
  | 'Part-Time'
  | 'Contract'
  | 'Academic/Leadership';

export interface ProjectScreenshot {
  url: string;
  path: string;
  caption?: string;
}

export interface ProfileData {
  fullName: string;
  headline: string;
  animatedRoles: string[];
  shortBio: string;
  detailedBio: string;
  careerObjective: string;
  interests: string[];
  avatarUrl: string;
  avatarStoragePath: string;
  location: string;
  email: string;
  availabilityStatus: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: ProjectCategory;
  technologies: string[];
  thumbnailUrl: string;
  thumbnailStoragePath: string;
  screenshots: ProjectScreenshot[];
  githubUrl: string | null;
  liveUrl: string | null;
  isFeatured: boolean;
  status: PublishStatus;
  displayOrder: number;
  viewCount: number;
  projectDate: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category: SkillCategory;
  iconName: string;
  proficiencyLevel: ProficiencyLevel;
  displayOrder: number;
  isVisible: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string | null;
  displayOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuingOrganization: string;
  issueDate: string;
  credentialId: string | null;
  credentialUrl: string | null;
  certificateImageUrl: string | null;
  certificateStoragePath: string | null;
  status: PublishStatus;
  displayOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  employmentType: EmploymentType;
  location: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
  technologiesUsed: string[];
  status: PublishStatus;
  displayOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeData {
  fileName: string;
  fileUrl: string;
  storagePath: string;
  fileSizeBytes: number;
  versionLabel: string;
  updatedAt: string;
}

export interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
  iconName: string;
  displayOrder: number;
  isVisible: boolean;
  updatedAt: string;
}

export interface ContactMessageItem {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SectionVisibility {
  hero: boolean;
  about: boolean;
  skills: boolean;
  projects: boolean;
  education: boolean;
  certifications: boolean;
  experience: boolean;
  contact: boolean;
}

export interface SiteSettings {
  siteTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  keywords: string[];
  maintenanceMode: boolean;
  sectionVisibility: SectionVisibility;
  updatedAt: string;
}

export interface ActivityLogItem {
  id: string;
  actorEmail: string;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'PUBLISH'
    | 'UNPUBLISH'
    | 'SOFT_DELETE'
    | 'RESTORE'
    | 'PERMANENT_DELETE'
    | 'UPLOAD'
    | 'BACKUP_RESTORE';
  resourceType: string;
  resourceId: string;
  summary: string;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalSiteVisits: number;
  visitsLast7Days: number;
  visitsLast30Days: number;
  topProjects: Array<{
    id: string;
    title: string;
    slug: string;
    viewCount: number;
  }>;
  dailyTraffic: Array<{
    date: string;
    visits: number;
  }>;
}