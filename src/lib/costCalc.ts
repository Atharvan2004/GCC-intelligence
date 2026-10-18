import type {
  CityAggregate,
  CityCostBreakdown,
  CostCategory,
  CostLineItem,
  GccPlanForm,
  RoleMixEntry,
  TalentCompensation,
} from '@/types';
import { COST_ASSUMPTIONS, PROVIDER_CONFIGS } from './assumptions';
import { getCityAggregates, getTalentByCity, serviceProviders } from './data';
import { normalizeCity } from './normalize';

const A = COST_ASSUMPTIONS;

function inrToUsd(inr: number): number {
  return inr / A.usdToInr;
}

function getAvgTalentCost(
  city: string,
  role: string,
  experienceLevel: string,
  talentByCity: Map<string, TalentCompensation[]>,
): { avgCostLpa: number | null; fullyLoadedUsd: number | null; timeToHire: number | null } {
  const talentList = talentByCity.get(city);
  if (!talentList) return { avgCostLpa: null, fullyLoadedUsd: null, timeToHire: null };

  const matches = talentList.filter(
    (t) => t.role === role && t.experience_level === experienceLevel,
  );
  if (matches.length === 0) {
    return { avgCostLpa: null, fullyLoadedUsd: null, timeToHire: null };
  }

  const avgCostLpa = matches.reduce((s, t) => s + (t.min_salary_lpa + t.max_salary_lpa) / 2, 0) / matches.length;
  const fullyLoadedUsd = matches.reduce((s, t) => s + t.fully_loaded_cost_usd, 0) / matches.length;
  const timeToHire = matches.reduce((s, t) => s + t.time_to_hire_days, 0) / matches.length;

  return { avgCostLpa, fullyLoadedUsd, timeToHire };
}

function calcEmployeeCosts(
  city: string,
  roleMix: RoleMixEntry[],
  talentByCity: Map<string, TalentCompensation[]>,
): CostCategory {
  const lineItems: CostLineItem[] = [];
  const missingNotes: string[] = [];
  let totalInr = 0;
  let totalUsd = 0;

  for (const entry of roleMix) {
    if (entry.headcount <= 0) continue;
    const { avgCostLpa, fullyLoadedUsd } = getAvgTalentCost(city, entry.role, entry.experienceLevel, talentByCity);
    if (avgCostLpa === null || fullyLoadedUsd === null) {
      missingNotes.push(`${entry.role} (${entry.experienceLevel}): no compensation data for ${city}`);
      lineItems.push({
        label: `${entry.role} — ${entry.experienceLevel} (${entry.headcount})`,
        amountInr: 0,
        amountUsd: 0,
        isDeposit: false,
        isEstimate: false,
        note: 'Data not available',
      });
      continue;
    }
    const annualInrPerPerson = avgCostLpa * 100000;
    const annualInrTotal = annualInrPerPerson * entry.headcount;
    const annualUsdTotal = fullyLoadedUsd * entry.headcount;
    totalInr += annualInrTotal;
    totalUsd += annualUsdTotal;
    lineItems.push({
      label: `${entry.role} — ${entry.experienceLevel} (${entry.headcount})`,
      amountInr: annualInrTotal,
      amountUsd: annualUsdTotal,
      isDeposit: false,
      isEstimate: false,
    });
  }

  if (roleMix.length > 0 && roleMix.some((e) => e.headcount > 0)) {
    const recruitmentCost = totalInr * A.recruitmentFeePercentOfCtc;
    totalInr += recruitmentCost;
    totalUsd += inrToUsd(recruitmentCost);
    lineItems.push({
      label: 'Recruitment fees (one-time, ~8.33% of CTC)',
      amountInr: recruitmentCost,
      amountUsd: inrToUsd(recruitmentCost),
      isDeposit: false,
      isEstimate: true,
    });
  }

  return {
    key: 'employeeCosts',
    label: 'Employee Costs',
    lineItems,
    totalInr,
    totalUsd,
    depositInr: 0,
    depositUsd: 0,
    hasMissingData: missingNotes.length > 0,
    missingDataNotes: missingNotes,
  };
}

