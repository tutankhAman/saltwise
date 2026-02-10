# Saltwise - Prescription Intelligence & Medicine Cost Optimization

## Overview

Saltwise is an AI-driven prescription intelligence system that reduces medicine costs without compromising clinical safety. It interprets prescriptions at the **salt (active ingredient) and dosage level**, then identifies **safe, regulatorily approved, lower-cost alternatives** across brands and pharmacies.

The system does not replace doctors or alter treatment intent. It operates strictly within pharmaceutical equivalence and substitution boundaries, functioning as infrastructure inside the prescription workflow rather than a consumer shopping app.

---

## Core Problem

Patients overpay for medicines because:

- Doctors prescribe by brand name, not by salt/generic name.
- Patients lack the knowledge to identify equivalent generics.
- Pharmacy incentives often push higher-margin brands.
- No transparent, trustworthy system exists to compare alternatives at the salt level.

Saltwise closes this gap by making substitution reasoning explicit, medically grounded, and cost-transparent.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19, RSC) |
| **Runtime & Package Manager** | Bun |
| **Database** | Supabase (PostgreSQL) |
| **ORM** | Drizzle ORM |
| **AI/LLM** | Vercel AI SDK + Groq + Cerebras |
| **Web Scraping** | Firecrawl (pharmacy price aggregation) |
| **UI** | shadcn/ui (base-mira style) + Tailwind CSS v4 |
| **Monorepo** | Turborepo with Bun workspaces |
| **Code Quality** | Ultracite (Biome) + Lefthook |
| **Deployment** | Vercel |

### Workspace Structure

```
saltwise/
  apps/
    web/              # Next.js frontend application
  packages/
    db/               # Drizzle ORM schema, migrations, DB client
    ui/               # Shared shadcn/ui component library (50+ components)
    configs/          # Shared TypeScript configurations
  context/            # Project documentation
  scripts/            # Setup and utility scripts
```

---

## System Architecture

### 1. Prescription Ingestion Layer

**Purpose**: Accept and parse prescriptions into structured, salt-level data.

- Accepts digital uploads (images, PDFs) or manual text entry.
- AI-powered OCR and NLP pipeline extracts:
  - Medicine names (brand and/or generic)
  - Strengths and dosage forms (tablet, capsule, syrup, etc.)
  - Dosage schedules and course duration
  - Doctor notes and special instructions
- Converts brand-heavy prescriptions into a **normalized salt-level representation**.
- Stores raw and parsed prescription data for audit.

**Key Models**:
- `prescriptions` - raw upload metadata, status, patient linkage
- `prescription_items` - individual medicines parsed from a prescription
- `parsed_medicines` - normalized salt + strength + form representation

### 2. Medical Intelligence Layer

**Purpose**: Validate medicines and enforce clinical safety rules.

- Validates parsed medicines against approved drug databases (Indian pharmacopoeia, FDA, WHO essential medicines list).
- Detects and flags:
  - **Drug-drug interactions** (severity levels: mild, moderate, severe, contraindicated)
  - **Dosage anomalies** (exceeds max daily dose, unusual frequency)
  - **Age-based risks** (pediatric/geriatric contraindications)
  - **Pregnancy/lactation risks** (FDA pregnancy categories)
  - **Allergy cross-reactivity** (if patient profile available)
- Flags cases where substitution is **unsafe or explicitly disallowed** (narrow therapeutic index drugs, specific formulations like extended-release vs immediate-release).
- Safety rules are **deterministic** - they override all cost optimization logic.

**Data Sources**:
- Drug interaction databases (seeded + periodically updated)
- Salt-to-brand mapping tables
- Regulatory approval status per drug

### 3. Generic & Equivalent Mapping Engine

**Purpose**: Map branded drugs to safe, equivalent alternatives.

- **Exact-salt generics**: Same active ingredient, same strength, same dosage form.
- **Therapeutic equivalents**: When exact matches are unavailable, proposes clinically equivalent alternatives with clear explanation of the difference.
- Ranking criteria (in priority order):
  1. **Safety** - regulatory approval status, manufacturer reliability
  2. **Clinical parity** - bioequivalence data where available
  3. **Regulatory trust** - CDSCO/FDA approval, GMP certification
  4. **Price** - cost is the tiebreaker, never the primary driver

