import { NextRequest } from 'next/server';
import { authController } from '@/controllers/auth.controller';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(req: NextRequest) {
  return authController.options(req);
}

// PATCH /api/admin/users/[id] - Super Admin approves or rejects admin
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return authController.updateAdminStatus(req, id);
}

// DELETE /api/admin/users/[id] - Super Admin deletes admin
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return authController.deleteAdmin(req, id);
}
