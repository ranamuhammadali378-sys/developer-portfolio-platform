import React from 'react';
import { SkillItem } from '@portfolio/shared';
import { fetchPortfolioBundle } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { ProjectsSection } from '@/components/ProjectsSection';
import { ContactSection } from '@/components/ContactSection';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { GraduationCap, Award, Briefcase, Code2, Target, Wrench } from 'lucide-react';

export const revalidate = 60;

export default async function HomePage() {
  const {
    profile,
    projects,
    skills,
    education,
    certifications,
    experience,
    resume,
    socials,
    settings,
  } = await fetchPortfolioBundle();

  if (settings?.maintenanceMode) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
        <Wrench className="h-12 w-12 text-indigo-400" />
        <h1 className="mt-4 text-3xl font-bold">Portfolio Under Scheduled Maintenance</h1>
        <p className="mt-2 max-w-md text-slate-400">
          Updating projects and system modules. Please check back shortly.
        </p>
      </main>
    );
  }

  const vis = settings?.sectionVisibility || {
    hero: true,
    about: true,
    skills: true,
    projects: true,
    education: true,
    certifications: true,
    experience: true,
    contact: true,
  };

  // Group skills by category
  const groupedSkills: Record<string, SkillItem[]> = {};
  for (const skill of skills) {
    if (!groupedSkills[skill.category]) {
      groupedSkills[skill.category] = [];
    }
    groupedSkills[skill.category].push(skill);
  }

  return (
    <>
      <AnalyticsTracker eventType="page_view" path="/" />
      <Navbar brandName={profile?.fullName?.split(' ')[0] || 'Rana.dev'} />

      <main>
        {vis.hero && (
          <HeroSection profile={profile} resume={resume} socials={socials} />
        )}

        {/* About & Career Objective */}
        {vis.about && profile && (
          <section
            id="about"
            className="border-b border-slate-200/70 py-20 dark:border-slate-800/70"
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                About &amp; Engineering Philosophy
              </h2>
              <div className="mt-8 grid gap-8 lg:grid-cols-12">
                <div className="space-y-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 lg:col-span-7">
                  <p>{profile.detailedBio}</p>
                  {profile.interests?.length > 0 && (
                    <div className="pt-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Core Technical Interests
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {profile.interests.map((interest) => (
                          <span
                            key={interest}
                            className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {profile.careerObjective && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-5">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Target className="h-5 w-5" />
                      <h3 className="font-bold">Career Objective</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {profile.careerObjective}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Skills Matrix */}
        {vis.skills && Object.keys(groupedSkills).length > 0 && (
          <section
            id="skills"
            className="border-b border-slate-200/70 py-20 dark:border-slate-800/70"
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <Code2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Technical Stack &amp; Skills
                </h2>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(groupedSkills).map(([category, items]) => (
                  <div
                    key={category}
                    className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {category}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {items.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Projects */}
        {vis.projects && <ProjectsSection projects={projects} />}

        {/* Education, Certifications & Experience */}
        {(vis.education || vis.certifications || vis.experience) && (
          <section
            id="education"
            className="border-b border-slate-200/70 py-20 dark:border-slate-800/70"
          >
            <div className="mx-auto max-w-6xl space-y-14 px-4 sm:px-6">
              {vis.education && education.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Academic Education
                    </h2>
                  </div>
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {education.map((edu) => (
                      <div
                        key={edu.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
                      >
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {edu.startDate} — {edu.endDate}
                        </span>
                        <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                          {edu.degree} in {edu.fieldOfStudy}
                        </h3>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {edu.institution} {edu.location ? `• ${edu.location}` : ''}
                        </p>
                        {edu.description && (
                          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {vis.experience && experience.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Experience &amp; Roles
                    </h2>
                  </div>
                  <div className="mt-6 space-y-4">
                    {experience.map((exp) => {
                      const item = exp as unknown as Record<string, unknown>;
                      return (
                        <div
                          key={exp.id}
                          className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {exp.role} — <span className="text-indigo-500">{exp.organization}</span>
                            </h3>
                            <span className="text-xs font-semibold text-slate-500">
                              {exp.startDate} — {exp.endDate || 'Present'}
                            </span>
                          </div>
                          {Boolean(item.description || item.summary) && (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                              {String(item.description || item.summary)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {vis.certifications && certifications.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5">
                    <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Certifications &amp; Achievements
                    </h2>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {certifications.map((cert) => {
                      const item = cert as unknown as Record<string, unknown>;
                      return (
                        <div
                          key={cert.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60"
                        >
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {cert.issueDate}
                          </p>
                          <h3 className="mt-1 font-bold text-slate-900 dark:text-white">
                            {cert.title}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {String(item.issuingOrganization || item.issuer || '')}
                          </p>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-block text-xs font-semibold text-indigo-500 hover:underline"
                            >
                              Verify Credential →
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {vis.contact && <ContactSection />}
      </main>

      <Footer fullName={profile?.fullName} socials={socials} />
    </>
  );
}