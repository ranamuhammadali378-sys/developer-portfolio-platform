'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Phone,
  User,
  Mail,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export function ContactSection() {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');

  const [numA, setNumA] = useState(4);
  const [numB, setNumB] = useState(3);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const regenerateChallenge = () => {
    setNumA(Math.floor(Math.random() * 8) + 2);
    setNumB(Math.floor(Math.random() * 8) + 1);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    regenerateChallenge();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (Number(captchaAnswer.trim()) !== numA + numB) {
      setStatus({
        type: 'error',
        text: 'Human verification answer is incorrect. Please solve the quick sum.',
      });
      regenerateChallenge();
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify({
          senderName,
          senderEmail,
          senderPhone,
          subject,
          message,
          websiteHoneypot,
        }),
      });
      setStatus({
        type: 'success',
        text: 'Your verified message has been delivered! I will contact you shortly.',
      });
      setSenderName('');
      setSenderEmail('');
      setSenderPhone('');
      setSubject('');
      setMessage('');
      regenerateChallenge();
    } catch (err) {
      setStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to send message right now.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="border-t border-slate-200/80 py-20 dark:border-slate-800/80">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Direct Verified Channel
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Get In Touch
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Have a software project, freelance inquiry, or engineering role in mind? Send a verified message directly.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-indigo-950/20 sm:p-9"
        >
          {/* Hidden Honeypot Anti-Bot Field */}
          <input
            type="text"
            name="websiteHoneypot"
            tabIndex={-1}
            autoComplete="off"
            value={websiteHoneypot}
            onChange={(e) => setWebsiteHoneypot(e.target.value)}
            className="hidden"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Name *
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Ali Khan"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950/90 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  maxLength={120}
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="ali@example.com"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950/90 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Phone / WhatsApp Number *
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  minLength={7}
                  maxLength={25}
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950/90 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subject *
              </label>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={150}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Software Engineering / Project Inquiry"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950/90 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                Message *
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                {message.length} / 3000
              </span>
            </div>
            <textarea
              required
              rows={4}
              minLength={10}
              maxLength={3000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your project requirements or message here..."
              className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950/90 dark:text-white"
            />
          </div>

          {/* Human Anti-Spam Verification Box */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 px-4 py-3.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-500" />
              <span>
                Anti-Spam Verification: What is{' '}
                <strong className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-indigo-600 dark:text-indigo-400">
                  {numA} + {numB}
                </strong>
                ?
              </span>
            </div>
            <input
              type="number"
              required
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="Answer"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-center text-sm font-bold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-28"
            />
          </div>

          {status && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-sm ${
                status.type === 'success'
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{status.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Verifying & Sending...' : 'Send Verified Message'}
          </button>
        </form>
      </div>
    </section>
  );
}