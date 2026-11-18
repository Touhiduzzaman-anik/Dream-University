# Comprehensive Bangladesh University Rankings Expansion

Expand the **University Rankings** backend and seed pipeline so **100% of the institutions stored in PostgreSQL** appear automatically inside the existing 5-column rankings table—ordered from top global QS/THE 2026 ranks down through national category tiers—while keeping the exact table UI and category filter pills intact.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Confirmed preferences from Phase 1 are locked into this design, alongside two architectural defaults recommended below.

- **Confirmed Decision 1 (Unranked Ordering):** Institutions without a global QS or THE placement (`—`) appear beneath globally ranked universities ordered by category tier: `Public` -> `Engineering` -> `GST` -> `Private` -> `Medical` -> `National` (sorted by establishment year and institution name within each tier).
- **Confirmed Decision 2 (Progressive Table Length):** Display the top **30 rows initially** inside the exact 5-column table, with a clean **Load More** button positioned directly below the table to reveal additional batches (resetting cleanly to 30 when switching category filter tabs).
- **Recommended Backend Sync Strategy:** Store verified global/regional ranking metadata in PostgreSQL and dynamically join/merge it with **every active record in the institutions table** on the server so any newly added or existing institution automatically appears in rankings without manual duplicate maintenance.

---

## 1. Overview & Core Concept

- **What It Does:** Replaces the small 6-entry static ranking list with a complete, backend-driven ranking feed covering every UGC-approved university, engineering institute, medical college, GST cluster campus, and National University institution in the database (`205` institutions today, plus any future admin additions).
- **Target Audience & Persona:** Bangladeshi HSC/SSC students and guardians comparing global standing alongside national accreditation tiers within a single familiar view.
- **Key Value:** Eliminates omissions across categories (`Public`, `Engineering`, `Private`, `Medical`, `GST`, `National`), cites verifiable 2026 QS World, THE World, QS Asia, and UGC/DGME directory sources, and preserves zero-clutter readability.

---

## 2. User Experience & Visual Design

- **Key User Flows:**
  1. Opening **University Ranking** loads the top 30 ranked Bangladeshi institutions immediately inside the unchanged 5-column table (`Institution`, `QS Global (2026)`, `THE Global (2026)`, `Bangladesh Standing`, `Source & Year`).
  2. Selecting any category filter pill (`All`, `Public`, `Engineering`, `Private`, `Medical`, `GST`, `National`) filters across all matching institutions from the database—ordered top-down from highest global rank to category-tier national standing—and resets the visible window to the first 30 matches.
  3. Clicking **Load More** below the table appends the next batch (30 rows at a time) until all matching institutions in that view are shown; clicking any university name opens its detail & eligibility modal as before.
- **Visual Identity & Theme:**
  - *Aesthetic Direction:* Utilitarian, structured academic reference table preserving Dream University's exact existing dark-slate/cyan light-and-dark theme tokens (`bg-white`, `border-slate-200`, `#0B1D3A`, `#0E7490`, dark mode `bg-slate-900`, `border-slate-800`, `cyan-400`).
  - *Typography & Hierarchy:* Unchanged tabular monospace ranks (`font-mono font-semibold tabular-nums`) for `QS Global (2026)` and `THE Global (2026)`, bold display institution titles, concise standing descriptions, and subtle inline external source links.
  - *Component Styling & Layout:* Zero structural changes to the card header, 7 category filter pills, or 5 table columns. Only adds a centered, border-matched **Load More** footer control beneath the table when `remainingCount > 0`.
- **Interactive Feedback:** Graceful skeleton/loading preservation while fetching `/api/rankings`, instant client-side category filtering once loaded, and localization parity across both English (`EN`) and Bangla (`বাংলা`) toggles.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Database-Backed Ranking Metadata Merged with All Active Institutions**
  - *Chosen Approach:* Persist global/regional ranking entries in PostgreSQL (and auto-sync during idempotent startup seeding) and expose a server endpoint that merges ranking records across **all active institutions** in the database—synthesizing accurate category-based national standing (`UGC Approved Public University`, `GST Cluster University`, `DGME Accredited Medical College`, etc.) and official 2026 source citations for every institution without a QS/THE entry.
  - *Why:* Guarantees 100% coverage—even when admins add new institutions later—while avoiding empty or missing rows in any category tab.
  - *Alternatives Considered:* Maintaining a hardcoded 205-row static frontend array was rejected because it diverges from PostgreSQL whenever institutions are added or updated.

