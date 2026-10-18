# GCC Intelligence

GCC Intelligence is a decision-support dashboard for companies exploring where to set up a Global Capability Centre (GCC) in India. It brings market context, existing GCCs, and city-level planning into one place.

See it live - https://gcc-intelligence-dashboard.netlify.app/

## Why this matters

India had **1,700+ GCCs**, **1.9 million+ GCC professionals**, and an estimated **US$64.6 billion in GCC revenue in FY2024**, according to the NASSCOM-Zinnov India GCC Landscape Report. With the ecosystem growing, choosing a location means weighing talent availability, office costs, and local market conditions.

## What you can do

- **Explore the market:** Get a quick overview of India's GCC ecosystem and key locations.
- **Search the GCC directory:** Filter existing GCC records by available attributes such as company, city, industry, or function.
- **Plan your GCC:** Enter your hiring needs, headcount, budget, and office preferences to compare suitable cities and estimated costs.
- **Compare options:** Review city recommendations alongside the assumptions used in the calculations.

## How it works

The prototype uses structured datasets and a scoring engine to compare locations. Cost estimates depend on the data and assumptions available, so results should be treated as directional rather than formal quotes.

Some records are synthetic/demo data and should not be treated as verified market information. The service-provider directory is a future enhancement, pending data validation.

## Tech stack

TypeScript, React, TanStack Start, and JSON-based datasets. The current prototype focuses on the front end and local data; it does not require a backend or external API.

## Data and sources

The project uses datasets covering GCC records, talent and compensation, and commercial micro-markets. Review the source, reporting period, units, and assumptions before using any figure for a business decision.

- [NASSCOM-Zinnov: India GCC Landscape Report – The 5-Year Journey](https://community.nasscom.in/index.php/communities/nasscom-insights/india-gcc-landscape-report-5-year-journey?page=7)
- [Savills India: Global Capability Centres – Enabling India’s Strategic Advantage](https://www.savills.in/research_articles/165611/225610-0)

*The market figures above are for FY2024, not live counts. This project is a planning prototype, not a substitute for professional, legal, tax, or real-estate advice.*
