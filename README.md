# MFA Documentary Dashboard v3

Files:
- `index.html`
- `data.json`
- `schema.md`

Deploy all three in the same GitHub Pages folder.

## What changed in v3

Added:
- evidence provenance
- confidence scoring
- contradiction logging
- mentor dependency index
- creative identity drift
- daily life/location context
- failure-mode analysis
- post-graduation trajectory forecasting
- priority evolution
- portfolio/project status, with Pamunkey marked exploratory/non-core
- scenario presets
- editable/importable JSON

## Live web updating

Static GitHub Pages cannot safely scrape the web itself.

To make it truly live, use one of:
- manual JSON updates generated from new findings
- Google Sheets published data
- serverless function that fetches APIs
- small backend with scheduled jobs

Recommended next step:
keep using JSON updates. When new emails or research findings arrive, revise affected subvariables instead of changing total school scores.


## v4 notes

This version adds data visualization layers and city/HRC MEI context.

Known HRC caveat:
The Human Rights Campaign Municipal Equality Index is broader LGBTQ municipal policy scoring. It should not be treated as a full lived trans-safety score. City MEI, state politics, healthcare access, and identity-stress resilience are intentionally separated.


## v5 additions

- master ontology for all future systems
- implementation-status tracking
- longitudinal creative-life simulation architecture
- scaffolding for Bayesian, Monte Carlo, GIS, journaling, and evidence-ingestion systems
- future documentary-education research mode

Excluded by explicit request:
- 16mm reverence intensity


## v6 additions

All future systems have now been activated as usable dashboard modules.

New dashboard tabs:
- All systems
- Mega indices

Important limitation:
Most newly activated systems are seeded from existing model variables. They should be treated as starting hypotheses, not confirmed findings.


## v7 additions

- public testimony ingestion layer
- Reddit / FilmSchool.org anecdotal evidence integration
- public testimony dashboard tab
- confidence adjustment from corroborated public posts

Important:
Public testimony is noisy and sometimes contradictory. These entries are treated as anecdotal evidence, not authoritative truth.


## v8 additions

- Alumni/current-student outcomes layer
- New dashboard tab: Alumni/current outcomes
- Concrete examples attached to each school
- Outcome-pattern summaries
- Current-student pattern summaries
- Model-impact hooks from outcomes into system modules
- Outcome taxonomy added to data.json

Important:
Outcomes are interpreted as evidence of the kind of life/career a program normalizes, not as a prestige score.


## v9 additions

New tabs:
- Forecast engine
- Doc philosophy
- Ordinary Tuesday
- Anti-delusion
- Reflection logs

New data:
- evidence hierarchy
- documentary philosophy maps
- advisor archetypes
- ordinary Tuesday descriptions
- future biographies
- anti-delusion checks
- stress-test scenarios
- behavioral self-data schemas


## v13-static

This version permanently removes backend/live-update assumptions.

The dashboard now treats all updates as manual JSON updates and explicitly separates:
- verified facts
- corroborated patterns
- single anecdotes
- structured inferences
- placeholder priors

This is the correct architecture for a no-backend project.


## v14 — The Documentary Futures Atlas

Renamed tool:
- The Documentary Futures Atlas

Added:
- in-page JSON editor
- JSON validation
- JSON formatting
- Load edited JSON into dashboard
- Download replacement data.json
- Save-to-file option where browser supports it
- Copy JSON
- upgraded UI/visual design


## v15 — ATLAS

Official project name:
ATLAS

Subtitle:
A static documentary education forecasting atlas


## v16 fix

Fixes local opening/loading issue by embedding fallback data in index.html.
When hosted over HTTP/GitHub Pages, ATLAS still attempts to load data.json first.


## v18 responsive

Added:
- mobile-first responsive layout
- desktop table/mobile card switching
- horizontal scroll tabs on small screens
- logout button
- category heatmap
- evidence confidence matrix
- risk dashboard
- diagnostic scorecard
- improved touch targets and mobile JSON editor behavior


## v19 unified
Rebuilt ATLAS as a clean unified static app with all major modules reintegrated into one navigation/render architecture.


## v20 clean
Cleaned old-version artifacts, reduced navigation, normalized naming, and consolidated modules into decision-useful sections.


## v21 clean visual
Icon navigation, collapsible menu, corner JSON editor, page-specific explanations, additional charts, and city photo cards.
