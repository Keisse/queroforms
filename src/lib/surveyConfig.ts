import { Step } from '../data/gpIa';
import { supabase } from './supabase';

export async function fetchPublishedSteps(slug: string): Promise<Step[] | null> {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('config')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error || !data) return null;
    const steps = (data.config as Record<string, unknown> | null)?.steps;
    return Array.isArray(steps) && steps.length ? (steps as Step[]) : null;
  } catch {
    return null;
  }
}

export async function publishSteps(slug: string, steps: Step[]) {
  const { data: existing } = await supabase.from('surveys').select('config').eq('slug', slug).maybeSingle();
  const nextConfig = { ...(existing?.config as Record<string, unknown> | undefined || {}), steps };
  const { error } = await supabase
    .from('surveys')
    .update({ config: nextConfig, updated_at: new Date().toISOString() })
    .eq('slug', slug);
  if (error) throw error;
}
