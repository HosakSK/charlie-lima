/**
 * Briefing Parser - processes [IF ...] conditions and variable substitution
 * Ported from getBriefingValidSentences() in script.js
 */

import type { ChecklistItem, ChecklistPage } from '@/hooks/store/useChecklistStore';

// Map of placeholder -> briefing store field
const VARIABLE_MAP: Record<string, string> = {
  '%callsign%': 'callsign',
  '%origin%': 'origin',
  '%dest%': 'dest',
  '%dep_atis%': 'depAtis',
  '%dep_qnh%': 'depQnh',
  '%dep_rwy%': 'depRwy',
  '%dep_rwy_hdg%': 'depRwyHdg',
  '%sid%': 'sid',
  '%init_alt%': 'initAlt',
  '%dep_tl%': 'depTl',
  '%squawk%': 'squawk',
  '%dep_dewpt%': 'depDewpt',
  '%dep_temp%': 'depTemp',
  '%dep_wind%': 'depWind',
  '%total_fuel%': 'totalFuel',
  '%trip_fuel%': 'tripFuel',
  '%reserve_fuel%': 'reserveFuel',
  '%v1%': 'v1',
  '%vr%': 'vr',
  '%v2%': 'v2',
  '%trim%': 'trim',
  '%dep_flaps%': 'depFlaps',
  '%dep_assumed%': 'depAssumed',
  '%taxi_out%': 'taxiOut',
  '%arr_atis%': 'arrAtis',
  '%arr_qnh%': 'arrQnh',
  '%arr_rwy%': 'arrRwy',
  '%landing_type%': 'landingType',
  '%arr_ta%': 'arrTa',
  '%star%': 'star',
  '%arr_dewpt%': 'arrDewpt',
  '%arr_temp%': 'arrTemp',
  '%arr_wind%': 'arrWind',
  '%ils_freq%': 'ilsFreq',
  '%course%': 'course',
  '%minima%': 'minima',
  '%ga_alt%': 'gaAlt',
  '%vref%': 'vref',
  '%arr_flaps%': 'arrFlaps',
  '%autobrake%': 'autobrake',
  '%taxi_in%': 'taxiIn',
  '%gate%': 'gate',
  '%notes%': 'notes',
};

/**
 * Replace %var% placeholders with actual briefing values
 */
export function parseVariables(
  text: string,
  briefingState: Record<string, string>,
  forSpeech = false
): string {
  let result = text;
  for (const [placeholder, field] of Object.entries(VARIABLE_MAP)) {
    const value = briefingState[field] || '';
    result = result.replace(new RegExp(placeholder.replace(/%/g, '%'), 'g'), value);
  }
  return result;
}

/**
 * Process briefing sentences with [IF ...] conditional logic
 * Returns array of valid sentences for the current state
 */
export function getBriefingValidSentences(
  item: ChecklistItem,
  briefingState: Record<string, string>,
  allPages: ChecklistPage[],
  forSpeech = false
): string[] {
  if (!item.briefing || !Array.isArray(item.briefing)) return [];

  const validSentences: string[] = [];

  for (const line of item.briefing) {
    let processedLine = line;

    // Handle [IF variable]...[/IF] blocks
    const ifRegex = /\[IF\s+([^\]]+)\](.*?)\[\/IF\]/gs;
    let hasFailedCondition = false;

    processedLine = processedLine.replace(ifRegex, (_match, condition: string, content: string) => {
      const condTrimmed = condition.trim();

      // Check if it's a briefing variable condition (has %)
      if (condTrimmed.includes('%')) {
        const varName = condTrimmed.replace(/%/g, '');
        const mappedField = VARIABLE_MAP[`%${varName}%`];
        if (mappedField && briefingState[mappedField]) {
          return content;
        }
        hasFailedCondition = true;
        return '';
      }

      // Check if it's a checklist item condition (check if named item was checked)
      for (const page of allPages) {
        for (const checkItem of page.items) {
          if (checkItem.name.toLowerCase() === condTrimmed.toLowerCase() && checkItem.checked) {
            return content;
          }
        }
      }

      hasFailedCondition = true;
      return '';
    });

    // Replace variables
    processedLine = parseVariables(processedLine, briefingState, forSpeech);

    // Skip line if it still has unfilled variables or failed conditions
    if (processedLine.includes('%') && processedLine.match(/%[a-z_]+%/)) continue;
    if (hasFailedCondition && !processedLine.trim()) continue;

    processedLine = processedLine.trim();
    if (processedLine) {
      validSentences.push(processedLine);
    }
  }

  return validSentences;
}
