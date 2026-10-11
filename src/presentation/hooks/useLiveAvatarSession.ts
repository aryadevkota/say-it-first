import { useState, useRef, useEffect, useCallback } from 'react';
import { Room, RoomEvent, DataPacket_Kind } from 'livekit-client';

export interface UseLiveAvatarSessionOptions {
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onTranscription?: (role: 'user' | 'agent', text: string) => void;
  onStateChange?: (state: 'idle' | 'connecting' | 'connected' | 'error') => void;
  mediaRefs?: {
    video: React.RefObject<HTMLVideoElement | null>;
    audio: React.RefObject<HTMLAudioElement | null>;
  };
}

export function useLiveAvatarSession(options: UseLiveAvatarSessionOptions = {}) {
  const { onPlaybackStateChange, onTranscription, onStateChange, mediaRefs } = options;

  const callbacksRef = useRef({ onPlaybackStateChange, onTranscription, onStateChange, mediaRefs });
  callbacksRef.current = { onPlaybackStateChange, onTranscription, onStateChange, mediaRefs };

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);

  const updateStatus = (status: 'idle' | 'connecting' | 'connected' | 'error') => {
    setSessionStatus(status);
    callbacksRef.current.onStateChange?.(status);
  };

  const connect = useCallback(async (token: string, url: string) => {
    try {
      updateStatus('connecting');
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        const currentMediaRefs = callbacksRef.current.mediaRefs;
        if (track.kind === 'video' && currentMediaRefs?.video?.current) {
          track.attach(currentMediaRefs.video.current);
        }
        if (track.kind === 'audio' && currentMediaRefs?.audio?.current) {
          track.attach(currentMediaRefs.audio.current);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        track.detach();
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant: any, kind?: DataPacket_Kind, topic?: string) => {
        if (topic === 'agent-response') {
          try {
            const parsed = JSON.parse(new TextDecoder().decode(payload));
            if (parsed.event_type === 'elevenlabs_agent_event') {
              const type = parsed.elevenlabs_event_type;
              const data = parsed.data || {};
              if (type === 'agent_response') {
                callbacksRef.current.onTranscription?.('agent', data.agent_response_event?.agent_response || data.text || '');
              } else if (type === 'user_transcript') {
                callbacksRef.current.onTranscription?.('user', data.user_transcription_event?.user_transcript || data.text || '');
              }
            } else if (parsed.event_type === 'avatar.speak_started') {
              setIsPlaying(true);
              callbacksRef.current.onPlaybackStateChange?.(true);
            } else if (parsed.event_type === 'avatar.speak_ended') {
              setIsPlaying(false);
              callbacksRef.current.onPlaybackStateChange?.(false);
            }
          } catch (err) {
            console.error('Error parsing data channel message', err);
          }
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        updateStatus('idle');
      });

      await room.connect(url, token);
      updateStatus('connected');
    } catch (err) {
      console.error('Failed to connect to LiveKit room', err);
      updateStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    updateStatus('idle');
  }, []);

  const sendText = useCallback((text: string) => {
    if (roomRef.current && sessionStatus === 'connected') {
      const payload = JSON.stringify({
        event_type: 'elevenlabs_agent_command',
        elevenlabs_event_type: 'user_message',
        data: { text }
      });
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(payload),
        { reliable: true, topic: 'agent-control' }
      );
    }
  }, [sessionStatus]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (roomRef.current) {
         // handle muting
      }
      return next;
    });
  }, []);

  return {
    isPlaying,
    sessionStatus,
    isMuted,
    voiceNotice,
    connect,
    disconnect,
    sendText,
    toggleMute,
  };
}
