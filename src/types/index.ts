export interface MicroMarket {
  id: string;
  city: string;
  tier: string;
  micro_market: string;
  avg_rent_sqft_inr: number;
  total_tech_talent_pool: number;
  attrition_rate: string;
  sez_availability: boolean;
  state_capex_subsidy_percent: number;
  infrastructure_score: number;
}

export interface TalentCompensation {
  id: string;
  city: string;
  role: string;
  experience_level: string;
  min_salary_lpa: number;
  max_salary_lpa: number;
  fully_loaded_cost_usd: number;
  time_to_hire_days: number;
}

export interface ServiceProvider {
  vendor_id: string;
  vendor_name: string;
  category: string;
  scale: string;
  headquarters: string;
  gccs_set_up: number;
  average_setup_sla_days: number;
  pricing_model: string;
  verified_rating: number;
}

export interface SyntheticGCC {
  gcc_id: string;
  parent_company_name: string;
  parent_hq_country: string;
  primary_industry: string;
  india_locations: string[];
  year_established: number;
  total_india_headcount: number;
  primary_functions: string[];
  operating_model: string;
}

export type ExperienceLevel = 'Junior (0-2)' | 'Mid (3-5)' | 'Senior (6-9)' | 'Leadership (10+)';

export interface RoleMixEntry {
  role: string;
  experienceLevel: ExperienceLevel;
  headcount: number;
}

export type OfficeType = 'Managed Office Space' | 'Bare Shell' | 'Coworking' | 'SEZ';
export type Priority = 'cost' | 'talent' | 'balanced';

export interface GccPlanForm {
  step: number;
  industry: string;
  parentHqCountry: string;
  gccFunctions: string[];
  totalHeadcount: number;
  roleMix: RoleMixEntry[];
  setupBudget: number;
  annualBudget: number;
  launchDate: string;
  officeType: OfficeType;
  seats: number;
  leaseDurationMonths: number;
  preferredCities: string[];
  priority: Priority;
  constraints: string;
}

export interface CityAggregate {
  canonicalName: string;
  tier: string;
  avgRentSqftInr: number | null;
  totalTalentPool: number | null;
  avgAttritionRate: number | null;
  hasSez: boolean;
  stateCapexSubsidyPercent: number | null;
  avgInfrastructureScore: number | null;
  microMarketCount: number;
}

export interface ScoreBreakdown {
  talentFit: number | null;
  operatingCost: number | null;
  ecosystem: number | null;
  officeSuitability: number | null;
  infrastructure: number | null;
  total: number | null;
}

export interface CityScore {
  city: string;
  score: ScoreBreakdown;
  rank: number;
  notes: string[];
}

export type CostCategoryKey =
  | 'employeeCosts'
  | 'officeRentOccupancy'
  | 'officeSetup'
  | 'utilities'
  | 'serviceProviders'
  | 'otherOperatingCosts';

export interface CostLineItem {
  label: string;
  amountInr: number;
  amountUsd: number;
  isDeposit: boolean;
  isEstimate: boolean;
  note?: string;
}

export interface CostCategory {
  key: CostCategoryKey;
  label: string;
  lineItems: CostLineItem[];
  totalInr: number;
  totalUsd: number;
  depositInr: number;
  depositUsd: number;
  hasMissingData: boolean;
  missingDataNotes: string[];
}

export interface CityCostBreakdown {
  city: string;
  categories: CostCategory[];
  firstYearGrossInr: number;
  firstYearGrossUsd: number;
  potentialIncentiveInr: number;
  potentialIncentiveUsd: number;
  costAfterIncentiveInr: number;
  costAfterIncentiveUsd: number;
  steadyStateAnnualInr: number;
  steadyStateAnnualUsd: number;
  refundableDepositInr: number;
  refundableDepositUsd: number;
  hasMissingData: boolean;
}

export interface SimulatedProviderConfig {
  vendor_id: string;
  simulatedSetupFeeInr: number;
  simulatedAnnualFeeInr: number;
  simulatedScore: number;
  coverageCities: string[];
  notes: string;
}