**Key Logic**:
- Narrow Therapeutic Index (NTI) drugs are flagged as non-substitutable by default.
- Extended-release, enteric-coated, and specialized formulations are matched only to identical formulation types.
- Doctor-marked "non-substitutable" medicines bypass this layer entirely.

### 4. Cost Optimization Engine

**Purpose**: Find the cheapest safe configuration for the full treatment course.

- Calculates **real treatment cost** (full course), not per-strip pricing that obscures true expense.
- Compares prices across:
  - Multiple pharmacy chains and online pharmacies
  - Different brands of the same salt
  - Different pack sizes (price-per-unit optimization)
- Suggests **split-pharmacy fulfillment** when buying different medicines from different pharmacies yields meaningful savings.
- Produces a clear cost breakdown:
  - Original prescription cost (branded)
  - Optimized cost (generic/equivalent)
  - Savings amount and percentage

**Data Pipeline**:
- Firecrawl scrapes pharmacy pricing data (1mg, PharmEasy, Netmeds, Apollo, local pharmacy APIs).
- Prices are cached with TTL and staleness indicators.
- Price confidence levels: `live` > `recent` (< 24h) > `cached` (< 7d) > `estimated`.

### 5. Availability & Fulfillment Layer

**Purpose**: Ensure recommended medicines are actually obtainable.

- Aggregates real-time or near-real-time pharmacy stock data.
- Provides:
  - **Stock status** per pharmacy per medicine
  - **Reserve/hold** functionality (where pharmacy APIs support it)
  - **Redirect** to alternative pharmacies when primary is out of stock
  - **Pickup vs delivery** options
- Graceful degradation: operates with placeholder/estimated availability in early deployment stages, upgrades to live feeds as pharmacy integrations mature.

### 6. Doctor Controls & Accountability

**Purpose**: Preserve clinical authority and create audit trails.

- Doctors can mark specific medicines as **non-substitutable** (brand-medically-necessary).
- All substitutions are logged with:
  - Original medicine and recommended alternative
  - Clinical rationale for equivalence
  - Safety checks performed
  - Cost comparison
  - Timestamp and system version
- Transparent audit trail for clinical review, legal compliance, and dispute resolution.

### 7. Patient Communication Layer

**Purpose**: Build trust through clarity.

- **Plain-language explanations** for every substitution ("This contains the same active ingredient, Paracetamol 500mg, made by a different manufacturer").
- **Side-by-side comparison**: brand vs generic showing salt, strength, form, manufacturer, and efficacy equivalence.
- **Adherence support**:
  - Dosage reminders tied to the actual medicines dispensed
  - Pill identification (appearance description to avoid confusion when switching brands)
  - Course completion tracking
- **No jargon** mode for patients; detailed clinical mode for doctors/pharmacists.

### 8. Transparency & Safety Guarantees

- Clear distinction between **verified medical data** (drug databases, interaction data) and **market-derived pricing** (scraped, estimated).
- No hidden substitutions - every recommendation is visible and explained.
- No pharmacy-biased recommendations - Saltwise has no financial relationship with pharmacies that would influence suggestions.
- All AI-generated content (parsing, explanations) is clearly labeled as AI-assisted.
- Confidence scores on every recommendation.

---

## AI Integration Architecture

### LLM Usage (Groq + Cerebras via Vercel AI SDK)

AI is used **only where ambiguity exists**. The core logic is deterministic.

| Task | AI Role | Deterministic Fallback |
|---|---|---|
| Prescription OCR/parsing | Primary (image-to-text, entity extraction) | Manual entry form |
| Medicine name normalization | Assist (fuzzy brand-to-salt matching) | Exact lookup in drug database |
| Patient explanations | Primary (natural language generation) | Template-based explanations |
| Interaction summarization | Assist (severity explanation) | Coded severity levels |
| Dosage validation | Secondary (edge case detection) | Rule-based max-dose checks |

