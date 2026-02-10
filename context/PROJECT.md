# Saltwise - Prescription Intelligence & Medicine Cost Optimization

## Overview

Saltwise is an AI-driven prescription intelligence system that reduces medicine costs without compromising clinical safety. It interprets prescriptions at the **salt (active ingredient) and dosage level**, then identifies **safe, regulatorily approved, lower-cost alternatives** across brands and pharmacies.

The system does not replace doctors or alter treatment intent. It operates strictly within pharmaceutical equivalence and substitution boundaries, functioning as clinical infrastructure rather than a consumer shopping app.

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

## Product Architecture: Search-Centric Design

Saltwise is built around a **unified search experience**. The search results page is the core of the product. A dedicated history page gives authenticated users a way to revisit past searches and track savings over time.

### User Flow

```
Landing Page (/) --> Search Input --> Results Page (/search?q=...)
                                          |
                                          +--> Medicine Info
                                          +--> Generic Alternatives
                                          +--> Price Comparisons
                                          +--> Safety Checks
                                          +--> AI Explanations

History Page (/history) --> Past Searches --> Click to Re-search
                               |
                               +--> Saved Medicines
                               +--> Prescription Upload History
                               +--> Cumulative Savings Tracker
```

### Route Structure

| Route | Purpose |
|---|---|
| `/` | Landing page with hero, search bar, and CTA |
| `/search?q=...` | **Core page** - Search results with full medicine intelligence |
| `/history` | Search history, saved medicines, prescription uploads, savings tracker (auth required) |
| `/auth/callback` | Supabase OAuth callback |

### Search Behavior

The search bar on the landing page (and persistent in the header) accepts two types of input:

1. **Medicine lookups** - Direct drug/salt names like "Dolo 650", "Paracetamol 500mg", "Augmentin". These trigger a database lookup and return structured results with alternatives and pricing.

2. **Natural language queries** - Questions like "What is the best alternative for Augmentin?", "Is Crocin the same as Dolo?", "Cheapest blood pressure medicine?". These are routed to the LLM, which uses the drug database as context to provide grounded, medically accurate answers.

The search results page (`/search`) is the **primary surface of the entire application**. It must be rich, informative, and trustworthy.

### Search Results Page - What It Shows

When a user searches for a medicine (e.g., "Dolo 650"), the results page displays:

#### Medicine Identity Card
- Brand name, salt/active ingredient (INN), strength, dosage form
- Manufacturer name and GMP certification status
- Regulatory approval status
- Drug class/category

#### Generic Alternatives Section
- List of all equivalent generics (same salt + strength + form)
- Each alternative shows: brand name, manufacturer, price, savings vs original
- Safety tier labels: "Exact Generic" or "Therapeutic Equivalent"
- Sorted by: safety > regulatory trust > price
- NTI (Narrow Therapeutic Index) drugs flagged as non-substitutable with explanation

#### Price Comparison Table
- Price per unit across multiple pharmacies (1mg, PharmEasy, Netmeds, Apollo)
- Pack size options and full course cost calculation
- Price confidence indicators (live / recent / cached / estimated)
- "Best deal" highlighting

#### Safety Information
- Drug-drug interactions (if user has searched multiple medicines or has a session)
- Dosage information and max daily limits
- Common side effects
- Pregnancy/lactation risk category
- Age-based warnings (pediatric/geriatric)

#### AI-Powered Explanations
- Plain-language explanation of why each alternative is safe
- "Why is this cheaper?" contextual explanation
- Inline AI chat for follow-up questions about the medicine

#### Prescription Upload (Secondary Input)
- Small upload zone integrated into the search flow
- Users can upload a prescription image/PDF
- AI-powered OCR extracts medicine names
- Each extracted medicine populates the results page as if searched individually
- Shows all medicines from the prescription with alternatives and total cost savings

---

## System Architecture

### 1. Unified Search Layer

**Purpose**: Single entry point for all medicine intelligence queries.

- Accepts text queries (medicine names, salts, natural language questions)
- Accepts prescription image uploads as a secondary input
- Routes queries to either:
  - **Database lookup** (exact/fuzzy match on drug or salt names)
  - **LLM pipeline** (natural language questions, ambiguous queries)
  - **Both** (LLM uses DB results as grounding context)
