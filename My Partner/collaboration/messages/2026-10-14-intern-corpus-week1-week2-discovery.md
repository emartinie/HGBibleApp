# Intern — Corpus discovery, Weeks 1 and 2 pilot

**Scope: read-only repository investigation. No production edits or schema implementation.**

We are building a reusable content-aware Quiet Commons Companion. Before designing a corpus index, investigate the existing content architecture, using **Week 1 (Bereshit)** and **Week 2 (Noach)** as concrete examples.

## Questions to answer
1. Trace each week's real source-of-truth content, including `data/week1.json`, `data/week2.json`, `commentary/week1.html`, `commentary/week2.html`, `homegroups_weekly_reading_schedule.csv`, Scripture files, and the code that loads/renders these sources. Verify actual paths and uses.
2. Inventory existing identifiers, titles, references, section keys, element IDs, and metadata. Distinguish **canonical content identity** from **card/page/DOM location**. Do not use card as the primary corpus key.
3. Identify where content is reused, duplicated, inconsistent, or referenced from multiple interfaces. Describe relationships: contains, cites, covers, related-to, rendered-in, etc. Do not assume all relationships mean the same thing.
4. For Week 1 and Week 2, provide 5–10 grounded sample content records each with provenance and stable-ID candidates, explicitly marking any proposed IDs as provisional.
5. Determine which metadata can be generated automatically versus which requires editorial review. Explain how to avoid fragile IDs derived from changeable titles or DOM positions.
6. Suggest the smallest **read-only context feed** the companion could consume: identity, label, optional passages/topics, source URL/anchor, and relationship references. Identify uncertainties and avoid inventing links.
7. Recommend a phased rollout and tests, including mobile, stale content, duplicate references, and preservation of existing Commons discussions.

## Boundaries
- No changes outside your explicitly authorized workspace; no production edits, no Firebase schema/rules deployment, no wholesale indexing, no rewriting studies.
- Do not finalize a schema or implement a corpus. Present findings and alternatives for joint review by project owner, Partner, and intern.
- Clearly separate **verified facts**, **inferences**, and **proposals**. Cite actual repository file paths and relevant keys/lines.

## Deliverable
A concise report with source inventory, Week 1/2 worked examples, key architectural decisions, gaps, and recommendations. The goal is to **recognize existing content**, not build a duplicate application.
