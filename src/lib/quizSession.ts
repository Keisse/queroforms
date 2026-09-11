import type { Step } from '../data/gpIa';
import { supabase, supabaseEnabled } from './supabase';

export type QuizAnswers = Record<string, string | string[]>;

export type QuizProgress = {
  surveyVersion: number;
  steps?: Step[];
  idx: number;
  answers: QuizAnswers;
  email: string;
  name: string;
  attemptId: string;
  updatedAt: string;
};

export type SubmissionPayload = Record<string, unknown> & {
  attempt_id: string;
  survey_slug: string;
  survey_version: number;
};

type BuilderDraft = {
  steps?: Step[];
  baseVersion?: number;
};

const RETRY_DELAYS_MS = [0, 700, 1800] as const;
const MAX_PENDING_SUBMISSIONS = 10;

function activeSurveySlug(fallback = 'gp-ia') {
  if (typeof window === 'undefined') return fallback;
  const querySlug = new URLSearchParams(window.location.search).get('survey');
  if (querySlug) return querySlug;
  const match = window.location.pathname.match(/^\/(?:builder|d)\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

function progressKey(){ return `qf_${activeSurveySlug().replace(/[^a-z0-9_-]/gi,'_')}_progress_v1`; }
function pendingKey(){ return `qf_${activeSurveySlug().replace(/[^a-z0-9_-]/gi,'_')}_pending_submissions_v1`; }
function builderDraftKey(){ return activeSurveySlug()==='gp-ia' ? 'qf_gp_ia_builder_screen_draft_v3' : `qf_${activeSurveySlug().replace(/[^a-z0-9_-]/gi,'_')}_builder_screen_draft_v3`; }

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Falha de storage não pode bloquear o diagnóstico.
  }
}

export function readQuizProgress(): QuizProgress | null {
  const progress = readJson<Partial<QuizProgress>>(progressKey());
  if (!progress || !progress.attemptId || !Number.isFinite(progress.surveyVersion) || !Number.isFinite(progress.idx)) return null;
  if (!progress.answers || typeof progress.answers !== 'object') return null;
  const frozenSteps = Array.isArray(progress.steps) && progress.steps.length ? progress.steps as Step[] : undefined;
  return {
    surveyVersion: Number(progress.surveyVersion),
    steps: frozenSteps,
    idx: Math.max(0, Number(progress.idx)),
    answers: progress.answers as QuizAnswers,
    email: String(progress.email || ''),
    name: String(progress.name || ''),
    attemptId: String(progress.attemptId),
    updatedAt: String(progress.updatedAt || ''),
  };
}

export function saveQuizProgress(progress: Omit<QuizProgress, 'updatedAt'>) {
  writeJson(progressKey(), {...progress, updatedAt: new Date().toISOString()});
}

export function clearQuizProgress() {
  try {
    window.localStorage.removeItem(progressKey());
  } catch {
    // Nada a fazer.
  }
}

export function readBuilderDraftPreview(publishedVersion: number): Step[] | null {
  const draft = readJson<BuilderDraft>(builderDraftKey());
  if (!draft || Number(draft.baseVersion) !== publishedVersion || !Array.isArray(draft.steps) || !draft.steps.length) return null;
  return draft.steps;
}

function normalizePayload(payload: SubmissionPayload): SubmissionPayload {
  return {...payload, survey_slug: activeSurveySlug(payload.survey_slug)};
}

function readPendingSubmissions(): SubmissionPayload[] {
  const value = readJson<SubmissionPayload[]>(pendingKey());
  return Array.isArray(value) ? value.filter(item => item && typeof item.attempt_id === 'string') : [];
}

function writePendingSubmissions(items: SubmissionPayload[]) {
  writeJson(pendingKey(), items.slice(-MAX_PENDING_SUBMISSIONS));
}

export function enqueueSubmission(payload: SubmissionPayload) {
  const normalized = normalizePayload(payload);
  const queue = readPendingSubmissions().filter(item => item.attempt_id !== normalized.attempt_id);
  queue.push(normalized);
  writePendingSubmissions(queue);
}

export function removePendingSubmission(attemptId: string) {
  writePendingSubmissions(readPendingSubmissions().filter(item => item.attempt_id !== attemptId));
}

function wait(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms));
}

export async function submitWithRetry(payload: SubmissionPayload): Promise<boolean> {
  if (!supabaseEnabled) return false;
  const normalized = normalizePayload(payload);

  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await wait(delay);
    try {
      const {error} = await supabase.from('submissions').insert(normalized);
      if (!error || error.code === '23505') return true;
      console.error('Falha ao salvar submissão do diagnóstico:', error);
    } catch (error: unknown) {
      console.error('Falha inesperada ao salvar submissão do diagnóstico:', error);
    }
  }

  return false;
}

export async function flushSubmissionQueue() {
  if (!supabaseEnabled || !navigator.onLine) return;
  const queue = readPendingSubmissions();
  for (const payload of queue) {
    const saved = await submitWithRetry(payload);
    if (saved) removePendingSubmission(payload.attempt_id);
  }
}