// R6 Intel data layer — bundled snapshots of r6calls.com open data.
// Source: https://www.r6calls.com — all data belongs to r6calls.com.

export interface Operator {
  nickName: string;
  status: string;
  organization: string;
  prevOrganization?: string;
  squad?: string;
  firstName: string;
  lastName: string;
  town: string;
  state: string;
  country: string;
  monthNumber: string;
  dayNumber: string;
  age: string;
  height: string;
  weight: string;
  side: "attackers" | "defenders";
  quote: string;
  biographyParagraphs: string[];
  psychologicalReportParagraphs?: string[];
  operation?: string;
}

export interface Weapon {
  name: string;
  type: string;
  country?: string;
  operation?: string;
  descriptionParagraphs?: string[];
}

export interface Gadget {
  name: string;
  type: string;
  operation?: string;
  descriptionParagraphs?: string[];
}

export interface Operation {
  id: string;
  color?: string;
  name: string;
  year: number;
  season: number;
  releaseMonth?: number;
  releaseYear?: number;
  doc?: string;
}

export interface Organization {
  id: string;
  color?: string;
  short?: string;
  name: string;
  doc?: string;
  operation?: string;
}

export interface Squad {
  id: string;
  color?: string;
  short?: string;
  name: string;
  quote?: string;
  doc?: string;
  operation?: string;
}

export interface LocationInfo {
  id: string;
  name: string;
  town?: string;
  state?: string;
  country?: string;
  operation?: string;
  doc?: string;
}

const UNDEFINED = "Undefined";

/** r6calls marks missing fields with the literal string "Undefined". */
export const isKnown = (v: string | undefined | null): boolean =>
  !!v && v !== UNDEFINED;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`./r6intel/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return (await res.json()) as T;
}

let operatorsCache: Operator[] | null = null;
export async function loadOperators(): Promise<Operator[]> {
  if (!operatorsCache) {
    const d = await fetchJson<{ operators: Operator[] }>("operators.json");
    operatorsCache = d.operators;
  }
  return operatorsCache;
}

let weaponsCache: { weapons: Weapon[]; gadgets: Gadget[]; types: Array<{ id: string; name: string }> } | null = null;
export async function loadWeapons() {
  if (!weaponsCache) weaponsCache = await fetchJson("weapons.json");
  return weaponsCache;
}

let r6Cache: { operations: Operation[]; organizations: Organization[]; squads: Squad[] } | null = null;
export async function loadRainbowSix() {
  if (!r6Cache) r6Cache = await fetchJson("rainbowsix.json");
  return r6Cache;
}

let locationsCache: LocationInfo[] | null = null;
export async function loadLocations(): Promise<LocationInfo[]> {
  if (!locationsCache) {
    const d = await fetchJson<{ locations: LocationInfo[] }>("locations.json");
    locationsCache = d.locations;
  }
  return locationsCache;
}