function calcOfficeRent(
  city: string,
  seats: number,
  officeType: string,
  leaseDurationMonths: number,
  cityAggregates: Map<string, CityAggregate>,
): CostCategory {
  const agg = cityAggregates.get(city);
  const lineItems: CostLineItem[] = [];
  const missingNotes: string[] = [];
  let totalInr = 0;
  let totalUsd = 0;
  let depositInr = 0;
  let depositUsd = 0;

  if (!agg || agg.avgRentSqftInr === null) {
    missingNotes.push('Rent data not available for this city');
    return {
      key: 'officeRentOccupancy',
      label: 'Office Rent & Occupancy',
      lineItems: [{ label: 'Office rent (annual)', amountInr: 0, amountUsd: 0, isDeposit: false, isEstimate: false, note: 'Data not available' }],
      totalInr: 0,
      totalUsd: 0,
      depositInr: 0,
      depositUsd: 0,
      hasMissingData: true,
      missingDataNotes: missingNotes,
    };
  }

  let rentPerSqft = agg.avgRentSqftInr;
  if (officeType === 'Managed Office Space') rentPerSqft *= (1 + A.managedOfficePremiumPercent);
  if (officeType === 'Coworking') rentPerSqft *= (1 + A.coworkingPremiumPercent);
  if (officeType === 'SEZ') rentPerSqft *= (1 - A.sezDiscountPercent);

  const areaSqft = seats * A.officeAreaPerSeatSqft;
  const monthlyRent = rentPerSqft * areaSqft;
  const annualRent = monthlyRent * 12;
  const annualCam = monthlyRent * A.camPercentOfRent * 12;
  const rentDeposit = monthlyRent * A.rentDepositMonths;

  totalInr = annualRent + annualCam;
  totalUsd = inrToUsd(totalInr);
  depositInr = rentDeposit;
  depositUsd = inrToUsd(rentDeposit);

  lineItems.push({
    label: `Office rent (annual, ${areaSqft} sq ft @ ₹${rentPerSqft.toFixed(0)}/sq ft)`,
    amountInr: annualRent,
    amountUsd: inrToUsd(annualRent),
    isDeposit: false,
    isEstimate: true,
  });
  lineItems.push({
    label: 'CAM charges (annual, 15% of rent)',
    amountInr: annualCam,
    amountUsd: inrToUsd(annualCam),
    isDeposit: false,
    isEstimate: true,
  });
  lineItems.push({
    label: `Rent deposit (${A.rentDepositMonths} months, refundable)`,
    amountInr: rentDeposit,
    amountUsd: inrToUsd(rentDeposit),
    isDeposit: true,
    isEstimate: true,
  });

  return {
    key: 'officeRentOccupancy',
    label: 'Office Rent & Occupancy',
    lineItems,
    totalInr,
    totalUsd,
    depositInr,
    depositUsd,
    hasMissingData: false,
    missingDataNotes: [],
  };
}

function calcOfficeSetup(
  city: string,
  seats: number,
  officeType: string,
  cityAggregates: Map<string, CityAggregate>,
): CostCategory {
  const lineItems: CostLineItem[] = [];
  const agg = cityAggregates.get(city);
  const missingNotes: string[] = [];

  const areaSqft = seats * A.officeAreaPerSeatSqft;
  const fitOutCost = areaSqft * A.fitOutCostPerSqftInr;
  const furnitureCost = seats * A.furnitureCostPerSeatInr;
  const itSetupCost = seats * A.itSetupPerSeatInr;

  let totalInr = fitOutCost + furnitureCost + itSetupCost;
  let totalUsd = inrToUsd(totalInr);

  lineItems.push({
    label: `Fit-out (${areaSqft} sq ft @ ₹${A.fitOutCostPerSqftInr}/sq ft)`,
    amountInr: fitOutCost,
    amountUsd: inrToUsd(fitOutCost),
    isDeposit: false,
    isEstimate: true,
  });
  lineItems.push({
    label: `Furniture (${seats} seats @ ₹${A.furnitureCostPerSeatInr}/seat)`,
    amountInr: furnitureCost,
    amountUsd: inrToUsd(furnitureCost),
    isDeposit: false,
    isEstimate: true,
  });
  lineItems.push({
    label: `IT setup (${seats} seats @ ₹${A.itSetupPerSeatInr}/seat)`,
    amountInr: itSetupCost,
    amountUsd: inrToUsd(itSetupCost),
    isDeposit: false,
    isEstimate: true,
  });

  if (officeType === 'Managed Office Space' || officeType === 'Coworking') {
    totalInr = furnitureCost + itSetupCost;
    totalUsd = inrToUsd(totalInr);
    lineItems[0].note = 'Fit-out included in managed office / coworking';
    lineItems[0].amountInr = 0;
    lineItems[0].amountUsd = 0;
  }

  if (!agg) {
    missingNotes.push('City aggregate data not available');
  }

  return {
    key: 'officeSetup',
    label: 'Office Setup',
    lineItems,
    totalInr,
    totalUsd,
    depositInr: 0,
    depositUsd: 0,
    hasMissingData: missingNotes.length > 0,
    missingDataNotes: missingNotes,
  };
}

