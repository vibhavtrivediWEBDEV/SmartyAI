import "server-only";

import nodemailer from "nodemailer";

export interface ServerMailMessage {
  to: string;
  subject: string;
  body: string;
  senderName?: string;
}

export type ServerMailResult =
  | { status: "sent"; messageId: string }
  | { status: "skipped"; reason: "smtp_not_configured" };

interface MailTransport {
  sendMail(message: Record<string, unknown>): Promise<{ messageId?: string }>;
}

type TransportFactory = (options: Record<string, unknown>) => MailTransport;

interface MailConfiguration {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

type MailEnvironment = Readonly<Record<string, string | undefined>>;

function readConfiguration(env: MailEnvironment): MailConfiguration | null {
  const host = env.EMAIL_HOST;
  const port = Number(env.EMAIL_PORT || 587);
  const user = env.EMAIL_USER;
  const pass = env.EMAIL_PASS || env.EMAIL_APP_PASSWORD;
  const from = env.EMAIL_FROM || user;

  if (!host || !user || !pass || !from || !Number.isInteger(port)) return null;
  return { host, port, user, pass, from };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createServerMailService(
  env: MailEnvironment = process.env,
  createTransport: TransportFactory = nodemailer.createTransport as TransportFactory,
) {
  return {
    isConfigured(): boolean {
      return readConfiguration(env) !== null;
    },

    async send(message: ServerMailMessage): Promise<ServerMailResult> {
      const configuration = readConfiguration(env);
      if (!configuration) return { status: "skipped", reason: "smtp_not_configured" };

      const transporter = createTransport({
        host: configuration.host,
        port: configuration.port,
        secure: configuration.port === 465,
        requireTLS: configuration.port !== 465,
        auth: { user: configuration.user, pass: configuration.pass },
        tls: { rejectUnauthorized: true },
      });
      const senderName = (message.senderName || "SmartyAI Career").replace(/[\r\n]/g, " ").trim();
      const bodyHtml = escapeHtml(message.body).replaceAll("\n", "<br>");
      const info = await transporter.sendMail({
        from: { name: senderName, address: configuration.from },
        to: message.to,
        subject: message.subject.replace(/[\r\n]/g, " ").trim(),
        text: message.body,
        html: `<div style="max-width:680px;margin:auto;padding:28px;font-family:Arial,sans-serif;line-height:1.65;color:#172033"><div>${bodyHtml}</div><hr style="margin:28px 0 12px;border:0;border-top:1px solid #e5e7eb"><small style="color:#718096">Sent by ${escapeHtml(senderName)} with SmartyAI</small></div>`,
      });

      return { status: "sent", messageId: info.messageId || "unknown" };
    },
  };
}

export const serverMailService = createServerMailService();