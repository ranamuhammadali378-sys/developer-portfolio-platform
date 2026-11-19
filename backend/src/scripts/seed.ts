import { db, auth } from '../config/firebase';
import { env } from '../config/env';
import { logger } from '../config/logger';

async function seedDatabase() {
  logger.info('🌱 Starting Firestore initial seed...');
  const now = new Date().toISOString();

  // 1. Bind Admin Role
  try {
    const userRecord = await auth.getUserByEmail(env.INITIAL_ADMIN_EMAIL);
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
    await db.collection('users').doc(userRecord.uid).set(
      {
        email: userRecord.email,
        role: 'admin',
        displayName: 'Portfolio Owner',
        updatedAt: now,
      },
      { merge: true }
    );
    logger.info(`✅ Admin privileges bound to ${env.INITIAL_ADMIN_EMAIL}`);
  } catch {
    logger.warn(
      `⚠️ Admin user (${env.INITIAL_ADMIN_EMAIL}) not found in Firebase Auth yet. Create it in Firebase Console and re-run seed.`
    );
  }

  // 2. Singleton Profile Document
  const profileRef = db.collection('profile').doc('main');
  if (!(await profileRef.get()).exists) {
    await profileRef.set({
      fullName: 'Rana Muhammad Ali',
      headline: 'BS Software Engineering Student | Flutter & Full-Stack Web Developer',
      animatedRoles: [
        'Flutter Mobile Developer',
        'Full-Stack Web Engineer',
        'REST API Architect',
        'Software Engineering Student',
      ],
      shortBio:
        'Passionate BS Software Engineering student building scalable cross-platform mobile applications with Flutter and modern full-stack web systems with Next.js, Node.js, and Firebase.',
      detailedBio:
        'I am pursuing a Bachelor of Science in Software Engineering at COMSATS University Islamabad, Vehari Campus. My focus lies in architecting reliable, user-centric mobile and web applications—ranging from agricultural marketplaces and inventory management tools to secure RESTful backend gateways.',
      careerObjective:
        'Seeking challenging software engineering opportunities where I can engineer clean, secure, and high-impact mobile and full-stack web solutions while continuously advancing in distributed systems and cloud architecture.',
      interests: [
        'Cross-Platform Mobile Development',
        'Backend API Security',
        'Cloud-Native Architectures',
        'IoT & Embedded Software Integration',
      ],
      avatarUrl: '',
      avatarStoragePath: '',
      location: 'Pakistan',
      email: env.INITIAL_ADMIN_EMAIL,
      availabilityStatus: 'Open to Internships & Junior Software Engineer Roles',
      updatedAt: now,
    });
    logger.info('✅ Seeded profile/main');
  }

  // 3. Singleton Site Settings
  const settingsRef = db.collection('site_settings').doc('global');
  if (!(await settingsRef.get()).exists) {
    await settingsRef.set({
      siteTitle: 'Rana Muhammad Ali | Software Engineer & Flutter/Web Developer',
      metaDescription:
        'Official developer portfolio showcasing Flutter mobile applications, Next.js full-stack web platforms, and secure Node.js REST APIs.',
      ogImageUrl: '',
      keywords: [
        'Software Engineer',
        'Flutter Developer',
        'Next.js Developer',
        'Node.js',
        'Firebase',
        'COMSATS Vehari',
      ],
      maintenanceMode: false,
      sectionVisibility: {
        hero: true,
        about: true,
        skills: true,
        projects: true,
        education: true,
        certifications: true,
        experience: true,
        contact: true,
      },
      updatedAt: now,
    });
    logger.info('✅ Seeded site_settings/global');
  }

  // 4. Verified Initial Projects
  const initialProjects = [
    {
      title: 'FarmerHub',
      slug: 'farmerhub',
      summary:
        'Cross-platform agricultural marketplace mobile application built with Flutter and Firebase to streamline produce trading.',
      description:
        '### Overview\nFarmerHub is a mobile agricultural marketplace built using **Flutter** and **Firebase**. It bridges the gap between agricultural producers and buyers through structured product listings, real-time data synchronization, and streamlined user workflows.\n\n### Key Engineering Highlights\n- Cross-platform Android/iOS client architecture in Flutter.\n- Real-time cloud database synchronization and authentication via Firebase.\n- Clean modular UI focused on accessibility for field and market users.',
      category: 'Mobile',
      technologies: ['Flutter', 'Dart', 'Firebase', 'Cloud Firestore'],
      thumbnailUrl: '',
      thumbnailStoragePath: '',
      screenshots: [],
      githubUrl: null,
      liveUrl: null,
      isFeatured: true,
      status: 'published',
      displayOrder: 1,
      viewCount: 0,
      projectDate: '2026',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Ameer-e-Milat Traders',
      slug: 'ameer-e-milat-traders',
      summary:
        'Business inventory and stock management mobile application engineered in Flutter for agricultural and livestock supply operations.',
      description:
        '### Overview\nA dedicated stock and business management solution built with **Flutter** for **Ameer-e-Milat Traders**, streamlining daily inventory tracking across feeds, seeds, fertilizers, and agricultural supplies.\n\n### Key Engineering Highlights\n- Structured stock-in / stock-out inventory tracking.\n- Product categorization for multi-line agricultural retail operations.\n- Responsive mobile interface designed for fast counter-side operations.',
      category: 'Mobile',
      technologies: ['Flutter', 'Dart', 'State Management', 'Local & Cloud Sync'],
      thumbnailUrl: '',
      thumbnailStoragePath: '',
      screenshots: [],
      githubUrl: null,
      liveUrl: null,
      isFeatured: true,
      status: 'published',
      displayOrder: 2,
      viewCount: 0,
      projectDate: '2026',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Enterprise Identity Security Gateway',
      slug: 'enterprise-identity-security-gateway',
      summary:
        'Centralized REST API authentication and security gateway built with Node.js and Express.js enforcing token verification and rate limiting.',
      description:
        '### Overview\nAn API security and identity gateway developed with **Node.js** and **Express.js** to protect downstream REST services against unauthorized access, brute-force abuse, and malformed payloads.\n\n### Key Engineering Highlights\n- Token-based authentication and Role-Based Access Control (RBAC) middleware.\n- HTTP security hardening with Helmet, strict CORS policies, and IP rate limiting.\n- Standardized JSON error envelopes and centralized exception handling.',
      category: 'Backend',
      technologies: ['Node.js', 'Express.js', 'REST APIs', 'JWT', 'API Security'],
      thumbnailUrl: '',
      thumbnailStoragePath: '',
      screenshots: [],
      githubUrl: null,
      liveUrl: null,
      isFeatured: true,
      status: 'published',
      displayOrder: 3,
      viewCount: 0,
      projectDate: '2026',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'V-Spark — COMSATS University Islamabad, Vehari Campus',
      slug: 'v-spark-comsats-vehari',
      summary:
        'Modern web platform built for V-Spark at COMSATS University Islamabad, Vehari Campus with GitHub CI/CD and Vercel deployment.',
      description:
        '### Overview\nA modern web development project created for **V-Spark** at **COMSATS University Islamabad, Vehari Campus**, featuring responsive layouts, structured evaluation workflows, and production cloud deployment.\n\n### Key Engineering Highlights\n- Component-driven modern web architecture.\n- Version-controlled workflow via Git & GitHub.\n- Automated production hosting and edge delivery on Vercel.',
      category: 'Full-Stack',
      technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'GitHub', 'Vercel'],
      thumbnailUrl: '',
      thumbnailStoragePath: '',
      screenshots: [],
      githubUrl: null,
      liveUrl: null,
      isFeatured: true,
      status: 'published',
      displayOrder: 4,
      viewCount: 0,
      projectDate: '2026',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Personal Developer Portfolio Platform',
      slug: 'personal-developer-portfolio',
      summary:
        'Full-stack dynamically managed developer portfolio and CMS built with Next.js, TypeScript, Express.js, and Firebase.',
      description:
        '### Overview\nA production-grade personal branding and portfolio platform engineered on the principle of **Build Once, Manage Everything Dynamically**.\n\n### Key Engineering Highlights\n- Public Next.js App Router frontend with SSR/ISR, dark/light themes, and SEO-friendly project pages.\n- Protected Admin Dashboard with Draft/Publish workflows, soft-delete recovery, analytics, and audit logs.\n- Express.js REST API backed by Firebase Firestore, Authentication, and Cloud Storage.',
      category: 'Full-Stack',
      technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express.js', 'Firebase'],
      thumbnailUrl: '',
      thumbnailStoragePath: '',
      screenshots: [],
      githubUrl: null,
      liveUrl: null,
      isFeatured: false,
      status: 'published',
      displayOrder: 5,
      viewCount: 0,
      projectDate: '2026',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const project of initialProjects) {
    const existing = await db.collection('projects').where('slug', '==', project.slug).limit(1).get();
    if (existing.empty) {
      await db.collection('projects').add(project);
      logger.info(`✅ Seeded project: ${project.title}`);
    }
  }

  // 5. Initial Skills
  const skillsSnapshot = await db.collection('skills').limit(1).get();
  if (skillsSnapshot.empty) {
    const initialSkills = [
      { name: 'Dart', category: 'Programming Languages', iconName: 'Code2', proficiencyLevel: 'Core', displayOrder: 1 },
      { name: 'TypeScript', category: 'Programming Languages', iconName: 'FileCode', proficiencyLevel: 'Core', displayOrder: 2 },
      { name: 'JavaScript (ES6+)', category: 'Programming Languages', iconName: 'Braces', proficiencyLevel: 'Core', displayOrder: 3 },
      { name: 'Python', category: 'Programming Languages', iconName: 'Terminal', proficiencyLevel: 'Proficient', displayOrder: 4 },
      { name: 'Flutter', category: 'Mobile Application Development', iconName: 'Smartphone', proficiencyLevel: 'Core', displayOrder: 1 },
      { name: 'Next.js', category: 'Frontend Development', iconName: 'Globe', proficiencyLevel: 'Core', displayOrder: 1 },
      { name: 'React', category: 'Frontend Development', iconName: 'Atom', proficiencyLevel: 'Core', displayOrder: 2 },
      { name: 'Tailwind CSS', category: 'Frontend Development', iconName: 'Palette', proficiencyLevel: 'Core', displayOrder: 3 },
      { name: 'Node.js', category: 'Backend Development', iconName: 'Server', proficiencyLevel: 'Core', displayOrder: 1 },
      { name: 'Express.js', category: 'Backend Development', iconName: 'Workflow', proficiencyLevel: 'Core', displayOrder: 2 },
      { name: 'REST APIs', category: 'Backend Development', iconName: 'Network', proficiencyLevel: 'Core', displayOrder: 3 },
      { name: 'Firebase Firestore', category: 'Databases', iconName: 'Database', proficiencyLevel: 'Core', displayOrder: 1 },
      { name: 'PostgreSQL', category: 'Databases', iconName: 'HardDrive', proficiencyLevel: 'Proficient', displayOrder: 2 },
      { name: 'Git & GitHub', category: 'Development Tools', iconName: 'GitBranch', proficiencyLevel: 'Core', displayOrder: 1 },
      { name: 'Vercel', category: 'Development Tools', iconName: 'Cloud', proficiencyLevel: 'Proficient', displayOrder: 2 },
    ];

    const batch = db.batch();
    for (const skill of initialSkills) {
      const ref = db.collection('skills').doc();
      batch.set(ref, {
        ...skill,
        isVisible: true,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }
    await batch.commit();
    logger.info('✅ Seeded initial skills');
  }

  // 6. Initial Education
  const eduSnapshot = await db.collection('education').limit(1).get();
  if (eduSnapshot.empty) {
    await db.collection('education').add({
      institution: 'COMSATS University Islamabad, Vehari Campus',
      degree: 'Bachelor of Science (BS)',
      fieldOfStudy: 'Software Engineering',
      location: 'Vehari, Punjab, Pakistan',
      startDate: '2024',
      endDate: 'Present',
      description:
        'Focused on Software Construction & Development, Software Quality Engineering, Web Technologies, Database Systems, and Object-Oriented Architecture.',
      displayOrder: 1,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    logger.info('✅ Seeded education record');
  }

  logger.info('🎉 Database seeding completed successfully!');
  process.exit(0);
}

seedDatabase().catch((err) => {
  logger.error({ err }, '❌ Seeding failed');
  process.exit(1);
});