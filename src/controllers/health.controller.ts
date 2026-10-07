import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { handleApiError } from '@/middlewares/errorHandler';
import { withCors, handleCorsPreflight } from '@/middlewares/cors.middleware';

export class HealthController {
  options(req: NextRequest): NextResponse {
    return handleCorsPreflight(req);
  }

  async checkHealth(req?: NextRequest) {
    try {
      await connectDB();
      const response = NextResponse.json({
        success: true,
        status: 'UP',
        message: 'Mining Discovery CMS Backend is healthy & connected to MongoDB',
        timestamp: new Date().toISOString(),
      });
      return withCors(response, req);
    } catch (error) {
      const errRes = handleApiError(error, 'Database health check failed');
      return withCors(errRes, req);
    }
  }
}

export const healthController = new HealthController();
export default healthController;
