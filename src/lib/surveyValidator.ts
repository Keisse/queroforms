import type { Step } from '../data/gpIa';

const REQUIRED_KINDS: Step['kind'][] = ['intro', 'branch', 'email', 'name', 'processing', 'result'];
const PROTECTED_KINDS = new Set<Step['kind']>(REQUIRED_KINDS);

export type SurveyValidation = {
  valid: boolean;
  errors: string[];
};

export function isProtectedStructuralStep(step: Step) {
  return PROTECTED_KINDS.has(step.kind);
}

export function validateSurveyStructure(steps: Step[]): SurveyValidation {
  const errors: string[] = [];

  if (!steps.length) return { valid: false, errors: ['O diagnóstico não pode ficar vazio.'] };

  const ids = new Set<string>();
  for (const step of steps) {
    if (!step.id.trim()) errors.push('Existe uma tela sem ID.');
    if (ids.has(step.id)) errors.push(`ID de tela duplicado: ${step.id}.`);
    ids.add(step.id);

    if (step.kind === 'question') {
      if (!step.title.trim()) errors.push(`A pergunta ${step.id} está sem título.`);
      if (step.options.length < 2) errors.push(`A pergunta ${step.id} precisa ter pelo menos duas opções.`);
      const optionValues = new Set<string>();
      for (const option of step.options) {
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

  if (steps[0]?.kind !== 'intro') errors.push('A abertura precisa ser a primeira tela.');
  if (steps[1]?.kind !== 'branch') errors.push('A resposta condicional precisa ser a segunda tela.');
  if (steps[steps.length - 1]?.kind !== 'result') errors.push('O resultado precisa ser a última tela.');

  const emailIndex = steps.findIndex(step => step.kind === 'email');
  const nameIndex = steps.findIndex(step => step.kind === 'name');
  const processingIndex = steps.findIndex(step => step.kind === 'processing');
  const resultIndex = steps.findIndex(step => step.kind === 'result');

  if (emailIndex >= 0 && nameIndex >= 0 && emailIndex > nameIndex) {
    errors.push('A captura de e-mail precisa vir antes da captura de nome.');
  }
  if (nameIndex >= 0 && processingIndex >= 0 && nameIndex > processingIndex) {
    errors.push('A captura de nome precisa vir antes do processamento.');
  }
  if (processingIndex >= 0 && resultIndex >= 0 && processingIndex > resultIndex) {
    errors.push('O processamento precisa vir antes do resultado.');
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
