import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Building2, ClipboardList, BookOpen, Menu, X } from 'lucide-react';
import { FormContext, getDefaultForm, loadForm, saveForm, clearForm } from '@/lib/formContext';
import type { GccPlanForm } from '@/types';
import OverviewPage from '@/pages/OverviewPage';
import GccDirectoryPage from '@/pages/GccDirectoryPage';
import PlanPage from '@/pages/PlanPage';
import SourcesPage from '@/pages/SourcesPage';

type Page = 'overview' | 'directory' | 'plan' | 'sources';

const NAV_ITEMS: { key: Page; label: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'directory', label: 'GCC Directory', icon: Building2 },
  { key: 'plan', label: 'My GCC Plan', icon: ClipboardList },
  { key: 'sources', label: 'Sources & Methodology', icon: BookOpen },
];

function App() {
  const [page, setPage] = useState<Page>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [form, setFormState] = useState<GccPlanForm>(() => {
    const saved = loadForm();
    return saved ?? getDefaultForm();
  });
  const [hasPlan, setHasPlan] = useState<boolean>(() => {
    return loadForm() !== null;
  });

  const setForm = useCallback((f: GccPlanForm) => {
    setFormState(f);
    saveForm(f);
  }, []);

  const updateForm = useCallback((partial: Partial<GccPlanForm>) => {
    setFormState((prev) => {
      const next = { ...prev, ...partial };
      saveForm(next);
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    clearForm();
    setFormState(getDefaultForm());
    setHasPlan(false);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const navigate = (p: Page) => {
    setPage(p);
    setMobileNavOpen(false);
  };

  return (
    <FormContext.Provider value={{ form, setForm, updateForm, resetForm, hasPlan, setHasPlan }}>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
            <button onClick={() => navigate('overview')} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-stone-900 text-white">
                <Building2 size={20} strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold tracking-tight text-stone-900">GCC Intelligence</div>
                <div className="text-[11px] text-stone-500">India Site Selection Dashboard</div>
              </div>
            </button>

            <nav className="hidden gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = page === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.key)}
                    className={`flex items-center gap-2 rounded px-3.5 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <button
              className="rounded p-2 text-stone-600 hover:bg-stone-100 md:hidden"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileNavOpen && (
            <nav className="border-t border-stone-200 md:hidden">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = page === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.key)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium ${
                      active ? 'bg-stone-100 text-stone-900' : 'text-stone-600'
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {page === 'overview' && <OverviewPage onNavigate={navigate} />}
          {page === 'directory' && <GccDirectoryPage />}
          {page === 'plan' && <PlanPage />}
          {page === 'sources' && <SourcesPage />}
        </main>

        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-stone-500 lg:px-8">
            GCC Intelligence Dashboard — Prototype for research and planning purposes. All provider fees are simulated.
            Incentive figures are indicative and not guaranteed. GCC directory records are synthetic.
          </div>
        </footer>
      </div>
    </FormContext.Provider>
  );
}

export default App;
