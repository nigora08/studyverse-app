export interface Concept {
  topic: string;
  definitions: string[];
  formulas: string[];
  relationships: string[];
  misconceptions: string[];
  applications: string[];
  rawText: string;
}

export function extractConcepts(text: string): Concept {
  const lower = text.toLowerCase();
  const formulas: string[] = [];
  const definitions: string[] = [];
  
  // Simple extraction for key formulas
  if (lower.includes('f = ma') || lower.includes('f=ma') || lower.includes("newton's second") || lower.includes('force equals mass')) {
    formulas.push('F = ma');
    definitions.push("Newton's Second Law: Force equals mass times acceleration.");
  }
  if (lower.includes('derivative') || lower.includes('d/dx') || lower.includes('tangent')) {
    formulas.push('f\'(x) = lim h→0 [f(x+h) - f(x)] / h');
    definitions.push('Derivative represents the instantaneous rate of change or slope of the tangent line.');
  }
  if (lower.includes('cell') && (lower.includes('nucleus') || lower.includes('mitochondria') || lower.includes('membrane'))) {
    definitions.push('Cell: basic unit of life containing organelles like nucleus (DNA), mitochondria (energy), membrane (boundary).');
  }

  // Extract sentences as potential content
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20).slice(0, 5);
  definitions.push(...sentences);

  return {
    topic: text.slice(0, 40).replace(/\n/g, ' ') + (text.length > 40 ? '...' : ''),
    definitions: definitions.length ? definitions : ['Key concepts extracted from your notes.'],
    formulas: formulas.length ? formulas : [],
    relationships: ['Force causes acceleration proportional to mass.'],
    misconceptions: ['Heavier objects fall faster (ignoring air resistance).'],
    applications: ['Calculating acceleration of a cart with applied force.'],
    rawText: text
  };
}

export const SAMPLE_PHYSICS = `Newton's Second Law of Motion: The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. F = ma, where F is force in Newtons, m is mass in kg, a is acceleration in m/s². To move a heavy cart, you need more force. Common misconception: mass doesn't affect acceleration under gravity without air resistance.`;

export const SAMPLE_CALC = `The derivative of a function f(x) at a point is the slope of the tangent line to the curve at that point. It measures the instantaneous rate of change. For f(x) = x², f'(x) = 2x. Adjust the tangent slope to match the derivative.`;

export const SAMPLE_BIO = `A eukaryotic cell has a nucleus containing DNA, mitochondria for energy production via ATP, and a cell membrane controlling entry. Place organelles correctly to repair the cell.`;
