import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthService } from '@/services/auth.service';
import { handleApiError } from '@/middlewares/errorHandler';
import { validateRequestBody } from '@/middlewares/validateRequest';
import { withCors, handleCorsPreflight } from '@/middlewares/cors.middleware';
import { getAdminToken } from '@/middlewares/auth.middleware';
import { AdminStatus } from '@/models/admin.model';

export class AuthController {
  private service: AuthService;

  constructor(service: AuthService = authService) {
    this.service = service;
  }

  options(req: NextRequest): NextResponse {
    return handleCorsPreflight(req);
  }

  private setAuthCookie(response: NextResponse, token: string) {
    response.cookies.set({
      name: 'admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  }

  // POST /api/admin/auth/register
  async register(req: NextRequest): Promise<NextResponse> {
    try {
      const { data, errorResponse } = await validateRequestBody<{
        name: string;
        email: string;
        password: string;
      }>(req, ['name', 'email', 'password']);

      if (errorResponse) {
        return withCors(errorResponse, req);
      }

      const result = await this.service.register(data!);

      const response = NextResponse.json(
        {
          success: true,
          message: result.message,
          isPendingApproval: result.isPendingApproval,
          data: result.admin,
          token: result.token,
        },
        { status: 201 }
      );

      // Only set session cookie if approved immediately (i.e. the first superadmin)
      if (result.token && !result.isPendingApproval) {
        this.setAuthCookie(response, result.token);
      }

      return withCors(response, req);
    } catch (error) {
      const errorRes = handleApiError(
        error,
        error instanceof Error ? error.message : 'Registration failed'
      );
      return withCors(errorRes, req);
    }
  }

  // POST /api/admin/auth/login
  async login(req: NextRequest): Promise<NextResponse> {
    try {
      const { data, errorResponse } = await validateRequestBody<{
        email: string;
        password: string;
      }>(req, ['email', 'password']);

      if (errorResponse) {
        return withCors(errorResponse, req);
      }

      const result = await this.service.login(data!);

      const response = NextResponse.json({
        success: true,
        message: 'Logged in successfully',
        data: result.admin,
        token: result.token,
      });

      if (result.token) {
        this.setAuthCookie(response, result.token);
      }

      return withCors(response, req);
    } catch (error) {
      const errorRes = handleApiError(
        error,
        error instanceof Error ? error.message : 'Invalid credentials'
      );
      return withCors(errorRes, req);
    }
  }

  // GET /api/admin/auth/me
  async me(req: NextRequest): Promise<NextResponse> {
    try {
      const token = getAdminToken(req);
      if (!token) {
        const unauth = NextResponse.json(
          { success: false, message: 'Not authenticated' },
          { status: 401 }
        );
        return withCors(unauth, req);
      }

      const payload = this.service.verifyToken(token);
      const profile = await this.service.getAdminProfile(payload.id);

      const response = NextResponse.json({
        success: true,
        data: profile,
      });

      return withCors(response, req);
    } catch (error) {
      const errorRes = handleApiError(error, 'Failed to fetch admin profile');
      return withCors(errorRes, req);
    }
  }

  // POST /api/admin/auth/logout
  async logout(req: NextRequest): Promise<NextResponse> {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set({
      name: 'admin_token',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return withCors(response, req);
  }

  // GET /api/admin/users (Super Admin view all admins and requests)
  async getAdmins(req: NextRequest): Promise<NextResponse> {
    try {
      const token = getAdminToken(req);
      if (!token) {
        return withCors(
          NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
          req
        );
      }

      const requester = this.service.verifyToken(token);
      const data = await this.service.getAdminsList(requester.role);

      return withCors(
        NextResponse.json({
          success: true,
          data: data.admins,
          pendingCount: data.pendingCount,
        }),
        req
      );
    } catch (error) {
      return withCors(handleApiError(error, 'Failed to fetch admins list'), req);
    }
  }

  // PATCH /api/admin/users/[id] (Super Admin approve / reject)
  async updateAdminStatus(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const token = getAdminToken(req);
      if (!token) {
        return withCors(
          NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
          req
        );
      }

      const requester = this.service.verifyToken(token);
      const { data, errorResponse } = await validateRequestBody<{ status: AdminStatus }>(req, [
        'status',
      ]);

      if (errorResponse) return withCors(errorResponse, req);

      const updated = await this.service.updateAdminStatus(
        id,
        data!.status,
        requester.name,
        requester.role
      );

      return withCors(
        NextResponse.json({
          success: true,
          message: `Admin access status updated to "${data!.status}"`,
          data: updated,
        }),
        req
      );
    } catch (error) {
      return withCors(handleApiError(error, 'Failed to update admin status'), req);
    }
  }

  // DELETE /api/admin/users/[id]
  async deleteAdmin(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const token = getAdminToken(req);
      if (!token) {
        return withCors(
          NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
          req
        );
      }

      const requester = this.service.verifyToken(token);
      const deleted = await this.service.deleteAdmin(id, requester.id, requester.role);

      return withCors(
        NextResponse.json({
          success: true,
          message: 'Admin account removed successfully',
          data: { id: deleted?._id },
        }),
        req
      );
    } catch (error) {
      return withCors(handleApiError(error, 'Failed to delete admin account'), req);
    }
  }

  // GET /api/admin/auth/setup-status (Check whether the next registered user is Super Admin)
  async getSetupStatus(req: NextRequest): Promise<NextResponse> {
    try {
      const status = await this.service.getSetupStatus();
      return withCors(
        NextResponse.json({
          success: true,
          data: status,
        }),
        req
      );
    } catch (error) {
      return withCors(handleApiError(error, 'Failed to retrieve setup status'), req);
    }
  }
}

export const authController = new AuthController();
export default authController;
