import type { ContributionLevel } from './types.js';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isContributionLevel(value: unknown): value is ContributionLevel {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4;
}
