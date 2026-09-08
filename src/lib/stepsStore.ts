import { gpIaSteps, Step } from '../data/gpIa';

const KEY = 'qf_gp_ia_steps_v1';

export function loadSteps(): Step[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return gpIaSteps;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed as Step[];
    return gpIaSteps;
  } catch {
    return gpIaSteps;
  }
}

export function saveSteps(steps: Step[]) {
  window.localStorage.setItem(KEY, JSON.stringify(steps));
}

export function resetSteps() {
  window.localStorage.removeItem(KEY);
}

export function hasCustomSteps(): boolean {
  return !!window.localStorage.getItem(KEY);
}
