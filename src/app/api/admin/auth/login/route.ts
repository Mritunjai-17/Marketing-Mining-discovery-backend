import { NextRequest } from 'next/server';
import { authController } from '@/controllers/auth.controller';

export async function OPTIONS(req: NextRequest) {
  return authController.options(req);
}

export async function POST(req: NextRequest) {
  return authController.login(req);
}
