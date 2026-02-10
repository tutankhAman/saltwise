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
  - `saltwise_salts` (id, name, aliases, description)
  - `saltwise_dosage_forms` (id, name - tablet, capsule, syrup, etc.)
  - `saltwise_manufacturers` (id, name, country, gmp_certified)
  - `saltwise_drugs` (id, brand_name, salt_id, strength, dosage_form_id, manufacturer_id)
  - `saltwise_drug_interactions` (drug_a_salt_id, drug_b_salt_id, severity, description)
  - `saltwise_prescriptions` (id, user_id, status, image_url, created_at)
  - `saltwise_prescription_items` (id, prescription_id, raw_name, parsed_salt_id, parsed_drug_id, strength, dosage_form, quantity, is_substitutable)
  - `saltwise_drug_prices` (id, drug_id, pharmacy_name, price, pack_size, price_per_unit, source_url, fetched_at, confidence)
- [ ] Run `bun run db:gen` and `bun run db:push` to apply migrations.
- [ ] Create seed script with ~50 common Indian medicines (salts, brands, manufacturers).

**FE: App Shell + Layout**
- [ ] Update root layout metadata (title: "Saltwise", description).
- [ ] Create app navigation layout:
  - Header with logo, nav links (Upload, Search, History).
  - Responsive sidebar/mobile menu using shadcn Sheet component.
- [ ] Set up route structure:
  - `/` - Landing/dashboard
  - `/upload` - Prescription upload
  - `/prescription/[id]` - Prescription results
  - `/search` - Drug search
  - `/compare` - Price comparison
- [ ] Configure theme colors (medical/pharma palette - blues, greens, whites).

---

### Hour 2 (1:00 - 2:00) - Drug Data + Landing Page

**BE: Seed Data + Drug Search API**
- [ ] Finish and run seed script (salts, drugs, interactions, sample prices).
- [ ] `GET /api/drugs/search?q=` - Full-text search on drug name and salt name.
- [ ] `GET /api/salts/search?q=` - Search active ingredients.
- [ ] `GET /api/salts/[id]/brands` - All brands for a given salt.

**FE: Landing Page + Drug Search**
- [ ] Build landing page:
  - Hero section explaining Saltwise value proposition.
  - Quick search bar (search drugs by name).
  - "Upload Prescription" CTA button.
  - Stats section (placeholder: "X medicines analyzed", "Y average savings").
- [ ] Build drug search page (`/search`):
  - Search input with debounced API calls.
  - Results list showing drug name, salt, strength, manufacturer.
  - Click-through to drug detail.

---

### Hour 3 (2:00 - 3:00) - Prescription Upload + AI Parsing Setup

**BE: Prescription Upload + Groq AI Parsing**
- [ ] `POST /api/prescriptions/upload` - Accept image upload, store in Supabase Storage, create prescription record.
- [ ] `POST /api/prescriptions/parse` - AI parsing pipeline:
  - Send image to Groq (LLaMA Vision) via Vercel AI SDK.
  - Structured output prompt: extract medicine names, strengths, dosage forms, quantities, schedule.
  - Fuzzy-match extracted names against `saltwise_drugs` and `saltwise_salts` tables.
  - Create `prescription_items` records with parsed data.
  - Return parsed prescription with confidence scores per item.
- [ ] Install and configure `ai`, `@ai-sdk/groq` packages.

**FE: Prescription Upload Page**
- [ ] Build upload page (`/upload`):
  - Drag-and-drop zone + file picker (accept images, PDFs).
  - Upload progress indicator.
  - "Analyzing prescription..." loading state with skeleton UI.
  - Preview of uploaded image.
- [ ] Wire up upload to `POST /api/prescriptions/upload`.

---

### SYNC POINT (3:00) - 5 min

- Verify upload -> parse flow works end-to-end with a test prescription image.
- Confirm API response shapes match FE expectations.

---

### Hour 4 (3:00 - 4:00) - Prescription Results + Alternatives

**BE: Generic Alternatives Engine**
- [ ] `GET /api/drugs/[id]/alternatives` - For a given drug:
  - Find all drugs with the same salt_id + strength + dosage_form.
  - Exclude the original drug.
  - Sort by: safety tier > regulatory trust > price.
  - Return with price comparison data.