function calcUtilities(seats: number): CostCategory {
  const lineItems: CostLineItem[] = [];
  const monthlyUtilities = seats * A.utilitiesPerSeatPerMonthInr;
  const annualUtilities = monthlyUtilities * 12;
  const annualInternet = A.internetPerMonthInr * 12;
  const totalInr = annualUtilities + annualInternet;
  const totalUsd = inrToUsd(totalInr);

  lineItems.push({
    label: `Utilities (${seats} seats @ ₹${A.utilitiesPerSeatPerMonthInr}/seat/month)`,
    amountInr: annualUtilities,
    amountUsd: inrToUsd(annualUtilities),
    isDeposit: false,
    isEstimate: true,
  });
  lineItems.push({
    label: 'Internet & connectivity (annual)',
    amountInr: annualInternet,
    amountUsd: inrToUsd(annualInternet),
    isDeposit: false,
    isEstimate: true,
  });

  return {
    key: 'utilities',
    label: 'Utilities',
    lineItems,
    totalInr,
    totalUsd,
    depositInr: 0,
    depositUsd: 0,
    hasMissingData: false,
    missingDataNotes: [],
  };
}

function calcServiceProviders(vendorId: string): CostCategory {
  const config = PROVIDER_CONFIGS[vendorId];
  const provider = serviceProviders.find((p) => p.vendor_id === vendorId);
  const lineItems: CostLineItem[] = [];
  const missingNotes: string[] = [];

  if (!config || !provider) {
    missingNotes.push('Provider configuration not found');
    return {
      key: 'serviceProviders',
      label: 'Service Providers',
      lineItems: [{ label: 'No provider selected', amountInr: 0, amountUsd: 0, isDeposit: false, isEstimate: false }],
      totalInr: 0,
      totalUsd: 0,
      depositInr: 0,
      depositUsd: 0,
      hasMissingData: true,
      missingDataNotes: missingNotes,
    };
  }

  const totalInr = config.simulatedSetupFeeInr + config.simulatedAnnualFeeInr;
  const totalUsd = inrToUsd(totalInr);

  lineItems.push({
    label: `${provider.vendor_name} — setup fee (simulated)`,
    amountInr: config.simulatedSetupFeeInr,
    amountUsd: inrToUsd(config.simulatedSetupFeeInr),
    isDeposit: false,
    isEstimate: true,
    note: 'Simulated fee — not a verified offer',
  });
  lineItems.push({
    label: `${provider.vendor_name} — annual fee (simulated)`,
    amountInr: config.simulatedAnnualFeeInr,
    amountUsd: inrToUsd(config.simulatedAnnualFeeInr),
    isDeposit: false,
    isEstimate: true,
    note: 'Simulated fee — not a verified offer',
  });

  return {
    key: 'serviceProviders',
    label: 'Service Providers',
    lineItems,
    totalInr,
    totalUsd,
    depositInr: 0,
    depositUsd: 0,
    hasMissingData: false,
    missingDataNotes: [],
  };
}

