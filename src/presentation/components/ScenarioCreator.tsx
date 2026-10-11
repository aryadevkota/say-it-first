'use client';

/**
 * ScenarioCreator.tsx — Custom Scenario Creator & Document Ingestion
 *
 * Implements:
 * - Direct pasting/typing or document upload (.txt, .md, .json)
 * - File validation (size limit <= 2MB, empty file checks, clear error messages)
 * - Optional clarifying questions (Who am I speaking with, context, goal, constraints)
 * - Editable scenario summary before practice: "Here's the situation we'll practice"
 * - Clear separation of user-provided facts vs inferred partner details
 * - Explicit save action to "My scenarios"
 */

import React, { useState, useRef } from 'react';
import {
  ScenarioGenerator,
  type ScenarioGenerationResult,
} from '../../domain/scenarios/ScenarioGenerator';
import type { ScenarioDefinition } from '../../domain/scenarios/topics';

interface ScenarioCreatorProps {
  onStartPractice: (scenario: ScenarioDefinition) => void;
  onSaveScenario: (scenario: ScenarioDefinition) => void;
  onCancel: () => void;
}

export const ScenarioCreator: React.FC<ScenarioCreatorProps> = ({
  onStartPractice,
  onSaveScenario,
  onCancel,
}) => {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');

  // Input fields
  const [situationText, setSituationText] = useState<string>('');
  const [partnerRole, setPartnerRole] = useState<string>('');
  const [relationshipContext, setRelationshipContext] = useState<string>('');
  const [userGoal, setUserGoal] = useState<string>('');
  const [avoidConstraints, setAvoidConstraints] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Status & errors
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Generated scenario for review
  const [generationResult, setGenerationResult] = useState<ScenarioGenerationResult | null>(null);

  // Editable review state
  const [editTitle, setEditTitle] = useState<string>('');
  const [editGoal, setEditGoal] = useState<string>('');
  const [editPartnerName, setEditPartnerName] = useState<string>('');
  const [editPartnerRole, setEditPartnerRole] = useState<string>('');
  const [editPartnerOpening, setEditPartnerOpening] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload (.txt, .md, .json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate extension
    const allowedExtensions = ['.txt', '.md', '.json'];
    const hasValidExt = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setErrorMessage(
        `Unsupported file format: "${file.name}". Supported document formats are .txt, .md, and .json.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (max 2MB)
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`The file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a file under 2MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size === 0) {
      setErrorMessage(`The selected file is empty. Please upload a file containing your scenario description.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content || !content.trim()) {
          setErrorMessage('The uploaded document appears to be empty.');
          return;
        }

        // If JSON, extract text values if structured
        let parsedText = content;
        if (file.name.toLowerCase().endsWith('.json')) {
          try {
            const parsed = JSON.parse(content);
            parsedText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
          } catch {
            // Use raw content
          }
        }

        setSituationText(parsedText.trim());
        setUploadedFileName(file.name);
      } catch {
        setErrorMessage('Unable to extract text from the document. Please try pasting the text directly.');
      }
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read the file. Please check file permissions or paste the text.');
    };

    reader.readAsText(file);
  };

  // Generate scenario
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!situationText.trim()) {
      setErrorMessage('Please enter or upload a description of your situation.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = ScenarioGenerator.generate({
        situationText,
        partnerRole,
        relationshipContext,
        userGoal,
        avoidConstraints,
        sourceType: uploadedFileName ? 'document' : 'manual',
        uploadedFileName: uploadedFileName || undefined,
      });

      setGenerationResult(result);
      setEditTitle(result.scenario.title);
      setEditGoal(result.scenario.userGoal);
      setEditPartnerName(result.scenario.partner.name);
      setEditPartnerRole(result.scenario.partner.role);
      setEditPartnerOpening(result.scenario.partner.initialDialogue);
      setIsSaved(false);
      setStep('review');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to generate scenario.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save scenario
  const handleSave = () => {
    if (!generationResult) return;

    const finalScenario: ScenarioDefinition = {
      ...generationResult.scenario,
      title: editTitle.trim() || generationResult.scenario.title,
      userGoal: editGoal.trim() || generationResult.scenario.userGoal,
      partner: {
        ...generationResult.scenario.partner,
        name: editPartnerName.trim() || generationResult.scenario.partner.name,
        role: editPartnerRole.trim() || generationResult.scenario.partner.role,
        initialDialogue: editPartnerOpening.trim() || generationResult.scenario.partner.initialDialogue,
      },
    };

    onSaveScenario(finalScenario);
    setIsSaved(true);
  };

  // Launch practice session
  const handleStart = () => {
    if (!generationResult) return;

    const finalScenario: ScenarioDefinition = {
      ...generationResult.scenario,
      title: editTitle.trim() || generationResult.scenario.title,
      userGoal: editGoal.trim() || generationResult.scenario.userGoal,
      partner: {
        ...generationResult.scenario.partner,
        name: editPartnerName.trim() || generationResult.scenario.partner.name,
        role: editPartnerRole.trim() || generationResult.scenario.partner.role,
        initialDialogue: editPartnerOpening.trim() || generationResult.scenario.partner.initialDialogue,
      },
    };

    onStartPractice(finalScenario);
  };

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-4 sm:px-6 text-ink-primary animate-fadeIn">
      {/* Step 1: Input & Configuration */}
      {step === 'input' && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
                Custom Scenario
              </span>
              <span className="text-canvas-border">•</span>
              <span className="text-xs text-ink-muted">Personalized Sandbox</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
              Create a Scenario
            </h1>
            <p className="text-sm text-ink-secondary mt-1">
              Describe a real or upcoming conversation you’d like to explore. We’ll prepare an adaptive practice partner for you.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-topic-apricotBg border border-topic-apricot text-xs text-topic-apricot flex items-start justify-between">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-ink-muted hover:text-ink-primary ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Input Mode Selector */}
            <div className="flex gap-2 p-1 rounded-xl bg-canvas-surface border border-canvas-border w-fit">
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                  inputMode === 'text'
                    ? 'bg-sif-primarySubtle text-sif-primary font-semibold'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                Type or paste situation
              </button>
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                  inputMode === 'file'
                    ? 'bg-sif-primarySubtle text-sif-primary font-semibold'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                Upload document
              </button>
            </div>

            {/* Situation Text Area */}
            {inputMode === 'text' ? (
              <div className="space-y-2">
                <label htmlFor="situation-text" className="text-xs font-semibold text-ink-primary block">
                  Describe the situation <span className="text-topic-apricot">*</span>
                </label>
                <textarea
                  id="situation-text"
                  value={situationText}
                  onChange={(e) => setSituationText(e.target.value)}
                  placeholder="Example: My roommate plays loud music late while I'm trying to sleep. I want to ask them to use headphones after 10 PM without getting defensive or making them feel attacked."
                  rows={5}
                  className="w-full rounded-2xl bg-canvas-surface border border-canvas-border p-4 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-sif-primary transition leading-relaxed"
                />
                <span className="text-[11px] text-ink-muted block">
                  Include as much or as little context as you like.
                </span>
              </div>
            ) : (
              /* File Upload Area */
              <div className="space-y-3">
                <label className="text-xs font-semibold text-ink-primary block">
                  Upload scenario document
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-canvas-border hover:border-sif-border rounded-2xl p-6 sm:p-8 text-center bg-canvas-surface cursor-pointer transition flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-sif-primarySubtle text-sif-primary flex items-center justify-center text-xl">
                    📄
                  </div>
                  <div>
                    <span className="text-sm font-medium text-ink-primary block">
                      {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Choose a file or click to browse'}
                    </span>
                    <span className="text-xs text-ink-muted mt-1 block">
                      Supported formats: <strong className="text-ink-secondary">.txt, .md, .json</strong> (Max 2MB)
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.json,text/plain,text/markdown,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {situationText && (
                  <div className="p-4 rounded-xl bg-canvas-surface border border-canvas-border text-xs text-ink-secondary max-h-36 overflow-y-auto">
                    <span className="font-semibold text-ink-primary block mb-1">Extracted content preview:</span>
                    <p className="line-clamp-4 italic">“{situationText.slice(0, 300)}...”</p>
                  </div>
                )}
              </div>
            )}

            {/* Optional Clarifying Fields */}
            <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-4">
              <span className="text-xs font-semibold uppercase text-ink-muted block">
                Optional Context (Fill only what is helpful)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="partner-role" className="text-xs font-medium text-ink-secondary block mb-1">
                    Who are you speaking with?
                  </label>
                  <input
                    id="partner-role"
                    type="text"
                    value={partnerRole}
                    onChange={(e) => setPartnerRole(e.target.value)}
                    placeholder="e.g. Roommate, Manager, Landlord"
                    className="w-full rounded-xl bg-canvas-light border border-canvas-border px-3.5 py-2.5 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-sif-primary"
                  />
                </div>

                <div>
                  <label htmlFor="user-goal" className="text-xs font-medium text-ink-secondary block mb-1">
                    What do you want to communicate?
                  </label>
                  <input
                    id="user-goal"
                    type="text"
                    value={userGoal}
                    onChange={(e) => setUserGoal(e.target.value)}
                    placeholder="e.g. Ask for quiet hours after 10 PM"
                    className="w-full rounded-xl bg-canvas-light border border-canvas-border px-3.5 py-2.5 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-sif-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rel-context" className="text-xs font-medium text-ink-secondary block mb-1">
                  Relationship or background context
                </label>
                <input
                  id="rel-context"
                  type="text"
                  value={relationshipContext}
                  onChange={(e) => setRelationshipContext(e.target.value)}
                  placeholder="e.g. We get along well, but this is our first time bringing up noise"
                  className="w-full rounded-xl bg-canvas-light border border-canvas-border px-3.5 py-2.5 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-sif-primary"
                />
              </div>

              <div>
                <label htmlFor="avoid-constraints" className="text-xs font-medium text-ink-secondary block mb-1">
                  Anything the practice partner should avoid?
                </label>
                <input
                  id="avoid-constraints"
                  type="text"
                  value={avoidConstraints}
                  onChange={(e) => setAvoidConstraints(e.target.value)}
                  placeholder="e.g. Don't make them overly combative, keep it collaborative"
                  className="w-full rounded-xl bg-canvas-light border border-canvas-border px-3.5 py-2.5 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-sif-primary"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-ink-muted hover:text-ink-primary transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessing || !situationText.trim()}
                className={`px-6 py-3 rounded-xl text-xs font-medium transition shadow-xs ${
                  isProcessing || !situationText.trim()
                    ? 'bg-canvas-subtle text-ink-muted cursor-not-allowed border border-canvas-borderSubtle'
                    : 'bg-sif-primary hover:bg-sif-primaryHover text-canvas-surface'
                }`}
              >
                {isProcessing ? 'Preparing scenario…' : 'Generate practice scenario →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Editable Review & Confirmation */}
      {step === 'review' && generationResult && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary block mb-1">
              Review & Customize
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
              Here’s the situation we’ll practice.
            </h1>
            <p className="text-sm text-ink-secondary mt-1">
              We’ve separated the facts you provided from our inferred setup. You can adjust any detail before beginning.
            </p>
          </div>

          {/* Section A: What You Provided (Facts) */}
          <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-4">
            <span className="text-xs font-semibold uppercase text-sif-primary block">
              1. What You Provided (Your Stated Context)
            </span>

            <div>
              <label htmlFor="edit-title" className="text-xs font-medium text-ink-muted block mb-1">
                Scenario Title
              </label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-xl bg-canvas-light border border-canvas-border px-3.5 py-2 text-sm font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-sif-primary"
              />
            </div>

            <div>
              <label htmlFor="edit-goal" className="text-xs font-medium text-ink-muted block mb-1">
                Your Practice Goal
              </label>
              <input
                id="edit-goal"
                type="text"
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                className="w-full rounded-xl bg-canvas-light border border-canvas-border px-3.5 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-sif-primary"
              />
            </div>

            {generationResult.userProvidedFacts.avoidConstraints && (
              <div className="p-3 rounded-xl bg-canvas-subtle text-xs text-ink-secondary">
                <span className="font-semibold text-ink-primary block mb-0.5">Constraints to avoid:</span>
                <span>{generationResult.userProvidedFacts.avoidConstraints}</span>
              </div>
            )}
          </div>

          {/* Section B: Inferred Details (Partner Setup) */}
          <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-4">
            <span className="text-xs font-semibold uppercase text-topic-apricot block">
              2. Inferred Practice Setup (Partner Persona)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-pname" className="text-xs font-medium text-ink-muted block mb-1">
                  Partner Name
                </label>
                <input
                  id="edit-pname"
                  type="text"
                  value={editPartnerName}
                  onChange={(e) => setEditPartnerName(e.target.value)}
                  className="w-full rounded-xl bg-canvas-light border border-canvas-border px-3.5 py-2 text-xs font-medium text-ink-primary focus:outline-none focus:ring-2 focus:ring-sif-primary"
                />
              </div>

              <div>
                <label htmlFor="edit-prole" className="text-xs font-medium text-ink-muted block mb-1">
                  Partner Role
                </label>
                <input
                  id="edit-prole"
                  type="text"
                  value={editPartnerRole}
                  onChange={(e) => setEditPartnerRole(e.target.value)}
                  className="w-full rounded-xl bg-canvas-light border border-canvas-border px-3.5 py-2 text-xs font-medium text-ink-primary focus:outline-none focus:ring-2 focus:ring-sif-primary"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-canvas-subtle text-xs text-ink-secondary space-y-1">
              <span className="font-semibold text-ink-primary block">Partner Concerns & Style:</span>
              <p>• {generationResult.inferredDetails.partnerConcerns}</p>
              <p>• {generationResult.inferredDetails.partnerStyle}</p>
            </div>

            <div>
              <label htmlFor="edit-opening" className="text-xs font-medium text-ink-muted block mb-1">
                Partner's Opening Line
              </label>
              <textarea
                id="edit-opening"
                value={editPartnerOpening}
                onChange={(e) => setEditPartnerOpening(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-canvas-light border border-canvas-border p-3 text-xs italic text-ink-primary focus:outline-none focus:ring-2 focus:ring-sif-primary"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('input')}
              className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink-primary transition"
            >
              ← Edit input
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSave}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition ${
                  isSaved
                    ? 'bg-sif-primarySubtle text-sif-primary font-semibold'
                    : 'bg-canvas-surface border border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                }`}
              >
                {isSaved ? '✓ Saved to My Scenarios' : 'Save to My Scenarios'}
              </button>

              <button
                type="button"
                onClick={handleStart}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-sif-primary hover:bg-sif-primaryHover text-canvas-surface text-xs font-medium transition shadow-xs"
              >
                Jump into practice →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
