# Saltwise - 12-Hour Implementation Timeline

## Team Structure

| Role | Focus Areas |
|---|---|
| **Backend (BE)** | Database schema, API routes, AI integration, Firecrawl scraping, business logic |
| **Frontend (FE)** | Pages, components, UI flows, client-side state, responsive design |

Both developers work in parallel. Sync points are marked with a handshake icon. Dependencies between BE and FE are minimized by agreeing on API contracts early.

---

## Pre-Work (Before the 12 Hours)

**Both (15 min)**:
- Clone repo, run `bun install`, verify `bun run dev` works.
- Run `bun run env` to configure `DATABASE_URL` (Supabase).
- Agree on API route signatures and response shapes (see contracts below).
- Set up Supabase project with PostgreSQL database.

---

## Hour-by-Hour Breakdown

### Hour 1 (0:00 - 1:00) - Foundation

**BE: Database Schema + Seed Data**
- [ ] Design and write Drizzle schema in `packages/db/src/schema.ts`:
  - `saltwise_salts` (id, name, aliases, description, is_nti)
  - `saltwise_dosage_forms` (id, name - tablet, capsule, syrup, etc.)
  - `saltwise_manufacturers` (id, name, country, gmp_certified)
  - `saltwise_drugs` (id, brand_name, salt_id, strength, dosage_form_id, manufacturer_id)
  - `saltwise_drug_interactions` (drug_a_salt_id, drug_b_salt_id, severity, description)
  - `saltwise_drug_prices` (id, drug_id, pharmacy_name, price, pack_size, price_per_unit, source_url, fetched_at, confidence)
  - `saltwise_users` (id, supabase_auth_id, email, created_at)
  - `saltwise_saved_searches` (id, user_id, query, drug_id, created_at)
  - `saltwise_search_history` (id, user_id, query, result_drug_id, savings_found, created_at)
  - `saltwise_saved_medicines` (id, user_id, drug_id, notes, created_at)
  - `saltwise_prescriptions` (id, user_id, status, image_url, created_at)
  - `saltwise_prescription_items` (id, prescription_id, raw_name, parsed_salt_id, parsed_drug_id, strength, dosage_form, quantity)
- [ ] Run `bun run db:gen` and `bun run db:push` to apply migrations.
- [ ] Create seed script with ~50 common Indian medicines (salts, brands, manufacturers).

**FE: App Shell + Landing Page**
- [ ] Simplify navigation: Remove Upload, Compare links. Keep Search and History in header.
- [ ] Update route structure:
  - `/` - Landing page with search
  - `/search?q=...` - Core results page
  - `/history` - Search history, saved medicines, savings tracker (auth required)
- [ ] Remove stub pages (`/upload`, `/compare`, `/prescription/[id]`).
- [ ] Polish landing page:
  - Hero section with value proposition.
  - Prominent search bar (existing QuickSearch component).
  - "Upload Prescription" secondary CTA below search.
  - Stats section (placeholder).

---

### Hour 2 (1:00 - 2:00) - Drug Data + Search API

**BE: Seed Data + Drug Search API**
- [ ] Finish and run seed script (salts, drugs, interactions, sample prices).
- [ ] `GET /api/drugs/search?q=` - Full-text search on drug name and salt name.
- [ ] `GET /api/salts/search?q=` - Search active ingredients.
- [ ] `GET /api/salts/[id]/brands` - All brands for a given salt.
- [ ] `GET /api/drugs/[id]/alternatives` - For a given drug:
  - Find all drugs with the same salt_id + strength + dosage_form.
  - Sort by: safety tier > regulatory trust > price.
  - Return with price comparison data.

**FE: Search Results Page - Core Layout**
- [ ] Build `/search` results page structure:
  - Search bar at top (persistent, pre-filled with query).
  - Loading skeleton while fetching.
  - Medicine Identity Card (brand, salt, strength, form, manufacturer).
  - Alternatives section (list of generic equivalents).
  - Price comparison table placeholder.
- [ ] Wire search bar to `GET /api/drugs/search?q=`.
- [ ] Handle empty states and "no results found".

---

### Hour 3 (2:00 - 3:00) - Alternatives Engine + AI Setup

