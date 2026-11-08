# Fellowship feed — conversation styling

Review branch `codex/fellowship-feed-styling`, from main `ffe914c` (PR #37 merged by the owner). Presentation changes only; no merge or deployment performed.

## Design interpretation

Make the people and their words the visual center. Author initials provide a recognizable, decorative presence without fetching photographs or profiles. The name leads the byline; community and date sit beneath it. Existing encoded post titles become serif headings, followed by readable, high-contrast body text. Legacy posts retain their complete text without an invented heading.

Dark mode uses an ink background and lifted slate surfaces; light mode uses warm parchment and near-white paper. Gold marks the single posting action and existing discussion links. Larger spacing separates voices and paragraphs. There are no extra buttons, introductory panels, descriptions or destinations.

Colors derive from the existing global theme tokens and inherited color scheme. Fonts are local system/Georgia stacks, with no downloads or dependencies. The modern light/dark surface enhancement has a base-token fallback. Diagnostic tokens remain inherited.

## Scope and verification

- `css/fellowship.css`: scoped home-feed surfaces, typography, bylines, controls and responsive spacing.
- `js/fellowship-feed.js`: display markup, decorative initials/icons, semantic titles and a feed-only class removed on disposal. Existing queries, identity guards, pagination, ordering, navigation handlers and subscription behavior are preserved.
- Tests: existing feed assertions updated for semantic markup; synthetic fixture authors/titles supported; new contrast, keyboard focus, responsive, legacy-content and style-disposal checks.

Verification: **20/20 focused checks passed** (17 existing feed regressions and three styling cases), followed by a 3/3 styling/screenshot confirmation including button hover contrast. Coverage includes pagination, empty and denied states, revocation/account changes, teardown, post/reply flows, navigation/Scripture associations and scroll restoration. New checks cover desktop/mobile theme switching, keyboard focus, 320px long/legacy content, literal text rendering, diagnostic inheritance and removal of feed styling when opening Prayer Map. Module syntax and whitespace/protected-file comparisons passed.

Sampled author, community, date, title, body, discussion-link and posting-action contrast has a minimum of **6.56:1 dark / 5.00:1 light** in the standard presets; the posting action remains above 4.5:1 on hover. These are measured text/control pairs, not a complete accessibility certification.

Tests use synthetic identities and data with external requests intercepted. They verify client behavior, not deployed Firebase authorization. Firebase/provider/emulator suites were not rerun for this presentation-only change. No Firebase/authentication/rules/configuration/data changes, pilot changes or real operations were performed.

Screenshots use fictional authors and posts in the actual app shell:

| Theme | Desktop, 1440×1000 | Mobile, 390×844 |
| --- | --- | --- |
| Dark | [View](tests/fellowship/screenshots/feed-styling/creative-feed-desktop-dark.png) | [View](tests/fellowship/screenshots/feed-styling/creative-feed-mobile-dark.png) |
| Light | [View](tests/fellowship/screenshots/feed-styling/creative-feed-desktop-light.png) | [View](tests/fellowship/screenshots/feed-styling/creative-feed-mobile-light.png) |

Physical iPhone/Safari, assistive-technology review and production operations were not tested. Sampled contrast checks do not constitute a complete accessibility audit. The app shell, discussion screens, global themes and other Fellowship sections are outside this styling pass.
