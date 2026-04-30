/**
 * NATO Alphabet and abbreviation spelling logic ported from script.js
 * Used by the voice engine for text-to-speech processing
 */

const NATO_ALPHABET: Record<string, string> = {
  A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo',
  F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliet',
  K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar',
  P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
  U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee',
  Z: 'Zulu'
};

const DONT_SPELL = new Set([
  'ON', 'OFF', 'UP', 'SET', 'RTO', 'MDA', 'DH', 'ARM', 'TEST', 'DOWN', 'AUTO',
  'OPEN', 'MAX', 'MIN', 'RUN', 'BOTH', 'IDLE', 'EXT', 'START', 'GRD', 'LOW',
  'ALL', 'REV', 'APR', 'TWO', 'OR', 'AS', 'TO', 'IF', 'BY', 'IS', 'IN',
  'CONTINUOUS', 'BRT', 'DIM', 'FMC', 'NOT'
]);

const CLASSIC_SPELL_EXCEPTIONS = new Set([
  'IRS', 'FD', 'YAW', 'MCP', 'CDU', 'IRU', 'ISFD', 'A/T', 'N1',
  'EPR', 'LNAV', 'VNAV', 'HDG', 'TCAS', 'WX', 'TA', 'RA',
  'AC', 'APU', 'GPU', 'DC', 'QNH', 'RWY', 'SID', 'STAR'
]);

/**
 * Converts abbreviations to speakable text with NATO alphabet spelling
 * Exact port of spellAbbreviations() from script.js
 */
export function spellAbbreviations(text: string, skipSpelling = false): string {
  // Pre-processing: aviation abbreviations to readable text
  text = text
    .replace(/\bA\/T\b/gi, 'Autothrottle')
    .replace(/\bAFDS\b/gi, 'A F D S')
    .replace(/\bF\/D\b/gi, 'Flight Director')
    .replace(/\bN1\b/g, 'N 1')
    .replace(/\bL\s+SIDE\b/gi, 'left side')
    .replace(/\bR\s+SIDE\b/gi, 'right side')
    .replace(/\bL\s*&\s*R\b/gi, 'left and right')
    .replace(/\bG\/S\b/gi, 'glide slope')
    .replace(/\bP-inhibit\b/gi, 'p inhibit')
    .replace(/(\d+(?:\.\d+)?)\s*l\b/gi, '$1 liters')
    .replace(/([-+]?\d+)\s*(?:°|degrees)?\s*c\b/gi, '$1 celsius')
    .replace(/°\s*C\b/gi, 'celsius')
    .replace(/\bIGN R\b/gi, 'ignition right')
    .replace(/\bWXR\b/gi, 'weather')
    .replace(/\bINIT ALT\b/gi, 'initial altitude')
    .replace(/100\s*%/g, 'one hundred percent')
    .replace(/\bGRD\b/gi, 'ground')
    .replace(/CDU DEP\/ARR, LEGS, DES pages/gi, 'CDU departure approach, legs and des pages')
    .replace(/\bDEP\/ARR\b/gi, 'departure approach')
    .replace(/\bP6\b/gi, 'p 6')
    .replace(/\bP18\b/gi, 'p 18');

  // Explicitly read decimal dots in numbers (e.g., trim 5.5 -> 5 dot 5)
  text = text.replace(/(\d+)\.(\d+)/g, '$1 dot $2');

  if (skipSpelling) {
    let result = text.replace(/\b(\d{2,})\b/g, (match) => match.split('').join(' '));
    return result.replace(/0/g, 'zero');
  }

  // 1. NATO Spelling and exceptions
  let result = text.replace(/\b([a-zA-Z0-9]+)\b/g, (match) => {
    const upper = match.toUpperCase();

    if (CLASSIC_SPELL_EXCEPTIONS.has(upper)) {
      return upper.split('').join(' ');
    }

    if (/^[A-Z0-9]+$/.test(match) && /[A-Z]/.test(match)) {
      if (DONT_SPELL.has(match)) return match;

      return match.split('').map(char => {
        if (/[A-Z]/.test(char)) return NATO_ALPHABET[char];
        return char;
      }).join(' ');
    }

    return match;
  });

  // 2. Numbers with 2+ digits: read individually (100 → "1 0 0")
  result = result.replace(/\b(\d{2,})\b/g, (match) => match.split('').join(' '));

  return result.replace(/0/g, 'zero').replace(/9/g, 'niner');
}