**BE: Generic Alternatives + Interaction Checks**
- [ ] `GET /api/drugs/[id]/info` - Detailed drug information (salt details, side effects, storage).
- [ ] `POST /api/drugs/interactions` - Accept array of salt_ids, return all pairwise interactions.
- [ ] Add NTI drug list to seed data (warfarin, lithium, phenytoin, etc.) with `is_nti: true`.
- [ ] Add interaction seed data for common dangerous combinations.
- [ ] Install and configure `ai`, `@ai-sdk/groq` packages.

**FE: Search Results - Alternatives UI**
- [ ] Build alternative medicine cards:
  - Side-by-side: Original vs Alternative (salt, strength, manufacturer, price).
  - Savings badge (amount and percentage).
  - Safety tier label ("Exact Generic" / "Therapeutic Equivalent").
  - NTI warning badge for non-substitutable drugs.
- [ ] Total cost comparison bar (original vs optimized).
- [ ] "Why is this safe?" expandable section per alternative (placeholder for AI text).

---

### SYNC POINT (3:00) - 5 min

- Verify search -> results -> alternatives flow works end-to-end.
- Confirm API response shapes match FE expectations.

---

### Hour 4 (3:00 - 4:00) - Unified Search + AI Query Routing

**BE: Unified Search Endpoint + LLM Integration**
- [ ] `GET /api/search?q=&type=` - Unified search endpoint:
  - Classifies query: medicine lookup vs natural language question.
  - Medicine lookups -> DB search + alternatives + pricing.
  - NL questions -> Groq LLM with drug DB context.
  - Returns structured response for both types.
- [ ] `POST /api/ai/chat` - Streaming conversational endpoint:
  - Context-aware: knows the current search and alternatives.
  - Can answer "Is this generic as effective?", "Why is this cheaper?", etc.
  - Uses Vercel AI SDK streaming.
- [ ] `POST /api/ai/explain` - Generate plain-language explanation for a substitution.

**FE: AI Integration in Search Results**
- [ ] Route search bar through `/api/search` (unified endpoint).
- [ ] Handle two result types:
  - Structured medicine results -> render cards/tables.
  - LLM text response -> render streamed markdown answer.
- [ ] Add inline AI chat panel to results page:
  - Slide-out or bottom sheet.
  - Suggested questions contextual to the searched medicine.
  - Streaming responses.

---

### Hour 5 (4:00 - 5:00) - Prescription Upload + Price Scraping

**BE: Prescription OCR + Firecrawl**
- [ ] `POST /api/search/prescription` - Accept image upload:
  - Send image to Groq (LLaMA Vision) via Vercel AI SDK.
  - Extract medicine names, strengths, dosage forms, quantities.
  - Fuzzy-match against drug DB.
  - Return array of parsed medicines (same shape as search results).
- [ ] Install and configure `@mendable/firecrawl-js`.
- [ ] Build scraping service for 2-3 pharmacy sites (1mg, PharmEasy).
- [ ] `POST /api/prices/refresh` - Trigger price scrape for a given drug.
- [ ] Add caching layer: skip scrape if price data is < 6 hours old.

**FE: Prescription Upload + Price UI**
- [ ] Add prescription upload zone to search results page:
  - Small drag-and-drop area or "Upload Prescription" button.
  - Upload progress indicator.
  - Parsed medicines appear as multiple result cards on the same page.
  - Aggregate savings displayed at the top.
- [ ] Build price comparison table within each medicine card:
  - Pharmacy name | Price | Pack Size | Per-Unit | Stock.
  - Sort by price, filter by availability.
  - Price confidence indicator (live/recent/cached/estimated).
  - "Refresh prices" button.

---

### Hour 6 (5:00 - 6:00) - Safety Information + Drug Details

**BE: Drug Info + Safety APIs**
- [ ] Expand `GET /api/drugs/[id]/info` with:
  - Common and rare side effects.
  - Pregnancy/lactation risk category.
  - Age-based warnings.
  - Storage instructions.
  - Mechanism of action (brief).
- [ ] Integrate interaction checking into the unified search response:
  - When prescription upload returns multiple medicines, auto-check all pairwise interactions.
  - Include interaction warnings in the response.

**FE: Safety & Drug Info Sections**
- [ ] Build drug info expandable section within results:
  - Salt info, mechanism of action, drug class.
  - Side effects (common vs rare, collapsible).
  - Warnings (pregnancy, age, interactions).
  - "How to take" instructions.
