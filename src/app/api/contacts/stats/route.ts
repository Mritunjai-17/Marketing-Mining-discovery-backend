import { NextRequest } from 'next/server';
import { contactController } from '@/controllers/contact.controller';

export async function OPTIONS(req: NextRequest) {
  return contactController.options(req);
}

// GET /api/contacts/stats - Summary KPIs for Admin dashboard
export async function GET(req: NextRequest) {
  return contactController.getStats(req);
}
