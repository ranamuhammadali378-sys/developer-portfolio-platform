import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { contactSubmissionSchema } from '@portfolio/shared';
import { db } from '../../config/firebase';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { requireAdmin, AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { contactFormLimiter } from '../../middlewares/rateLimit.middleware';
import { logAdminActivity } from '../../utils/audit.helper';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';

const router = Router();
const messagesCol = () => db.collection('messages');

async function sendEmailNotification(data: {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  message: string;
}) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.NOTIFY_EMAIL_TO) {
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Portfolio Contact" <${env.SMTP_USER}>`,
      to: env.NOTIFY_EMAIL_TO,
      replyTo: data.senderEmail,
      subject: `[Portfolio Inquiry] ${data.subject}`,
      text: `New verified message from ${data.senderName} (${data.senderEmail} | Phone: ${data.senderPhone}):\n\n${data.message}`,
    });
  } catch (error) {
    logger.warn({ err: error }, 'SMTP email alert failed, message safely saved in Firestore');
  }
}

// Public Contact Submission
router.post(
  '/',
  contactFormLimiter,
  validateBody(contactSubmissionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { senderName, senderEmail, senderPhone, subject, message } = req.body;
      const ipHash = crypto
        .createHash('sha256')
        .update(`${req.ip || 'unknown'}-${env.ANALYTICS_SALT}`)
        .digest('hex')
        .slice(0, 16);

      const record = {
        senderName,
        senderEmail,
        senderPhone,
        subject,
        message,
        isRead: false,
        ipHash,
        createdAt: new Date().toISOString(),
      };

      const ref = await messagesCol().add(record);
      await sendEmailNotification({ senderName, senderEmail, senderPhone, subject, message });

      return sendSuccess(
        res,
        { id: ref.id },
        'Thank you! Your message has been sent successfully.',
        201
      );
    } catch (err) {
      next(err);
    }
  }
);

// Admin: List messages
router.get(
  '/admin/messages',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const snap = await messagesCol().orderBy('createdAt', 'desc').limit(100).get();
      let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (req.query.unreadOnly === 'true') {
        items = items.filter((m: Record<string, unknown>) => !m.isRead);
      }

      return sendSuccess(res, items, 'Messages retrieved');
    } catch (err) {
      next(err);
    }
  }
);

// Admin: Toggle read status
router.patch(
  '/admin/messages/:id',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const msgId = String(req.params.id);
      const ref = messagesCol().doc(msgId);
      const snap = await ref.get();
      if (!snap.exists) {
        throw new AppError('Message not found', 404, 'NOT_FOUND');
      }
      const isRead = typeof req.body?.isRead === 'boolean' ? req.body.isRead : true;
      await ref.update({ isRead });
      return sendSuccess(res, { id: ref.id, isRead }, 'Message status updated');
    } catch (err) {
      next(err);
    }
  }
);

// Admin: Delete message
router.delete(
  '/admin/messages/:id',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const msgId = String(req.params.id);
      const ref = messagesCol().doc(msgId);
      const snap = await ref.get();
      if (!snap.exists) {
        throw new AppError('Message not found', 404, 'NOT_FOUND');
      }
      await ref.delete();
      await logAdminActivity({
        actorEmail: req.user!.email,
        action: 'PERMANENT_DELETE',
        resourceType: 'message',
        resourceId: ref.id,
        summary: `Deleted contact message (${ref.id})`,
      });
      return sendSuccess(res, { id: ref.id }, 'Message deleted');
    } catch (err) {
      next(err);
    }
  }
);

export default router;