import { useMemo, useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { syntheticGccs } from '@/lib/data';

const industryOptions = ['All industries', ...new Set(syntheticGccs.map((gcc) => gcc.primary_industry))].sort();
const countryOptions = ['All HQ countries', ...new Set(syntheticGccs.map((gcc) => gcc.parent_hq_country))].sort();
const modelOptions = ['All operating models', ...new Set(syntheticGccs.map((gcc) => gcc.operating_model))].sort();

function GccDirectoryPage() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All industries');
  const [country, setCountry] = useState('All HQ countries');
  const [model, setModel] = useState('All operating models');

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return syntheticGccs.filter((gcc) => {
      const matchesText =
        !query ||
        gcc.parent_company_name.toLowerCase().includes(query) ||
        gcc.primary_industry.toLowerCase().includes(query) ||
        gcc.parent_hq_country.toLowerCase().includes(query) ||
        gcc.india_locations.join(' ').toLowerCase().includes(query) ||
        gcc.primary_functions.join(' ').toLowerCase().includes(query) ||
        gcc.gcc_id.toLowerCase().includes(query);

      const matchesIndustry = industry === 'All industries' || gcc.primary_industry === industry;
      const matchesCountry = country === 'All HQ countries' || gcc.parent_hq_country === country;
      const matchesModel = model === 'All operating models' || gcc.operating_model === model;

      return matchesText && matchesIndustry && matchesCountry && matchesModel;
    });
  }, [country, industry, model, search]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-stone-100 p-2.5 text-stone-700">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Directory</div>
            <h1 className="text-2xl font-semibold text-stone-900">GCC list</h1>
            <h5 className="text-sm font-medium text-stone-600">Explore GCC profiles across India by company, industry, location, and operating model.</h5>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-stone-600">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search GCCs or locations"
              className="w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />
          </label>

          <select value={industry} onChange={(event) => setIndustry(event.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400">
            {industryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select value={country} onChange={(event) => setCountry(event.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400">
            {countryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select value={model} onChange={(event) => setModel(event.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400">
            {modelOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-100 text-xs uppercase tracking-[0.08em] text-stone-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">HQ</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">India locations</th>
                <th className="px-4 py-3">Functions</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Headcount</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((gcc) => (
                <tr key={gcc.gcc_id} className="border-t border-stone-200 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-stone-900">{gcc.parent_company_name}</div>
                    <div className="text-xs text-stone-500">{gcc.gcc_id}</div>
                  </td>
                  <td className="px-4 py-3">{gcc.parent_hq_country}</td>
                  <td className="px-4 py-3">{gcc.primary_industry}</td>
                  <td className="px-4 py-3">{gcc.india_locations.join(', ')}</td>
                  <td className="px-4 py-3">{gcc.primary_functions.join(', ')}</td>
                  <td className="px-4 py-3">{gcc.operating_model}</td>
                  <td className="px-4 py-3">{gcc.total_india_headcount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-stone-500">No GCC records match the current filters.</div>
        )}
      </section>
    </div>
  );
}

export default GccDirectoryPage;
