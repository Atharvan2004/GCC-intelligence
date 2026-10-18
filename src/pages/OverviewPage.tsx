import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Briefcase, Building2, ChartNoAxesCombined, MapPinned } from 'lucide-react';
import { calcCityCostBreakdown } from '@/lib/costCalc';
import { getGccsByCity, microMarkets, syntheticGccs } from '@/lib/data';
import { useForm } from '@/lib/formContext';
import { normalizeCity, RECOMMENDED_CITIES } from '@/lib/normalize';
import { scoreCities } from '@/lib/scoring';
import type { CityScore } from '@/types';

type Page = 'overview' | 'directory' | 'plan' | 'sources';

interface OverviewPageProps {
  onNavigate: (page: Page) => void;
}

interface CityValue {
  city: string;
  value: number | null;
}

type Direction = 'ascending' | 'descending';

function sortCityValues(values: CityValue[], direction: Direction): CityValue[] {
  return [...values].sort((a, b) => {
    if (a.value === null) return b.value === null ? 0 : 1;
    if (b.value === null) return -1;
    return direction === 'ascending' ? a.value - b.value : b.value - a.value;
  });
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1, notation: 'compact' }).format(value);
}

interface RankedBarsProps {
  title: string;
  description: string;
  rows: CityValue[];
  direction: Direction;
  formatValue: (value: number) => string;
  unit: string;
  controls?: ReactNode;
}