- [ ] `POST /api/prescriptions/[id]/optimize` - For a full prescription:
  - For each item, find alternatives.
  - Calculate total original cost vs optimized cost.
  - Flag non-substitutable items (NTI drugs, doctor-marked).
  - Return optimization summary with per-item alternatives.
- [ ] Add NTI drug list to seed data (warfarin, lithium, phenytoin, etc.) with `is_nti: true` flag on salts.

**FE: Prescription Results Page**
- [ ] Build prescription results page (`/prescription/[id]`):
  - Parsed prescription summary (patient info if available, date, doctor).
  - List of prescription items as cards:
    - Original medicine (name, salt, strength, form).
    - Parsed confidence indicator.
    - "Finding alternatives..." loading state.
  - Call optimize endpoint on page load.

---

### Hour 5 (4:00 - 5:00) - Cost Comparison UI + Interaction Checks

**BE: Drug Interaction Checker**
- [ ] `POST /api/drugs/interactions` - Accept array of salt_ids, return all pairwise interactions.
- [ ] Integrate interaction check into `/api/prescriptions/[id]/optimize`:
  - Check interactions between all items in the prescription.
  - Include interaction warnings in response.
  - Block substitutions that would introduce new interactions.
- [ ] Add interaction seed data for common dangerous combinations (e.g., warfarin + aspirin, metformin + contrast dye).

**FE: Optimization Results + Comparisons**
- [ ] Enhance prescription results page with optimization data:
  - Per-item alternative cards:
    - Side-by-side: Original vs Recommended (salt, strength, manufacturer, price).
    - Savings badge (amount and percentage).
    - "Why this is safe" expandable explanation.
    - "Keep original" / "Switch to generic" toggle.
  - Total cost comparison bar:
    - Original total vs Optimized total.
    - Total savings highlighted.
  - Interaction warnings section (yellow/red alert banners).

---

### Hour 6 (5:00 - 6:00) - Firecrawl Price Scraping + Price UI

**BE: Firecrawl Integration for Live Prices**
- [ ] Install and configure `@mendable/firecrawl-js`.
- [ ] Build scraping service for 2-3 pharmacy sites:
  - 1mg.com product pages.
  - PharmEasy search results.
  - (Optional) Netmeds.
- [ ] `POST /api/prices/refresh` - Trigger price scrape for a given drug:
  - Firecrawl scrapes target URLs.
  - Parse HTML/markdown for price, pack size, availability.
  - Upsert into `saltwise_drug_prices` with confidence level and timestamp.
- [ ] Add caching layer: skip scrape if price data is < 6 hours old.

**FE: Detailed Price Comparison View**
- [ ] Build price comparison page/modal (`/compare` or inline):
  - Table view: Drug name | Pharmacy | Price | Pack Size | Per-Unit | Stock.
  - Sort by price, filter by availability.
  - "Refresh prices" button (triggers scrape).
  - Price confidence indicator (live/recent/cached/estimated).
  - Split-pharmacy suggestion: "Buy Drug A from Pharmacy X, Drug B from Pharmacy Y to save Z more."

---

### BREAK (6:00 - 6:30) - 30 min

---

### SYNC POINT (6:30) - 10 min

- Demo full flow: upload -> parse -> optimize -> price compare.
- Identify bugs, mismatches, missing data.
- Prioritize remaining hours.

---

### Hour 7 (6:30 - 7:30) - Patient Explanations + AI Chat

**BE: AI Explanation Generation**
- [ ] `POST /api/ai/explain` - Generate plain-language explanation for a substitution:
  - Input: original drug, recommended alternative, reason.
  - Output: patient-friendly text explaining why the switch is safe.
  - Use Groq for fast inference with streaming.
- [ ] `POST /api/ai/chat` - Conversational endpoint for patient questions:
  - Context-aware: knows the current prescription and alternatives.
  - Can answer "Is this generic as effective?", "Why is this cheaper?", etc.
  - Uses Vercel AI SDK streaming.

**FE: AI Chat Interface + Explanations**
- [ ] Add explanation bubbles to each substitution card:
  - "Why is this recommended?" -> expandable plain-language text.
  - Generated via `/api/ai/explain` on demand.
- [ ] Build chat panel (slide-out or bottom sheet):
  - Message input with send button.
  - Streaming AI responses.
  - Suggested questions: "Is this safe?", "What are the side effects?", "Why is it cheaper?"
  - Context badge showing which prescription is being discussed.

---

