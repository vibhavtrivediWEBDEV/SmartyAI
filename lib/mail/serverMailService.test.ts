import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createServerMailService } from "./serverMailService";

describe("serverMailService", () => {
  it("reports and skips incomplete SMTP configuration", async () => {
    const createTransport = vi.fn();
    const service = createServerMailService({}, createTransport);

    await expect(service.send({ to: "user@example.com", subject: "Reminder", body: "Body" }))
      .resolves.toEqual({ status: "skipped", reason: "smtp_not_configured" });
    expect(service.isConfigured()).toBe(false);
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("sends through the configured SMTP transport", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "smtp-123" });
    const createTransport = vi.fn(() => ({ sendMail }));
    const service = createServerMailService({
      EMAIL_HOST: "smtp.example.com",
      EMAIL_PORT: "465",
      EMAIL_USER: "mailer@example.com",
      EMAIL_PASS: "secret",
    }, createTransport);

    await expect(service.send({ to: "user@example.com", subject: "Reminder\n", body: "A < B" }))
      .resolves.toEqual({ status: "sent", messageId: "smtp-123" });
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: true }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: "user@example.com",
      subject: "Reminder",
      text: "A < B",
      html: expect.stringContaining("A &lt; B"),
    }));
  });
});