import { NextResponse } from 'next/server';
import { TavusSessionCoordinator } from './coordinator';

export const runtime = 'nodejs';

function isKeyConfigured(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return false;
  if (trimmed.startsWith('your_') || trimmed === 'test-key') return false;
  return true;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text().catch(() => '');
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }

    const tavusApiKey = process.env.TAVUS_API_KEY?.trim().replace(/^["']|["']$/g, '');
    const tavusFaceId = (process.env.TAVUS_FACE_ID || "r3f427f43c9d").trim().replace(/^["']|["']$/g, '');

    // Beacon / termination handler from tab close
    if (body.action === 'end' || (body.conversationId && !body.scenarioId)) {
      if (body.conversationId && isKeyConfigured(tavusApiKey)) {
        console.log('[Tavus] Immediate tab close termination:', body.conversationId);
        TavusSessionCoordinator.clearActiveSession(body.conversationId);
        await fetch(`https://tavusapi.com/v2/conversations/${body.conversationId}/end`, {
          method: 'POST',
          headers: { 'x-api-key': tavusApiKey! }
        }).catch(() => {});
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!isKeyConfigured(tavusApiKey)) {
      return NextResponse.json(
        { error: { message: 'TAVUS_API_KEY is not configured in environment.' } },
        { status: 503 }
      );
    }

    // Use provided scenarioId or generate a unique per-entry identifier
    const scenarioId = (typeof body.scenarioId === 'string' && body.scenarioId.trim())
      ? body.scenarioId.trim()
      : `scenario-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // (B) If a creation request is already in-flight (e.g. Strict Mode double-invoke or rapid click), await it
    const inFlight = TavusSessionCoordinator.getInFlightPromise();
    if (inFlight) {
      console.log(`[Tavus] Awaiting existing in-flight session creation for scenario: ${scenarioId}`);
      try {
        const result = await inFlight;
        return NextResponse.json({
          provider: 'tavus',
          conversation_id: result.conversationId,
          conversation_url: result.conversationUrl,
          deduplicated: true,
        }, { status: 200 });
      } catch (err: any) {
        return NextResponse.json(
          { error: { message: err?.message || 'Failed to create Tavus conversation' } },
          { status: 500 }
        );
      }
    }

    // (C) If a termination is currently ongoing, wait for it before attempting to create
    const ongoingTermination = TavusSessionCoordinator.getTerminationPromise();
    if (ongoingTermination) {
      console.log('[Tavus] Waiting for ongoing termination to settle before creation...');
      await ongoingTermination.catch(() => {});
    }

    // (D) Single-flight lock around Tavus creation
    const partnerName = body.partnerName || "Sophia";
    const partnerRole = body.partnerRole || "conversational practice partner";
    const userGoal = body.userGoal || "Practice difficult and meaningful conversations safely.";
    const initialDialogue = body.initialDialogue || "Hey! I'm here to practice with you. What would you like to say?";

    const conversationalContext = `You are ${partnerName}, a ${partnerRole}. You are a realistic, emotionally intelligent conversational partner roleplaying with the user in Say It First, a communication practice app.
The user's goal in this practice scenario: "${userGoal}".
Stay in character, respond naturally, empathetically, and constructively. Keep your replies concise, spoken-length (1-3 sentences), and supportive.`;

    const createPayload = {
      face_id: tavusFaceId,
      conversation_name: `SayItFirst Practice - ${partnerName}`,
      conversational_context: conversationalContext,
      custom_greeting: initialDialogue,
      properties: {
        max_call_duration: 1800,
        participant_left_timeout: 10,
        participant_absent_timeout: 60,
        enable_closed_captions: true,
      }
    };

    const executeCreate = async () => {
      const sendCreate = async () => {
        return fetch('https://tavusapi.com/v2/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': tavusApiKey!,
          },
          body: JSON.stringify(createPayload)
        });
      };

      let tavusRes = await sendCreate();

      // If concurrency limit is reached, auto-end lingering active conversations and retry
      if (!tavusRes.ok && tavusRes.status === 400) {
        const errJson = await tavusRes.clone().json().catch(() => ({}));
        if (errJson.message?.includes('maximum concurrent conversations')) {
          console.warn('[Tavus] Concurrency limit hit. Cleaning up lingering active sessions...');
          try {
            const listRes = await fetch('https://tavusapi.com/v2/conversations', {
              headers: { 'x-api-key': tavusApiKey! }
            });
            if (listRes.ok) {
              const listData = await listRes.json();
              const activeSessions = (listData.data || []).filter(
                (c: any) => c.status === 'active' || c.status === 'created'
              );
              await Promise.all(
                activeSessions.map((c: any) =>
                  fetch(`https://tavusapi.com/v2/conversations/${c.conversation_id}/end`, {
                    method: 'POST',
                    headers: { 'x-api-key': tavusApiKey! }
                  }).catch(() => {})
                )
              );
              // Serialized wait for webhook / session termination to register
              await new Promise((resolve) => setTimeout(resolve, 1500));
              tavusRes = await sendCreate();
            }
          } catch (cleanErr) {
            console.warn('[Tavus] Cleanup of lingering sessions failed:', cleanErr);
          }
        }
      }

      if (!tavusRes.ok) {
        const errData = await tavusRes.json().catch(() => ({}));
        console.error('[Tavus] Conversation creation failed:', tavusRes.status, errData);
        throw new Error(errData.message || errData.error || 'Failed to create Tavus conversation');
      }

      const tavusData = await tavusRes.json();
      console.log('[Tavus] Conversation created successfully:', tavusData.conversation_id);
      TavusSessionCoordinator.setActiveSession(tavusData.conversation_id, tavusData.conversation_url, scenarioId);

      return {
        conversationId: tavusData.conversation_id,
        conversationUrl: tavusData.conversation_url,
      };
    };

    const creationPromise = executeCreate();
    TavusSessionCoordinator.setInFlightPromise(creationPromise);

    try {
      const created = await creationPromise;
      return NextResponse.json({
        provider: 'tavus',
        conversation_id: created.conversationId,
        conversation_url: created.conversationUrl,
      }, { status: 200 });
    } catch (err: any) {
      return NextResponse.json(
        { error: { message: err?.message || 'Failed to create Tavus conversation' } },
        { status: 400 }
      );
    } finally {
      TavusSessionCoordinator.setInFlightPromise(null);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[AvatarSession] Unexpected error:', err);
    return NextResponse.json(
      { error: { message: `Avatar session negotiation encountered an error: ${message}` } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    let conversationId: string | undefined;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      conversationId = body.conversationId;
    } else {
      const text = await request.text().catch(() => '');
      try {
        const parsed = JSON.parse(text);
        conversationId = parsed.conversationId;
      } catch {
        conversationId = text.trim();
      }
    }

    const tavusApiKey = process.env.TAVUS_API_KEY?.trim().replace(/^["']|["']$/g, '');

    if (!conversationId || !isKeyConfigured(tavusApiKey)) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    console.log('[Tavus] Ending conversation:', conversationId);
    TavusSessionCoordinator.clearActiveSession(conversationId);

    const termPromise = (async () => {
      try {
        await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
          method: 'POST',
          headers: {
            'x-api-key': tavusApiKey!,
          }
        });
        // Brief settling period for Tavus server to record termination state
        await new Promise((r) => setTimeout(r, 1200));
      } catch (e) {
        console.warn('[Tavus] Failed to end conversation:', e);
      }
    })();

    TavusSessionCoordinator.setTerminationPromise(termPromise);
    await termPromise;
    TavusSessionCoordinator.setTerminationPromise(null);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.warn('[Tavus] Error ending conversation:', err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