function calcOtherOperatingCosts(seats: number): CostCategory {
  const lineItems: CostLineItem[] = [];
  const annualHrSoftware = seats * A.hrSoftwarePerSeatPerYearInr;
  const annualOtherMonthly = seats * A.otherMonthlyPerSeatInr * 12;
  const annualCompliance = A.complianceLegalAnnualInr;
  const totalInr = annualHrSoftware + annualOtherMonthly + annualCompliance;
  const totalUsd = inrToUsd(totalInr);

  lineItems.push({
    label: `HR software & tools (${seats} seats @ ₹${A.hrSoftwarePerSeatPerYearInr}/seat/year)`,
    amountInr: annualHrSoftware,
    amountUsd: inrToUsd(annualHrSoftware),
    isDeposit: false,
    isEstimate: true,
  });
  lineItems.push({
    label: `Other monthly costs (${seats} seats @ ₹${A.otherMonthlyPerSeatInr}/seat/month)`,
    amountInr: annualOtherMonthly,
    amountUsd: inrToUsd(annualOtherMonthly),
    isDeposit: false,
    isEstimate: true,
  });
  lineItems.push({
    label: 'Compliance & legal (annual retainer)',
    amountInr: annualCompliance,
    amountUsd: inrToUsd(annualCompliance),
    isDeposit: false,
    isEstimate: true,
  });

  return {
    key: 'otherOperatingCosts',
    label: 'Other Operating Costs',
    lineItems,
    totalInr,
    totalUsd,
    depositInr: 0,
    depositUsd: 0,
    hasMissingData: false,
    missingDataNotes: [],
  };
}

export function calcCityCostBreakdown(
  formCity: string,
  form: GccPlanForm,
  vendorId: string,
): CityCostBreakdown {
  const city = normalizeCity(formCity);
  const cityAggregates = getCityAggregates();
  const talentByCity = getTalentByCity();
  const employeeCosts = calcEmployeeCosts(city, form.roleMix, talentByCity);
  const officeRent = calcOfficeRent(city, form.seats, form.officeType, form.leaseDurationMonths, cityAggregates);
  const officeSetup = calcOfficeSetup(city, form.seats, form.officeType, cityAggregates);
  const utilities = calcUtilities(form.seats);
  const serviceProviders = calcServiceProviders(vendorId);
  const otherCosts = calcOtherOperatingCosts(form.seats);

  const categories = [employeeCosts, officeRent, officeSetup, utilities, serviceProviders, otherCosts];

  const nonDepositInr = categories.reduce((s, c) => s + c.totalInr, 0);
  const nonDepositUsd = categories.reduce((s, c) => s + c.totalUsd, 0);
  const refundableDepositInr = categories.reduce((s, c) => s + c.depositInr, 0);
  const refundableDepositUsd = categories.reduce((s, c) => s + c.depositUsd, 0);

  const agg = cityAggregates.get(city);
  const subsidyPercent = agg?.stateCapexSubsidyPercent ?? 0;

  const eligibleCapexInr = officeSetup.totalInr;
  const potentialIncentiveInr = (eligibleCapexInr * subsidyPercent) / 100;
  const potentialIncentiveUsd = inrToUsd(potentialIncentiveInr);

  const costAfterIncentiveInr = nonDepositInr - potentialIncentiveInr;
  const costAfterIncentiveUsd = nonDepositUsd - potentialIncentiveUsd;

  const recurringAnnualInr = employeeCosts.totalInr + officeRent.totalInr + utilities.totalInr + otherCosts.totalInr + serviceProviders.totalInr;
  const steadyStateAnnualInr = recurringAnnualInr * A.steadyStateEmployeeFactor;
  const steadyStateAnnualUsd = inrToUsd(steadyStateAnnualInr);

  const hasMissingData = categories.some((c) => c.hasMissingData);

  return {
    city,
    categories,
    firstYearGrossInr: nonDepositInr,
    firstYearGrossUsd: nonDepositUsd,
    potentialIncentiveInr,
    potentialIncentiveUsd,
    costAfterIncentiveInr,
    costAfterIncentiveUsd,
    steadyStateAnnualInr,
    steadyStateAnnualUsd,
    refundableDepositInr,
    refundableDepositUsd,
    hasMissingData,
  };
}
