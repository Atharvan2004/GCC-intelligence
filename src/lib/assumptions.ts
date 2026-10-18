import type { SimulatedProviderConfig } from '@/types';

export const COST_ASSUMPTIONS = {
  usdToInr: 83,
  camPercentOfRent: 0.15,
  rentDepositMonths: 6,
  fitOutCostPerSqftInr: 2500,
  furnitureCostPerSeatInr: 75000,
  itSetupPerSeatInr: 120000,
  utilitiesPerSeatPerMonthInr: 3500,
  internetPerMonthInr: 15000,
  hrSoftwarePerSeatPerYearInr: 24000,
  complianceLegalSetupInr: 500000,
  complianceLegalAnnualInr: 800000,
  recruitmentFeePercentOfCtc: 0.0833,
  officeAreaPerSeatSqft: 90,
  managedOfficePremiumPercent: 0.20,
  coworkingPremiumPercent: 0.35,
  sezDiscountPercent: 0.10,
  otherMonthlyPerSeatInr: 2000,
  steadyStateEmployeeFactor: 0.85,
} as const;

export const PROVIDER_CONFIGS: Record<string, SimulatedProviderConfig> = {
  'V-016': {
    vendor_id: 'V-016',
    simulatedSetupFeeInr: 4500000,
    simulatedAnnualFeeInr: 1800000,
    simulatedScore: 8.2,
    coverageCities: ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR', 'Mumbai'],
    notes: 'Simulated fee for full BOT setup. Not a verified offer.',
  },
  'V-031': {
    vendor_id: 'V-031',
    simulatedSetupFeeInr: 6500000,
    simulatedAnnualFeeInr: 2400000,
    simulatedScore: 7.8,
    coverageCities: ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR', 'Mumbai', 'Ahmedabad'],
    notes: 'Simulated fee for enterprise GCC advisory. Not a verified offer.',
  },
  'V-004': {
    vendor_id: 'V-004',
    simulatedSetupFeeInr: 2200000,
    simulatedAnnualFeeInr: 960000,
    simulatedScore: 7.5,
    coverageCities: ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR', 'Mumbai', 'Indore', 'Jaipur'],
    notes: 'Simulated per-seat managed office quote. Not a verified offer.',
  },
  'V-001': {
    vendor_id: 'V-001',
    simulatedSetupFeeInr: 1500000,
    simulatedAnnualFeeInr: 600000,
    simulatedScore: 8.0,
    coverageCities: ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR', 'Mumbai'],
    notes: 'Simulated legal and compliance retainer. Not a verified offer.',
  },
  'V-049': {
    vendor_id: 'V-049',
    simulatedSetupFeeInr: 800000,
    simulatedAnnualFeeInr: 1200000,
    simulatedScore: 8.5,
    coverageCities: ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR', 'Mumbai', 'Kochi', 'Thiruvananthapuram'],
    notes: 'Simulated EOR setup and per-seat monthly. Not a verified offer.',
  },
  'V-006': {
    vendor_id: 'V-006',
    simulatedSetupFeeInr: 3000000,
    simulatedAnnualFeeInr: 450000,
    simulatedScore: 9.0,
    coverageCities: ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR', 'Mumbai'],
    notes: 'Simulated fixed project fee for real estate brokerage. Not a verified offer.',
  },
};

export const SELECTED_PROVIDER_IDS = Object.keys(PROVIDER_CONFIGS);
