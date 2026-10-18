import microMarketsData from '@/data/micro_markets.json';
import talentCompData from '@/data/talent_compensation.json';
import syntheticGccsData from '@/data/synthetic_gccs.json';
import serviceProvidersData from '@/data/service_providers.json';
import type {
  MicroMarket,
  TalentCompensation,
  SyntheticGCC,
  ServiceProvider,
  CityAggregate,
} from '@/types';
import { normalizeCity } from './normalize';

export const microMarkets = microMarketsData as MicroMarket[];
export const talentCompensation = talentCompData as TalentCompensation[];
export const syntheticGccs = syntheticGccsData as SyntheticGCC[];
export const serviceProviders = serviceProvidersData as ServiceProvider[];

function parseAttrition(s: string): number | null {
  const match = s.match(/([\d.]+)%/);
  return match ? parseFloat(match[1]) : null;
}

export function getCityAggregates(): Map<string, CityAggregate> {
  const cityMap = new Map<string, CityAggregate>();
  for (const mm of microMarkets) {
    const canonical = normalizeCity(mm.city);
    const existing = cityMap.get(canonical);
    const attrition = parseAttrition(mm.attrition_rate);
    if (existing) {
      existing.avgRentSqftInr = existing.avgRentSqftInr === null
        ? mm.avg_rent_sqft_inr
        : (existing.avgRentSqftInr + mm.avg_rent_sqft_inr) / 2;
      existing.totalTalentPool = existing.totalTalentPool === null
        ? mm.total_tech_talent_pool
        : (existing.totalTalentPool ?? 0) + mm.total_tech_talent_pool;
      existing.avgAttritionRate = attrition === null
        ? existing.avgAttritionRate
        : existing.avgAttritionRate === null
          ? attrition
          : (existing.avgAttritionRate + attrition) / 2;
      if (mm.sez_availability) existing.hasSez = true;
      existing.stateCapexSubsidyPercent = mm.state_capex_subsidy_percent;
      existing.avgInfrastructureScore = existing.avgInfrastructureScore === null
        ? mm.infrastructure_score
        : (existing.avgInfrastructureScore + mm.infrastructure_score) / 2;
      existing.microMarketCount++;
    } else {
      cityMap.set(canonical, {
        canonicalName: canonical,
        tier: mm.tier,
        avgRentSqftInr: mm.avg_rent_sqft_inr,
        totalTalentPool: mm.total_tech_talent_pool,
        avgAttritionRate: attrition,
        hasSez: mm.sez_availability,
        stateCapexSubsidyPercent: mm.state_capex_subsidy_percent,
        avgInfrastructureScore: mm.infrastructure_score,
        microMarketCount: 1,
      });
    }
  }
  return cityMap;
}

export function getGccsByCity(): Map<string, SyntheticGCC[]> {
  const map = new Map<string, SyntheticGCC[]>();
  for (const gcc of syntheticGccs) {
    for (const loc of gcc.india_locations) {
      const canonical = normalizeCity(loc);
      const arr = map.get(canonical) ?? [];
      arr.push(gcc);
      map.set(canonical, arr);
    }
  }
  return map;
}

export function getTalentByCity(): Map<string, TalentCompensation[]> {
  const map = new Map<string, TalentCompensation[]>();
  for (const tc of talentCompensation) {
    const canonical = normalizeCity(tc.city);
    const arr = map.get(canonical) ?? [];
    arr.push(tc);
    map.set(canonical, arr);
  }
  return map;
}

export function getIndustries(): string[] {
  return [...new Set(syntheticGccs.map(g => g.primary_industry))].sort();
}

export function getFunctions(): string[] {
  const funcs = new Set<string>();
  for (const gcc of syntheticGccs) {
    for (const f of gcc.primary_functions) funcs.add(f);
  }
  return [...funcs].sort();
}

export function getCountries(): string[] {
  return [...new Set(syntheticGccs.map(g => g.parent_hq_country))].sort();
}

export function getOperatingModels(): string[] {
  return [...new Set(syntheticGccs.map(g => g.operating_model))].sort();
}
