'use client';

/**
 * Avatar3DRig.tsx — 3D Expressive Conversational Partner
 *
 * Implements a warm, dimensional Three.js conversational character partner:
 * - Friendly, stylized proportions (adult, approachable, rounded, soft matte PBR materials)
 * - Articulated facial features: expressive eyes with periodic blinking, adjustable eyebrows, speaking mouth
 * - Upper torso with natural breathing posture, listening head tilt, thinking gaze, and receptive gestures
 * - Dynamic states: neutral, listening, thinking, speaking, receptive, defensive
 * - Full accessibility: reduced-motion support, WebGL fallback, toggleable "Hide 3D partner" text-only view
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type AvatarState = 'neutral' | 'listening' | 'thinking' | 'speaking' | 'receptive' | 'defensive';

export interface Avatar3DRigProps {
  state?: AvatarState;
  partnerVariant?: 'alex' | 'maya' | 'jordan' | 'sam';
  partnerName?: string;
  partnerRole?: string;
  isHidden?: boolean;
  onToggleHidden?: () => void;
  className?: string;
}

export const Avatar3DRig: React.FC<Avatar3DRigProps> = ({
  state = 'neutral',
  partnerVariant = 'alex',
  partnerName = 'Alex',
  partnerRole = 'Conversation Partner',
  isHidden = false,
  onToggleHidden,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // References for live animation interpolation
  const animationStateRef = useRef<{
    state: AvatarState;
    headGroup: THREE.Group | null;
    mouthMesh: THREE.Mesh | null;
    leftEyeMesh: THREE.Mesh | null;
    rightEyeMesh: THREE.Mesh | null;
    leftBrowMesh: THREE.Mesh | null;
    rightBrowMesh: THREE.Mesh | null;
    torsoGroup: THREE.Group | null;
    clock: THREE.Clock;
    lastBlinkTime: number;
    isBlinking: boolean;
    blinkDuration: number;
  }>({
    state,
    headGroup: null,
    mouthMesh: null,
    leftEyeMesh: null,
    rightEyeMesh: null,
    leftBrowMesh: null,
    rightBrowMesh: null,
    torsoGroup: null,
    clock: new THREE.Clock(),
    lastBlinkTime: 0,
    isBlinking: false,
    blinkDuration: 0.16,
  });

  // Keep state updated in animation ref
  useEffect(() => {
    animationStateRef.current.state = state;
  }, [state]);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Set up Three.js scene
  useEffect(() => {
    if (isHidden) return;
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 340;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 3.2);

    // Renderer with soft anti-aliasing
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch {
      setWebGlSupported(false);
      return;
    }

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7f0, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2.5, 3.5, 3.0);
    scene.add(keyLight);

    const softFillLight = new THREE.DirectionalLight(0xe2edf8, 0.7);
    softFillLight.position.set(-2.5, 1.0, 2.0);
    scene.add(softFillLight);

    const rimLight = new THREE.DirectionalLight(0xffdfcb, 0.5);
    rimLight.position.set(0, 3.0, -3.0);
    scene.add(rimLight);

    // Palette variants
    const variantThemes = {
      alex: {
        skin: 0xf5cbb7,
        hair: 0x3d271e,
        clothing: 0x1f5456,
        accent: 0xe0a96d,
      },
      maya: {
        skin: 0xdeb39a,
        hair: 0x221a1a,
        clothing: 0x5a4a75,
        accent: 0xe58b88,
      },
      jordan: {
        skin: 0x9c6d53,
        hair: 0x181414,
        clothing: 0x345946,
        accent: 0xd9b48f,
      },
      sam: {
        skin: 0xf7d4c1,
        hair: 0x8a5a36,
        clothing: 0xb5653b,
        accent: 0x487a5b,
      },
    };

    const theme = variantThemes[partnerVariant] || variantThemes.alex;

    // Soft Matte PBR Materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: theme.skin,
      roughness: 0.65,
      metalness: 0.05,
    });

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: theme.hair,
      roughness: 0.7,
      metalness: 0.1,
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x242426,
      roughness: 0.2,
      metalness: 0.2,
    });

    const eyeHighlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const browMaterial = new THREE.MeshStandardMaterial({
      color: theme.hair,
      roughness: 0.8,
    });

    const mouthMaterial = new THREE.MeshStandardMaterial({
      color: 0x9b4d4b,
      roughness: 0.5,
    });

    const clothingMaterial = new THREE.MeshStandardMaterial({
      color: theme.clothing,
      roughness: 0.8,
      metalness: 0.05,
    });

    // Character Rig Root Group
    const characterRoot = new THREE.Group();
    scene.add(characterRoot);

    // 1. Torso & Shoulders
    const torsoGroup = new THREE.Group();
    characterRoot.add(torsoGroup);

    // Rounded chest / sweater
    const torsoGeo = new THREE.CylinderGeometry(0.52, 0.62, 0.95, 32);
    const torsoMesh = new THREE.Mesh(torsoGeo, clothingMaterial);
    torsoMesh.position.y = -0.7;
    torsoGroup.add(torsoMesh);

    // Rounded shoulders
    const shoulderGeo = new THREE.CapsuleGeometry(0.28, 0.65, 8, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeo, clothingMaterial);
    leftShoulder.rotation.z = Math.PI / 2.7;
    leftShoulder.position.set(-0.46, -0.42, 0);
    torsoGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, clothingMaterial);
    rightShoulder.rotation.z = -Math.PI / 2.7;
    rightShoulder.position.set(0.46, -0.42, 0);
    torsoGroup.add(rightShoulder);

    // Collar / neckline
    const collarGeo = new THREE.TorusGeometry(0.26, 0.06, 16, 32);
    const collarMesh = new THREE.Mesh(collarGeo, clothingMaterial);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, -0.22, 0);
    torsoGroup.add(collarMesh);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.21, 0.32, 24);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, -0.1, 0);
    torsoGroup.add(neckMesh);

    // 2. Articulated Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.32, 0);
    characterRoot.add(headGroup);

    // Soft rounded head (Sphere slightly scaled for friendly stylized jaw)
    const headGeo = new THREE.SphereGeometry(0.46, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.scale.set(1.0, 1.08, 0.96);
    headGroup.add(headMesh);

    // Stylized Hair Cap
    const hairGeo = new THREE.SphereGeometry(0.49, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const hairMesh = new THREE.Mesh(hairGeo, hairMaterial);
    hairMesh.rotation.x = -0.15;
    hairMesh.position.set(0, 0.08, -0.02);
    headGroup.add(hairMesh);

    // Friendly hair volume front
    const hairFrontGeo = new THREE.CapsuleGeometry(0.14, 0.44, 8, 16);
    const hairFrontMesh = new THREE.Mesh(hairFrontGeo, hairMaterial);
    hairFrontMesh.rotation.z = Math.PI / 2.3;
    hairFrontMesh.position.set(0, 0.48, 0.22);
    headGroup.add(hairFrontMesh);

    // Friendly dimensional nose
    const noseGeo = new THREE.ConeGeometry(0.065, 0.12, 16);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.rotation.x = Math.PI / 2;
    noseMesh.position.set(0, -0.02, 0.46);
    headGroup.add(noseMesh);

    // Soft cheeks
    const cheekMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5988e,
      roughness: 0.9,
      transparent: true,
      opacity: 0.32,
    });
    const cheekGeo = new THREE.CircleGeometry(0.09, 16);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMaterial);
    leftCheek.position.set(-0.25, -0.08, 0.41);
    leftCheek.rotation.y = -0.35;
    headGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, cheekMaterial);
    rightCheek.position.set(0.25, -0.08, 0.41);
    rightCheek.rotation.y = 0.35;
    headGroup.add(rightCheek);

    // Expressive Eyes
    const eyeGeo = new THREE.SphereGeometry(0.065, 20, 20);
    const leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEyeMesh.position.set(-0.16, 0.08, 0.42);
    headGroup.add(leftEyeMesh);

    const rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEyeMesh.position.set(0.16, 0.08, 0.42);
    headGroup.add(rightEyeMesh);

    // Friendly Eye catchlights (highlights)
    const highlightGeo = new THREE.SphereGeometry(0.02, 12, 12);
    const leftHighlight = new THREE.Mesh(highlightGeo, eyeHighlightMaterial);
    leftHighlight.position.set(-0.145, 0.1, 0.47);
    headGroup.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeo, eyeHighlightMaterial);
    rightHighlight.position.set(0.175, 0.1, 0.47);
    headGroup.add(rightHighlight);

    // Expressive Eyebrows
    const browGeo = new THREE.CapsuleGeometry(0.026, 0.12, 6, 12);

    const leftBrowMesh = new THREE.Mesh(browGeo, browMaterial);
    leftBrowMesh.rotation.z = Math.PI / 2.15;
    leftBrowMesh.position.set(-0.16, 0.22, 0.43);
    headGroup.add(leftBrowMesh);

    const rightBrowMesh = new THREE.Mesh(browGeo, browMaterial);
    rightBrowMesh.rotation.z = -Math.PI / 2.15;
    rightBrowMesh.position.set(0.16, 0.22, 0.43);
    headGroup.add(rightBrowMesh);

    // Articulated Mouth
    const mouthGeo = new THREE.CapsuleGeometry(0.038, 0.15, 8, 16);
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMaterial);
    mouthMesh.rotation.z = Math.PI / 2;
    mouthMesh.position.set(0, -0.18, 0.43);
    headGroup.add(mouthMesh);

    // Store references in animation state
    animationStateRef.current.headGroup = headGroup;
    animationStateRef.current.mouthMesh = mouthMesh;
    animationStateRef.current.leftEyeMesh = leftEyeMesh;
    animationStateRef.current.rightEyeMesh = rightEyeMesh;
    animationStateRef.current.leftBrowMesh = leftBrowMesh;
    animationStateRef.current.rightBrowMesh = rightBrowMesh;
    animationStateRef.current.torsoGroup = torsoGroup;

    // Handle container resizing
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth && newHeight) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const anim = animationStateRef.current;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = anim.clock.getElapsedTime();

      if (!reducedMotion) {
        // Natural gentle breathing on torso and head
        const breathCycle = Math.sin(elapsedTime * 1.8) * 0.02;
        if (torsoGroup) {
          torsoGroup.position.y = breathCycle;
        }

        // Periodic natural blinking
        if (!anim.isBlinking && elapsedTime - anim.lastBlinkTime > 3.2 + Math.random() * 2) {
          anim.isBlinking = true;
          anim.lastBlinkTime = elapsedTime;
        }

        if (anim.isBlinking) {
          const blinkProgress = (elapsedTime - anim.lastBlinkTime) / anim.blinkDuration;
          if (blinkProgress >= 1) {
            anim.isBlinking = false;
            if (leftEyeMesh && rightEyeMesh) {
              leftEyeMesh.scale.y = 1;
              rightEyeMesh.scale.y = 1;
            }
          } else {
            const blinkScale = Math.sin(blinkProgress * Math.PI);
            const scaleY = Math.max(0.1, 1 - blinkScale * 0.9);
            if (leftEyeMesh && rightEyeMesh) {
              leftEyeMesh.scale.y = scaleY;
              rightEyeMesh.scale.y = scaleY;
            }
          }
        }

        // Expressive state behavior
        const currentState = anim.state;
        if (headGroup) {
          if (currentState === 'listening') {
            // Attentive slight head tilt (approx 3 degrees) and slow conversational nod
            const nod = Math.sin(elapsedTime * 2.2) * 0.035;
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.05, 0.08);
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, nod, 0.1);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.02, 0.08);
          } else if (currentState === 'thinking') {
            // Contemplative gaze drift slightly upward and to the side
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, -0.04, 0.06);
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -0.06, 0.06);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.08, 0.06);
          } else if (currentState === 'speaking') {
            // Natural conversational head accentuation
            const speechCadence = Math.sin(elapsedTime * 4.5) * 0.025;
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, speechCadence, 0.12);
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.0, 0.08);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.0, 0.08);
          } else if (currentState === 'receptive') {
            // Warm open posture, slight affirmative head posture
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.02, 0.08);
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.04, 0.08);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.0, 0.08);
          } else if (currentState === 'defensive') {
            // Guarded slight retraction, brow furrowed
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -0.04, 0.08);
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, -0.02, 0.08);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, -0.04, 0.08);
          } else {
            // Neutral calm posture
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.0, 0.08);
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.0, 0.08);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.0, 0.08);
          }
        }

        // Brow articulation by state
        if (leftBrowMesh && rightBrowMesh) {
          if (currentState === 'defensive') {
            // Brow furrow (tilt inward)
            leftBrowMesh.rotation.z = THREE.MathUtils.lerp(leftBrowMesh.rotation.z, Math.PI / 2.6, 0.1);
            rightBrowMesh.rotation.z = THREE.MathUtils.lerp(rightBrowMesh.rotation.z, -Math.PI / 2.6, 0.1);
            leftBrowMesh.position.y = THREE.MathUtils.lerp(leftBrowMesh.position.y, 0.20, 0.1);
            rightBrowMesh.position.y = THREE.MathUtils.lerp(rightBrowMesh.position.y, 0.20, 0.1);
          } else if (currentState === 'thinking' || currentState === 'listening') {
            // Inquisitive slight brow lift
            leftBrowMesh.rotation.z = THREE.MathUtils.lerp(leftBrowMesh.rotation.z, Math.PI / 2.05, 0.1);
            rightBrowMesh.rotation.z = THREE.MathUtils.lerp(rightBrowMesh.rotation.z, -Math.PI / 2.05, 0.1);
            leftBrowMesh.position.y = THREE.MathUtils.lerp(leftBrowMesh.position.y, 0.23, 0.1);
            rightBrowMesh.position.y = THREE.MathUtils.lerp(rightBrowMesh.position.y, 0.23, 0.1);
          } else {
            // Gentle resting brows
            leftBrowMesh.rotation.z = THREE.MathUtils.lerp(leftBrowMesh.rotation.z, Math.PI / 2.15, 0.1);
            rightBrowMesh.rotation.z = THREE.MathUtils.lerp(rightBrowMesh.rotation.z, -Math.PI / 2.15, 0.1);
            leftBrowMesh.position.y = THREE.MathUtils.lerp(leftBrowMesh.position.y, 0.22, 0.1);
            rightBrowMesh.position.y = THREE.MathUtils.lerp(rightBrowMesh.position.y, 0.22, 0.1);
          }
        }

        // Mouth articulation (speaking jaw movement)
        if (mouthMesh) {
          if (currentState === 'speaking') {
            const mouthCadence = 0.6 + Math.abs(Math.sin(elapsedTime * 9.0)) * 0.9;
            mouthMesh.scale.x = THREE.MathUtils.lerp(mouthMesh.scale.x, mouthCadence, 0.25);
            mouthMesh.scale.y = THREE.MathUtils.lerp(mouthMesh.scale.y, 0.7 + mouthCadence * 0.4, 0.25);
          } else if (currentState === 'receptive') {
            // Subtle pleasant smile curve
            mouthMesh.scale.x = THREE.MathUtils.lerp(mouthMesh.scale.x, 1.15, 0.1);
            mouthMesh.scale.y = THREE.MathUtils.lerp(mouthMesh.scale.y, 0.75, 0.1);
          } else {
            // Rest mouth
            mouthMesh.scale.x = THREE.MathUtils.lerp(mouthMesh.scale.x, 1.0, 0.1);
            mouthMesh.scale.y = THREE.MathUtils.lerp(mouthMesh.scale.y, 1.0, 0.1);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
      }
      scene.clear();
    };
  }, [isHidden, partnerVariant, reducedMotion]);

  // If user has chosen to hide the 3D partner for focus/text-only mode
  if (isHidden) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-canvas-subtle border border-canvas-border text-center ${className}`}
        role="region"
        aria-label="Conversation partner status (Text focus mode)"
      >
        <div className="w-14 h-14 rounded-full bg-teal-subtle text-teal-brand flex items-center justify-center font-semibold text-lg mb-3 shadow-sm">
          {partnerName.charAt(0)}
        </div>
        <p className="font-medium text-ink-primary text-base">{partnerName}</p>
        <p className="text-xs text-ink-muted mb-4">{partnerRole}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-canvas-surface border border-canvas-border text-ink-secondary mb-3">
          <span className="w-2 h-2 rounded-full bg-teal-brand animate-pulse" />
          <span>Status: {state}</span>
        </div>
        {onToggleHidden && (
          <button
            onClick={onToggleHidden}
            className="text-xs font-medium text-teal-brand hover:underline focus:outline-none focus:ring-2 focus:ring-teal-brand rounded"
          >
            Show 3D conversation partner
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-72 sm:h-80 md:h-88 flex items-center justify-center relative overflow-hidden rounded-2xl"
        role="img"
        aria-label={`3D avatar of ${partnerName}, currently ${state}`}
      >
        {!webGlSupported && (
          // Graceful fallback if WebGL is unavailable on machine
          <div className="flex flex-col items-center justify-center p-6 text-center bg-canvas-subtle rounded-2xl border border-canvas-border max-w-sm">
            <div className="w-16 h-16 rounded-full bg-teal-subtle text-teal-brand flex items-center justify-center font-bold text-xl mb-3">
              {partnerName.charAt(0)}
            </div>
            <p className="font-semibold text-ink-primary">{partnerName}</p>
            <p className="text-xs text-ink-muted mb-2">{partnerRole}</p>
            <span className="text-xs text-ink-secondary">
              (WebGL hardware acceleration disabled; continuing in accessible text mode)
            </span>
          </div>
        )}
      </div>

      {/* Subtle Partner Info & Toggle Bar */}
      <div className="w-full flex items-center justify-between px-2 pt-2 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-primary">{partnerName}</span>
          <span className="text-canvas-border">|</span>
          <span className="capitalize text-ink-secondary">{state}</span>
        </div>

        {onToggleHidden && (
          <button
            onClick={onToggleHidden}
            className="text-ink-muted hover:text-ink-primary transition-colors focus:outline-none focus:ring-1 focus:ring-teal-brand rounded px-1.5 py-0.5"
            title="Switch to minimal text-only view"
          >
            Hide avatar
          </button>
        )}
      </div>
    </div>
  );
};
