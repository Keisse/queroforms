export const META_PIXEL_ID = '753711627811080';
const SCRIPT_ID = 'qf-meta-pixel';

type PixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push?: PixelFunction;
  loaded: boolean;
  version: string;
};
type PixelWindow = Window & {
  fbq?: PixelFunction;
  _fbq?: PixelFunction;
  qfMetaPixelInitialized?: boolean;
};

export type QuizPixelView = {
  surveySlug: string;
  stepId: string;
  stepKind: string;
  stepIndex: number;
  attemptId: string;
  preview: boolean;
};

function initializePixel(host: PixelWindow): PixelFunction {
  if (!host.fbq) {
    const fbq: PixelFunction = Object.assign(function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    }, { queue: [] as unknown[][], loaded: true, version: '2.0' });
    fbq.push = fbq;
    host.fbq = fbq;
    if (!host._fbq) host._fbq = fbq;
  }
  if (!host.document.getElementById(SCRIPT_ID)) {
    const script = host.document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    host.document.head.appendChild(script);
  }
  if (!host.qfMetaPixelInitialized) {
    host.fbq('init', META_PIXEL_ID);
    host.qfMetaPixelInitialized = true;
  }
  return host.fbq;
}

// Owned by the public renderer, independent of editable survey content.
// No answers, names, emails or scores are sent as event parameters.
export function createQuizPixelTracker(host: PixelWindow = window) {
  let lastView = '';
  const sentLeads = new Set<string>();

  return (view: QuizPixelView) => {
    if (view.preview || new URLSearchParams(host.location.search).has('preview') ||
        !/^\/d\/[^/]+\/?$/.test(host.location.pathname)) return;

    const viewKey = JSON.stringify([view.surveySlug, view.attemptId, view.stepIndex, view.stepId]);
    const leadKey = `qf:meta-lead:${META_PIXEL_ID}:${view.surveySlug}:${view.attemptId}`;
    const parameters = {
      content_name: view.surveySlug,
      survey_slug: view.surveySlug,
      screen_id: view.stepId,
      screen_kind: view.stepKind,
      screen_number: view.stepIndex + 1,
    };

    // Tracking failures must never stop the diagnosis or result rendering.
    try {
      const fbq = initializePixel(host);
      if (lastView !== viewKey) {
        fbq('trackSingle', META_PIXEL_ID, 'PageView', parameters);
        lastView = viewKey;
      }
      if (view.stepKind !== 'result' || sentLeads.has(leadKey)) return;
      try {
        if (host.sessionStorage.getItem(leadKey)) {
          sentLeads.add(leadKey);
          return;
        }
      } catch { /* Private browsing can disable storage. */ }
      fbq('trackSingle', META_PIXEL_ID, 'Lead', parameters);
      sentLeads.add(leadKey);
      try { host.sessionStorage.setItem(leadKey, '1'); } catch { /* In-memory guard remains. */ }
    } catch { /* Blocked pixels must not interrupt the public quiz. */ }
  };
}
