'use client';

/**
 * Avatar3DRig.tsx — Semi-Realistic Stylized 3D Avatar (Microsoft Teams Aesthetic)
 *
 * Implements a dimensional Three.js conversational character partner & user avatar:
 * - Semi-realistic stylized adult proportions (grounded head-to-torso ratio, natural posture)
 * - Matte PBR materials (roughness 0.84, no plastic gloss, warm skin tones)
 * - Almond-shaped eyes with iris, pupil, highlights, and lifelike micro-saccades (no lifeless stare)
 * - Articulated eyebrows and mouth with natural speaking jaw movement
 * - Audio-driven speech synchronization with clean rest closure
 * - Customizable attire (crewneck, cardigan, polo, blazer), hairstyles, colors, and eyewear
 * - Two-person stage support (mirroring for inward-facing conversational stance)
 * - Reduced motion & accessible text-only fallback mode
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  type AvatarCustomization,
  DEFAULT_USER_AVATAR,
  PARTNER_AVATAR_PRESETS,
  SKIN_TONE_PALETTE,
  HAIR_COLOR_PALETTE,
  CLOTHING_COLOR_PALETTE,
} from '../../domain/entities/AvatarCustomization';

export type AvatarState = 'neutral' | 'listening' | 'thinking' | 'speaking' | 'receptive' | 'defensive';

export interface Avatar3DRigProps {
  customization?: AvatarCustomization;
  state?: AvatarState;
  partnerVariant?: 'alex' | 'maya' | 'jordan' | 'sam';
  partnerName?: string;
  partnerRole?: string;
  isSpeakingAudio?: boolean;
  isHidden?: boolean;
  mirror?: boolean;
  onToggleHidden?: () => void;
  className?: string;
}

export const Avatar3DRig: React.FC<Avatar3DRigProps> = ({
  customization,
  state = 'neutral',
  partnerVariant = 'alex',
  partnerName = 'Alex',
  partnerRole = 'Conversation Partner',
  isSpeakingAudio = false,
  isHidden = false,
  mirror = false,
  onToggleHidden,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Derive active avatar configuration
  const activeConfig: AvatarCustomization =
    customization || PARTNER_AVATAR_PRESETS[partnerVariant] || DEFAULT_USER_AVATAR;

  // Animation state references
  const animRef = useRef<{
    state: AvatarState;
    isSpeakingAudio: boolean;
    headGroup: THREE.Group | null;
    mouthGroup: THREE.Group | null;
    leftEyeMesh: THREE.Mesh | null;
    rightEyeMesh: THREE.Mesh | null;
    leftIrisMesh: THREE.Mesh | null;
    rightIrisMesh: THREE.Mesh | null;
    leftBrowMesh: THREE.Mesh | null;
    rightBrowMesh: THREE.Mesh | null;
    torsoGroup: THREE.Group | null;
    clock: THREE.Clock;
    lastBlinkTime: number;
    isBlinking: boolean;
    blinkDuration: number;
    lastSaccadeTime: number;
    saccadeTarget: { x: number; y: number };
  }>({
    state,
    isSpeakingAudio,
    headGroup: null,
    mouthGroup: null,
    leftEyeMesh: null,
    rightEyeMesh: null,
    leftIrisMesh: null,
    rightIrisMesh: null,
    leftBrowMesh: null,
    rightBrowMesh: null,
    torsoGroup: null,
    clock: new THREE.Clock(),
    lastBlinkTime: 0,
    isBlinking: false,
    blinkDuration: 0.15,
    lastSaccadeTime: 0,
    saccadeTarget: { x: 0, y: 0 },
  });

  // Keep live references updated
  useEffect(() => {
    animRef.current.state = state;
    animRef.current.isSpeakingAudio = isSpeakingAudio;
  }, [state, isSpeakingAudio]);

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

  // Three.js Scene Construction
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

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 340;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 3.1);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch {
      setWebGlSupported(false);
      return;
    }

    // Studio Lighting (Warm 3-point portrait setup)
    const ambientLight = new THREE.AmbientLight(0xfff7f0, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(2.4, 3.2, 2.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe4edf5, 0.7);
    fillLight.position.set(-2.4, 1.2, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffdfd0, 0.55);
    rimLight.position.set(0, 3.2, -2.8);
    scene.add(rimLight);

    // Color definitions
    const skinColorHex = SKIN_TONE_PALETTE[activeConfig.skinTone]?.hex || 0xfce4d6;
    const hairColorHex = HAIR_COLOR_PALETTE[activeConfig.hairColor]?.hex || 0x2b1d16;
    const clothingColorHex = CLOTHING_COLOR_PALETTE[activeConfig.clothingColor]?.hex || 0x1c6e72;

    // Matte PBR Materials (Teams aesthetic: soft matte, no plastic gloss)
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: skinColorHex,
      roughness: 0.84,
      metalness: 0.0,
    });

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: hairColorHex,
      roughness: 0.78,
      metalness: 0.05,
    });

    const browMaterial = new THREE.MeshStandardMaterial({
      color: hairColorHex,
      roughness: 0.82,
    });

    const clothingMaterial = new THREE.MeshStandardMaterial({
      color: clothingColorHex,
      roughness: 0.88,
      metalness: 0.02,
    });

    const innerCollarMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf8f5,
      roughness: 0.9,
    });

    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb,
      roughness: 0.25,
      metalness: 0.05,
    });

    const irisMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d312a,
      roughness: 0.2,
      metalness: 0.1,
    });

    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: 0x111111,
    });

    const catchlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const lipMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa5b57,
      roughness: 0.6,
      metalness: 0.0,
    });

    const eyewearMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2c30,
      roughness: 0.3,
      metalness: 0.8,
    });

    // Character Root
    const characterRoot = new THREE.Group();
    if (mirror) {
      characterRoot.scale.x = -1; // Mirror for inward conversation stance
    }
    scene.add(characterRoot);

    // ── 1. Upper Torso & Attire ──────────────────────────────────────────────
    const torsoGroup = new THREE.Group();
    characterRoot.add(torsoGroup);

    // Chest & Shoulders (Natural adult proportions)
    const chestGeo = new THREE.CylinderGeometry(0.50, 0.58, 0.92, 32);
    const chestMesh = new THREE.Mesh(chestGeo, clothingMaterial);
    chestMesh.position.y = -0.72;
    torsoGroup.add(chestMesh);

    // Rounded shoulders
    const shoulderGeo = new THREE.CapsuleGeometry(0.24, 0.62, 8, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeo, clothingMaterial);
    leftShoulder.rotation.z = Math.PI / 2.65;
    leftShoulder.position.set(-0.44, -0.42, 0);
    torsoGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, clothingMaterial);
    rightShoulder.rotation.z = -Math.PI / 2.65;
    rightShoulder.position.set(0.44, -0.42, 0);
    torsoGroup.add(rightShoulder);

    // Clothing Details by Style
    if (activeConfig.clothingStyle === 'cardigan') {
      // V-neck opening with light shirt underneath
      const vNeckGeo = new THREE.ConeGeometry(0.22, 0.45, 16);
      const vNeckMesh = new THREE.Mesh(vNeckGeo, innerCollarMaterial);
      vNeckMesh.rotation.x = Math.PI;
      vNeckMesh.position.set(0, -0.32, 0.22);
      torsoGroup.add(vNeckMesh);
    } else if (activeConfig.clothingStyle === 'blazer') {
      // Lapel collar
      const lapelGeo = new THREE.BoxGeometry(0.12, 0.38, 0.04);
      const leftLapel = new THREE.Mesh(lapelGeo, clothingMaterial);
      leftLapel.position.set(-0.16, -0.32, 0.26);
      leftLapel.rotation.z = -0.22;
      torsoGroup.add(leftLapel);

      const rightLapel = new THREE.Mesh(lapelGeo, clothingMaterial);
      rightLapel.position.set(0.16, -0.32, 0.26);
      rightLapel.rotation.z = 0.22;
      torsoGroup.add(rightLapel);

      const shirtGeo = new THREE.BoxGeometry(0.18, 0.32, 0.03);
      const shirtMesh = new THREE.Mesh(shirtGeo, innerCollarMaterial);
      shirtMesh.position.set(0, -0.32, 0.23);
      torsoGroup.add(shirtMesh);
    } else {
      // Clean crewneck / polo collar
      const collarGeo = new THREE.TorusGeometry(0.24, 0.045, 16, 32);
      const collarMesh = new THREE.Mesh(collarGeo, clothingMaterial);
      collarMesh.rotation.x = Math.PI / 2;
      collarMesh.position.set(0, -0.22, 0);
      torsoGroup.add(collarMesh);
    }

    // Neck (Natural transition into jaw)
    const neckGeo = new THREE.CylinderGeometry(0.17, 0.19, 0.30, 24);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, -0.09, 0);
    torsoGroup.add(neckMesh);

    // ── 2. Head & Facial Structure ───────────────────────────────────────────
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.34, 0);
    characterRoot.add(headGroup);

    // Grounded oval head shape (tapered jaw for natural adult silhouette)
    const headGeo = new THREE.SphereGeometry(0.44, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.scale.set(0.96, 1.08, 0.94);
    headGroup.add(headMesh);

    // Defined chin curve
    const chinGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const chinMesh = new THREE.Mesh(chinGeo, skinMaterial);
    chinMesh.position.set(0, -0.30, 0.26);
    chinMesh.scale.set(1.0, 0.7, 0.85);
    headGroup.add(chinMesh);

    // Nose (Soft natural bridge and subtle tip)
    const noseBridgeGeo = new THREE.CapsuleGeometry(0.032, 0.12, 8, 12);
    const noseBridgeMesh = new THREE.Mesh(noseBridgeGeo, skinMaterial);
    noseBridgeMesh.position.set(0, 0.02, 0.44);
    headGroup.add(noseBridgeMesh);

    const noseTipGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const noseTipMesh = new THREE.Mesh(noseTipGeo, skinMaterial);
    noseTipMesh.position.set(0, -0.05, 0.46);
    headGroup.add(noseTipMesh);

    // ── 3. Expressive Almond Eyes & Saccades ──────────────────────────────────
    // Left Eye Group
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.155, 0.08, 0.41);
    headGroup.add(leftEyeGroup);

    const eyeWhiteGeo = new THREE.SphereGeometry(0.062, 20, 20);
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMaterial);
    leftEyeWhite.scale.set(1.08, 0.85, 0.9); // Almond shape
    leftEyeGroup.add(leftEyeWhite);

    const irisGeo = new THREE.CircleGeometry(0.034, 16);
    const leftIris = new THREE.Mesh(irisGeo, irisMaterial);
    leftIris.position.set(0, 0, 0.06);
    leftEyeGroup.add(leftIris);

    const pupilGeo = new THREE.CircleGeometry(0.016, 12);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    leftPupil.position.set(0, 0, 0.062);
    leftEyeGroup.add(leftPupil);

    const catchlightGeo = new THREE.CircleGeometry(0.008, 8);
    const leftCatchlight = new THREE.Mesh(catchlightGeo, catchlightMaterial);
    leftCatchlight.position.set(0.012, 0.012, 0.064);
    leftEyeGroup.add(leftCatchlight);

    // Right Eye Group
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.155, 0.08, 0.41);
    headGroup.add(rightEyeGroup);

    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMaterial);
    rightEyeWhite.scale.set(1.08, 0.85, 0.9); // Almond shape
    rightEyeGroup.add(rightEyeWhite);

    const rightIris = new THREE.Mesh(irisGeo, irisMaterial);
    rightIris.position.set(0, 0, 0.06);
    rightEyeGroup.add(rightIris);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    rightPupil.position.set(0, 0, 0.062);
    rightEyeGroup.add(rightPupil);

    const rightCatchlight = new THREE.Mesh(catchlightGeo, catchlightMaterial);
    rightCatchlight.position.set(0.012, 0.012, 0.064);
    rightEyeGroup.add(rightCatchlight);

    // ── 4. Eyebrows ──────────────────────────────────────────────────────────
    const browGeo = new THREE.CapsuleGeometry(0.022, 0.11, 6, 12);

    const leftBrowMesh = new THREE.Mesh(browGeo, browMaterial);
    leftBrowMesh.position.set(-0.155, 0.22, 0.43);
    leftBrowMesh.rotation.z = Math.PI / 2.12;
    headGroup.add(leftBrowMesh);

    const rightBrowMesh = new THREE.Mesh(browGeo, browMaterial);
    rightBrowMesh.position.set(0.155, 0.22, 0.43);
    rightBrowMesh.rotation.z = -Math.PI / 2.12;
    headGroup.add(rightBrowMesh);

    // ── 5. Articulated Mouth & Lips ──────────────────────────────────────────
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.19, 0.42);
    headGroup.add(mouthGroup);

    // Upper Lip
    const upperLipGeo = new THREE.CapsuleGeometry(0.024, 0.12, 8, 12);
    const upperLipMesh = new THREE.Mesh(upperLipGeo, lipMaterial);
    upperLipMesh.rotation.z = Math.PI / 2;
    upperLipMesh.position.y = 0.018;
    mouthGroup.add(upperLipMesh);

    // Lower Lip
    const lowerLipGeo = new THREE.CapsuleGeometry(0.026, 0.11, 8, 12);
    const lowerLipMesh = new THREE.Mesh(lowerLipGeo, lipMaterial);
    lowerLipMesh.rotation.z = Math.PI / 2;
    lowerLipMesh.position.y = -0.018;
    mouthGroup.add(lowerLipMesh);

    // ── 6. Hairstyles (No eye clipping, frames forehead cleanly) ─────────────
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    // Base Hair Cap (Resting behind brow plane)
    const baseHairGeo = new THREE.SphereGeometry(0.46, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const baseHairMesh = new THREE.Mesh(baseHairGeo, hairMaterial);
    baseHairMesh.rotation.x = -0.28;
    baseHairMesh.position.set(0, 0.08, -0.06);
    hairGroup.add(baseHairMesh);

    if (activeConfig.hairStyle === 'shoulder-waves') {
      // Cascading side volume
      const waveGeo = new THREE.CapsuleGeometry(0.07, 0.42, 8, 16);
      const leftWave = new THREE.Mesh(waveGeo, hairMaterial);
      leftWave.position.set(-0.36, -0.05, 0.05);
      leftWave.rotation.z = -0.18;
      hairGroup.add(leftWave);

      const rightWave = new THREE.Mesh(waveGeo, hairMaterial);
      rightWave.position.set(0.36, -0.05, 0.05);
      rightWave.rotation.z = 0.18;
      hairGroup.add(rightWave);

      const topVolumeGeo = new THREE.CapsuleGeometry(0.08, 0.34, 8, 16);
      const topVolume = new THREE.Mesh(topVolumeGeo, hairMaterial);
      topVolume.rotation.z = Math.PI / 2;
      topVolume.position.set(0, 0.48, 0.08);
      hairGroup.add(topVolume);
    } else if (activeConfig.hairStyle === 'curls') {
      // Textured curls clusters
      for (let i = -2; i <= 2; i++) {
        const curlGeo = new THREE.SphereGeometry(0.085, 12, 12);
        const curlMesh = new THREE.Mesh(curlGeo, hairMaterial);
        curlMesh.position.set(i * 0.12, 0.46 - Math.abs(i) * 0.03, 0.08);
        hairGroup.add(curlMesh);
      }
    } else if (activeConfig.hairStyle === 'top-knot') {
      // Crown bun
      const bunGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const bunMesh = new THREE.Mesh(bunGeo, hairMaterial);
      bunMesh.position.set(0, 0.58, -0.05);
      bunMesh.scale.set(1.1, 0.85, 1.0);
      hairGroup.add(bunMesh);
    } else {
      // Default: short-part / textured-crop
      const cropGeo = new THREE.CapsuleGeometry(0.08, 0.36, 8, 16);
      const cropMesh = new THREE.Mesh(cropGeo, hairMaterial);
      cropMesh.rotation.z = Math.PI / 2;
      cropMesh.position.set(0, 0.49, 0.10);
      hairGroup.add(cropMesh);

      const sideGeo = new THREE.CapsuleGeometry(0.05, 0.20, 6, 12);
      const leftSide = new THREE.Mesh(sideGeo, hairMaterial);
      leftSide.position.set(-0.36, 0.16, 0.06);
      leftSide.rotation.z = -0.15;
      hairGroup.add(leftSide);

      const rightSide = new THREE.Mesh(sideGeo, hairMaterial);
      rightSide.position.set(0.36, 0.16, 0.06);
      rightSide.rotation.z = 0.15;
      hairGroup.add(rightSide);
    }

    // ── 7. Eyewear (Optional) ────────────────────────────────────────────────
    if (activeConfig.eyewear !== 'none') {
      const glassesGroup = new THREE.Group();
      glassesGroup.position.set(0, 0.08, 0.46);
      headGroup.add(glassesGroup);

      if (activeConfig.eyewear === 'round') {
        const frameGeo = new THREE.TorusGeometry(0.075, 0.009, 12, 24);
        const leftFrame = new THREE.Mesh(frameGeo, eyewearMaterial);
        leftFrame.position.x = -0.155;
        glassesGroup.add(leftFrame);

        const rightFrame = new THREE.Mesh(frameGeo, eyewearMaterial);
        rightFrame.position.x = 0.155;
        glassesGroup.add(rightFrame);

        // Bridge
        const bridgeGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.09, 8);
        const bridge = new THREE.Mesh(bridgeGeo, eyewearMaterial);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.y = 0.01;
        glassesGroup.add(bridge);
      } else if (activeConfig.eyewear === 'rectangular') {
        // Modern rectangular frames
        const frameGeo = new THREE.BoxGeometry(0.15, 0.09, 0.012);
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x222428,
          roughness: 0.4,
        });
        const leftFrame = new THREE.Mesh(frameGeo, frameMat);
        leftFrame.position.x = -0.155;
        glassesGroup.add(leftFrame);

        const rightFrame = new THREE.Mesh(frameGeo, frameMat);
        rightFrame.position.x = 0.155;
        glassesGroup.add(rightFrame);

        const bridgeGeo = new THREE.BoxGeometry(0.08, 0.014, 0.012);
        const bridge = new THREE.Mesh(bridgeGeo, frameMat);
        glassesGroup.add(bridge);
      }
    }

    // Store references in animRef
    animRef.current.headGroup = headGroup;
    animRef.current.mouthGroup = mouthGroup;
    animRef.current.leftEyeMesh = leftEyeWhite;
    animRef.current.rightEyeMesh = rightEyeWhite;
    animRef.current.leftIrisMesh = leftIris;
    animRef.current.rightIrisMesh = rightIris;
    animRef.current.leftBrowMesh = leftBrowMesh;
    animRef.current.rightBrowMesh = rightBrowMesh;
    animRef.current.torsoGroup = torsoGroup;

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const anim = animRef.current;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = anim.clock.getElapsedTime();

      if (!reducedMotion) {
        // 1. Natural subtle breathing
        const breath = Math.sin(elapsedTime * 1.7) * 0.018;
        if (torsoGroup) {
          torsoGroup.position.y = breath;
        }

        // 2. Periodic lifelike blinking (every 3-5 seconds)
        if (!anim.isBlinking && elapsedTime - anim.lastBlinkTime > 3.0 + Math.random() * 2.2) {
          anim.isBlinking = true;
          anim.lastBlinkTime = elapsedTime;
        }

        if (anim.isBlinking) {
          const blinkProgress = (elapsedTime - anim.lastBlinkTime) / anim.blinkDuration;
          if (blinkProgress >= 1) {
            anim.isBlinking = false;
            if (leftEyeWhite && rightEyeWhite) {
              leftEyeWhite.scale.y = 0.85;
              rightEyeWhite.scale.y = 0.85;
            }
          } else {
            const blinkScale = Math.sin(blinkProgress * Math.PI);
            const scaleY = Math.max(0.08, 0.85 - blinkScale * 0.78);
            if (leftEyeWhite && rightEyeWhite) {
              leftEyeWhite.scale.y = scaleY;
              rightEyeWhite.scale.y = scaleY;
            }
          }
        }

        // 3. Subtle micro-saccades (prevents frozen lifeless gaze)
        if (elapsedTime - anim.lastSaccadeTime > 2.5 + Math.random() * 2.0) {
          anim.lastSaccadeTime = elapsedTime;
          anim.saccadeTarget = {
            x: (Math.random() - 0.5) * 0.012,
            y: (Math.random() - 0.5) * 0.008,
          };
        }
        if (leftIris && rightIris) {
          leftIris.position.x = THREE.MathUtils.lerp(leftIris.position.x, anim.saccadeTarget.x, 0.08);
          leftIris.position.y = THREE.MathUtils.lerp(leftIris.position.y, anim.saccadeTarget.y, 0.08);
          rightIris.position.x = THREE.MathUtils.lerp(rightIris.position.x, anim.saccadeTarget.x, 0.08);
          rightIris.position.y = THREE.MathUtils.lerp(rightIris.position.y, anim.saccadeTarget.y, 0.08);
        }

        // 4. Conversational posture & affect states
        const currentState = anim.state;
        const isSpeaking = anim.isSpeakingAudio || currentState === 'speaking';

        if (headGroup) {
          if (currentState === 'listening') {
            const nod = Math.sin(elapsedTime * 2.2) * 0.028;
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.045, 0.08);
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, nod, 0.1);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.02, 0.08);
          } else if (currentState === 'thinking') {
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, -0.04, 0.06);
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -0.05, 0.06);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.07, 0.06);
          } else if (isSpeaking) {
            const speechCadence = Math.sin(elapsedTime * 4.2) * 0.022;
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, speechCadence, 0.12);
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.0, 0.08);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.0, 0.08);
          } else if (currentState === 'receptive') {
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.02, 0.08);
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.035, 0.08);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.0, 0.08);
          } else if (currentState === 'defensive') {
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -0.035, 0.08);
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, -0.02, 0.08);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, -0.03, 0.08);
          } else {
            headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.0, 0.08);
            headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.0, 0.08);
            headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.0, 0.08);
          }
        }

        // 5. Eyebrow expression
        if (leftBrowMesh && rightBrowMesh) {
          if (currentState === 'defensive') {
            leftBrowMesh.rotation.z = THREE.MathUtils.lerp(leftBrowMesh.rotation.z, Math.PI / 2.55, 0.1);
            rightBrowMesh.rotation.z = THREE.MathUtils.lerp(rightBrowMesh.rotation.z, -Math.PI / 2.55, 0.1);
            leftBrowMesh.position.y = THREE.MathUtils.lerp(leftBrowMesh.position.y, 0.20, 0.1);
            rightBrowMesh.position.y = THREE.MathUtils.lerp(rightBrowMesh.position.y, 0.20, 0.1);
          } else if (currentState === 'thinking' || currentState === 'listening') {
            leftBrowMesh.rotation.z = THREE.MathUtils.lerp(leftBrowMesh.rotation.z, Math.PI / 2.05, 0.1);
            rightBrowMesh.rotation.z = THREE.MathUtils.lerp(rightBrowMesh.rotation.z, -Math.PI / 2.05, 0.1);
            leftBrowMesh.position.y = THREE.MathUtils.lerp(leftBrowMesh.position.y, 0.24, 0.1);
            rightBrowMesh.position.y = THREE.MathUtils.lerp(rightBrowMesh.position.y, 0.24, 0.1);
          } else {
            leftBrowMesh.rotation.z = THREE.MathUtils.lerp(leftBrowMesh.rotation.z, Math.PI / 2.12, 0.1);
            rightBrowMesh.rotation.z = THREE.MathUtils.lerp(rightBrowMesh.rotation.z, -Math.PI / 2.12, 0.1);
            leftBrowMesh.position.y = THREE.MathUtils.lerp(leftBrowMesh.position.y, 0.22, 0.1);
            rightBrowMesh.position.y = THREE.MathUtils.lerp(rightBrowMesh.position.y, 0.22, 0.1);
          }
        }

        // 6. Speaking Mouth & Jaw Articulation (Synchronized with speech)
        if (mouthGroup) {
          if (isSpeaking) {
            const jawCadence = 0.7 + Math.abs(Math.sin(elapsedTime * 9.5)) * 0.85;
            mouthGroup.scale.y = THREE.MathUtils.lerp(mouthGroup.scale.y, jawCadence, 0.25);
            mouthGroup.scale.x = THREE.MathUtils.lerp(mouthGroup.scale.x, 0.95 + jawCadence * 0.15, 0.25);
          } else if (currentState === 'receptive') {
            // Subtle resting smile curve
            mouthGroup.scale.y = THREE.MathUtils.lerp(mouthGroup.scale.y, 0.85, 0.1);
            mouthGroup.scale.x = THREE.MathUtils.lerp(mouthGroup.scale.x, 1.12, 0.1);
          } else {
            // Closed rest position
            mouthGroup.scale.y = THREE.MathUtils.lerp(mouthGroup.scale.y, 1.0, 0.15);
            mouthGroup.scale.x = THREE.MathUtils.lerp(mouthGroup.scale.x, 1.0, 0.15);
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
  }, [isHidden, partnerVariant, customization, reducedMotion, mirror]);

  if (isHidden) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-canvas-subtle border border-canvas-border text-center ${className}`}
        role="region"
        aria-label="Conversation partner status (Text focus mode)"
      >
        <div className="w-14 h-14 rounded-full bg-teal-subtle text-teal-brand flex items-center justify-center font-semibold text-lg mb-3 shadow-xs">
          {partnerName.charAt(0)}
        </div>
        <p className="font-semibold text-ink-primary text-base">{partnerName}</p>
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
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-72 sm:h-80 md:h-88 flex items-center justify-center relative overflow-hidden rounded-2xl"
        role="img"
        aria-label={`3D avatar of ${partnerName}, currently ${state}`}
      >
        {!webGlSupported && (
          <div className="flex flex-col items-center justify-center p-6 text-center bg-canvas-subtle rounded-2xl border border-canvas-border max-w-sm">
            <div className="w-16 h-16 rounded-full bg-teal-subtle text-teal-brand flex items-center justify-center font-bold text-xl mb-3">
              {partnerName.charAt(0)}
            </div>
            <p className="font-semibold text-ink-primary">{partnerName}</p>
            <p className="text-xs text-ink-muted mb-2">{partnerRole}</p>
            <span className="text-xs text-ink-secondary">
              (WebGL acceleration unavailable; text captions active)
            </span>
          </div>
        )}
      </div>

      {/* Partner Info & Visibility Toggle */}
      <div className="w-full flex items-center justify-between px-2 pt-2 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-primary">{partnerName}</span>
          <span className="text-canvas-border">•</span>
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
