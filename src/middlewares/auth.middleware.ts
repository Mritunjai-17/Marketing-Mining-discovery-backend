import { NextRequest, NextResponse } from 'next/server';
import { authService, AdminPayload } from '@/services/auth.service';

export interface AuthenticatedRequest extends NextRequest {
  adminUser?: AdminPayload;
}

export type AuthenticatedRouteHandler = (
  req: NextRequest,
  admin: AdminPayload,
  context?: unknown
) => Promise<NextResponse>;

export function getAdminToken(req: NextRequest): string | null {
  // 1. Check HTTP-only cookie
  const cookieToken = req.cookies.get('admin_token')?.value;
  if (cookieToken) return cookieToken;

  // 2. Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export function withAdminAuth(handler: AuthenticatedRouteHandler) {
  return async (req: NextRequest, context?: unknown): Promise<NextResponse> => {
    const token = getAdminToken(req);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized: Authentication required to access this resource',
        },
        { status: 401 }
      );
    }

    try {
      const payload = authService.verifyToken(token);
      return handler(req, payload, context);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized: Invalid or expired session. Please log in again.',
        },
        { status: 401 }
      );
    }
  };
}