- Returns structured results optimized for the search results page

**Query Classification Logic**:
- If query matches a known drug/salt name -> DB lookup + enrich with alternatives/pricing
- If query is a natural language question -> LLM with drug DB context
- If query is ambiguous -> DB fuzzy search + LLM interpretation in parallel
- If input is an image -> OCR pipeline -> extract medicines -> multi-search

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

### 4. Cost Optimization Engine

**Purpose**: Find the cheapest safe option and make savings transparent.

- Calculates **real treatment cost** (full course), not per-strip pricing that obscures true expense.
- Compares prices across:
  - Multiple pharmacy chains and online pharmacies
  - Different brands of the same salt
  - Different pack sizes (price-per-unit optimization)
- Produces a clear cost breakdown:
  - Original prescription cost (branded)
  - Optimized cost (generic/equivalent)
  - Savings amount and percentage

**Data Pipeline**:
- Firecrawl scrapes pharmacy pricing data (1mg, PharmEasy, Netmeds, Apollo, local pharmacy APIs).
- Prices are cached with TTL and staleness indicators.
- Price confidence levels: `live` > `recent` (< 24h) > `cached` (< 7d) > `estimated`.

### 5. Prescription OCR & Parsing (Secondary Input)

**Purpose**: Accept prescription images and extract medicine data into the search flow.

- Accepts image uploads (photos, scans) and PDFs
- AI-powered OCR and NLP pipeline extracts:
  - Medicine names (brand and/or generic)
  - Strengths and dosage forms
  - Quantities
- Converts extracted medicines into search queries
- Each medicine from the prescription is displayed on the results page with full alternative/pricing intelligence
- Shows aggregate savings across all medicines in the prescription

### 6. Patient Communication & Trust

**Purpose**: Build trust through clarity.

- **Plain-language explanations** for every substitution ("This contains the same active ingredient, Paracetamol 500mg, made by a different manufacturer").
- **Side-by-side comparison**: brand vs generic showing salt, strength, form, manufacturer, and efficacy equivalence.
- **No jargon** mode for patients; detailed clinical mode for healthcare professionals.
- **Confidence scores** on every recommendation.
- Clear distinction between **verified medical data** (drug databases, interaction data) and **market-derived pricing** (scraped, estimated).
- All AI-generated content is clearly labeled as AI-assisted.

### 7. Authentication & User Features

**Purpose**: Enable personalization and saved data.

- Supabase Auth with Google OAuth
- Authenticated users can:
  - View full search history on the `/history` page
  - Bookmark medicines and alternatives
  - Set up a medicine profile (current medications for interaction checking)
  - Track prescription uploads over time
  - See cumulative savings across all searches
- Anonymous users get full search functionality without saving

### 8. History Page

**Purpose**: Give authenticated users a persistent record of their activity and savings.

The `/history` page is the secondary surface of the app (after search results). It shows:

- **Search History** - Chronological list of past searches with timestamps. Click any entry to re-run the search with fresh data.
- **Saved Medicines** - Bookmarked drugs and their alternatives. Quick access to medicines the user cares about.
- **Prescription Uploads** - Past prescription uploads with parsed results. Each shows the medicines found and savings achieved.
- **Cumulative Savings Tracker** - Running total of potential savings across all searches. "You've found X in potential savings across Y searches."
- **Medicine Profile** - User's current medications list, used for automatic interaction checking on every search.

The page requires authentication. Unauthenticated users who navigate to `/history` are prompted to sign in.

---

## AI Integration Architecture

### LLM Usage (Groq + Cerebras via Vercel AI SDK)

AI is used **only where ambiguity exists**. The core logic is deterministic.

| Task | AI Role | Deterministic Fallback |
|---|---|---|
| Natural language query understanding | Primary (intent classification, entity extraction) | Direct DB lookup |
| Prescription OCR/parsing | Primary (image-to-text, entity extraction) | Manual text entry |
| Medicine name normalization | Assist (fuzzy brand-to-salt matching) | Exact lookup in drug database |
| Patient explanations | Primary (natural language generation) | Template-based explanations |
| Interaction summarization | Assist (severity explanation) | Coded severity levels |
| Follow-up Q&A | Primary (conversational, context-aware) | Links to drug info pages |

