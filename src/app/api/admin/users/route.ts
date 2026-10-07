import { NextRequest } from 'next/server';
import { authController } from '@/controllers/auth.controller';

export async function OPTIONS(req: NextRequest) {
  return authController.options(req);
}

// GET /api/admin/users - Super Admin lists all admins and pending requests
export async function GET(req: NextRequest) {
  return authController.getAdmins(req);
}