- [ ] Interaction warning banners:
  - Yellow for moderate, red for severe/contraindicated.
  - Clear explanation of what interacts with what.
  - Appears when multiple medicines are in context (prescription upload).

---

### BREAK (6:00 - 6:30) - 30 min

---

### SYNC POINT (6:30) - 10 min

- Demo full flow: search -> results with alternatives + prices + AI.
- Demo prescription upload -> multi-medicine results.
- Identify bugs, mismatches, missing data.
- Prioritize remaining hours.

---

### Hour 7 (6:30 - 7:30) - Auth + User Features

**BE: Authentication + Saved Data + History**
- [ ] Wire up Supabase Auth middleware (session refresh on requests).
- [ ] Create user record on first login (link to Supabase Auth).
- [ ] Auto-log searches to `search_history` table for authenticated users.
- [ ] `GET /api/history` - Paginated search history for the user.
- [ ] `GET /api/history/savings` - Cumulative savings stats across all searches.
- [ ] `POST /api/saved-medicines` - Bookmark a medicine.
- [ ] `GET /api/saved-medicines` - Retrieve user's bookmarked medicines.
- [ ] `DELETE /api/saved-medicines/[id]` - Remove a bookmark.
- [ ] `POST /api/medicine-profile` - Save user's current medications.
- [ ] `GET /api/medicine-profile` - Get user's medicine profile (for interaction checking).

**FE: Auth + History Page + Personalization**
- [ ] Wire AuthIsland component into the site header.
- [ ] Build `/history` page (auth required):
  - Search history list: chronological, with query text, matched medicine, and timestamp.
  - Click any history entry to re-run the search.
  - Saved medicines section: bookmarked drugs with quick-view info.
  - Prescription upload history: past uploads with parsed results summary.
  - Cumulative savings tracker: total potential savings found, number of searches.
  - "My Medications" profile section: current medications for interaction checking.
  - Auth gate: redirect unauthenticated users to sign-in prompt.
- [ ] Add "Save" / "Bookmark" buttons to medicine cards on search results (requires auth).
- [ ] Show recent searches in the landing page search bar dropdown (authenticated users).

---

### Hour 8 (7:30 - 8:30) - AI Explanations + Polish

**BE: AI Explanation Generation**
- [ ] Enhance `/api/ai/explain` with:
  - Input: original drug, recommended alternative, safety data.
  - Output: patient-friendly text explaining why the switch is safe.
  - Template fallback when LLM is unavailable.
- [ ] Add explanation generation to the alternatives response (lazy-loaded per alternative).
- [ ] Rate limiting on AI endpoints.
- [ ] Error response standardization across all routes.

**FE: Explanations + UI Polish**
- [ ] Add AI explanation bubbles to each alternative card:
  - "Why is this recommended?" -> expandable plain-language text.
  - Streamed from `/api/ai/explain` on demand (not pre-loaded).
- [ ] Suggested questions below each medicine result:
  - "Is this safe?", "What are the side effects?", "Why is it cheaper?"
  - Click to ask -> opens AI chat with the question.
- [ ] Polish animations and transitions on the results page.

---

### Hour 9 (8:30 - 9:30) - Error Handling + Edge Cases

**BE: Validation + Edge Cases**
- [ ] Add Zod validation schemas for all API inputs.
- [ ] Handle edge cases:
  - Drug not found in database (flag for manual review, suggest closest match).
  - No alternatives available (return original with explanation).
  - Stale price data (show warning, offer refresh).
  - Unparseable prescription (return confidence < threshold, ask for retry).
  - LLM timeout/failure (graceful degradation to DB-only results).
- [ ] Add database indexes for common queries (salt name search, drug lookup by salt_id).
- [ ] Optimize N+1 queries in alternatives lookup (batch queries).

**FE: Error States + Loading States**
- [ ] Error boundaries and error UI for all sections.
- [ ] Empty states:
  - No results -> "We couldn't find this medicine. Try searching by salt name."
  - No alternatives -> "This is already the most cost-effective option."
  - No prices -> "Price data unavailable. Check back later."
  - Prescription parse failed -> "We couldn't read this prescription. Try a clearer image."
