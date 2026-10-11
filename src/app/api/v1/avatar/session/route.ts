import { NextResponse } from 'next/server';

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
    const body = await request.json().catch(() => ({}));
    const tavusApiKey = process.env.TAVUS_API_KEY?.trim().replace(/^["']|["']$/g, '');
    const tavusFaceId = (process.env.TAVUS_FACE_ID || "r3f427f43c9d").trim().replace(/^["']|["']$/g, '');

    // -------------------------------------------------------------
    // 1. Tavus CVI Integration Path
    // -------------------------------------------------------------
    if (isKeyConfigured(tavusApiKey)) {
      const partnerName = body.partnerName || "Sophia";
      const partnerRole = body.partnerRole || "conversational practice partner";
      const userGoal = body.userGoal || "Practice difficult and meaningful conversations safely.";
      const initialDialogue = body.initialDialogue || "Hey! I'm here to practice with you. What would you like to say?";

      const conversationalContext = `You are ${partnerName}, a ${partnerRole}. You are a realistic, emotionally intelligent conversational partner roleplaying with the user in Say It First, a communication practice app.
The user's goal in this practice scenario: "${userGoal}".
Stay in character, respond naturally, empathetically, and constructively. Keep your replies concise, spoken-length (1-3 sentences), and supportive.`;

      const tavusRes = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey!,
        },
        body: JSON.stringify({
          face_id: tavusFaceId,
          conversation_name: `SayItFirst Practice - ${partnerName}`,
          conversational_context: conversationalContext,
          custom_greeting: initialDialogue,
          properties: {
            max_call_duration: 1800,
            participant_left_timeout: 30,
            participant_absent_timeout: 120,
            enable_closed_captions: true,
          }
        })
      });

      if (!tavusRes.ok) {
        const errData = await tavusRes.json().catch(() => ({}));
        console.error('[Tavus] Conversation creation failed:', tavusRes.status, errData);
        return NextResponse.json(
          { error: { message: errData.message || errData.error || 'Failed to create Tavus conversation' } },
          { status: tavusRes.status }
        );
      }

      const tavusData = await tavusRes.json();
      console.log('[Tavus] Conversation created successfully:', tavusData.conversation_id);

      return NextResponse.json({
        provider: 'tavus',
        conversation_id: tavusData.conversation_id,
        conversation_url: tavusData.conversation_url,
      }, { status: 200 });
    }

    // -------------------------------------------------------------
    // 2. HeyGen LiveAvatar LITE Fallback Path
    // -------------------------------------------------------------
    const heygenApiKey = process.env.HEYGEN_API_KEY;
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenlabsAgentId = process.env.ELEVENLABS_AGENT_ID;
    
    const DEFAULT_AVATAR_ID = "a96238c3-21e9-4eca-b4ca-3e411e4e5b6d";
    const rawAvatarId = process.env.HEYGEN_AVATAR_ID?.trim().replace(/^["']|["']$/g, '');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    let avatarId = DEFAULT_AVATAR_ID;
    if (rawAvatarId && uuidRegex.test(rawAvatarId)) {
      avatarId = rawAvatarId;
    }

    if (!isKeyConfigured(heygenApiKey)) {
      return NextResponse.json(
        { error: { message: 'Neither TAVUS_API_KEY nor HEYGEN_API_KEY is configured in environment.' } },
        { status: 503 }
      );
    }
    
    if (!isKeyConfigured(elevenlabsApiKey) || !isKeyConfigured(elevenlabsAgentId)) {
      return NextResponse.json(
        { error: { message: 'ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID is missing or invalid in environment.' } },
        { status: 503 }
      );
    }

    const cleanedHeygenKey = heygenApiKey!.trim().replace(/^["']|["']$/g, '');
    const cleanedElevenLabsKey = elevenlabsApiKey!.trim().replace(/^["']|["']$/g, '');

    const secretRes = await fetch('https://api.liveavatar.com/v1/secrets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': cleanedHeygenKey,
      },
      body: JSON.stringify({
        secret_type: 'ELEVENLABS_API_KEY',
        secret_name: `elevenlabs-key-${Date.now()}`,
        secret_value: cleanedElevenLabsKey
      })
    });

    if (!secretRes.ok) {
      const errText = await secretRes.text().catch(() => 'Unknown secret registration error');
      console.error('[LiveAvatar] Secret registration failed:', secretRes.status, errText);
      return NextResponse.json(
        { error: { message: `Failed to create secret: ${errText}` } },
        { status: secretRes.status }
      );
    }

    const secretData = await secretRes.json().catch(() => ({}));
    const secretId = secretData.secret_id || secretData.data?.secret_id || secretData.data?.id || secretData.id;

    if (!secretId) {
      return NextResponse.json(
        { error: { message: 'Failed to obtain secret_id from LiveAvatar.' } },
        { status: 500 }
      );
    }

    const tokenRes = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': cleanedHeygenKey,
      },
      body: JSON.stringify({
        mode: 'LITE',
        avatar_id: avatarId,
        elevenlabs_agent_config: {
          secret_id: secretId,
          agent_id: elevenlabsAgentId,
        }
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => 'Unknown session token creation error');
      console.error('[LiveAvatar] Session token creation failed:', tokenRes.status, errText);
      return NextResponse.json(
        { error: { message: `Failed to create session token: ${errText}` } },
        { status: tokenRes.status }
      );
    }

    const tokenData = await tokenRes.json().catch(() => ({}));
    const sessionToken = tokenData.session_token || tokenData.data?.session_token;

    if (!sessionToken) {
      return NextResponse.json(
        { error: { message: 'Failed to obtain session_token from LiveAvatar.' } },
        { status: 500 }
      );
    }

    const startRes = await fetch('https://api.liveavatar.com/v1/sessions/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (!startRes.ok) {
      const errText = await startRes.text().catch(() => 'Unknown session start error');
      console.error('[LiveAvatar] Session start failed:', startRes.status, errText);
      return NextResponse.json(
        { error: { message: `Failed to start session: ${errText}` } },
        { status: startRes.status }
      );
    }

    const startData = await startRes.json().catch(() => ({}));
    const livekitUrl = startData.livekit_url || startData.data?.livekit_url;
    const livekitToken = startData.livekit_client_token || startData.data?.livekit_client_token || sessionToken;

    return NextResponse.json({
      provider: 'liveavatar',
      session_token: livekitToken,
      ws_url: livekitUrl,
      raw: startData
    }, { status: 200 });

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
    const { conversationId } = await request.json().catch(() => ({}));
    const tavusApiKey = process.env.TAVUS_API_KEY?.trim().replace(/^["']|["']$/g, '');

    if (!conversationId || !isKeyConfigured(tavusApiKey)) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    console.log('[Tavus] Ending conversation:', conversationId);
    await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
      method: 'POST',
      headers: {
        'x-api-key': tavusApiKey!,
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.warn('[Tavus] Error ending conversation:', err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