### Hour 8 (7:30 - 8:30) - Doctor Controls + Audit Trail

**BE: Substitution Controls + Logging**
- [ ] Add `substitution_logs` table tracking:
  - original_drug_id, recommended_drug_id, action (accepted/rejected/kept_original), rationale, timestamp.
- [ ] `PATCH /api/prescription-items/[id]` - Mark item as non-substitutable.
- [ ] `POST /api/substitutions/[id]/accept` - Accept a substitution (log it).
- [ ] `POST /api/substitutions/[id]/reject` - Reject a substitution (log reason).
- [ ] `GET /api/prescriptions/[id]/audit` - Full audit trail for a prescription.

**FE: Action Buttons + History Page**
- [ ] Add action buttons to each substitution:
  - "Accept Generic" (green) - saves choice, logs.
  - "Keep Original" (neutral) - logs preference.
  - "Not Substitutable" (lock icon) - marks as doctor-required.
- [ ] Build prescription history page (`/history`):
  - List of past prescriptions with dates and savings.
  - Click to view full details and audit trail.
  - Total savings counter across all prescriptions.

---

### Hour 9 (8:30 - 9:30) - Adherence + Dosage Info

**BE: Adherence & Drug Info APIs**
- [ ] `GET /api/drugs/[id]/info` - Detailed drug information:
  - Salt details, mechanism of action (from seed data).
  - Common side effects.
  - Pill appearance description (for identification when switching brands).
  - Storage instructions.
- [ ] `POST /api/adherence/schedule` - Generate dosage schedule from prescription:
  - Parse frequency (BD, TDS, OD, SOS, etc.).
  - Return structured schedule with times and reminders.
- [ ] `GET /api/adherence/today` - Today's medication schedule for a user.

**FE: Drug Info Cards + Schedule View**
- [ ] Build drug information modal/page:
  - Salt info, manufacturer, regulatory status.
  - Side effects (common vs rare).
  - Pill appearance and identification tips.
  - "How to take" instructions.
- [ ] Build medication schedule view:
  - Timeline/calendar view of daily doses.
  - Checkboxes for dose tracking.
  - Next dose reminder display.
  - Visual pill identifier per medicine.

---

### Hour 10 (9:30 - 10:30) - Polish + Error Handling

**BE: Validation + Edge Cases**
- [ ] Add Zod validation schemas for all API inputs.
- [ ] Handle edge cases:
  - Unparseable prescription (return confidence < threshold, ask for manual entry).
  - Drug not found in database (flag for manual review, suggest closest match).
  - No alternatives available (return original with explanation).
  - Stale price data (show warning, offer refresh).
- [ ] Rate limiting on AI endpoints.
- [ ] Error response standardization (consistent error format across all routes).

**FE: Error States + Loading States**
- [ ] Add error boundaries and error UI for all pages.
- [ ] Empty states:
  - No prescriptions yet -> "Upload your first prescription" CTA.
  - No alternatives found -> "This is already the most cost-effective option."
  - Drug not in database -> "We couldn't identify this medicine. Enter details manually."
- [ ] Loading skeletons for all data-dependent sections.
- [ ] Toast notifications for actions (substitution accepted, price refreshed, etc.).
- [ ] Form validation with inline error messages.

---

### Hour 11 (10:30 - 11:30) - Responsive Design + Mobile + Final Integration

**BE: Performance + Final APIs**
- [ ] Add database indexes for common queries (salt name search, drug lookup by salt_id).
- [ ] Optimize N+1 queries in prescription optimization (batch alternatives lookup).
- [ ] `GET /api/dashboard/stats` - Summary stats for the landing page:
  - Total prescriptions analyzed.
  - Average savings percentage.
  - Most common substitutions.
- [ ] Final API smoke tests across all endpoints.

**FE: Responsive + Mobile + Integration**
- [ ] Mobile-responsive pass on all pages:
  - Upload page works on mobile (camera capture).
  - Results page: stack cards vertically, collapsible sections.
  - Price comparison: horizontal scroll table on mobile.
  - Chat: full-screen on mobile.
- [ ] Connect any remaining hardcoded data to live APIs.
- [ ] Add page transitions and micro-interactions.
- [ ] Favicon and meta tags for social sharing.

---

### SYNC POINT (11:30) - 15 min

- Full end-to-end walkthrough of all flows.
- Bug triage: critical vs nice-to-have.
- Split remaining time on highest-impact fixes.