- **Decision 2: Strict Citation Discipline for 2026 Global & National Data**
  - *Chosen Approach:* Populate verified 2026 placements for every Bangladeshi university appearing in **QS World University Rankings 2026** (15 universities led by `DU #584`, `BUET 761–770`, `NSU 951–1000`, `DIU 1001–1200`, `BracU`/`IUT`/`JU`/`RU` `1201–1400`, etc.), **THE World University Rankings 2026** (19 ranked universities led by `801–1000` bracket: `DU`, `NSU`, `DIU`, `JU`, `GAU`), and **QS Asia Rankings 2026** (`AUST`, `IUB`, `UIU`, `IUBAT`, `SEU`, `SU`, `UAP`, `ULAB`, `GUB`, `IIUC`, `UU`, `SUST`, etc.). Display `—` in QS/THE columns for institutions not listed in those global tables, paired with their accurate 2026 national tier and `UGC Bangladesh Official Directory (2026)` / `DGME (2026)` link.
  - *Why:* Upholds platform integrity (zero invented global ranks) while giving every single institution an accurate, scannable row.

- **Decision 3: Composite Top-Down Sort Order**
  - *Chosen Approach:* Sort deterministically on the backend using a numeric priority score:
    1. **QS World Ranked (2026)** ascending (`#584` -> `761–770` -> `951–1000` -> `1001–1200` -> `1201–1400` -> `1401+`), breaking ties by **THE World 2026** rank bracket (`801–1000` before `1001–1200` before `1201–1500` before `1501+`).
    2. **THE World Ranked Only / QS Asia 2026 Ranked** descending by best bracket/Asian rank (`GAU`, `BAU`, `JUST`, `MBSTU`, `NSTU`, `MIST`, `BUP`, `AUST`, `UIU`, `IUBAT`, `SEU`, `UAP`, etc.).
    3. **Nationally Accredited / Unranked Institutions** ordered strictly by category tier (`public` -> `engineering` -> `gst` -> `private` -> `medical` -> `national`), then by establishment year (oldest first) and English name.
  - *Why:* Balances global prestige first with transparent national structure underneath.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Data Flow

```text
┌───────────────────────────┐      idempotent seed / admin CRUD      ┌──────────────────────────────┐
│   Seed Catalog & 2026     │───────────────────────────────────────▶│      PostgreSQL Tables       │
│  Verified QS / THE Data   │                                        │  • institutions (205+ rows)  │
└───────────────────────────┘                                        │  • institution_rankings      │
                                                                     └──────────────┬───────────────┘
                                                                                    │
                                                                     LEFT JOIN + deterministic sort
                                                                                    │
                                                                                    ▼
┌───────────────────────────┐       GET /api/rankings (JSON)         ┌──────────────────────────────┐
│  UniversityRankingSection │◀───────────────────────────────────────│   Express Rankings Endpoint  │
│  • Category Filter Pills  │                                        │  • Maps 100% active rows     │
│  • Exact 5-Column Table   │                                        │  • Assigns "—" & national    │
│  • 30-row Load More Footer│                                        │    standing if unranked      │
└──────────────┬────────────┘                                        └──────────────────────────────┘
               │
               │ click institution name
               ▼
┌───────────────────────────┐
│ Institution Detail Modal  │
└───────────────────────────┘
```

### Data Model & State

- **`institution_rankings` Table (PostgreSQL):** Stores verified global/regional citation rows keyed by unique institution code (`qs_global_2026`, `the_global_2026`, `qs_rank_score`, `the_rank_score`, `qs_asia_rank_score`, `bangladesh_standing_en`, `bangladesh_standing_bn`, `source_citation`, `citation_year`, `source_url`). Separating verified global ranking metadata from `institutions` keeps admin institution creation clean while allowing idempotent ranking updates.
- **Dynamic Server Merge Rule:** Querying rankings performs a `LEFT JOIN` from all active `institutions` onto `institution_rankings`. Any institution without a custom ranking row automatically receives:
  - `qsGlobal2026`: `"—"`
  - `theGlobal2026`: `"—"`
  - `bangladeshStandingEn` / `bangladeshStandingBn`: Category-tailored national tier label (e.g., `UGC Approved Public University`, `Engineering University Tier`, `GST Cluster University`, `UGC Approved Private University`, `DGME Accredited Medical College`, `National University Affiliated Network`)
  - `sourceCitation` & `sourceUrl`: `"DGME Official Directory"` (`https://dgme.gov.bd`) for medical colleges, `"National University Bangladesh"` (`https://www.nu.ac.bd`) for National University/affiliated campuses, or `"UGC Bangladesh Official Directory"` (`https://www.ugc.gov.bd`) for all other accredited universities, all stamped with year `2026`.

### Interactive Component & State Mapping

- **Initial Load:** Parent fetches `/api/rankings` (and falls back cleanly to local deterministic builder matching the exact server merge logic if offline/during tests) and passes the full ordered dataset into the ranking table component.
- **Category Filter Pills (`All`, `Public`, `Engineering`, `Private`, `Medical`, `GST`, `National`):** Updating `categoryFilter` recomputes matching rows cleanly via `useMemo` and resets `visibleLimit` to `30`.
- **Load More Button:** Increments `visibleLimit` by `30` (`Math.min(visibleLimit + 30, filteredRows.length)`), displaying a concise remaining count without modifying any table headers, row spacing, or column structure.
