import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const safeHttpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
    message: 'Only http:// or https:// URLs are allowed',
  });

export const publishStatusSchema = z.enum(['draft', 'published']);

export const projectCategorySchema = z.enum([
  'Mobile',
  'Web',
  'Backend',
  'Full-Stack',
]);

export const skillCategorySchema = z.enum([
  'Programming Languages',
  'Frontend Development',
  'Mobile Application Development',
  'Backend Development',
  'Databases',
  'Development Tools',
]);

export const proficiencyLevelSchema = z.enum(['Core', 'Proficient', 'Familiar']);

export const employmentTypeSchema = z.enum([
  'Internship',
  'Part-Time',
  'Contract',
  'Academic/Leadership',
]);

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  headline: z.string().trim().min(5).max(160),
  animatedRoles: z.array(z.string().trim().min(2).max(60)).min(1).max(8),
  shortBio: z.string().trim().min(10).max(400),
  detailedBio: z.string().trim().min(20).max(4000),
  careerObjective: z.string().trim().min(10).max(1000),
  interests: z.array(z.string().trim().min(2).max(60)).max(15),
  location: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  availabilityStatus: z.string().trim().min(2).max(80),
});

export const createProjectSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(slugRegex, 'Slug must contain lowercase letters, numbers, and hyphens only')
    .min(2)
    .max(120)
    .optional(),
  summary: z.string().trim().min(10).max(300),
  description: z.string().trim().min(20).max(10000),
  category: projectCategorySchema,
  technologies: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  githubUrl: safeHttpUrlSchema.nullable().optional().or(z.literal('')),
  liveUrl: safeHttpUrlSchema.nullable().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  status: publishStatusSchema.default('draft'),
  displayOrder: z.number().int().min(0).default(0),
  projectDate: z.string().trim().min(4).max(30),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createSkillSchema = z.object({
  name: z.string().trim().min(1).max(60),
  category: skillCategorySchema,
  iconName: z.string().trim().min(1).max(50).default('Code2'),
  proficiencyLevel: proficiencyLevelSchema,
  displayOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

export const updateSkillSchema = createSkillSchema.partial();

export const createEducationSchema = z.object({
  institution: z.string().trim().min(2).max(150),
  degree: z.string().trim().min(2).max(150),
  fieldOfStudy: z.string().trim().min(2).max(150),
  location: z.string().trim().min(2).max(100),
  startDate: z.string().trim().min(4).max(30),
  endDate: z.string().trim().min(4).max(30),
  description: z.string().trim().max(1500).nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateEducationSchema = createEducationSchema.partial();

export const createCertificationSchema = z.object({
  title: z.string().trim().min(2).max(160),
  issuingOrganization: z.string().trim().min(2).max(120),
  issueDate: z.string().trim().min(4).max(30),
  credentialId: z.string().trim().max(100).nullable().optional(),
  credentialUrl: safeHttpUrlSchema.nullable().optional().or(z.literal('')),
  status: publishStatusSchema.default('published'),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateCertificationSchema = createCertificationSchema.partial();

export const createExperienceSchema = z.object({
  role: z.string().trim().min(2).max(120),
  organization: z.string().trim().min(2).max(150),
  employmentType: employmentTypeSchema,
  location: z.string().trim().min(2).max(100),
  startDate: z.string().trim().min(4).max(30),
  endDate: z.string().trim().min(4).max(30),
  responsibilities: z.array(z.string().trim().min(5).max(500)).min(1).max(12),
  technologiesUsed: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  status: publishStatusSchema.default('published'),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateExperienceSchema = createExperienceSchema.partial();

export const contactSubmissionSchema = z.object({
  senderName: z.string().trim().min(2).max(80),
  senderEmail: z.string().trim().email().max(120),
  senderPhone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone/WhatsApp number')
    .max(25)
    .regex(/^\+?[0-9\s\-()]{7,25}$/, 'Invalid phone number format'),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(3000),
  websiteHoneypot: z.string().max(0).optional(),
});

export const updateSiteSettingsSchema = z.object({
  siteTitle: z.string().trim().min(3).max(120),
  metaDescription: z.string().trim().min(10).max(300),
  ogImageUrl: safeHttpUrlSchema.or(z.literal('')),
  keywords: z.array(z.string().trim().min(1).max(40)).max(25),
  maintenanceMode: z.boolean(),
  sectionVisibility: z.object({
    hero: z.boolean(),
    about: z.boolean(),
    skills: z.boolean(),
    projects: z.boolean(),
    education: z.boolean(),
    certifications: z.boolean(),
    experience: z.boolean(),
    contact: z.boolean(),
  }),
});

export const trackAnalyticsSchema = z.object({
  eventType: z.enum(['page_view', 'project_view']),
  path: z.string().trim().min(1).max(200),
  projectSlug: z.string().trim().max(120).optional(),
});