import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Simple rate limiting (in-memory)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const limit = rateLimit.get(ip);

    if (!limit || now > limit.resetTime) {
        rateLimit.set(ip, {
            count: 1,
            resetTime: now + (parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'))
        });
        return true;
    }

    if (limit.count >= parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5')) {
        return false;
    }

    limit.count++;
    return true;
}

// Email validation
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Sanitize input
function sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
}

export async function POST(req: NextRequest) {
    try {
        // Get client IP for rate limiting
        const ip = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';

        // Check rate limit
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Too many requests. Please try again later.'
                },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await req.json();
        const { to, subject, body: emailBody } = body;

        // Validation
        if (!to || !subject || !emailBody) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'All fields (to, subject, body) are required.'
                },
                { status: 400 }
            );
        }

        // Validate email format
        if (!isValidEmail(to)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid recipient email address.'
                },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const sanitizedTo = sanitizeInput(to);
        const sanitizedSubject = sanitizeInput(subject);
        const sanitizedBody = sanitizeInput(emailBody);

        // Check environment variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
            console.error('Missing email configuration');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Email service is not configured properly.'
                },
                { status: 500 }
            );
        }

        // Create transporter with secure settings
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
            secure: true, // Use TLS
            tls: {
                rejectUnauthorized: true
            }
        });

        // Verify transporter configuration
        await transporter.verify();

        // Email options
        const mailOptions = {
            from: {
                name: 'Your App Name',
                address: process.env.EMAIL_USER
            },
            to: sanitizedTo,
            subject: sanitizedSubject,
            text: sanitizedBody,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <p>${sanitizedBody.replace(/\n/g, '<br>')}</p>
          <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #888;">
            This email was sent from Your App Name
          </p>
        </div>
      `,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);

        return NextResponse.json(
            {
                success: true,
                message: `Email successfully sent to ${sanitizedTo}`,
                messageId: info.messageId
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Email sending error:', error);

        // Don't expose internal errors to client
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to send email. Please try again later.'
            },
            { status: 500 }
        );
    }
}

// Prevent GET requests
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}