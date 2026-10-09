# Gates: Next.js foundation and design-system migration

OWNS: package.json, package-lock.json, next.config.ts, tsconfig.json, app/**, src/**, public/**, GATES.md

Scope: maintain the Next.js frontend while preserving the current domain behavior, protected role routes, design sheet, local demo workflow, and the guided occurrence-reporting experience.

- [x] G0: this ledger is structurally valid and its checks are reviewable
  CHECK: node /home/local/dotfiles/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=b954fd5a77051b182348a18b1ccd76d319c28a0524dfc80745f44717b06998a6; output-bytes=387

- [x] G1: the repository uses a Next.js start/build toolchain and keeps the required client-side dependencies
  CHECK: node -e "const p=require('./package.json'); if (!p.dependencies.next || !p.scripts.dev.includes('next') || !p.scripts.build.includes('next')) process.exit(1); console.log('NEXT TOOLCHAIN PASSED')"
  EXPECT: NEXT TOOLCHAIN PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=b56cef3cb3cc8ce2a38b5c65551c293a47bcb6aa82f6053627fb1ee95556106d; output-bytes=22

- [x] G2: TypeScript and linting pass after the migration
  CHECK: npm run typecheck && npm run lint && echo "STATIC CHECKS PASSED"
  EXPECT: STATIC CHECKS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=c7711a7fcca5584ec973e793aeae995228df904598f4b15a8dd6e63a7e875957; output-bytes=114

- [x] G3: existing domain and repository tests pass after the migration
  CHECK: npm test && echo "DOMAIN TESTS PASSED"
  EXPECT: DOMAIN TESTS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=8d7f4946a542aca3fdabc89fa2e8cbf85df9f4534ebe34303f462cad2f2f3bcc; output-bytes=1775

- [x] G4: the production Next.js build completes
  CHECK: npm run build && echo "NEXT BUILD PASSED"
  EXPECT: NEXT BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=6be538b56b8da124b2a809209104c3b1b437d9526e70c25bb0872639ead5e7ca; output-bytes=1097

- [x] G5: the migrated application is visually reviewed at mobile and desktop sizes, including login, citizen map, reports, field orders, management dashboard, and design sheet
  EVIDENCE: Playwright review completed for login, citizen map, citizen reports, field orders, management dashboard, design sheet, and the Iteration 08 citizen-map treatment at mobile/desktop target sizes; no page errors.

- [x] G6: the citizen map uses a low-noise colored base with geographic references and no broken tile provider
  CHECK: node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/maps/IssueMapClient.tsx','utf8'); const required=['tile.openstreetmap.org','OpenStreetMap contributors']; if (required.some((item)=>!s.includes(item)) || s.includes('basemaps.cartocdn.com') || s.includes('API KEY REQUIRED')) process.exit(1); console.log('MAP BASE CONTRACT PASSED')"
  EXPECT: MAP BASE CONTRACT PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=aabc139f5bab1259ad72b6f53ba755e9ca49681f5707454da25948104017af13; output-bytes=25

- [x] G7: the citizen navigation keeps the report action separate from the three primary destinations
  CHECK: node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/layout/BottomNavigation.tsx','utf8'); if (!s.includes('bottom-nav-links') || !s.includes('bottom-fab-slot') || !s.includes('Nova ocorrência')) process.exit(1); console.log('NAVIGATION ACTION CONTRACT PASSED')"
  EXPECT: NAVIGATION ACTION CONTRACT PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=683e06960823a3b9b2f1df032791add93e149080dd8440d8d42cb7f90eed4293; output-bytes=34

- [x] G8: the guided occurrence flow and map changes preserve static, domain, and production checks
  CHECK: npm run typecheck && npm run lint && npm test && npm run build && echo "GUIDED FLOW BUILD PASSED"
  EXPECT: GUIDED FLOW BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=d2908be2f3dc96713bc4bbb38f1b4b13a0c469b3c5d96cb7f1a4a971897d5c07; output-bytes=2952

- [x] G9: the updated map and guided occurrence flow are visually reviewed in the browser at mobile and desktop sizes
  EVIDENCE: Playwright review completed for softened but still geographic OSM cartography, closer citizen-map framing, balanced four-action mobile navigation, red fixed location pin, shadcn-style occurrence drawer on mobile/desktop, popup removal, Escape dismissal, location picker, photo step, details step, address search, and return-to-map flow; no page errors.

- [x] G10: the public experience does not expose prototype-only wording and guides citizens with readable state feedback
  CHECK: node -e "const fs=require('fs'); const files=['src/screens/LoginPage.tsx','src/screens/ProfilePage.tsx','src/components/layout/AppShell.tsx','src/screens/citizen/CitizenMapPage.tsx','src/components/reports/LocationPicker.tsx']; const s=files.map(f=>fs.readFileSync(f,'utf8')).join('\\n'); const forbidden=['Acesso simulado para demonstração','Protótipo de demonstração','Sessão local ativa','Modo de demonstração','Ponto de demonstração']; const required=['Bem-vinda','Solicitação enviada','Escolha como prefere localizar']; if (forbidden.some(x=>s.includes(x))||required.some(x=>!s.includes(x))) process.exit(1); console.log('BELIEVABLE EXPERIENCE COPY PASSED')"
  EXPECT: BELIEVABLE EXPERIENCE COPY PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=32b744b8fce79cd7118876de6b20301b427d802e1fdfee09c23d528695fd6105; output-bytes=34

- [x] G11: accessible interaction styles provide larger tap targets and honour reduced-motion preferences
  CHECK: node -e "const fs=require('fs'); const s=fs.readFileSync('src/styles.css','utf8'); const required=['prefers-reduced-motion: reduce','.map-filter-option {','min-height: 44px','font-size: .82rem','.experience-toast']; if (required.some(x=>!s.includes(x))) process.exit(1); console.log('ACCESSIBLE INTERACTION STYLES PASSED')"
  EXPECT: ACCESSIBLE INTERACTION STYLES PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=b9e92fcd0a3a06e0c360ce6e025e1fb10e6f3a95d50579e2edc396ca3268ac22; output-bytes=37

- [x] G12: demo-experience implementation preserves static checks, domain tests, and production build
  CHECK: npm run typecheck && npm run lint && npm test && npm run build && echo "DEMO EXPERIENCE BUILD PASSED"
  EXPECT: DEMO EXPERIENCE BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=0400c4059b27ab1fbb218146570247beb50521da673f58dedd4534bd1ca7e136; output-bytes=2957

- [x] G13: citizen, field, management, login, and guided-report journeys are visually reviewed at desktop and mobile widths
  EVIDENCE: Chrome headless review at 1440×1024 and 390×844 verified login balance, citizen map/drawer/submission receipt/list view, guided location and category-before-photo flow, text-size persistence, profile modal Escape/focus return, field next action, and management collapsed mobile filters; no page errors.

- [x] G14: street geometry is preferred for saved intervention traces and interactive intervention drafts, while fallback remains explicit
  CHECK: node -e "const fs=require('fs'); const map=fs.readFileSync('src/components/maps/IssueMapClient.tsx','utf8'); const geo=fs.readFileSync('src/utils/geo.ts','utf8'); const required=['fetchStreetRoute(intervention.geometry)','fetchStreetRoute(interactivePoints)','interventionRouteResults','draftRouteResult']; const forbidden=['positions={coords}','positions={interactivePoints.map']; if(required.some((x)=>!map.includes(x)) || !geo.includes('getRenderableRouteCoordinates') || forbidden.some((x)=>map.includes(x))) process.exit(1); console.log('INTERVENTION STREET ROUTING CONTRACT PASSED')"
  EXPECT: INTERVENTION STREET ROUTING CONTRACT PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=f8ce59a7708d480caac6c8fce76a073cf45f6efe6fcf02c4327156aead76c83b; output-bytes=44

- [x] G15: occurrence removal is persisted, rejects unknown records, and is only exposed through the manager-authorized context action
  CHECK: npm test -- --run src/services/reportRepository.test.ts src/utils/geo.test.ts && node -e "const fs=require('fs'); const repo=fs.readFileSync('src/services/reportRepository.ts','utf8'); const ctx=fs.readFileSync('src/context/AppContext.tsx','utf8'); const ui=fs.readFileSync('src/screens/management/ManagementDashboardPage.tsx','utf8'); if(!repo.includes('remove(id: string)') || !ctx.includes('deleteReport') || !ctx.includes(\"session.role !== 'MANAGER'\") || !ui.includes('deleteReport')) process.exit(1); console.log('OCCURRENCE DELETION CONTRACT PASSED')" && echo "DOMAIN AND DELETE CHECKS PASSED"
  EXPECT: DOMAIN AND DELETE CHECKS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=fd1b26cda9987eccdd72140e73df7877b03e7446aed2a6a74283a8762b3aee87; output-bytes=954

- [x] G16: static checks pass after the map and deletion changes
  CHECK: npm run typecheck && npm run lint && echo "STATIC CHECKS PASSED"
  EXPECT: STATIC CHECKS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=c7711a7fcca5584ec973e793aeae995228df904598f4b15a8dd6e63a7e875957; output-bytes=114

- [x] G17: production build passes after the map and deletion changes
  CHECK: npm run build && echo "NEXT BUILD PASSED"
  EXPECT: NEXT BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=5e8c50115565fb80aedf9139ce404a6cb3281e7a5126bda76e699305c5bf8b90; output-bytes=1097

- [x] G18: the manager UI exposes a three-stage deletion contract and the map keeps the route proxy integration
  CHECK: node -e "const fs=require('fs'); const map=fs.readFileSync('src/components/maps/IssueMapClient.tsx','utf8'); const geo=fs.readFileSync('src/utils/geo.ts','utf8'); const ui=fs.readFileSync('src/screens/management/ManagementDashboardPage.tsx','utf8'); const requiredMap=['fetchStreetRoute','getRenderableRouteCoordinates']; const requiredGeo=['/api/route-path']; const requiredDelete=['Validação em 3 etapas','delete-report-ack','delete-report-protocol','Excluir definitivamente','setDeleteStep']; if(requiredMap.some((x)=>!map.includes(x)) || requiredGeo.some((x)=>!geo.includes(x)) || requiredDelete.some((x)=>!ui.includes(x))) process.exit(1); console.log('RUNTIME INTERACTION CONTRACT PASSED')"
  EXPECT: RUNTIME INTERACTION CONTRACT PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=968fbd824cc6/41 entries; EXPECT=matched; output-sha256=b9424b8ce66cad38d8dfbd3fa236accdb5550d9a43071c7b9c3c226ee49792ba; output-bytes=36

- [x] G19: opening the layers filter has an isolated mobile width-expansion contract
  CHECK: node -e "const fs=require('fs'); const page=fs.readFileSync('src/screens/citizen/CitizenMapPage.tsx','utf8'); const css=fs.readFileSync('src/styles.css','utf8'); if(!page.includes('map-filter-control-layers') || !css.includes('.map-filter-control-layers.map-filter-control-open') || !css.includes('flex-grow: 2.7')) process.exit(1); console.log('LAYER FILTER EXPANSION CONTRACT PASSED')"
  EXPECT: LAYER FILTER EXPANSION CONTRACT PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=33b616d78b8f/37 entries; EXPECT=matched; output-sha256=02d510c04a7f01921a2f12cee05f40c8c621ac0b8d50a6e7326429969da2f6df; output-bytes=39

- [x] G20: at a 390px mobile viewport, the opened layers filter shows both labels and counts without horizontal clipping
  EVIDENCE: Chrome production review at 390×844: opened control=169.75px and options client/scroll width=168px; “Ocorrências (16)” and “Intervenções (4)” both fully visible; screenshot=/tmp/codex-layer-filter-mobile.png.

- [x] G21: static analysis and the production build pass after the mobile layers-filter change
  CHECK: npm run typecheck && npm run lint && npm run build && echo "MOBILE LAYER FILTER BUILD PASSED"
  EXPECT: MOBILE LAYER FILTER BUILD PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/local/www/projeto; path=33b616d78b8f/37 entries; EXPECT=matched; output-sha256=cbb34f7c07d8910ed956099193aec865edea7cafbebbb0bde4ae8e8cbf4f8f96; output-bytes=1205
