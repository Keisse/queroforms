import type { Step } from '../data/gpIa';

const REQUIRED_KINDS: Step['kind'][] = ['intro', 'branch', 'email', 'name', 'processing', 'result'];
const PROTECTED_KINDS = new Set<Step['kind']>(REQUIRED_KINDS);
const PRE_RESULT_STEP_ID = 'insight-pre-result-guide';
const RESULT_DIMENSIONS = ['planejamento', 'riscos', 'decisao', 'comunicacao', 'automacao', 'confianca'] as const;

export type SurveyValidation = {
  valid: boolean;
  errors: string[];
};

export function isProtectedStructuralStep(step: Step) {
  return PROTECTED_KINDS.has(step.kind) || step.id === PRE_RESULT_STEP_ID;
}

function isScoreableQuestion(step: Step, dimension: string) {
  if (step.kind !== 'question' || step.input === 'multi' || step.dimension !== dimension) return false;
  return step.options.filter(option => typeof option.score === 'number').length >= 2;
}

export function validateSurveyStructure(steps: Step[]): SurveyValidation {
  const errors: string[] = [];

  if (!steps.length) return { valid: false, errors: ['O diagnóstico não pode ficar vazio.'] };

  const ids = new Set<string>();
  for (const step of steps) {
    if (!step.id.trim()) errors.push('Existe uma tela sem ID.');
    if (ids.has(step.id)) errors.push(`ID de tela duplicado: ${step.id}.`);
    ids.add(step.id);

    if ('title' in step && !step.title.trim()) {
      errors.push(`A tela ${step.id} está sem título.`);
    }

    if (step.kind === 'intro' && !step.body.trim()) {
      errors.push('A abertura está sem pergunta/texto.');
    }

    if (step.kind === 'branch') {
      for (const key of ['sim', 'nao']) {
        const variant = step.variants[key];
        if (!variant) {
          errors.push(`A resposta condicional precisa da variante ${key}.`);
          continue;
        }
        if (!variant.title.trim()) errors.push(`A variante ${key} da resposta condicional está sem título.`);
        if (!variant.body.trim()) errors.push(`A variante ${key} da resposta condicional está sem texto.`);
      }
    }

    if (step.kind === 'question') {
      if (!step.title.trim()) errors.push(`A pergunta ${step.id} está sem título.`);
      if (step.options.length < 2) errors.push(`A pergunta ${step.id} precisa ter pelo menos duas opções.`);
      const optionValues = new Set<string>();
      for (const option of step.options) {
        if (!option.label.trim()) errors.push(`A pergunta ${step.id} possui uma opção sem rótulo.`);
        if (!option.value.trim()) errors.push(`A pergunta ${step.id} possui uma opção sem valor.`);
        if (optionValues.has(option.value)) errors.push(`A pergunta ${step.id} possui valores de opção duplicados.`);
        optionValues.add(option.value);
      }
    }
  }

  for (const kind of REQUIRED_KINDS) {
    const count = steps.filter(step => step.kind === kind).length;
    if (count !== 1) errors.push(`O diagnóstico precisa ter exatamente uma tela do tipo ${kind}; encontrou ${count}.`);
  }

  const preResultCount = steps.filter(step => step.id === PRE_RESULT_STEP_ID).length;
  if (preResultCount !== 1) {
    errors.push(`O diagnóstico precisa ter exatamente uma tela de preparação do resultado; encontrou ${preResultCount}.`);
  }

  for (const dimension of RESULT_DIMENSIONS) {
    if (!steps.some(step => isScoreableQuestion(step, dimension))) {
      errors.push(`O resultado precisa de pelo menos uma pergunta pontuável na dimensão ${dimension}.`);
    }
  }

  if (steps[0]?.kind !== 'intro') errors.push('A abertura precisa ser a primeira tela.');
  if (steps[1]?.kind !== 'branch') errors.push('A resposta condicional precisa ser a segunda tela.');
  if (steps[steps.length - 1]?.kind !== 'result') errors.push('O resultado precisa ser a última tela.');

  const emailIndex = steps.findIndex(step => step.kind === 'email');
  const nameIndex = steps.findIndex(step => step.kind === 'name');
  const processingIndex = steps.findIndex(step => step.kind === 'processing');
  const resultIndex = steps.findIndex(step => step.kind === 'result');
  const preResultIndex = steps.findIndex(step => step.id === PRE_RESULT_STEP_ID);

  if (emailIndex >= 0 && nameIndex >= 0 && emailIndex > nameIndex) {
    errors.push('A captura de e-mail precisa vir antes da captura de nome.');
  }
  if (nameIndex >= 0 && processingIndex >= 0 && nameIndex > processingIndex) {
    errors.push('A captura de nome precisa vir antes do processamento.');
  }
  if (processingIndex >= 0 && resultIndex >= 0 && processingIndex > resultIndex) {
    errors.push('O processamento precisa vir antes do resultado.');
  }
  if (preResultIndex >= 0 && resultIndex >= 0 && preResultIndex !== resultIndex - 1) {
    errors.push('A tela de preparação do resultado precisa ficar imediatamente antes do resultado.');
  }
  if (preResultIndex >= 0 && processingIndex >= 0 && processingIndex > preResultIndex) {
    errors.push('A tela de preparação do resultado precisa vir depois do processamento.');
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