- [ ] Loading skeletons for all data-dependent sections.
- [ ] Toast notifications for actions (search saved, prices refreshed, etc.).

---

### Hour 10 (9:30 - 10:30) - Responsive Design + Mobile

**BE: Performance + Final APIs**
- [ ] `GET /api/stats` - Summary stats for the landing page:
  - Total drugs in database.
  - Average savings percentage.
  - Number of alternatives mapped.
- [ ] Final API smoke tests across all endpoints.
- [ ] Ensure all endpoints handle concurrent requests properly.

**FE: Responsive + Mobile**
- [ ] Mobile-responsive pass on search results page:
  - Stack cards vertically.
  - Collapsible sections (alternatives, prices, safety info).
  - Price comparison: horizontal scroll table on mobile.
  - AI chat: full-screen on mobile.
- [ ] Mobile-responsive history page:
  - Compact search history list.
  - Swipeable saved medicines cards.
  - Savings summary at the top.
- [ ] Mobile-responsive landing page:
  - Search bar prominent and thumb-accessible.
  - Prescription upload works on mobile (camera capture).
- [ ] Header responsive behavior (already has mobile menu).
- [ ] Page transitions and micro-interactions.

---

### SYNC POINT (10:30) - 15 min

- Full end-to-end walkthrough of all flows.
- Bug triage: critical vs nice-to-have.
- Split remaining time on highest-impact fixes.

---

### Hour 11 (10:30 - 11:30) - Integration Testing + Fixes

**Both: Joint Testing + Bug Fixes**
- [ ] Test search flow with different query types:
  1. Direct medicine name (e.g., "Dolo 650").
  2. Salt name (e.g., "Paracetamol").
  3. Natural language question (e.g., "What is the cheapest alternative to Augmentin?").
  4. Prescription image upload.
- [ ] Test edge cases:
  - NTI drug search (should show non-substitutable warning).
  - Drug with no alternatives.
  - Drug not in database.
  - Multiple medicines with interactions (via prescription upload).
- [ ] Fix critical bugs found during testing.
- [ ] Verify auth flow: sign in, save search, view history, sign out.

---

### Hour 12 (11:30 - 12:00) - Final Polish + Deploy

**Both: Final Testing + Deployment**
- [ ] Run `bun x ultracite fix` to ensure code quality.
- [ ] Run `bun run build` to verify production build succeeds.
- [ ] Deploy to Vercel:
  - Set environment variables (DATABASE_URL, GROQ_API_KEY, CEREBRAS_API_KEY, FIRECRAWL_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).
  - Verify deployment works.
- [ ] Quick smoke test on production URL.
- [ ] Favicon and meta tags for social sharing.

---

## API Contract Reference (Agreed at Start)

