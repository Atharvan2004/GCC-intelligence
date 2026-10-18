import { Database, ShieldCheck, Sparkles } from 'lucide-react';

const methodology = [
  {
    title: 'Market intelligence',
    icon: Database,
    text: 'The dashboard uses synthetic India micro-market data, compensation curves, provider pricing, and GCC operating examples to approximate site-selection decisions for strategic planning.',
  },
  {
    title: 'Scoring logic',
    icon: Sparkles,
    text: 'Each city score blends talent fit, operating cost, ecosystem depth, office suitability, and infrastructure. Relative weightings shift based on the selected priority mode: cost-led, talent-led, or balanced.',
  },
  {
    title: 'Reliability guardrails',
    icon: ShieldCheck,
    text: 'All cost, provider, and incentive figures are simulated and labelled as such. They are intended for planning discussions, not formal vendor offers, state approvals, or legal commitments.',
  },
];

function SourcesPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Sources & methodology</div>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">Scoring, economics, and dataset assumptions</h1>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {methodology.map(({ title, icon: Icon, text }) => (
          <article key={title} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-800">
              <Icon size={20} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-stone-900">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">{text}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Scoring weights and normalization</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
            <li><span className="font-semibold text-stone-900">Balanced:</span> Talent fit 30%, operating cost 25%, ecosystem 20%, office suitability 15%, infrastructure 10%.</li>
            <li><span className="font-semibold text-stone-900">Cost-led:</span> Talent fit 20%, operating cost 40%, ecosystem 15%, office suitability 15%, infrastructure 10%.</li>
            <li><span className="font-semibold text-stone-900">Talent-led:</span> Talent fit 45%, operating cost 15%, ecosystem 20%, office suitability 10%, infrastructure 10%.</li>
            <li>Scores are normalized using min-max scaling across the recommended city set, with attrition and rent treated as inverse-cost indicators where lower values are better.</li>
            <li>Missing values do not get filled with zero; they are excluded from the weighted score and surfaced as notes in the UI.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Cost formulas and assumptions</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
            <li>Employee cost = compensation band × headcount × local market rates; recruitment fee is ~8.33% of annual employee CTC.</li>
            <li>Office rent = seats × 90 sq ft × market rent per sq ft × 12 months + 15% CAM charge, adjusted by office type premium or SEZ discount.</li>
            <li>Office setup = fit-out, furniture, and IT installation assumptions of ₹2,500/sq ft, ₹75,000/seat, and ₹120,000/seat.</li>
            <li>Utilities = ₹3,500/seat/month + ₹15,000/month connectivity; other costs include HR tools, compliance retainer, and monthly operating overheads.</li>
            <li>Steady-state annual cost equals recurring annual costs × 0.85 to reflect operational stabilization.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-900">Synthetic data and provider coverage</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-stone-50 p-4">
            <div className="text-sm font-semibold text-stone-900">Dataset contents</div>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              <li>• 120 synthetic GCC company records</li>
              <li>• India micro-market rent, talent, infrastructure, and SEZ data</li>
              <li>• Compensation bands by role, experience level, and city</li>
              <li>• Provider pricing, SLA coverage, and operating categories</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <div className="text-sm font-semibold text-stone-900">Simulated provider details</div>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              <li>• Provider line items are modelled from an internal simulator, not a live quote engine.</li>
              <li>• Setup and annual fees are labelled as simulated and not verified offers.</li>
              <li>• Coverage is city-specific, and the synthetic fee set is meant for planning comparison only.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-900">Incentive limitations</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
          <li>• Incentive values are estimated from aggregate state capex subsidy assumptions and applied only to eligible office setup costs.</li>
          <li>• They are not legal forecasts, prior approval numbers, or state guarantee calculations.</li>
          <li>• The dashboard intentionally preserves disclaimers to prevent overstating the certainty of subsidy value.</li>
        </ul>
      </section>
    </div>
  );
}

export default SourcesPage;
