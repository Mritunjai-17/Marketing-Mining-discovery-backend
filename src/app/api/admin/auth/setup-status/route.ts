import { NextRequest } from 'next/server';
import { authController } from '@/controllers/auth.controller';

export async function GET(req: NextRequest) {
  return authController.getSetupStatus(req);
}

export async function OPTIONS(req: NextRequest) {
  return authController.options(req);
}
