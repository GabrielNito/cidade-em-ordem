# Gates: Next.js foundation and design-system migration

OWNS: package.json, package-lock.json, next.config.ts, tsconfig.json, app/**, src/**, public/**, GATES.md

Scope: maintain the Next.js frontend while preserving the current domain behavior, protected role routes, design sheet, local demo workflow, and the guided occurrence-reporting experience.

- [x] G0: this ledger is structurally valid and its checks are reviewable
  CHECK: node /home/local/dotfiles/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=b954fd5a77051b182348a18b1ccd76d319c28a0524dfc80745f44717b06998a6; output-bytes=387

- [x] G1: the repository uses a Next.js start/build toolchain and keeps the required client-side dependencies
  CHECK: node -e "const p=require('./package.json'); if (!p.dependencies.next || !p.scripts.dev.includes('next') || !p.scripts.build.includes('next')) process.exit(1); console.log('NEXT TOOLCHAIN PASSED')"
  EXPECT: NEXT TOOLCHAIN PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=b56cef3cb3cc8ce2a38b5c65551c293a47bcb6aa82f6053627fb1ee95556106d; output-bytes=22

- [x] G2: TypeScript and linting pass after the migration
  CHECK: npm run typecheck && npm run lint && echo "STATIC CHECKS PASSED"
  EXPECT: STATIC CHECKS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=c7711a7fcca5584ec973e793aeae995228df904598f4b15a8dd6e63a7e875957; output-bytes=114

- [x] G3: existing domain and repository tests pass after the migration
  CHECK: npm test && echo "DOMAIN TESTS PASSED"
  EXPECT: DOMAIN TESTS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=f4852eb717a6b298705082691a8692f4572b99346191627c465abdf6a1b266e2; output-bytes=1211

- [x] G4: the production Next.js build completes
  CHECK: npm run build && echo "NEXT BUILD PASSED"
  EXPECT: NEXT BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=046c2d182eecbcfbaac772ed2031b4bd17123ffddb48a7fc4abceb9bd24ecf24; output-bytes=1074

- [x] G5: the migrated application is visually reviewed at mobile and desktop sizes, including login, citizen map, reports, field orders, management dashboard, and design sheet
  EVIDENCE: Playwright review completed for login, citizen map, citizen reports, field orders, management dashboard, design sheet, and the Iteration 08 citizen-map treatment at mobile/desktop target sizes; no page errors.

- [x] G6: the citizen map uses a low-noise colored base with geographic references and no broken tile provider
  CHECK: node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/maps/IssueMapClient.tsx','utf8'); const required=['tile.openstreetmap.org','OpenStreetMap contributors']; if (required.some((item)=>!s.includes(item)) || s.includes('basemaps.cartocdn.com') || s.includes('API KEY REQUIRED')) process.exit(1); console.log('MAP BASE CONTRACT PASSED')"
  EXPECT: MAP BASE CONTRACT PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=aabc139f5bab1259ad72b6f53ba755e9ca49681f5707454da25948104017af13; output-bytes=25

- [x] G7: the citizen navigation keeps the report action separate from the three primary destinations
  CHECK: node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/layout/BottomNavigation.tsx','utf8'); if (!s.includes('bottom-nav-links') || !s.includes('bottom-fab-slot') || !s.includes('Nova ocorrência')) process.exit(1); console.log('NAVIGATION ACTION CONTRACT PASSED')"
  EXPECT: NAVIGATION ACTION CONTRACT PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=683e06960823a3b9b2f1df032791add93e149080dd8440d8d42cb7f90eed4293; output-bytes=34

- [x] G8: the guided occurrence flow and map changes preserve static, domain, and production checks
  CHECK: npm run typecheck && npm run lint && npm test && npm run build && echo "GUIDED FLOW BUILD PASSED"
  EXPECT: GUIDED FLOW BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=e4278c4ca3120f9f1290e1a979438b7acf2e7467be09f618ae45dd6fd0fbfae9; output-bytes=2363

- [x] G9: the updated map and guided occurrence flow are visually reviewed in the browser at mobile and desktop sizes
  EVIDENCE: Playwright review completed for softened but still geographic OSM cartography, closer citizen-map framing, balanced four-action mobile navigation, red fixed location pin, shadcn-style occurrence drawer on mobile/desktop, popup removal, Escape dismissal, location picker, photo step, details step, address search, and return-to-map flow; no page errors.

- [x] G10: the public experience does not expose prototype-only wording and guides citizens with readable state feedback
  CHECK: node -e "const fs=require('fs'); const files=['src/screens/LoginPage.tsx','src/screens/ProfilePage.tsx','src/components/layout/AppShell.tsx','src/screens/citizen/CitizenMapPage.tsx','src/components/reports/LocationPicker.tsx']; const s=files.map(f=>fs.readFileSync(f,'utf8')).join('\\n'); const forbidden=['Acesso simulado para demonstração','Protótipo de demonstração','Sessão local ativa','Modo de demonstração','Ponto de demonstração']; const required=['Bem-vinda','Solicitação enviada','Escolha como prefere localizar']; if (forbidden.some(x=>s.includes(x))||required.some(x=>!s.includes(x))) process.exit(1); console.log('BELIEVABLE EXPERIENCE COPY PASSED')"
  EXPECT: BELIEVABLE EXPERIENCE COPY PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=32b744b8fce79cd7118876de6b20301b427d802e1fdfee09c23d528695fd6105; output-bytes=34

- [x] G11: accessible interaction styles provide larger tap targets and honour reduced-motion preferences
  CHECK: node -e "const fs=require('fs'); const s=fs.readFileSync('src/styles.css','utf8'); const required=['prefers-reduced-motion: reduce','.map-filter-option {','min-height: 44px','font-size: .82rem','.experience-toast']; if (required.some(x=>!s.includes(x))) process.exit(1); console.log('ACCESSIBLE INTERACTION STYLES PASSED')"
  EXPECT: ACCESSIBLE INTERACTION STYLES PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=b9e92fcd0a3a06e0c360ce6e025e1fb10e6f3a95d50579e2edc396ca3268ac22; output-bytes=37

- [x] G12: demo-experience implementation preserves static checks, domain tests, and production build
  CHECK: npm run typecheck && npm run lint && npm test && npm run build && echo "DEMO EXPERIENCE BUILD PASSED"
  EXPECT: DEMO EXPERIENCE BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=824005f237d5/29 entries; EXPECT=matched; output-sha256=26f6a0362e1a72fcfaa43d458ba56e0bc239918b79feef292796ffdc4ad5dc49; output-bytes=2367

- [x] G13: citizen, field, management, login, and guided-report journeys are visually reviewed at desktop and mobile widths
  EVIDENCE: Chrome headless review at 1440×1024 and 390×844 verified login balance, citizen map/drawer/submission receipt/list view, guided location and category-before-photo flow, text-size persistence, profile modal Escape/focus return, field next action, and management collapsed mobile filters; no page errors.