**Model Selection**:
- **Groq** (LLaMA models): Fast inference for real-time prescription parsing and conversational interactions.
- **Cerebras** (Wafer-scale models): High-throughput batch processing for bulk price comparison and drug database enrichment tasks.

### Vercel AI SDK Integration

- `ai` package for streaming responses in prescription analysis.
- `@ai-sdk/groq` and `@ai-sdk/cerebras` provider packages.
- Server Actions and Route Handlers for AI endpoints.
- Structured output (JSON mode) for prescription parsing to ensure reliable data extraction.

---

## Database Schema (Planned)

Core tables (all prefixed `saltwise_` in Drizzle config):

```
-- Drug Reference Data
salts                    # Active ingredients (INN names)
salt_combinations        # Multi-salt formulations
dosage_forms             # tablet, capsule, syrup, injection, etc.
drugs                    # Brand-name products (salt + strength + form + manufacturer)
manufacturers            # Pharmaceutical companies
drug_interactions        # Pairwise interaction data with severity
contraindications        # Age, pregnancy, condition-based restrictions

-- Prescription Flow
users                    # Patients and doctors
prescriptions            # Uploaded prescriptions (metadata, status)
prescription_items       # Individual medicines from a prescription
substitution_results     # AI/engine-generated alternatives per item
substitution_logs        # Audit trail of all recommendations

-- Pricing & Availability
pharmacies               # Pharmacy locations and API integrations
drug_prices              # Price per drug per pharmacy (with timestamp, confidence)
pharmacy_availability    # Stock status per drug per pharmacy

-- Patient Features
adherence_records        # Dose tracking
saved_prescriptions      # Patient prescription history
```

---

## API Routes (Planned)

```
POST   /api/prescriptions/upload     # Upload prescription image/PDF
POST   /api/prescriptions/parse      # AI-parse uploaded prescription
GET    /api/prescriptions/:id        # Get parsed prescription with items
POST   /api/prescriptions/:id/optimize  # Run cost optimization

GET    /api/drugs/search              # Search drugs by name/salt
GET    /api/drugs/:id/alternatives    # Get generic alternatives for a drug
GET    /api/drugs/:id/interactions    # Check interactions with other drugs

GET    /api/salts/search              # Search salts/active ingredients
GET    /api/salts/:id/brands          # All brands for a given salt

POST   /api/compare/prices            # Compare prices across pharmacies
GET    /api/pharmacies/nearby          # Nearby pharmacies with availability

POST   /api/ai/chat                   # Conversational AI for patient queries
POST   /api/ai/explain                # Generate plain-language explanation
```

---

## Key Design Principles

1. **Safety over savings** - Clinical rules always override cost optimization. A cheaper drug that is contraindicated is never recommended.

2. **Deterministic core** - Drug interactions, dosage limits, and substitution rules are rule-based. AI handles ambiguity (OCR, fuzzy matching, natural language) but never makes clinical decisions.

3. **Modular isolation** - Prescription parsing, medical validation, pricing, and availability are separate layers. Each can be tested, updated, and scaled independently.

4. **Regional scalability** - Drug brands differ by country, but salts (INNs) are universal. The salt-level architecture allows expansion to any market by adding brand mappings.

5. **Transparency** - Every recommendation includes its reasoning. No black-box substitutions.

6. **No pharmacy bias** - Recommendations are ranked by safety and cost, never by pharmacy margin or partnership.

---

## Environment Variables

```
DATABASE_URL          # Supabase PostgreSQL connection string
GROQ_API_KEY          # Groq API key for LLM inference
CEREBRAS_API_KEY      # Cerebras API key for batch AI tasks
FIRECRAWL_API_KEY     # Firecrawl API key for pharmacy scraping
NEXT_PUBLIC_APP_URL   # Public application URL
```

---

## Target Outcome

Saltwise reduces medicine costs, increases generic adoption, improves treatment adherence, and restores trust in substitutions by making the reasoning explicit and medically grounded. It is clinical infrastructure, not a shopping app.
