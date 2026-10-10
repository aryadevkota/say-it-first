/**
 * Next.js 14 App Router Route Handler: POST /api/v1/conversation/turn
 */

import { NextResponse } from 'next/server';
import { handleTurnRequest } from '../../../../../presentation/api/routes/conversation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await handleTurnRequest(body);
    return NextResponse.json(result.data, { status: result.status });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'MALFORMED_JSON_BODY',
          message: 'Unable to parse incoming JSON payload.',
        },
      },
      { status: 400 },
    );
  }
}
