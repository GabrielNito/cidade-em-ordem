# Gates: Next.js foundation and design-system migration

OWNS: package.json, package-lock.json, next.config.ts, tsconfig.json, app/**, src/**, public/**, GATES.md

Scope: maintain the Next.js frontend while preserving the current domain behavior, protected role routes, design sheet, local demo workflow, and the guided occurrence-reporting experience.

- [x] G0: this ledger is structurally valid and its checks are reviewable
  CHECK: node /home/local/dotfiles/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=b90f76ecbf51/37 entries; EXPECT=matched; output-sha256=5e9ee8e4fa5d4c012f0d3691208ca688aba3146c26db71ff3c950e830b7caaa5; output-bytes=268

- [x] G1: the repository uses a Next.js start/build toolchain and keeps the required client-side dependencies
  CHECK: node -e "const p=require('./package.json'); if (!p.dependencies.next || !p.scripts.dev.includes('next') || !p.scripts.build.includes('next')) process.exit(1); console.log('NEXT TOOLCHAIN PASSED')"
  EXPECT: NEXT TOOLCHAIN PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=b90f76ecbf51/37 entries; EXPECT=matched; output-sha256=b56cef3cb3cc8ce2a38b5c65551c293a47bcb6aa82f6053627fb1ee95556106d; output-bytes=22

- [x] G2: TypeScript and linting pass after the migration
  CHECK: npm run typecheck && npm run lint && echo "STATIC CHECKS PASSED"
  EXPECT: STATIC CHECKS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=b90f76ecbf51/37 entries; EXPECT=matched; output-sha256=c7711a7fcca5584ec973e793aeae995228df904598f4b15a8dd6e63a7e875957; output-bytes=114

- [x] G3: existing domain and repository tests pass after the migration
  CHECK: npm test && echo "DOMAIN TESTS PASSED"
  EXPECT: DOMAIN TESTS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=b90f76ecbf51/37 entries; EXPECT=matched; output-sha256=8ef251dc6606a0c4bb66d9484300e609374f10391dc3c581fd19666c4ff8ce7c; output-bytes=1205

- [x] G4: the production Next.js build completes
  CHECK: npm run build && echo "NEXT BUILD PASSED"
  EXPECT: NEXT BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=b90f76ecbf51/37 entries; EXPECT=matched; output-sha256=52f352e92242c4aace9a82a16bf9aba14a12b86e2a5341f36adc86d272f17328; output-bytes=1074

- [x] G5: the migrated application is visually reviewed at mobile and desktop sizes, including login, citizen map, reports, field orders, management dashboard, and design sheet
  EVIDENCE: Playwright review completed for login, citizen map, citizen reports, field orders, management dashboard, design sheet, and the Iteration 08 citizen-map treatment at mobile/desktop target sizes; no page errors.

- [x] G6: the citizen map uses a low-noise colored base with geographic references and no broken tile provider
  CHECK: node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/maps/IssueMapClient.tsx','utf8'); const required=['tile.openstreetmap.org','OpenStreetMap contributors']; if (required.some((item)=>!s.includes(item)) || s.includes('basemaps.cartocdn.com') || s.includes('API KEY REQUIRED')) process.exit(1); console.log('MAP BASE CONTRACT PASSED')"
  EXPECT: MAP BASE CONTRACT PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=b90f76ecbf51/37 entries; EXPECT=matched; output-sha256=aabc139f5bab1259ad72b6f53ba755e9ca49681f5707454da25948104017af13; output-bytes=25

- [x] G7: the citizen navigation keeps the report action separate from the three primary destinations
  CHECK: node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/layout/BottomNavigation.tsx','utf8'); if (!s.includes('bottom-nav-links') || !s.includes('bottom-fab-slot') || !s.includes('Nova ocorrência')) process.exit(1); console.log('NAVIGATION ACTION CONTRACT PASSED')"
  EXPECT: NAVIGATION ACTION CONTRACT PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=b90f76ecbf51/37 entries; EXPECT=matched; output-sha256=683e06960823a3b9b2f1df032791add93e149080dd8440d8d42cb7f90eed4293; output-bytes=34

- [x] G8: the guided occurrence flow and map changes preserve static, domain, and production checks
  CHECK: npm run typecheck && npm run lint && npm test && npm run build && echo "GUIDED FLOW BUILD PASSED"
  EXPECT: GUIDED FLOW BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=b90f76ecbf51/37 entries; EXPECT=matched; output-sha256=63f013139eb2bad8ddb7e8fe10c592b4dc69a5aed060c66b644f7a3ffb051254; output-bytes=2359

- [x] G9: the updated map and guided occurrence flow are visually reviewed in the browser at mobile and desktop sizes
  EVIDENCE: Playwright review completed for softened but still geographic OSM cartography, closer citizen-map framing, balanced four-action mobile navigation, red fixed location pin, shadcn-style occurrence drawer on mobile/desktop, popup removal, Escape dismissal, location picker, photo step, details step, address search, and return-to-map flow; no page errors.
