import { Step } from '../data/gpIa';
import { supabase } from './supabase';

type SurveyConfig = Record<string, unknown> & {
  steps?: Step[];
  draft_steps?: Step[];
};

function readSteps(config: SurveyConfig | null | undefined, key: 'steps' | 'draft_steps') {
  const value = config?.[key];
  return Array.isArray(value) && value.length ? (value as Step[]) : null;
}

export async function fetchPublishedSteps(slug: string): Promise<Step[] | null> {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('config')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error || !data) return null;
    return readSteps(data.config as SurveyConfig | null, 'steps');
  } catch {
    return null;
  }
}

export async function fetchBuilderSteps(slug: string): Promise<Step[] | null> {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('config')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    const config = data.config as SurveyConfig | null;
    return readSteps(config, 'draft_steps') || readSteps(config, 'steps');
  } catch {
    return null;
  }
}

async function readConfig(slug: string) {
  const { data, error } = await supabase
    .from('surveys')
    .select('config')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Diagnóstico não encontrado.');
  return (data.config as SurveyConfig | null) || {};
}

export async function saveDraftSteps(slug: string, steps: Step[]) {
  const existingConfig = await readConfig(slug);
  const nextConfig: SurveyConfig = { ...existingConfig, draft_steps: steps };

  const { data, error } = await supabase
    .from('surveys')
    .update({ config: nextConfig, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select('updated_at')
    .single();

  if (error) throw error;
  if (!data) throw new Error('O rascunho não atualizou nenhum diagnóstico.');
}

export async function publishSteps(slug: string, steps: Step[]) {
  const existingConfig = await readConfig(slug);
  const nextConfig: SurveyConfig = {
    ...existingConfig,
    steps,
    draft_steps: steps,
  };

  const { data, error } = await supabase
    .from('surveys')
    .update({ config: nextConfig, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select('updated_at')
    .single();

  if (error) throw error;
  if (!data) throw new Error('A publicação não atualizou nenhum diagnóstico.');
}
