import { createContext, useContext } from 'react';
import type { GccPlanForm, RoleMixEntry } from '@/types';
import { RECOMMENDED_CITIES } from '@/lib/normalize';

export const EMPTY_FORM: GccPlanForm = {
  step: 1,
  industry: '',
  parentHqCountry: '',
  gccFunctions: [],
  totalHeadcount: 0,
  roleMix: [],
  setupBudget: 0,
  annualBudget: 0,
  launchDate: '',
  officeType: 'Managed Office Space',
  seats: 0,
  leaseDurationMonths: 36,
  preferredCities: [...RECOMMENDED_CITIES.slice(0, 3)],
  priority: 'balanced',
  constraints: '',
};

export const DEFAULT_ROLE_MIX: RoleMixEntry[] = [
  { role: 'Backend Engineer', experienceLevel: 'Mid (3-5)', headcount: 5 },
  { role: 'Frontend', experienceLevel: 'Mid (3-5)', headcount: 3 },
  { role: 'DevOps', experienceLevel: 'Senior (6-9)', headcount: 1 },
  { role: 'Product Manager', experienceLevel: 'Mid (3-5)', headcount: 1 },
  { role: 'AI Engineer', experienceLevel: 'Senior (6-9)', headcount: 2 },
  { role: 'Finance Ops', experienceLevel: 'Junior (0-2)', headcount: 2 },
];

const STORAGE_KEY = 'gcc-plan-session';

export function loadForm(): GccPlanForm | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GccPlanForm;
    return parsed;
  } catch {
    return null;
  }
}

export function saveForm(form: GccPlanForm): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    // ignore storage errors
  }
}

export function clearForm(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getDefaultForm(): GccPlanForm {
  const withDefaults = { ...EMPTY_FORM, preferredCities: [...RECOMMENDED_CITIES.slice(0, 3)] };
  withDefaults.roleMix = DEFAULT_ROLE_MIX.map((r) => ({ ...r }));
  withDefaults.totalHeadcount = DEFAULT_ROLE_MIX.reduce((s, r) => s + r.headcount, 0);
  withDefaults.seats = withDefaults.totalHeadcount;
  return withDefaults;
}

interface FormContextValue {
  form: GccPlanForm;
  setForm: (form: GccPlanForm) => void;
  updateForm: (partial: Partial<GccPlanForm>) => void;
  resetForm: () => void;
  hasPlan: boolean;
  setHasPlan: (v: boolean) => void;
}

export const FormContext = createContext<FormContextValue | null>(null);

export function useForm(): FormContextValue {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useForm must be used within FormContext.Provider');
  return ctx;
}
