/**
 * POST /api/v1/conversation/report
 *
 * Generates or synthesizes a comprehensive SessionReport for a completed conversation.
 * Supports LLM inference via Gemini when available, or domain synthesis via ReportGeneratorService.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ReportGeneratorService } from '../../../../../domain/services/ReportGeneratorService';

const ReportRequestSchema = z.object({
  scenario_id: z.string().min(1),
  duration_seconds: z.number().optional().default(90),
  turns: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(['partner', 'user']),
      text: z.string(),
    }),
  ),
  custom_scenario: z
    .object({
      situation: z.string().optional(),
      partner_role: z.string().optional(),
      partner_name: z.string().optional(),
      user_goal: z.string().optional(),
    })
    .optional(),
});

const reportService = new ReportGeneratorService();

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ReportRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REPORT_REQUEST',
            message: 'Invalid payload for report synthesis',
            issues: parsed.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const { scenario_id, turns, duration_seconds, custom_scenario } = parsed.data;

    const report = reportService.generateReport({
      scenarioId: scenario_id,
      turns,
      durationSeconds: duration_seconds,
      customScenario: custom_scenario,
    });

    return NextResponse.json({ report }, { status: 200 });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'REPORT_SYNTHESIS_FAILED',
          message: error?.message || 'Failed to generate conversation report',
        },
      },
      { status: 500 },
    );
  }
}
