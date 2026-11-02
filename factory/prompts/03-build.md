# Stage 3 — Full-stack Builder

Implement the current product from reviewed behavior and concrete design. Work in the preinstalled app skeleton.

Read `SKELETON.md`, `../requirements/requirements.md`, `../requirements/product.json`, approved `../requirements/review.json`, `../design/ui-spec.md`, and `../design/visual-plan.json`. Tokens and the REVIEWED resolved seed are already copied into the app.

Follow the `SKELETON.md` layout and code-structure rules: one route per page file, one component per file, a router and service per server resource, pure logic in `shared/`. Small, well-named modules beat a few large files. Apply the included `e2e-contract` skill to UI code and the `express-api` skill to server code.

Apply the included `domain-invariants` skill to applicable business rules and `vercel-react-best-practices` to the React client. Read only relevant rule files; Next.js-only examples and additional caching packages are outside this Vite build.

Build only what this product needs:
- Shared types for actual domain/API data, plus appropriately named helpers for relevant pure logic. Do not force particular pricing/date/state helpers into unrelated products.
- Meaningful unit tests for implemented calculations, validation, transformations or workflow boundaries. Cover worked examples and real risks. Follow the reviewed unit-test applicability decision; never invent domain logic or tautological tests solely to fill a file.
- Server endpoints/supporting code needed by the actual API contract. Validate input, permissions and relevant invariants; use specified errors and trusted server calculations where appropriate. Retain infrastructure health/reset even when no domain API is needed.
- Consume `server/data/seed.json` as the complete reviewed reset state. Preserve its records/values and shape; do not append invented fixtures. Adapt the store to this domain instead of assuming fixed entity keys. Reset must restore this seed exactly.
- React routes/components/states per the UI contract, with actual product title, plain token CSS, exact testids/labels/types/formats and stable feedback targets. Support 360px and 390px without horizontal overflow.
- Appropriate freshness/persistence, safe ordinary submissions and useful recovery. Do not add unrequested roles, storage or integrations. Implement explicit real authentication/integrations honestly; record missing credentials or clear demo limitations rather than fake success.
- Clear hierarchy and principal task, accessible labels/focus, applicable loading/empty/error/success states, and intentional fallbacks for actual remote media.

Do not read/write `e2e/`; independent QA writes tests concurrently. Do not alter reviewed requirements/product/seed/acceptance, UI/visual contracts or Playwright configuration to fit implementation.

Run `npm run build`, fixing errors in scope. Run `npx vitest run` when meaningful unit logic is required or existing unit test files are present. When the reviewed product explicitly sets `unit_tests_required: false` with a valid reason and there are no unit tests, record that reason instead of creating dummy tests or trying to fix Vitest's empty-suite exit. Report checks actually run, relevant logic coverage and limitations. Do not claim E2E or image-review success prematurely.
