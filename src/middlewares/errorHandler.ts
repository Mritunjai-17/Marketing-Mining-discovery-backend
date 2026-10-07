import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string | Record<string, unknown>;
  statusCode: number;
}

export function handleApiError(error: unknown, customMessage?: string): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);

  const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
  const statusCode = (error as { statusCode?: number })?.statusCode || 500;

  return NextResponse.json(
    {
      success: false,
      message: customMessage || errorMessage,
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      statusCode,
    },
    { status: statusCode }
  );
}
