import { NextRequest } from 'next/server';
import { contactController } from '@/controllers/contact.controller';

export async function OPTIONS(req: NextRequest) {
  return contactController.options(req);
}

// POST /api/contacts - Public form submission
export async function POST(req: NextRequest) {
  return contactController.submitContact(req);
}

// GET /api/contacts - Inquiries list (pagination, filter, search)
export async function GET(req: NextRequest) {
  return contactController.getContacts(req);
}