**Model Selection**:
- **Groq** (LLaMA models): Fast inference for real-time search queries, prescription parsing, and conversational interactions.
- **Cerebras** (Wafer-scale models): High-throughput batch processing for bulk price comparison and drug database enrichment tasks.

### Vercel AI SDK Integration

- `ai` package for streaming responses in search results and chat.
- `@ai-sdk/groq` and `@ai-sdk/cerebras` provider packages.
- Server Actions and Route Handlers for AI endpoints.
- Structured output (JSON mode) for prescription parsing and query classification.

---

## Database Schema

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

-- User Data
users                    # Patients (Supabase Auth linked)
search_history           # Log of all searches (query, timestamp, result drug_id)
saved_medicines          # Bookmarked drugs
medicine_profiles        # User's current medications (for interaction checking)

-- Prescription Flow
prescriptions            # Uploaded prescriptions (metadata, status)
prescription_items       # Individual medicines parsed from a prescription

-- Pricing & Availability
pharmacies               # Pharmacy sources and API integrations
drug_prices              # Price per drug per pharmacy (with timestamp, confidence)
```

---

## API Routes

```
# Search (Core)
GET    /api/search?q=&type=          # Unified search endpoint (medicine lookup + NL queries)
POST   /api/search/prescription      # Upload prescription image, parse, return results

# Drug Data
GET    /api/drugs/search?q=          # Search drugs by name/salt (DB-level)
GET    /api/drugs/[id]/alternatives   # Get generic alternatives for a drug
GET    /api/drugs/[id]/info           # Detailed drug information
GET    /api/drugs/[id]/interactions   # Check interactions with other drugs

# Salts
GET    /api/salts/search?q=          # Search salts/active ingredients
GET    /api/salts/[id]/brands        # All brands for a given salt

# Pricing
POST   /api/prices/compare           # Compare prices across pharmacies
POST   /api/prices/refresh           # Trigger fresh price scrape for a drug

# AI
POST   /api/ai/chat                  # Conversational AI for patient queries (streaming)
POST   /api/ai/explain               # Generate plain-language explanation

# History (Auth required)
GET    /api/history                   # Get user's search history (paginated)
GET    /api/history/savings           # Get cumulative savings stats
GET    /api/saved-medicines           # Get user's bookmarked medicines
POST   /api/saved-medicines           # Bookmark a medicine
DELETE /api/saved-medicines/[id]      # Remove a bookmark

# Auth
GET    /auth/callback                # Supabase OAuth callback
```

---

## Key Design Principles

1. **Search is the product** - The search results page is the core surface. Every feature serves the search experience. The history page complements it by giving users a persistent record.

2. **Safety over savings** - Clinical rules always override cost optimization. A cheaper drug that is contraindicated is never recommended.

3. **Deterministic core** - Drug interactions, dosage limits, and substitution rules are rule-based. AI handles ambiguity (NL queries, OCR, fuzzy matching, natural language) but never makes clinical decisions.

4. **Modular isolation** - Medical validation, pricing, and AI are separate layers. Each can be tested, updated, and scaled independently.

5. **Regional scalability** - Drug brands differ by country, but salts (INNs) are universal. The salt-level architecture allows expansion to any market by adding brand mappings.

6. **Transparency** - Every recommendation includes its reasoning. No black-box substitutions.

7. **No pharmacy bias** - Recommendations are ranked by safety and cost, never by pharmacy margin or partnership.

---

## Environment Variables

```
DATABASE_URL              # Supabase PostgreSQL connection string
GROQ_API_KEY              # Groq API key for LLM inference
CEREBRAS_API_KEY          # Cerebras API key for batch AI tasks
FIRECRAWL_API_KEY         # Firecrawl API key for pharmacy scraping
NEXT_PUBLIC_APP_URL       # Public application URL
NEXT_PUBLIC_SUPABASE_URL  # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
```

---

## Target Outcome

Saltwise reduces medicine costs, increases generic adoption, and restores trust in substitutions by making the reasoning explicit and medically grounded. It is clinical infrastructure, not a shopping app. The core experience lives in a powerful search page, with a history page to track activity and savings over time.
