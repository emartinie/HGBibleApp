# Two Powers in Heaven — investigation page

Prepared November 1, 2026 by Partner, at Eddie’s request.

- [Read the page](two-powers-in-heaven.html)
- [Prepared manifest entry](manifest-entry.json)

## What is ready

A self-contained HTML investigation following the existing navy/gold article design, especially `investigations/is-the-son-the-father.html` and `investigations/did-jewish-followers-of-yeshua-leave-judaism.html`. Nine native expandable sections work without scripts, which is important because `js/investigations.js` inserts fetched HTML with `innerHTML`. Styles are scoped to the article, with a standalone-only body rule, to avoid restyling the surrounding app.

The page covers Hagar’s earlier encounter; Abraham’s visitors and Genesis 19:24; alternative readings; Philo, Justin, Sanhedrin and Chagigah; related biblical passages; and discussion questions. It links to the existing Son/Father investigation. No audio placeholder or uncreated media is presented.

## Integration — pending Eddie’s explicit write-scope authorization

The existing `My Partner/AGENTS.md` limits Partner writes to `My Partner/`. No root application files or published manifest have been changed for this task.

After Eddie explicitly authorizes these two outside-folder changes:

1. Copy `two-powers-in-heaven.html` to root `investigations/two-powers-in-heaven.html`.
2. Re-fetch `data/investigations/published-investigations.json` and append the object from `manifest-entry.json` to its `investigations` array. Preserve every existing record. Check the id, filename and order for conflicts before writing; #016 was the next available number in the inspected baseline.

No JavaScript loader modification is needed. The proposed published record has `reviewStatus: unreviewed`, matching the existing distinction between publication and editorial review. Relationship arrays are deliberately empty rather than inventing cross-module identifiers or schemas.

Expected app route after integration: `https://homegroups.org/?card=investigations&id=two-powers-in-heaven`.

Expected standalone route after integration: `https://homegroups.org/investigations/two-powers-in-heaven.html`.

The preview here is independently readable but is not yet registered in the live Investigations card.

## Verification and limits

Inspected baseline: `247c0e3c2590a68a0c7fe2731f68c9789ade6799`.

Read the actual loader, card markup, published manifest, manifest schema, and two existing pages. The manifest contains 16 published records (#000–#015). Verified the proposed record’s required fields, allowed status values, filename/id syntax, relationship categories, and uniqueness. The existing manifest remains unchanged.

HTML checks passed: balanced element nesting; unique element ids; valid heading-label targets; one article and main heading; nine matching details/summary pairs; 20 source/passage/related links; safe new-tab attributes; no scripts, event handlers, iframes, or placeholder media. All style selectors are scoped to the article or its standalone body. Responsive grid rules allow columns to shrink to the available width.

Browser visual and live-card interaction checks are still pending: Chromium was absent, and the attempted browser download failed. Source inspection and structural checks are not represented as a rendered mobile/desktop test. External links are the previously researched source URLs; this pass checked their markup, not every remote page’s availability.

After integration and deployment, open the page from the card, search for “Two Powers” and “Hagar,” verify the deep link on reload, expand sections by keyboard and touch, and check narrow mobile/card widths. Confirm the old investigations remain available.

## Coordination

Partner owns this page preparation. Intern’s uncommitted activity remains unknown; no intern assignment or direct message has been sent. Staging the new page here avoids touching existing production investigation prose.
