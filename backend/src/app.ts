import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import {
  createSkillSchema,
  updateSkillSchema,
  createEducationSchema,
  updateEducationSchema,
  createCertificationSchema,
  updateCertificationSchema,
  createExperienceSchema,
  updateExperienceSchema,
} from '@portfolio/shared';
import { env } from './config/env';
import { db } from './config/firebase';
import { globalApiLimiter } from './middlewares/rateLimit.middleware';
import { notFoundHandler, globalErrorHandler } from './middlewares/error.middleware';
import { sendSuccess } from './utils/apiResponse';

import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import projectsRoutes from './modules/projects/projects.routes';
import resumeRoutes from './modules/resume/resume.routes';
import contactRoutes from './modules/contact/contact.routes';
import settingsRoutes from './modules/settings/settings.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import adminRoutes from './modules/admin/admin.routes';
import { createCrudRouter } from './modules/crud/crud.factory';

const app = express();

// HTTP Security & CORS
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(env.API_PREFIX, globalApiLimiter);

// Health Check Endpoint
app.get(`${env.API_PREFIX}/health`, async (_req, res) => {
  let dbStatus = 'connected';
  try {
    await db.collection('site_settings').doc('global').get();
  } catch {
    dbStatus = 'degraded';
  }
  return sendSuccess(
    res,
    {
      status: 'ok',
      database: dbStatus,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    'API service healthy'
  );
});

// Core Modules
app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/profile`, profileRoutes);
app.use(`${env.API_PREFIX}/projects`, projectsRoutes);
app.use(`${env.API_PREFIX}/resume`, resumeRoutes);
app.use(`${env.API_PREFIX}/contact`, contactRoutes);
app.use(`${env.API_PREFIX}/settings`, settingsRoutes);
app.use(`${env.API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${env.API_PREFIX}/admin`, adminRoutes);

// Standardized CRUD Modules
app.use(
  `${env.API_PREFIX}/skills`,
  createCrudRouter({
    collectionName: 'skills',
    resourceLabel: 'Skill',
    createSchema: createSkillSchema,
    updateSchema: updateSkillSchema,
    supportsSoftDelete: true,
    supportsVisibilityFlag: true,
  })
);

app.use(
  `${env.API_PREFIX}/education`,
  createCrudRouter({
    collectionName: 'education',
    resourceLabel: 'Education',
    createSchema: createEducationSchema,
    updateSchema: updateEducationSchema,
    supportsSoftDelete: true,
  })
);

app.use(
  `${env.API_PREFIX}/certifications`,
  createCrudRouter({
    collectionName: 'certifications',
    resourceLabel: 'Certification',
    createSchema: createCertificationSchema,
    updateSchema: updateCertificationSchema,
    supportsSoftDelete: true,
    supportsPublishStatus: true,
  })
);

app.use(
  `${env.API_PREFIX}/experience`,
  createCrudRouter({
    collectionName: 'experience',
    resourceLabel: 'Experience',
    createSchema: createExperienceSchema,
    updateSchema: updateExperienceSchema,
    supportsSoftDelete: true,
    supportsPublishStatus: true,
  })
);

const socialSchema = z.object({
  platform: z.string().trim().min(2).max(50),
  url: z.string().trim().url(),
  iconName: z.string().trim().min(1).max(40).default('Link'),
  displayOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

app.use(
  `${env.API_PREFIX}/socials`,
  createCrudRouter({
    collectionName: 'social_links',
    resourceLabel: 'Social Link',
    createSchema: socialSchema,
    updateSchema: socialSchema.partial(),
    supportsVisibilityFlag: true,
  })
);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;