---

### Hour 12 (11:30 - 12:00) - Final Testing + Deploy

**Both: Joint Testing + Deployment**
- [ ] Test complete flow 3 times with different prescriptions:
  1. Simple prescription (2-3 common medicines with generics available).
  2. Complex prescription (5+ medicines with interactions).
  3. Edge case (NTI drug, unavailable generic, unparseable item).
- [ ] Fix critical bugs found during testing.
- [ ] Run `bun x ultracite fix` to ensure code quality.
- [ ] Run `bun run build` to verify production build succeeds.
- [ ] Deploy to Vercel:
  - Set environment variables (DATABASE_URL, GROQ_API_KEY, CEREBRAS_API_KEY, FIRECRAWL_API_KEY).
  - Verify deployment works.
- [ ] Quick smoke test on production URL.

---

## API Contract Reference (Agreed at Start)

```typescript
// Prescription Upload
POST /api/prescriptions/upload
  Body: FormData { file: File }
  Response: { id: string, status: "uploaded", imageUrl: string }

// Prescription Parse
POST /api/prescriptions/parse
  Body: { prescriptionId: string }
  Response: {
    id: string,
    status: "parsed",
    items: Array<{
      id: string,
      rawName: string,
      parsedSalt: { id: string, name: string } | null,
      parsedDrug: { id: string, brandName: string } | null,
      strength: string,
      dosageForm: string,
      quantity: number,
      confidence: number
    }>
  }

// Optimize Prescription
POST /api/prescriptions/[id]/optimize
  Response: {
    originalCost: number,
    optimizedCost: number,
    savingsAmount: number,
    savingsPercent: number,
    items: Array<{
      original: Drug,
      alternatives: Array<{
        drug: Drug,
        pricePerUnit: number,
        totalPrice: number,
        savings: number,
        safetyTier: "exact_generic" | "therapeutic_equivalent",
        explanation: string
      }>,
      interactions: Array<{ withDrug: string, severity: string, description: string }>,
      isSubstitutable: boolean
    }>
  }

// Drug Search
GET /api/drugs/search?q=string
  Response: { drugs: Array<{ id, brandName, salt, strength, form, manufacturer }> }

// Price Comparison
POST /api/compare/prices
  Body: { drugIds: string[] }
  Response: {
    comparisons: Array<{
      drug: Drug,
      prices: Array<{ pharmacy, price, packSize, perUnit, inStock, confidence, fetchedAt }>
    }>
  }

// AI Chat (Streaming)
POST /api/ai/chat
  Body: { messages: Message[], prescriptionId?: string }
  Response: ReadableStream (Vercel AI SDK format)
```

---

## Deliverables at 12 Hours

| Feature | Status Target |
|---|---|
| Prescription upload + AI parsing | Functional |
| Salt-level drug normalization | Functional |
| Generic alternative mapping | Functional |
| Drug interaction detection | Functional (seeded data) |
| Price comparison (multi-pharmacy) | Functional (2-3 sources) |
| Cost optimization engine | Functional |
| AI explanations + chat | Functional |
| Doctor non-substitutable controls | Functional |
| Substitution audit logging | Functional |
| Adherence schedule | Basic |
| Drug info cards | Basic |
| Mobile responsive | Partial |
| Production deployment | Deployed |

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Groq API rate limits | Cache parsed prescriptions; batch requests; fallback to Cerebras |
| Firecrawl scraping blocked | Pre-seed price data for top 50 drugs; show "estimated" prices |
| Prescription parsing accuracy | Manual entry fallback; confidence scores; "edit parsed result" UI |
| Drug database incomplete | Start with top 100 Indian medicines; flag unknown drugs for manual addition |
| Supabase cold starts | Use connection pooling; keep-alive pings |
| 12 hours is tight | Prioritize core flow (upload -> parse -> optimize -> compare); cut adherence/chat if behind |

---

## Cut List (If Behind Schedule)

Drop these first (in order) if time runs short:

1. Adherence schedule and reminders (Hour 9 FE).
2. AI chat interface (Hour 7 FE) - keep explanations, cut chat.
3. Detailed drug info cards (Hour 9 FE).
4. Split-pharmacy fulfillment suggestion (Hour 6 FE).
5. Prescription history page (Hour 8 FE).

**Never cut**: Prescription parsing, alternative mapping, price comparison, interaction checks, audit logging.