```typescript
// Unified Search
GET /api/search?q=string&type=medicine|question
  Response: {
    type: "medicine" | "ai_response",
    // If type === "medicine":
    results: Array<{
      drug: Drug,
      alternatives: Array<{
        drug: Drug,
        pricePerUnit: number,
        totalPrice: number,
        savings: number,
        savingsPercent: number,
        safetyTier: "exact_generic" | "therapeutic_equivalent",
      }>,
      prices: Array<{
        pharmacy: string,
        price: number,
        packSize: number,
        perUnit: number,
        inStock: boolean,
        confidence: "live" | "recent" | "cached" | "estimated",
        fetchedAt: string,
      }>,
      isSubstitutable: boolean,
      ntiWarning?: string,
    }>,
    // If type === "ai_response":
    answer: string, // streamed markdown
    relatedDrugs?: Drug[],
  }

// Prescription Upload
POST /api/search/prescription
  Body: FormData { file: File }
  Response: {
    prescriptionId: string,
    items: Array<{
      rawName: string,
      confidence: number,
      drug: Drug | null,
      alternatives: Array<{ drug: Drug, savings: number, safetyTier: string }>,
    }>,
    totalOriginalCost: number,
    totalOptimizedCost: number,
    totalSavings: number,
  }

// Drug Search (DB-level)
GET /api/drugs/search?q=string
  Response: { drugs: Array<{ id, brandName, salt, strength, form, manufacturer }> }

// Drug Alternatives
GET /api/drugs/[id]/alternatives
  Response: {
    original: Drug,
    alternatives: Array<{
      drug: Drug,
      pricePerUnit: number,
      savings: number,
      safetyTier: "exact_generic" | "therapeutic_equivalent",
    }>,
    isSubstitutable: boolean,
  }

// Drug Info
GET /api/drugs/[id]/info
  Response: {
    drug: Drug,
    salt: { name, description, mechanismOfAction },
    sideEffects: { common: string[], rare: string[] },
    warnings: { pregnancy: string, pediatric: string, geriatric: string },
    dosage: { usual: string, max: string },
    storage: string,
  }

// Drug Interactions
POST /api/drugs/interactions
  Body: { saltIds: string[] }
  Response: {
    interactions: Array<{
      saltA: string,
      saltB: string,
      severity: "mild" | "moderate" | "severe" | "contraindicated",
      description: string,
    }>
  }

// Price Comparison
POST /api/prices/compare
  Body: { drugIds: string[] }
  Response: {
    comparisons: Array<{
      drug: Drug,
      prices: Array<{ pharmacy, price, packSize, perUnit, inStock, confidence, fetchedAt }>
    }>
  }

// AI Chat (Streaming)
POST /api/ai/chat
  Body: { messages: Message[], drugContext?: { drugId: string, query: string } }
  Response: ReadableStream (Vercel AI SDK format)

// AI Explain
POST /api/ai/explain
  Body: { originalDrug: Drug, alternative: Drug, safetyTier: string }
  Response: { explanation: string }

// Saved Searches (Auth required)
GET  /api/saved-searches
POST /api/saved-searches
  Body: { query: string, drugId?: string }

// Saved Medicines (Auth required)
GET    /api/saved-medicines
POST   /api/saved-medicines
  Body: { drugId: string, notes?: string }
DELETE /api/saved-medicines/[id]

// Search History (Auth required)
GET /api/history?page=number&limit=number
  Response: {
    searches: Array<{
      id: string,
      query: string,
      resultDrug: Drug | null,
      savingsFound: number | null,
      createdAt: string,
    }>,
    total: number,
    page: number,
  }

GET /api/history/savings
  Response: {
    totalSearches: number,
    totalSavingsFound: number,
    averageSavingsPercent: number,
    topSavings: Array<{ query: string, savings: number, date: string }>,
  }

// Medicine Profile (Auth required)
GET  /api/medicine-profile
POST /api/medicine-profile
  Body: { saltIds: string[] }
```

---

## Deliverables at 12 Hours

| Feature | Status Target |
|---|---|
| Unified search (medicine + NL queries) | Functional |
| Search results page with medicine info | Functional |
| Generic alternative mapping + display | Functional |
| Price comparison (multi-pharmacy) | Functional (2-3 sources) |
| Drug interaction detection | Functional (seeded data) |
| AI explanations + inline chat | Functional |
| Prescription upload + OCR parsing | Functional |
| Safety information display | Functional |
| Authentication + saved searches | Functional |
| History page + savings tracker | Functional |
| Medicine profile (interaction checking) | Basic |
| Mobile responsive | Partial |
| Production deployment | Deployed |

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Groq API rate limits | Cache LLM responses for common queries; batch requests; fallback to Cerebras |
| Firecrawl scraping blocked | Pre-seed price data for top 50 drugs; show "estimated" prices |
| Prescription parsing accuracy | Confidence scores per item; "edit parsed result" option; retry with better image |
| Drug database incomplete | Start with top 100 Indian medicines; flag unknown drugs; LLM can fill gaps conversationally |
| Supabase cold starts | Use connection pooling; keep-alive pings |
| 12 hours is tight | Prioritize core flow (search -> results with alternatives + prices); cut auth features if behind |

---

## Cut List (If Behind Schedule)

Drop these first (in order) if time runs short:

1. Medicine profile / automatic interaction checking (Hour 7 FE).
2. Cumulative savings tracker on history page (Hour 7 FE) - keep history list, cut stats.
3. AI chat interface (Hour 4 FE) - keep explanations, cut conversational chat.
4. Prescription upload (Hour 5) - keep search-only flow.
5. Price refresh/live scraping (Hour 5 BE) - use seeded price data only.

**Never cut**: Search results page, alternative mapping, price display, safety information, AI explanations, basic history page.
