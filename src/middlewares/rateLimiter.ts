import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now > record.resetAt) {
      ipRequestMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  req: NextRequest,
  maxRequests = 5,
  windowMs = 60 * 1000
): { allowed: boolean; response?: NextResponse } {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  const now = Date.now();
  const existing = ipRequestMap.get(ip);

  if (!existing || now > existing.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (existing.count >= maxRequests) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      response: NextResponse.json(
        {
          success: false,
          message: `Too many submissions. Please wait ${retryAfter} seconds before trying again.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      ),
    };
  }

  existing.count += 1;
  return { allowed: true };
}
