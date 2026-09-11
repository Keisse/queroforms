import { Step } from '../data/gpIa';
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

export async function fetchSubmissions(slug = 'gp-ia', limit = 2000): Promise<SubmissionSnapshot> {
  const { data, error, count } = await supabase
    .from('submissions')
    .select(
      'id,survey_slug,survey_version,attempt_id,name,email,score,level,dimension_scores,answers,source,utm_source,utm_medium,utm_campaign,utm_content,utm_term,landing_url,referrer,created_at',
      { count: 'exact' },
    )
    .eq('survey_slug', slug)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const rows = (data || []) as Submission[];
  const totalCount = count ?? rows.length;
  return { rows, totalCount, truncated: totalCount > rows.length };
}

export async function fetchSurveyVersionSteps(slug = 'gp-ia'): Promise<Record<number, Step[]>> {
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('id,config,published_version')
    .eq('slug', slug)
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
