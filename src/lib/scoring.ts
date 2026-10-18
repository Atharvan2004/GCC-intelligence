import type { CityAggregate, CityScore, Priority, SyntheticGCC, TalentCompensation } from '@/types';
import { getCityAggregates, getGccsByCity, getTalentByCity } from './data';
import { RECOMMENDED_CITIES, normalizeCity } from './normalize';

type ScoreMetricKey = 'talentFit' | 'operatingCost' | 'ecosystem' | 'officeSuitability' | 'infrastructure';

interface RawScores {
  talentFit: number | null;
  operatingCost: number | null;
  ecosystem: number | null;
  officeSuitability: number | null;
  infrastructure: number | null;
}

function getWeightSet(priority: Priority): Record<ScoreMetricKey, number> {
  switch (priority) {
    case 'cost':
      return { talentFit: 0.20, operatingCost: 0.40, ecosystem: 0.15, officeSuitability: 0.15, infrastructure: 0.10 };
    case 'talent':
      return { talentFit: 0.45, operatingCost: 0.15, ecosystem: 0.20, officeSuitability: 0.10, infrastructure: 0.10 };
    default:
      return { talentFit: 0.30, operatingCost: 0.25, ecosystem: 0.20, officeSuitability: 0.15, infrastructure: 0.10 };
  }
}

function minMaxNormalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

function inverseMinMaxNormalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return 100 - ((value - min) / (max - min)) * 100;
}

function computeRawScores(
  cities: string[],
  cityAggregates: Map<string, CityAggregate>,
  gccsByCity: Map<string, SyntheticGCC[]>,
  talentByCity: Map<string, TalentCompensation[]>,
): Map<string, RawScores> {
  const rawMap = new Map<string, RawScores>();

  const rentValues: number[] = [];
  const talentValues: number[] = [];
  const infraValues: number[] = [];
  const gccCounts: number[] = [];
  const attritionValues: number[] = [];

  for (const city of cities) {
    const agg = cityAggregates.get(city);
    if (agg) {
      if (agg.avgRentSqftInr !== null) rentValues.push(agg.avgRentSqftInr);
      if (agg.totalTalentPool !== null) talentValues.push(agg.totalTalentPool);
      if (agg.avgInfrastructureScore !== null) infraValues.push(agg.avgInfrastructureScore);
      if (agg.avgAttritionRate !== null) attritionValues.push(agg.avgAttritionRate);
    }
    const gccs = gccsByCity.get(city);
    if (gccs) gccCounts.push(gccs.length);
  }

  const rentMin = Math.min(...rentValues);
  const rentMax = Math.max(...rentValues);
  const talentMin = Math.min(...talentValues);
  const talentMax = Math.max(...talentValues);
  const infraMin = Math.min(...infraValues);
  const infraMax = Math.max(...infraValues);
  const gccMin = Math.min(...gccCounts.length ? gccCounts : [0]);
  const gccMax = Math.max(...gccCounts.length ? gccCounts : [0]);
  const attrMin = Math.min(...attritionValues);
  const attrMax = Math.max(...attritionValues);

  for (const city of cities) {
    const agg = cityAggregates.get(city);
    const gccs = gccsByCity.get(city);
    const talent = talentByCity.get(city);

    const notes: string[] = [];
    const raw: RawScores = {
      talentFit: null,
      operatingCost: null,
      ecosystem: null,
      officeSuitability: null,
      infrastructure: null,
    };

    if (agg) {
      if (agg.totalTalentPool !== null) {
        let talentScore = minMaxNormalize(agg.totalTalentPool, talentMin, talentMax);
        if (agg.avgAttritionRate !== null) {
          const attrScore = inverseMinMaxNormalize(agg.avgAttritionRate, attrMin, attrMax);
          talentScore = talentScore * 0.7 + attrScore * 0.3;
        }
        raw.talentFit = talentScore;
      } else {
        notes.push('Talent pool data not available');
      }

      if (agg.avgRentSqftInr !== null) {
        raw.operatingCost = inverseMinMaxNormalize(agg.avgRentSqftInr, rentMin, rentMax);
      } else {
        notes.push('Rent data not available');
      }

      if (agg.avgInfrastructureScore !== null) {
        raw.infrastructure = minMaxNormalize(agg.avgInfrastructureScore, infraMin, infraMax);
      } else {
        notes.push('Infrastructure data not available');
      }

      if (agg.microMarketCount > 0) {
        raw.officeSuitability = Math.min(agg.microMarketCount / 8 * 100, 100);
        if (agg.hasSez) {
          raw.officeSuitability = Math.min(raw.officeSuitability + 10, 100);
        }
      } else {
        notes.push('Office suitability data not available');
      }
    } else {
      notes.push('No micro-market data for this city');
    }

    if (gccs) {
      raw.ecosystem = gccs.length > 0 && gccMax > 0 ? minMaxNormalize(gccs.length, gccMin, gccMax) : null;
      if (raw.ecosystem === null) {
        notes.push('No GCC ecosystem data');
      }
    } else {
      notes.push('No GCC ecosystem data');
    }

    if (talent && talent.length === 0) {
      notes.push('No compensation data for this city');
    }

    rawMap.set(city, raw);
  }

  return rawMap;
}

export function scoreCities(
  priority: Priority = 'balanced',
  cities: string[] = RECOMMENDED_CITIES,
): CityScore[] {
  const validCities = [...new Set(cities.map((city) => normalizeCity(city)).filter((city) => RECOMMENDED_CITIES.includes(city)))];
  const cityAggregates = getCityAggregates();
  const gccsByCity = getGccsByCity();
  const talentByCity = getTalentByCity();

  const rawScores = computeRawScores(validCities, cityAggregates, gccsByCity, talentByCity);
  const weights = getWeightSet(priority);

  const results: CityScore[] = validCities.map((city) => {
    const raw = rawScores.get(city) ?? {
      talentFit: null,
      operatingCost: null,
      ecosystem: null,
      officeSuitability: null,
      infrastructure: null,
    };
    const notes: string[] = [];

    let total = 0;
    let appliedWeight = 0;

    (Object.keys(weights) as ScoreMetricKey[]).forEach((key) => {
      const rawVal = raw[key];
      const weight = weights[key];
      if (rawVal !== null) {
        total += rawVal * weight;
        appliedWeight += weight;
      } else {
        notes.push(`${key} data not available — weight redistributed`);
      }
    });

    const finalTotal = appliedWeight > 0 ? total / appliedWeight : null;

    return {
      city,
      score: {
        talentFit: raw.talentFit,
        operatingCost: raw.operatingCost,
        ecosystem: raw.ecosystem,
        officeSuitability: raw.officeSuitability,
        infrastructure: raw.infrastructure,
        total: finalTotal === null ? null : Math.round(finalTotal * 10) / 10,
      },
      rank: 0,
      notes: notes.length > 0 ? notes : ['Full score coverage'],
    };
  });

  results.sort((a, b) => {
    const aTotal = a.score.total ?? Number.NEGATIVE_INFINITY;
    const bTotal = b.score.total ?? Number.NEGATIVE_INFINITY;
    return bTotal - aTotal;
  });
  results.forEach((r, i) => { r.rank = i + 1; });

  return results;
}
