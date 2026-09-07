# Araland

Read README.md, docs/API-CONTRACT.md and docs/ARCHITECTURE.md before changing boundaries. Product/UI text is Persian and RTL; code/contracts use English names.

- Bun workspaces. API: apps/api, public/manager web: apps/web, native manager: apps/mobile, Prisma: packages/db, shared contracts/template defaults: packages/shared.
- A site ID is never authorization. API endpoints must check owner membership; private downloads also check exact recipient and site membership.
- Draft content, template, name and SEO remain independent of published snapshots. Forms and individually published blog posts are deliberately live resources.
- New real sites use createInitialContent (no sample testimonials). createContent is for template previews.
- Do not fabricate successful SMS, AI generation, verified domains or visitor data. Development OTP requires AUTH_DEV_MODE=true and cannot run in production.
- Keep secrets server-side. Do not commit .env, uploads, database files, generated bundles or Next output.
- Preserve field-label snapshots when editing forms; old leads must retain the questions originally answered.
- Web UI changes: test desktop and phone widths and actual keyboard interactions. Native export is not a device runtime test.
- Verification: bun run db:generate, bun run db:deploy, bun run typecheck, bun run test, bun run build. After native changes run bun run mobile:export.
- Use migrations for database changes. Tests create and clean their own records; do not delete seed/user work during verification.
