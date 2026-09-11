import { Step } from '../data/gpIa';
import { supabase } from './supabase';

type SurveyConfig = Record<string, unknown> & {
  steps?: Step[];
  draft_steps?: Step[];
};

export type SurveySnapshot = {
  steps: Step[];
  version: number;
  updatedAt: string;
};

function readSteps(config: SurveyConfig | null | undefined, key: 'steps' | 'draft_steps') {
  const value = config?.[key];
  return Array.isArray(value) && value.length ? (value as Step[]) : null;
}

function resolveSurveySlug(fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const querySlug = new URLSearchParams(window.location.search).get('survey');
  if (querySlug) return querySlug;
  const match = window.location.pathname.match(/^\/(?:builder|d)\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

export async function fetchPublishedSurvey(slug: string): Promise<SurveySnapshot | null> {
  const resolvedSlug = resolveSurveySlug(slug);
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('config,published_version,updated_at')
      .eq('slug', resolvedSlug)
      .eq('status', 'published')
      .maybeSingle();
    if (error || !data) return null;
    const steps = readSteps(data.config as SurveyConfig | null, 'steps');
    if (!steps) return null;
    return {
      steps,
      version: Number(data.published_version) || 1,
      updatedAt: String(data.updated_at || ''),
    };
  } catch {
    return null;
  }
}

export async function fetchBuilderSnapshot(slug: string): Promise<SurveySnapshot | null> {
  const resolvedSlug = resolveSurveySlug(slug);
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('config,published_version,updated_at')
      .eq('slug', resolvedSlug)
      .maybeSingle();
    if (error || !data) return null;
    const config = data.config as SurveyConfig | null;
    const steps = readSteps(config, 'draft_steps') || readSteps(config, 'steps');
    if (!steps) return null;
    return {
      steps,
      version: Number(data.published_version) || 1,
      updatedAt: String(data.updated_at || ''),
    };
  } catch {
    return null;
  }
}

export async function publishSteps(slug: string, steps: Step[], expectedVersion?: number) {
  const resolvedSlug = resolveSurveySlug(slug);
  let version = expectedVersion;
  if (version === undefined) {
    const snapshot = await fetchBuilderSnapshot(resolvedSlug);
    if (!snapshot) throw new Error('Diagnóstico não encontrado.');
    version = snapshot.version;
  }

  const { data, error } = await supabase.rpc('publish_survey', {
    p_slug: resolvedSlug,
    p_steps: steps,
    p_expected_version: version,
  });

  if (error) {
    const message = String(error.message || '');
    if (error.code === '40001' || message.toLowerCase().includes('version conflict')) {
      throw new Error('CONFLICT: existe uma versão mais recente publicada no Supabase. Recarregue antes de publicar.');
    }
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('A publicação não retornou confirmação do Supabase.');

  return {
    version: Number((row as { version?: number }).version) || version + 1,
    updatedAt: String((row as { updated_at?: string }).updated_at || ''),
  };
}
