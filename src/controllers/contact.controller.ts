import { NextRequest, NextResponse } from 'next/server';
import { contactService, ContactService } from '@/services/contact.service';
import { handleApiError } from '@/middlewares/errorHandler';
import { validateRequestBody } from '@/middlewares/validateRequest';
import { withCors, handleCorsPreflight } from '@/middlewares/cors.middleware';
import { checkRateLimit } from '@/middlewares/rateLimiter';
import { ContactStatus } from '@/models/contact.model';

export class ContactController {
  private service: ContactService;

  constructor(service: ContactService = contactService) {
    this.service = service;
  }

  // Preflight handler
  options(req: NextRequest): NextResponse {
    return handleCorsPreflight(req);
  }

  // POST /api/contacts (Public form submission)
  async submitContact(req: NextRequest): Promise<NextResponse> {
    try {
      // 1. Rate limiting check (e.g. max 5 submissions per minute per IP)
      const rateLimit = checkRateLimit(req, 5, 60 * 1000);
      if (!rateLimit.allowed) {
        return withCors(rateLimit.response!, req);
      }

      // 2. Validate request payload
      const { data, errorResponse } = await validateRequestBody<{
        name: string;
        email: string;
        phone?: string;
        message: string;
      }>(req, ['name', 'email', 'message']);

      if (errorResponse) {
        return withCors(errorResponse, req);
      }

      // 3. Extract metadata
      const forwardedFor = req.headers.get('x-forwarded-for');
      const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '';
      const userAgent = req.headers.get('user-agent') || '';

      // 4. Delegate to Service layer
      const created = await this.service.submitContact({
        name: data!.name,
        email: data!.email,
        phone: data!.phone,
        message: data!.message,
        ipAddress,
        userAgent,
      });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Thank you! Your message has been received. Our team will contact you shortly.',
          data: {
            id: created._id,
            name: created.name,
            email: created.email,
            status: created.status,
            createdAt: created.createdAt,
          },
        },
        { status: 201 }
      );

      return withCors(response, req);
    } catch (error) {
      const errorRes = handleApiError(error, error instanceof Error ? error.message : 'Submission failed');
      return withCors(errorRes, req);
    }
  }

  // GET /api/contacts (Admin list with pagination & search)
  async getContacts(req: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const status = (searchParams.get('status') || 'all') as ContactStatus | 'all';
      const search = searchParams.get('search') || '';

      const result = await this.service.getContacts({ page, limit, status, search });

      const response = NextResponse.json({
        success: true,
        ...result,
      });

      return withCors(response, req);
    } catch (error) {
      const errorRes = handleApiError(error, 'Failed to fetch contact inquiries');
      return withCors(errorRes, req);
    }
  }

  // GET /api/contacts/[id]
  async getContactById(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const contact = await this.service.getContactById(id);
      const response = NextResponse.json({
        success: true,
        data: contact,
      });
      return withCors(response, req);
    } catch (error) {
      const errorRes = handleApiError(error, 'Inquiry not found');
      return withCors(errorRes, req);
    }
  }

  // PATCH /api/contacts/[id] (Update status or admin notes)
  async updateStatus(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const { data, errorResponse } = await validateRequestBody<{
        status?: ContactStatus;
        adminNotes?: string;
      }>(req);

      if (errorResponse) {
        return withCors(errorResponse, req);
      }

      if (!data?.status && data?.adminNotes === undefined) {
        const badReq = NextResponse.json(
          { success: false, message: 'Please provide status or adminNotes to update' },
          { status: 400 }
        );
        return withCors(badReq, req);
      }

      const updated = await this.service.updateStatus(id, data.status as ContactStatus, data.adminNotes);

      const response = NextResponse.json({
        success: true,
        message: 'Inquiry updated successfully',
        data: updated,
      });

      return withCors(response, req);
    } catch (error) {
      const errorRes = handleApiError(error, 'Failed to update inquiry');
      return withCors(errorRes, req);
    }
  }

  // DELETE /api/contacts/[id]
  async deleteContact(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const deleted = await this.service.deleteContact(id);
      const response = NextResponse.json({
        success: true,
        message: 'Inquiry deleted successfully',
        data: { id: deleted._id },
      });
      return withCors(response, req);
    } catch (error) {
      const errorRes = handleApiError(error, 'Failed to delete inquiry');
      return withCors(errorRes, req);
    }
  }

  // GET /api/contacts/stats
  async getStats(req: NextRequest): Promise<NextResponse> {
    try {
      const stats = await this.service.getStats();
      const response = NextResponse.json({
        success: true,
        data: stats,
      });
      return withCors(response, req);
    } catch (error) {
      const errorRes = handleApiError(error, 'Failed to fetch inquiry statistics');
      return withCors(errorRes, req);
    }
  }
}

export const contactController = new ContactController();
export default contactController;
