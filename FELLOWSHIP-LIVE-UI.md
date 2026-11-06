# Fellowship live: map-first UI

Presentation/navigation only, based on main 502fbfb. No merge or deployment.

- A bare ?card=fellowship-live entry keeps the existing default Prayer Map. Explicit community/discussion/message deep links still open their intended destination.
- A collapsed native Menu disclosure reuses the existing buttons and handlers for Prayer Map, My Communities, Explore Communities, Messages, Find People, My Profile, Account / Sign In and Return to Bible Study. Selection closes it; Escape closes it and returns focus. No new destinations, service or dependency.
- The real existing map/search/status elements move ahead of introductory help text. Help, map controls, layers, markers and data sources remain intact. Live-scoped CSS gives the map roughly two-thirds of the viewport height and inherits global themes.
- The live card temporarily hides the complete week dock, including loading and denied states. Disposal restores its exact previous visibility/display. Weekly study code and reading-week context are unchanged.
- Shared card markup and the read-only test keep their existing presentation. Only the live adapter opts into the compact UI. Existing read-only map/pilot restrictions are retained.

## Changed files

cards/fellowship-live.html removes obsolete week-dock spacing. js/fellowship-live.js manages dock visibility/restoration and versions its renderer import. js/fellowship.js rearranges existing live navigation/map elements. css/fellowship.css adds live-scoped layout. Presentation tests cover desktop/mobile map entry, every destination, discussions/recipient links, themes, keyboard dismissal, zero writes, week restoration and ordinary Prayer Map. Existing live test selectors follow the collapsed menu; no service assertions are removed. Test package/README and coordination records are updated.

## Evidence and limits

Verification: 3/3 new presentation tests, 4/4 read-only/ordinary-map compatibility checks and 2/2 existing live-flow checks passed (9 targeted cases total). Both changed JS modules parsed; whitespace and protected-file comparisons passed. No broad suites were rerun. Fixtures load actual app markup/loader/screens but replace Firebase and Leaflet and omit unrelated full-app boot/Tailwind loading. Captures verify presentation with a blank mocked map region, not production tile rendering. Ordinary Prayer Map is checked for initialization and week visibility rather than the omitted Tailwind height utility. No production reads, writes, messages, authentication emails or memberships were performed.

The live-pilot JSON, access policy, Firebase initialization/authentication, Firestore rules, Commons membership/discussion/DM source, Prayer Map source/fragment and datasets remain unchanged. A denied/expired pilot still cannot enter Fellowship. Actual iPhone/Safari, real map tiles/geolocation and real Firebase behavior require manual verification after separate release approval. No production authorization or historical location-consent issue is claimed fixed by this UI change.
