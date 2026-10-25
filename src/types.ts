/** GitHub's five contribution intensity levels, from empty to most active. */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: string;
  level: ContributionLevel;
  count?: number;
}

export interface CellPosition {
  x: number;
  y: number;
}

/** A null date marks padding or a day absent from the source calendar. */
export interface CalendarCell extends CellPosition {
  date: string | null;
  level: ContributionLevel;
  count?: number;
}

/** Dense column-major grid: each column contains Sunday through Saturday. */
export interface CalendarGrid {
  width: number;
  height: 7;
  cells: CalendarCell[];
  from: string;
  to: string;
}

export type Keyframe = [time: number, opacity: number];

export interface SampledCell extends CalendarCell {
  contributionOpacity: number;
  logoOpacity: number;
}

export type Theme = 'dark' | 'light';
export type RenderMode = 'animated' | 'logo' | 'calendar';

export interface RenderOptions {
  username?: string;
  theme?: Theme;
  mode?: RenderMode;
}

export type ContributionSource = 'fixture' | 'github-public' | 'github-graphql';

export interface ContributionResult {
  days: ContributionDay[];
  source: Exclude<ContributionSource, 'fixture'>;
}

/** Concrete request shape also makes injected fetch implementations easy to inspect. */
export interface ContributionRequestOptions {
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  signal: AbortSignal;
  body?: string;
}

export type FetchImplementation = (
  url: string,
  options: ContributionRequestOptions,
) => Promise<Response>;

export interface FetchContributionsOptions {
  token?: string;
  fetchImpl?: FetchImplementation;
  timeoutMs?: number;
}

export interface CalendarMetadata {
  username: string;
  source: ContributionSource;
  from: string;
  to: string;
  weeks: number;
  rows: 7;
  dayCount: number;
  days: ContributionDay[];
}
