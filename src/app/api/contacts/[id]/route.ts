import { NextRequest } from 'next/server';
import { contactController } from '@/controllers/contact.controller';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(req: NextRequest) {
  return contactController.options(req);
}

// GET /api/contacts/[id] - Single inquiry
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return contactController.getContactById(req, id);
}

// PATCH /api/contacts/[id] - Update inquiry status or admin notes
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return contactController.updateStatus(req, id);
}

// DELETE /api/contacts/[id] - Delete inquiry
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return contactController.deleteContact(req, id);
}
