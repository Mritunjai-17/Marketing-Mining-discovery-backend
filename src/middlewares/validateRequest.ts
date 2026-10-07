import { NextRequest, NextResponse } from 'next/server';

export async function validateRequestBody<T = Record<string, unknown>>(
  req: NextRequest,
  requiredFields: string[] = []
): Promise<{ data: T | null; errorResponse: NextResponse | null }> {
  try {
    const data = (await req.json()) as T;

    for (const field of requiredFields) {
      if ((data as Record<string, unknown>)[field] === undefined || (data as Record<string, unknown>)[field] === null) {
        return {
          data: null,
          errorResponse: NextResponse.json(
            {
              success: false,
              message: `Validation Error: Missing required field "${field}"`,
            },
            { status: 400 }
          ),
        };
      }
    }

    return { data, errorResponse: null };
  } catch {
    return {
      data: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON request payload',
        },
        { status: 400 }
      ),
    };
  }
}
