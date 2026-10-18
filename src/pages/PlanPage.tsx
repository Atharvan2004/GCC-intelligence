import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useForm } from '@/lib/formContext';
import { calcCityCostBreakdown } from '@/lib/costCalc';
import { RECOMMENDED_CITIES } from '@/lib/normalize';
import { scoreCities } from '@/lib/scoring';

const stepLabels = ['Company', 'Team', 'Budget & Office', 'Review'];
const AVAILABLE_CITIES = RECOMMENDED_CITIES;

function PlanPage() {
  const { form, updateForm, resetForm } = useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const selectedCities = form.preferredCities.filter((city) => AVAILABLE_CITIES.includes(city));
  const effectiveSelectedCities = selectedCities.length > 0 ? selectedCities : AVAILABLE_CITIES.slice(0, 3);
  const cityScores = useMemo(() => scoreCities(form.priority, effectiveSelectedCities), [form.priority, effectiveSelectedCities]);
  const cityCostBreakdowns = effectiveSelectedCities.map((city) => ({ city, breakdown: calcCityCostBreakdown(city, form, 'V-016') }));

  const toggleCity = (city: string) => {
    if (!AVAILABLE_CITIES.includes(city)) return;

    if (form.preferredCities.includes(city)) {
      updateForm({ preferredCities: form.preferredCities.filter((value) => value !== city) });
      return;
    }
    const filteredCities = form.preferredCities.filter((value) => AVAILABLE_CITIES.includes(value));
    if (filteredCities.length >= 4) {
      updateForm({ preferredCities: [...filteredCities.slice(1), city] });
      return;
    }
    updateForm({ preferredCities: [...filteredCities, city] });
  };

  const updateRoleMix = (index: number, field: 'headcount' | 'experienceLevel', value: string | number) => {
    const nextMix = [...form.roleMix];
    const item = nextMix[index];
    if (!item) return;

    nextMix[index] = {
      ...item,
      [field]: field === 'headcount' ? Number(value) : value,
    };

    updateForm({
      roleMix: nextMix,
      totalHeadcount: nextMix.reduce((sum, entry) => sum + Number(entry.headcount || 0), 0),
    });
  };

  const addRole = () => {
    updateForm({
      roleMix: [...form.roleMix, { role: 'Analyst', experienceLevel: 'Mid (3-5)', headcount: 1 }],
    });
  };

  const removeRole = (index: number) => {
    const nextMix = form.roleMix.filter((_, idx) => idx !== index);
    updateForm({
      roleMix: nextMix,
      totalHeadcount: nextMix.reduce((sum, entry) => sum + Number(entry.headcount || 0), 0),
    });
  };

  const setNextStep = () => setCurrentStep((step) => Math.min(step + 1, stepLabels.length - 1));
  const setPreviousStep = () => setCurrentStep((step) => Math.max(step - 1, 0));

  const renderCompanyStep = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-stone-600">
          <span>Industry</span>
          <input value={form.industry} onChange={(event) => updateForm({ industry: event.target.value })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" placeholder="Fintech, SaaS, manufacturing..." />
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span>Parent HQ country</span>
          <input value={form.parentHqCountry} onChange={(event) => updateForm({ parentHqCountry: event.target.value })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" placeholder="USA, UK, Singapore..." />
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span>Launch date</span>
          <input type="date" value={form.launchDate} onChange={(event) => updateForm({ launchDate: event.target.value })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" />
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span>Priority</span>
          <select value={form.priority} onChange={(event) => updateForm({ priority: event.target.value as 'cost' | 'talent' | 'balanced' })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400">
            <option value="balanced">Balanced</option>
            <option value="cost">Cost-led</option>
            <option value="talent">Talent-led</option>
          </select>
        </label>
      </div>

      <label className="block space-y-2 text-sm text-stone-600">
        <span>Core GCC functions</span>
        <input value={form.gccFunctions.join(', ')} onChange={(event) => updateForm({ gccFunctions: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" placeholder="Product, Engineering, Finance" />
      </label>
    </div>
  );

  const renderTeamStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900">Team composition</h3>
        <button onClick={addRole} type="button" className="rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800">Add role</button>
      </div>

      {form.roleMix.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-500">No roles added yet.</div>
      ) : (
        <div className="space-y-3">
          {form.roleMix.map((entry, index) => (
            <div key={`${entry.role}-${index}`} className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 md:grid-cols-[1.4fr_1fr_0.7fr_auto]">
              <input value={entry.role} onChange={(event) => { const nextMix = [...form.roleMix]; nextMix[index] = { ...entry, role: event.target.value }; updateForm({ roleMix: nextMix }); }} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" />
              <select value={entry.experienceLevel} onChange={(event) => updateRoleMix(index, 'experienceLevel', event.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400">
                <option value="Junior (0-2)">Junior (0-2)</option>
                <option value="Mid (3-5)">Mid (3-5)</option>
                <option value="Senior (6-9)">Senior (6-9)</option>
                <option value="Leadership (10+)">Leadership (10+)</option>
              </select>
              <input type="number" min={0} value={entry.headcount} onChange={(event) => updateRoleMix(index, 'headcount', event.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" />
              <button type="button" onClick={() => removeRole(index)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">Remove</button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-stone-50 p-3 text-sm text-stone-600">
        Total team size: <span className="font-semibold text-stone-900">{form.totalHeadcount}</span>
      </div>
    </div>
  );

  const renderBudgetStep = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-stone-600">
          <span>Setup budget (₹)</span>
          <input type="number" min={0} value={form.setupBudget} onChange={(event) => updateForm({ setupBudget: Number(event.target.value || 0) })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" />
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span>Annual budget (₹)</span>
          <input type="number" min={0} value={form.annualBudget} onChange={(event) => updateForm({ annualBudget: Number(event.target.value || 0) })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" />
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span>Seat count</span>
          <input type="number" min={1} value={form.seats} onChange={(event) => updateForm({ seats: Number(event.target.value || 0) })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" />
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span>Office type</span>
          <select value={form.officeType} onChange={(event) => updateForm({ officeType: event.target.value as typeof form.officeType })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400">
            <option value="Managed Office Space">Managed Office Space</option>
            <option value="Bare Shell">Bare Shell</option>
            <option value="Coworking">Coworking</option>
            <option value="SEZ">SEZ</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span>Lease duration (months)</span>
          <input type="number" min={1} value={form.leaseDurationMonths} onChange={(event) => updateForm({ leaseDurationMonths: Number(event.target.value || 0) })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-900 outline-none focus:border-stone-400" />
        </label>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-stone-500">Preferred cities</h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_CITIES.map((city) => {
            const active = form.preferredCities.includes(city);
            const disabled = !active && form.preferredCities.filter((value) => AVAILABLE_CITIES.includes(value)).length >= 4;

            return (
              <button
                key={city}
                type="button"
                disabled={disabled}
                onClick={() => toggleCity(city)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300 hover:bg-stone-100'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {city}
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-stone-500">Select up to four cities from the recommended GCC hubs.</div>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const recommendedResults = cityScores.slice(0, 3);
    const budgetAwareCities = effectiveSelectedCities;

    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Compare city shortlist</div>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CITIES.map((city) => {
              const active = effectiveSelectedCities.includes(city);
              const disabled = !active && effectiveSelectedCities.length >= 4;
              return (
                <button
                  key={`review-${city}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleCity(city)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-100'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl bg-stone-100 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Plan snapshot</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-white p-3"><div className="text-xs text-stone-500">Company</div><div className="mt-1 font-semibold text-stone-900">{form.industry || 'Not set yet'}</div></div>
            <div className="rounded-xl bg-white p-3"><div className="text-xs text-stone-500">Team</div><div className="mt-1 font-semibold text-stone-900">{form.totalHeadcount} roles</div></div>
            <div className="rounded-xl bg-white p-3"><div className="text-xs text-stone-500">Office</div><div className="mt-1 font-semibold text-stone-900">{form.officeType}</div></div>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">Ranked recommendations</h3>
          <div className="mt-4 space-y-3">
            {recommendedResults.map((result) => (
              <div key={result.city} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">#{result.rank}</div>
                  <div>
                    <div className="font-medium text-stone-900">{result.city}</div>
                    <div className="text-xs text-stone-500">{result.notes[0] || 'Score coverage complete'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-stone-900">{result.score.total === null ? 'N/A' : `${result.score.total.toFixed(1)}`}</div>
                  <div className="text-[11px] uppercase tracking-[0.1em] text-stone-500">score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-[#05070b] p-4 text-white shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-stone-400">GCC cost comparison</div>
              <div className="mt-1 text-2xl font-semibold">Cost model</div>
            </div>
            <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">Illustrative</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-stone-200">
              <thead>
                <tr>
                  <th className="border-b border-stone-800 bg-stone-950/80 px-3 py-3 font-medium text-stone-300">Cost category</th>
                  {budgetAwareCities.map((city) => (
                    <th key={city} className="border-b border-stone-800 bg-stone-950/80 px-3 py-3 text-center font-medium text-stone-100">{city}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {budgetAwareCities.length > 0 && (() => {
                  const rows = cityCostBreakdowns[0].breakdown.categories.map((category) => ({
                    key: category.key,
                    label: category.label,
                    values: budgetAwareCities.map((city) => {
                      const matching = cityCostBreakdowns.find((entry) => entry.city === city)?.breakdown.categories.find((item) => item.key === category.key);
                      return matching ?? null;
                    }),
                  }));

                  return (
                    <>
                      {rows.map((row) => {
                        const expanded = expandedSections[row.key] ?? true;
                        return (
                          <>
                            <tr className="border-b border-stone-800">
                              <td className="border-b border-stone-800 bg-stone-950/30 px-3 py-3">
                                <button type="button" onClick={() => setExpandedSections((current) => ({ ...current, [row.key]: !expanded }))} className="flex items-center gap-2 font-medium text-stone-100">
                                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  {row.label}
                                </button>
                              </td>
                              {row.values.map((value, index) => (
                                <td key={`${row.key}-${budgetAwareCities[index]}`} className="border-b border-stone-800 bg-stone-950/20 px-3 py-3 text-right text-stone-200">
                                  {value ? `₹${(value.totalInr / 1000000).toFixed(1)}M` : '—'}
                                </td>
                              ))}
                            </tr>
                            {expanded && row.values[0] && (
                              <>
                                {row.values[0].lineItems.map((lineItem, itemIndex) => (
                                  <tr key={`${row.key}-detail-${itemIndex}`} className="border-b border-stone-800/80 bg-stone-900/60 text-xs text-stone-300">
                                    <td className="px-3 py-2 pl-8">{lineItem.label}</td>
                                    {budgetAwareCities.map((city) => {
                                      const matching = cityCostBreakdowns.find((entry) => entry.city === city)?.breakdown.categories.find((category) => category.key === row.key);
                                      const line = matching?.lineItems[itemIndex];
                                      return <td key={`${city}-${itemIndex}`} className="px-3 py-2 text-right">{line ? `₹${(line.amountInr / 1000000).toFixed(1)}M` : '—'}</td>;
                                    })}
                                  </tr>
                                ))}
                              </>
                            )}
                          </>
                        );
                      })}

                      <tr className="border-t-2 border-amber-400 bg-amber-500/10">
                        <td className="px-3 py-3 font-semibold text-amber-100">Total cost summary</td>
                        {budgetAwareCities.map((city) => {
                          const matching = cityCostBreakdowns.find((entry) => entry.city === city)?.breakdown;
                          if (!matching) {
                            return <td key={`${city}-total`} className="px-3 py-3 text-right text-stone-300">—</td>;
                          }

                          const exceedsSetup = matching.firstYearGrossInr > form.setupBudget;
                          const exceedsAnnual = matching.steadyStateAnnualInr > form.annualBudget;
                          const withinBudget = !exceedsSetup && !exceedsAnnual;
                          const totalLabel = withinBudget ? 'Within budget' : 'Exceeds budget';

                          return (
                            <td key={`${city}-total`} className={`px-3 py-3 text-right ${withinBudget ? 'text-emerald-300' : 'text-rose-300'}`}>
                              <div className="font-semibold">₹{(matching.firstYearGrossInr / 1000000).toFixed(1)}M</div>
                              <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-stone-300">{totalLabel}</div>
                              <div className="mt-1 text-[10px] text-stone-300">
                                {exceedsSetup ? `Setup > ₹${(form.setupBudget / 1000000).toFixed(1)}M` : `Setup ≤ ₹${(form.setupBudget / 1000000).toFixed(1)}M`}
                                <br />
                                {exceedsAnnual ? `Annual > ₹${(form.annualBudget / 1000000).toFixed(1)}M` : `Annual ≤ ₹${(form.annualBudget / 1000000).toFixed(1)}M`}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const currentRender = currentStep === 0 ? renderCompanyStep() : currentStep === 1 ? renderTeamStep() : currentStep === 2 ? renderBudgetStep() : renderReviewStep();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">My GCC plan</div>
            <h1 className="mt-1 text-3xl font-semibold text-stone-900">Planning flow</h1>
          </div>
          <button onClick={resetForm} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
            <RotateCcw size={14} /> Reset plan
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap gap-2">
          {stepLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentStep(index)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${currentStep === index ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-stone-50 text-stone-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-stone-50 p-5">{currentRender}</div>

        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={setPreviousStep} disabled={currentStep === 0} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-50">
            <ArrowLeft size={16} /> Back
          </button>

          <button type="button" onClick={setNextStep} disabled={currentStep === stepLabels.length - 1} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50">
            Continue <ArrowRight size={16} />
          </button>
        </div>

        {currentStep === stepLabels.length - 1 && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <div className="flex items-center gap-2 font-medium"><Check size={16} /> Recommendations are based on the selected market mix and current scoring model.</div>
          </div>
        )}
      </section>
    </div>
  );
}

export default PlanPage;
