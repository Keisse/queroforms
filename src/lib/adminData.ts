import { gpIaSteps, Step } from '../data/gpIa';
import { supabase } from './supabase';

export type Submission = {
  id: string;
  survey_slug: string;
  survey_version: number;
  attempt_id: string;
  name: string | null;
  email: string | null;
  score: number | null;
  level: number | null;
  dimension_scores: Record<string, number> | null;
  answers: Record<string, string | string[]> | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_url: string | null;
  referrer: string | null;
  created_at: string;
};

export type SubmissionSnapshot = {
  rows: Submission[];
  totalCount: number;
  truncated: boolean;
};

export type SurveySummary = {
  id: string;
  slug: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
  published_version: number;
  created_at: string;
  updated_at: string;
  leads: number;
  leadsLast7Days: number;
  lastLeadAt: string | null;
};

export type SurveyRecord = Omit<SurveySummary, 'leads' | 'leadsLast7Days' | 'lastLeadAt'> & {
  config?: Record<string, unknown> | null;
};

function requestedSurveySlug(fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const querySlug = new URLSearchParams(window.location.search).get('survey');
  if (querySlug) return querySlug;
  const match = window.location.pathname.match(/^\/(?:builder|d)\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

const submissionSelect = 'id,survey_slug,survey_version,attempt_id,name,email,score,level,dimension_scores,answers,source,utm_source,utm_medium,utm_campaign,utm_content,utm_term,landing_url,referrer,created_at';

export async function fetchSubmissions(slug = 'gp-ia', limit = 2000): Promise<SubmissionSnapshot> {
  const resolvedSlug = requestedSurveySlug(slug);
  const { data, error, count } = await supabase
    .from('submissions')
    .select(submissionSelect, { count: 'exact' })
    .eq('survey_slug', resolvedSlug)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const rows = (data || []) as Submission[];
  const totalCount = count ?? rows.length;
  return { rows, totalCount, truncated: totalCount > rows.length };
}

export async function fetchAllSubmissions(limit = 5000): Promise<SubmissionSnapshot> {
  const { data, error, count } = await supabase
    .from('submissions')
    .select(submissionSelect, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const rows = (data || []) as Submission[];
  const totalCount = count ?? rows.length;
  return { rows, totalCount, truncated: totalCount > rows.length };
}

export async function deleteSubmission(id: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSubmissions(ids: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  if (!uniqueIds.length) return;

  const { error } = await supabase
    .from('submissions')
    .delete()
    .in('id', uniqueIds);

  if (error) throw error;
}

export async function fetchRecentSubmissions(limit = 8): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(submissionSelect)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as Submission[];
}

export async function fetchSurvey(slug: string): Promise<SurveyRecord | null> {
  const { data, error } = await supabase
    .from('surveys')
    .select('id,slug,name,status,published_version,created_at,updated_at,config')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as SurveyRecord | null;
}

export async function fetchSurveySummaries(): Promise<SurveySummary[]> {
  const { data, error } = await supabase
    .from('surveys')
    .select('id,slug,name,status,published_version,created_at,updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const summaries = await Promise.all((data || []).map(async survey => {
    const [totalResult, weekResult, latestResult] = await Promise.all([
      supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('survey_slug', survey.slug),
      supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('survey_slug', survey.slug).gte('created_at', cutoff),
      supabase.from('submissions').select('created_at').eq('survey_slug', survey.slug).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (totalResult.error) throw totalResult.error;
    if (weekResult.error) throw weekResult.error;
    if (latestResult.error) throw latestResult.error;

    return {
      ...(survey as Omit<SurveySummary, 'leads' | 'leadsLast7Days' | 'lastLeadAt'>),
      leads: totalResult.count ?? 0,
      leadsLast7Days: weekResult.count ?? 0,
      lastLeadAt: latestResult.data?.created_at ? String(latestResult.data.created_at) : null,
    } as SurveySummary;
  }));

  return summaries;
}

export function slugifySurveyName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export async function createSurvey(input: { name: string; slug?: string }) {
  const name = input.name.trim();
  const slug = slugifySurveyName(input.slug || name);
  if (!name) throw new Error('Informe um nome para o diagnóstico.');
  if (!slug) throw new Error('Não foi possível gerar uma URL válida.');

  const { data: existing, error: existingError } = await supabase
    .from('surveys')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) throw new Error('Já existe um diagnóstico com essa URL.');

  const starterSteps = JSON.parse(JSON.stringify(gpIaSteps)) as Step[];
  const config = {
    type: 'maturity-diagnostic',
    template_source: 'gp-ia',
    steps: starterSteps,
    draft_steps: starterSteps,
  };

  const { data, error } = await supabase
    .from('surveys')
    .insert({ name, slug, status: 'draft', config, published_version: 1 })
    .select('id,slug,name,status,published_version,created_at,updated_at')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Já existe um diagnóstico com essa URL.');
    throw error;
  }
  return data as SurveyRecord;
}

export async function fetchSurveyVersionSteps(slug = 'gp-ia'): Promise<Record<number, Step[]>> {
  const resolvedSlug = requestedSurveySlug(slug);
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('id,config,published_version')
    .eq('slug', resolvedSlug)
    .maybeSingle();

  if (surveyError) throw surveyError;
  if (!survey) return {};

  const { data: versions, error: versionError } = await supabase
    .from('survey_versions')
    .select('version,config')
    .eq('survey_id', survey.id)
    .order('version', { ascending: true });

  if (versionError) throw versionError;

  const result: Record<number, Step[]> = {};
  for (const row of versions || []) {
    const config = row.config as { steps?: Step[] } | null;
    if (Array.isArray(config?.steps)) result[Number(row.version)] = config.steps;
  }

  const liveConfig = survey.config as { steps?: Step[] } | null;
  const liveVersion = Number(survey.published_version) || 1;
  if (!result[liveVersion] && Array.isArray(liveConfig?.steps)) result[liveVersion] = liveConfig.steps;

  return result;
}
