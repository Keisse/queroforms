import type { Step } from '../data/gpIa';
import { supabase, supabaseEnabled } from './supabase';

export type QuizAnswers = Record<string, string | string[]>;

export type QuizProgress = {
  surveyVersion: number;
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

const PROGRESS_KEY = 'qf_gp_ia_progress_v1';
const PENDING_SUBMISSIONS_KEY = 'qf_gp_ia_pending_submissions_v1';
const BUILDER_DRAFT_KEY = 'qf_gp_ia_builder_screen_draft_v3';
const RETRY_DELAYS_MS = [0, 700, 1800] as const;
const MAX_PENDING_SUBMISSIONS = 10;

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
  const progress = readJson<Partial<QuizProgress>>(PROGRESS_KEY);
  if (!progress || !progress.attemptId || !Number.isFinite(progress.surveyVersion) || !Number.isFinite(progress.idx)) return null;
  if (!progress.answers || typeof progress.answers !== 'object') return null;
  return {
    surveyVersion: Number(progress.surveyVersion),
    idx: Math.max(0, Number(progress.idx)),
    answers: progress.answers as QuizAnswers,
    email: String(progress.email || ''),
    name: String(progress.name || ''),
    attemptId: String(progress.attemptId),
    updatedAt: String(progress.updatedAt || ''),
  };
}

export function saveQuizProgress(progress: Omit<QuizProgress, 'updatedAt'>) {
  writeJson(PROGRESS_KEY, {...progress, updatedAt: new Date().toISOString()});
}

export function clearQuizProgress() {
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Nada a fazer.
  }
}

export function readBuilderDraftPreview(publishedVersion: number): Step[] | null {
  const draft = readJson<BuilderDraft>(BUILDER_DRAFT_KEY);
  if (!draft || Number(draft.baseVersion) !== publishedVersion || !Array.isArray(draft.steps) || !draft.steps.length) return null;
  return draft.steps;
}

function readPendingSubmissions(): SubmissionPayload[] {
  const value = readJson<SubmissionPayload[]>(PENDING_SUBMISSIONS_KEY);
  return Array.isArray(value) ? value.filter(item => item && typeof item.attempt_id === 'string') : [];
}

function writePendingSubmissions(items: SubmissionPayload[]) {
  writeJson(PENDING_SUBMISSIONS_KEY, items.slice(-MAX_PENDING_SUBMISSIONS));
}

export function enqueueSubmission(payload: SubmissionPayload) {
  const queue = readPendingSubmissions().filter(item => item.attempt_id !== payload.attempt_id);
  queue.push(payload);
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

  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await wait(delay);
    try {
      const {error} = await supabase.from('submissions').insert(payload);
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