function RankedBars({ title, description, rows, direction, formatValue, unit, controls }: RankedBarsProps) {
  const sortedRows = sortCityValues(rows, direction);
  const availableValues = sortedRows.flatMap((row) => row.value === null ? [] : [row.value]);
  const maxValue = Math.max(...availableValues, 0);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
        </div>
        {controls}
      </div>
      <div className="mt-5 space-y-4">
        {sortedRows.map(({ city, value }, index) => (
          <div key={city} className="grid grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] items-center gap-3">
            <div className="truncate text-xs font-medium text-stone-700" title={city}>
              <span className="mr-1.5 text-stone-400">{index + 1}.</span>{city}
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-stone-100"
              title={value === null ? `${city}: ${unit} unavailable` : `${city}: ${formatValue(value)} ${unit}`}
              aria-label={value === null ? `${city}: ${unit} unavailable` : `${city}: ${formatValue(value)} ${unit}`}
            >
              {value !== null && maxValue > 0 && (
                <div className="h-full rounded-full bg-stone-700" style={{ width: `${(value / maxValue) * 100}%` }} />
              )}
            </div>
            <div className="text-right text-xs tabular-nums text-stone-700">
              {value === null ? 'N/A' : formatValue(value)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-stone-100 pt-3 text-[11px] text-stone-400">Unit: {unit} · N/A means source data is unavailable.</div>
    </section>
  );
}

interface SuitabilityChartProps {
  cityScores: CityScore[];
}

function SuitabilityChart({ cityScores }: SuitabilityChartProps) {
  const sortedScores = [...cityScores].sort((a, b) => {
    if (a.score.total === null) return b.score.total === null ? 0 : 1;
    if (b.score.total === null) return -1;
    return b.score.total - a.score.total;
  });
  const metrics = [
    { key: 'talentFit', label: 'Talent fit' },
    { key: 'operatingCost', label: 'Operating cost' },
    { key: 'infrastructure', label: 'Infrastructure' },
    { key: 'ecosystem', label: 'GCC ecosystem' },
  ] as const;

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">City suitability comparison</h2>
      <p className="mt-1 text-xs leading-5 text-stone-500">Balanced composite and component scores, normalized to 0–100. Operating cost score is rent-based; higher scores indicate lower rent.</p>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[32rem]">
          <div className="grid grid-cols-[7rem_repeat(4,minmax(4rem,1fr))_4rem] gap-x-2 border-b border-stone-200 pb-2 text-[10px] font-medium uppercase tracking-wide text-stone-500">
            <div>City</div>
            {metrics.map((metric) => <div key={metric.key} className="text-center">{metric.label}</div>)}
            <div className="text-right">Overall</div>
          </div>
          <div className="divide-y divide-stone-100">
            {sortedScores.map(({ city, score }) => (
              <div key={city} className="grid grid-cols-[7rem_repeat(4,minmax(4rem,1fr))_4rem] items-center gap-x-2 py-3">
                <div className="truncate text-xs font-medium text-stone-700" title={city}>{city}</div>
                {metrics.map((metric) => {
                  const value = score[metric.key];
                  return (
                    <div
                      key={metric.key}
                      className="text-center"
                      title={value === null ? `${city} ${metric.label}: unavailable` : `${city} ${metric.label}: ${value.toFixed(1)} / 100`}
                    >
                      <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                        {value !== null && <div className="h-full rounded-full bg-stone-400" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />}
                      </div>
                      <div className="mt-1 text-[10px] tabular-nums text-stone-500">{value === null ? 'N/A' : value.toFixed(0)}</div>
                    </div>
                  );
                })}
                <div className="text-right text-xs font-semibold tabular-nums text-stone-900">{score.total === null ? 'N/A' : score.total.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 border-t border-stone-100 pt-3 text-[11px] text-stone-400">Each component and the composite use a 0–100 score · hover a value for its exact score.</div>
    </section>
  );
}

interface GccCityCount {
  city: string;
  count: number;
}

interface GccCityMapProps {
  cityCounts: GccCityCount[];
}

const CITY_MAP_POSITIONS: Record<string, { x: number; y: number; labelX: number; labelY: number; anchor: 'start' | 'middle' | 'end' }> = {
  'Delhi NCR': { x: 220, y: 112, labelX: 220, labelY: 79, anchor: 'middle' },
  Mumbai: { x: 137, y: 246, labelX: 100, labelY: 277, anchor: 'middle' },
  Pune: { x: 164, y: 222, labelX: 164, labelY: 190, anchor: 'middle' },
  Hyderabad: { x: 232, y: 252, labelX: 269, labelY: 256, anchor: 'start' },
  Bengaluru: { x: 216, y: 322, labelX: 188, labelY: 355, anchor: 'middle' },
  Chennai: { x: 250, y: 331, labelX: 291, labelY: 346, anchor: 'start' },
};

function GccCityMap({ cityCounts }: GccCityMapProps) {
  const maxCount = Math.max(...cityCounts.map(({ count }) => count), 0);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">GCC footprint across India</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-stone-500">
            Distinct synthetic GCC directory records by shortlisted city. Bubble size shows the number of records listing that city.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">
          <span className="h-3 w-3 rounded-full bg-stone-700" aria-hidden="true" />
          GCC directory records
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-stone-50 p-2 sm:p-4">
        <svg
          viewBox="0 0 480 420"
          role="img"
          aria-labelledby="gcc-city-map-title gcc-city-map-description"
          className="mx-auto block h-auto max-h-[34rem] w-full"
        >
          <title id="gcc-city-map-title">India GCC footprint by shortlisted city</title>
          <desc id="gcc-city-map-description">
            A schematic map of India with bubbles at Bengaluru, Hyderabad, Pune, Chennai, Delhi NCR, and Mumbai. Each bubble is labeled with its distinct synthetic GCC directory record count.
          </desc>

          <path
            d="M116 35 L153 27 L183 31 L210 39 L239 43 L263 41 L286 49 L301 61 L318 69 L333 83 L350 96 L366 104 L380 116 L374 128 L358 135 L348 148 L340 165 L334 184 L322 199 L316 216 L304 231 L295 250 L286 270 L276 293 L267 316 L257 339 L246 362 L234 384 L224 397 L215 383 L207 365 L198 344 L190 323 L179 305 L169 285 L157 269 L146 251 L132 238 L118 226 L103 216 L90 202 L80 185 L82 169 L88 153 L92 135 L95 116 L100 99 L104 80 L106 61 Z"
            fill="#e7e5e4"
            stroke="#d6d3d1"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M350 105 L371 99 L390 103 L408 112 L425 124 L419 136 L399 140 L383 134 L368 137 L356 128 Z"
            fill="#e7e5e4"
            stroke="#d6d3d1"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M88 220 L74 236 L81 249" fill="none" stroke="#d6d3d1" strokeWidth="2" strokeLinecap="round" />
          <path d="M230 404 L236 411" fill="none" stroke="#d6d3d1" strokeWidth="2" strokeLinecap="round" />

          {cityCounts.map(({ city, count }) => {
            const position = CITY_MAP_POSITIONS[city];
            if (!position) return null;
            const radius = maxCount > 0 ? 10 + 9 * Math.sqrt(count / maxCount) : 10;

            return (
              <g key={city} className="cursor-default">
                <title>{`${city}: ${count} distinct synthetic GCC records`}</title>
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={radius + 4}
                  fill="#78716c"
                  fillOpacity="0.12"
                />
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={radius}
                  fill="#44403c"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={position.x}
                  y={position.y + 4}
                  textAnchor="middle"
                  className="fill-white text-[11px] font-semibold"
                >
                  {count}
                </text>
                <text
                  x={position.labelX}
                  y={position.labelY}
                  textAnchor={position.anchor}
                  className="fill-stone-700 text-[12px] font-medium"
                  paintOrder="stroke"
                  stroke="#fafaf9"
                  strokeWidth="4"
                  strokeLinejoin="round"
                >
                  {city}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {cityCounts.map(({ city, count }) => (
          <div key={city} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
            <div className="truncate text-[11px] text-stone-500">{city}</div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-stone-900">{count} GCCs</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[11px] leading-5 text-stone-400">
        Source: synthetic GCC directory · counts are distinct records; a GCC listing multiple Indian cities is counted once in each listed city. A zero indicates no records for that city in this dataset.
      </div>
    </section>
  );
}

function OverviewPage({ onNavigate }: OverviewPageProps) {
  const { form } = useForm();
  const [costMode, setCostMode] = useState<'total' | 'perEmployee'>('total');
  const gccCityCounts = useMemo(() => {
    const gccsByCity = getGccsByCity();
    return RECOMMENDED_CITIES.map((city) => ({
      city,
      count: new Set((gccsByCity.get(city) ?? []).map((gcc) => gcc.gcc_id)).size,
    }));
  }, []);
  const marketData = useMemo(() => {
    const aggregates = new Map<string, {
      talentPool: number[];
      rents: number[];
      infrastructure: number[];
    }>();

    for (const city of RECOMMENDED_CITIES) {
      aggregates.set(city, { talentPool: [], rents: [], infrastructure: [] });
    }

    for (const market of microMarkets) {
      const city = normalizeCity(market.city);
      const aggregate = aggregates.get(city);
      if (!aggregate) continue;
      if (Number.isFinite(market.total_tech_talent_pool)) aggregate.talentPool.push(market.total_tech_talent_pool);
      if (Number.isFinite(market.avg_rent_sqft_inr)) aggregate.rents.push(market.avg_rent_sqft_inr);
      if (Number.isFinite(market.infrastructure_score)) aggregate.infrastructure.push(market.infrastructure_score);
    }

    const average = (values: number[]) => values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const sum = (values: number[]) => values.length > 0 ? values.reduce((total, value) => total + value, 0) : null;

    return RECOMMENDED_CITIES.map((city) => {
      const values = aggregates.get(city);
      return {
        city,
        talentPool: values ? sum(values.talentPool) : null,
        rent: values ? average(values.rents) : null,
        infrastructure: values ? average(values.infrastructure) : null,
      };
    });
  }, []);

  const cityScores = useMemo(() => scoreCities('balanced', RECOMMENDED_CITIES), []);
  const roleMixHeadcount = form.roleMix.reduce((total, role) => total + Math.max(0, role.headcount), 0);
  const annualCosts = useMemo(() => RECOMMENDED_CITIES.map((city) => {
    const breakdown = calcCityCostBreakdown(city, form, 'V-016');
    const annualCost = breakdown.hasMissingData ? null : breakdown.steadyStateAnnualInr;
    return {
      city,
      total: annualCost,
      perEmployee: annualCost !== null && roleMixHeadcount > 0 ? annualCost / roleMixHeadcount : null,
    };
  }), [form, roleMixHeadcount]);

  const meanAvailable = (values: Array<number | null>) => {
    const available = values.filter((value): value is number => value !== null);
    return available.length > 0 ? available.reduce((sum, value) => sum + value, 0) / available.length : null;
  };
  const avgTalentPool = meanAvailable(marketData.map((city) => city.talentPool));
  const avgRent = meanAvailable(marketData.map((city) => city.rent));
  const avgInfra = meanAvailable(marketData.map((city) => city.infrastructure));

  const metrics = [
    {
      label: 'Established GCCs in India',
      value: `${syntheticGccs.length}`,
      detail: 'Synthetic market records',
      source: 'Source: synthetic GCC directory',
      icon: Building2,
    },
    {
      label: 'Avg talent pool across cities',
      value: avgTalentPool === null ? 'N/A' : `${(avgTalentPool / 1000).toFixed(0)}K`,
      detail: 'Tech talent pool',
      source: 'Source: India market dataset',
      icon: Briefcase,
    },
    {
      label: 'Avg rent across cities',
      value: avgRent === null ? 'N/A' : `₹${avgRent.toFixed(0)}`,
      detail: 'per sq ft / month',
      source: 'Source: micro-market benchmark',
      icon: MapPinned,
    },
    {
      label: 'Infrastructure',
      value: avgInfra === null ? 'N/A' : `${avgInfra.toFixed(0)}/100`,
      detail: 'Composite readiness score',
      source: 'Source: market infrastructure index',
      icon: ChartNoAxesCombined,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 p-8 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-200">
              GCC overview page
            </span>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Build the next GCC where talent, policy, and cost align.</h1>
            <p className="max-w-xl text-sm text-stone-200 md:text-base">
              Compare the highest-priority India markets and turn market intelligence into a realistic GCC launch plan.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => onNavigate('plan')} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-stone-100">
                Plan my GCC <ArrowRight size={16} />
              </button>
              <button onClick={() => onNavigate('directory')} className="rounded-xl border border-white/30 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Explore GCCs
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.12em] text-stone-300">Priority market</div>
            <div className="mt-3 text-3xl font-semibold">{RECOMMENDED_CITIES[0]}</div>
            <div className="mt-2 text-sm text-stone-200">Leading city for new GCCs based on infrastructure, talent, and other factors</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, source, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-stone-500">{label}</div>
              <div className="rounded-lg bg-stone-100 p-2 text-stone-700">
                <Icon size={16} />
              </div>
            </div>
            <div className="mt-4 text-2xl font-semibold text-stone-900">{value}</div>
            <div className="mt-1 text-xs text-stone-500">{detail}</div>
            <div className="mt-3 text-[11px] uppercase tracking-[0.08em] text-stone-400">{source}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <RankedBars
          title="Operating cost by city"
          description="Estimated steady-state annual operating cost. Simulated provider fees are included."
          rows={annualCosts.map(({ city, total, perEmployee }) => ({
            city,
            value: costMode === 'total' ? total : perEmployee,
          }))}
          direction="ascending"
          formatValue={(value) => costMode === 'total' ? `₹${(value / 10000000).toFixed(1)}Cr` : `₹${(value / 100000).toFixed(1)}L`}
          unit={costMode === 'total' ? 'per year' : 'per employee / year'}
          controls={
            <div className="inline-flex shrink-0 rounded-lg border border-stone-200 bg-stone-50 p-1" aria-label="Operating cost measure">
              <button
                type="button"
                onClick={() => setCostMode('total')}
                aria-pressed={costMode === 'total'}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${costMode === 'total' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-white'}`}
              >
                Total cost
              </button>
              <button
                type="button"
                onClick={() => setCostMode('perEmployee')}
                aria-pressed={costMode === 'perEmployee'}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${costMode === 'perEmployee' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-white'}`}
              >
                Per employee
              </button>
            </div>
          }
        />
        <RankedBars
          title="Talent pool by city"
          description="Total available tech talent pool summed across the city's micro-market records."
          rows={marketData.map(({ city, talentPool }) => ({ city, value: talentPool }))}
          direction="descending"
          formatValue={formatCount}
          unit="people"
        />
        <RankedBars
          title="Office rent by city"
          description="Mean rent rate across the city's micro-market records; cities are ranked from lower to higher rent."
          rows={marketData.map(({ city, rent }) => ({ city, value: rent }))}
          direction="ascending"
          formatValue={(value) => `₹${value.toFixed(0)}`}
          unit="per sq ft / month"
        />
        <SuitabilityChart cityScores={cityScores} />
      </section>

      <GccCityMap cityCounts={gccCityCounts} />

      {/* <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Market benchmark</h2>
          <div className="mt-5 space-y-3">
            {RECOMMENDED_CITIES.map((city) => {
              const market = marketData.find((entry) => entry.city === city);
              const infra = market?.infrastructure ?? null;
              const rent = market?.rent ?? null;
              const talent = market?.talentPool ?? null;

              return (
                <div key={city} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5">
                  <div>
                    <div className="font-medium text-stone-900">{city}</div>
                    <div className="text-xs text-stone-500">
                      {talent !== null ? `${(talent / 1000000).toFixed(1)}M talent` : 'Talent data unavailable'} • {rent !== null ? `₹${rent.toFixed(0)}/sq ft/month` : 'Rent data unavailable'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-stone-900">{infra !== null ? `${infra.toFixed(0)}/100` : 'N/A'}</div>
                    <div className="text-[11px] uppercase tracking-[0.1em] text-stone-500">infrastructure</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Plan summary</h2>
          <div className="mt-5 space-y-4 text-sm text-stone-600">
            <div className="rounded-2xl bg-stone-50 p-3">
              <div className="text-stone-500">Industry</div>
              <div className="mt-1 font-medium text-stone-900">{form.industry || 'Technology / digital operations'}</div>
            </div>
            <div className="rounded-2xl bg-stone-50 p-3">
              <div className="text-stone-500">Core functions</div>
              <div className="mt-1 font-medium text-stone-900">{form.gccFunctions.length > 0 ? form.gccFunctions.join(', ') : 'Product, engineering, finance'}</div>
            </div>
            <div className="rounded-2xl bg-stone-50 p-3">
              <div className="text-stone-500">Launch date</div>
              <div className="mt-1 font-medium text-stone-900">{form.launchDate || 'Q3 2026'}</div>
            </div>
            <div className="rounded-2xl bg-stone-50 p-3">
              <div className="text-stone-500">Selected cities</div>
              <div className="mt-1 font-medium text-stone-900">{form.preferredCities.length > 0 ? form.preferredCities.join(', ') : 'Bengaluru, Hyderabad, Pune'}</div>
            </div>
            <button onClick={() => onNavigate('plan')} className="w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800">
              Review assumptions
            </button>
          </div>
        </div>
      </section> */}
    </div>
  );
}

export default OverviewPage;
