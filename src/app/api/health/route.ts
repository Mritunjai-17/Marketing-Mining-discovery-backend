import { NextRequest } from 'next/server';
import { healthController } from '@/controllers/health.controller';

export async function OPTIONS(req: NextRequest) {
  return healthController.options(req);
}

export async function GET(req: NextRequest) {
  return healthController.checkHealth(req);
}
