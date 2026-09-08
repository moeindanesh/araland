# API v1 contract

Base URL: http://localhost:4000/api. JSON; errors `{error: string}`. Auth `Authorization: Bearer <token>`. IDs are strings, dates ISO strings. All private endpoints check ownership. Native and web share `packages/shared/src/index.ts`.

- POST /auth/request `{phone,siteSlug?}` → `{challengeId, expiresIn, devCode?}`
- POST /auth/verify `{challengeId, code}` → `{token, user: {id,phone,name}, sites: Site[]}`
- GET /me → `{user}`
- GET /sites → `{sites}`
- POST /sites `{name,slug,templateId}` → `{site}`
- GET /sites/:id → `{site}`
- PATCH /sites/:id `{name?, draft?, seo?}` → `{site}`
- POST /sites/:id/publish → `{site}` (atomically copy home, pages, page SEO, navigation, template, name and site SEO to the published snapshot; publishedAt)
- POST /sites/:id/template `{templateId}` → `{site}` (reset home draft to template defaults; preserve additional pages, page links and published snapshot; discard menu links to home sections absent from the new template)
- GET /sites/:id/stats → `{visits,leads,members,conversion,series: {label,value}[]}`
- GET /sites/:id/leads → `{leads}`
- GET /sites/:id/members → `{members}`
- GET /sites/:id/forms → `{forms}`
- POST /sites/:id/forms `{title,fields}` → `{form}`
- PATCH /sites/:id/forms/:formId `{title?,fields?}` → `{form}` (validated fields; existing leads preserve original responses)
- DELETE /sites/:id/forms/:formId → `{ok}`
- GET /sites/:id/posts → `{posts}`
- POST /sites/:id/posts `{title,slug,excerpt,body,cover?,published?}` → `{post}`
- PATCH /sites/:id/posts/:postId `{title?,slug?,excerpt?,body?,cover?:string|null,published?}` → `{post}` (set `cover:null` to remove cover; publish or unpublish a saved draft)
- DELETE /sites/:id/posts/:postId → `{ok}`
- GET /sites/:id/domains → `{domains}`
- POST /sites/:id/domains `{hostname}` → `{domain}`
- POST /sites/:id/domains/:domainId/verify → `{domain}`
- DELETE /sites/:id/domains/:domainId → `{ok}` (same-site owner only; removes domain lookup and dynamic CORS eligibility; does not edit external DNS)
- GET /sites/:id/files → `{files}`
- POST /sites/:id/files multipart(file,title,recipientPhone) → `{file}`
- DELETE /sites/:id/files/:fileId → `{ok}` (same-site owner only; revokes database access before storage cleanup; later downloads return 404)
- GET /files/:id/download (owner or assigned site member only) → bytes
- POST /sites/:id/ai/image `{prompt}` → `{media}` or 503 when provider missing
- POST /sites/:id/media multipart(file) → `{media}` (optimized public image)
- GET /public/sites/:slug → `{site,forms,posts}` (published snapshot only; no private data)
- GET /public/sites/:slug/pages/:pageSlug → `{site,page,forms,posts}` (enabled page in the published snapshot; missing, disabled, draft-only and previous renamed slugs return 404)
- GET /public/domain/:hostname → `{slug}` (verified domain only)
- POST /public/sites/:slug/forms/:formId/submit `{values}` → `{ok}`
- POST /public/sites/:slug/visit → `{ok}`
- POST /public/sites/:slug/join (auth) → `{member}`
- GET /portal/:slug (auth) → `{site:{name,slug},files}` (site membership required)

Site: `{id,name,slug,templateId,status:'DRAFT'|'PUBLISHED',draft:SiteContent,published:SiteContent|null,publishedAt:string|null,updatedAt:string,seo:{title,description}}`.

SiteContent: `{brand:{name,tagline,primaryColor,logo?},sections:Section[],pages?:SitePage[],navigation?:{header:NavigationItem[],footer:NavigationItem[]}}`. Legacy content without `pages` or `navigation` remains valid. `sections` is always the home page; brand and template are shared by every page.
Section: `{id,type:'hero'|'services'|'about'|'testimonials'|'faq'|'contact'|'instagram'|'stories'|'blog',enabled,title,subtitle?,items?:{id,title,description?,image?,url?,pageId?}[],image?,buttonText?,buttonUrl?,buttonPageId?}`. An item accepts either `url` or `pageId`; a section button accepts either `buttonUrl` or `buttonPageId`.
SitePage: `{id,title,slug,kind:'page'|'service'|'topic',enabled,sections:Section[],seo:{title,description}}`.
NavigationItem: `{id,label,target:{type:'home'}|{type:'page',pageId}|{type:'section',sectionId}|{type:'url',url}}`. Section targets refer to the home page only. Array order determines link order within each menu. An explicitly empty menu means no configured links; an omitted menu retains the template navigation behavior.
TemplateId: `'orbit'|'bloom'|'forma'|'pulse'|'luma'`.
Form fields: `{id,label,type:'text'|'email'|'phone'|'textarea'|'select',required,options?:string[]}[]`.

Lead: `{id,formTitle,values,fieldLabels,createdAt}`. `fieldLabels` maps field IDs to the labels displayed at submission time, and remains unchanged when a form is edited or deleted. Existing records default to `{}`. Member: `{id,phone,name?,createdAt}`. File: `{id,title,originalName,mimeType,size,recipientPhone,createdAt}`. Post: `{id,title,slug,excerpt,body,cover?,published,createdAt}`. Domain: `{id,hostname,status:'PENDING'|'VERIFIED',verificationToken,createdAt}`.

## Multi-page validation and publication

Manage pages and navigation through the owner-authorized `PATCH /sites/:id` with the complete `draft`. The snapshot is one JSON value; no new database table, migration or separate page publish operation is required. Page content and metadata remain independent of the currently published site. Forms and individually published posts remain live resources shared across pages.

- At most 50 additional pages, 1–40 sections per page, 40 items per section and 100 links in each menu. Page IDs are unique within the site; section IDs within a page; item IDs within a section; navigation IDs within each menu.
- Page slugs are trimmed, NFC-normalized and lowercased on save, at most 120 characters, and match `[a-z0-9]+(?:-[a-z0-9]+)*`. Slugs are unique within a site. Reserved slugs include `api`, `portal`, `blog`, `preview`, `s`, `admin`, `dashboard`, `home`, `robots`, `sitemap`, `assets`, `login`, `templates`, `editor` and `live-preview`; the authoritative list is `reservedPageSlugs` in the shared package. Page titles and navigation labels must contain a non-whitespace character.
- Internal links reference stable page IDs from the same draft. Unknown page IDs, unknown home-section targets, duplicate IDs/slugs, invalid URLs and conflicting URL/page targets are rejected with 400. A site ID or a page ID does not grant management permission; portal-scoped sessions remain excluded from all management routes.
- A disabled page stays in the owner's draft and stored snapshot, but its body and SEO are omitted from both `published` and the compatibility `draft` in every public DTO. Menu entries and section/item references to unavailable pages are removed from the public projection. Menu references to disabled home sections are omitted too. A page may be enabled without appearing in any menu.
- Disabled sections are excluded from both public content fields on home and enabled additional pages. The owner's saved draft and stored publication retain them.
- Adding, editing, renaming, disabling or deleting a page becomes public only on site publication. Renaming updates ID-based internal links to the new route; the old external URL returns 404, with no automatic redirect in this version. Page removal should use shared `removeSitePage` to remove inbound navigation and content links before saving.
- Public web paths are `/s/:siteSlug/:pageSlug`, or `/:pageSlug` on a verified custom domain. The home page, blog paths and portal paths retain their existing routes.

## Validation, assets and public discovery

Required short text must contain a non-whitespace character. Select-field options must be unique after trimming. Saved form labels remain independent of historical lead labels.

Image fields accept validated HTTP(S) URLs, the existing public media paths, and bundled template assets matching `/images/templates/[a-z0-9-]+.webp`. Resolve bundled template paths against the web origin on native clients; public metadata uses an absolute web URL.

The web serves `/s/:slug/sitemap.xml`, or `/sitemap.xml` on the verified customer domain. It lists the published home, enabled published pages and live published articles only. Customer robots uses verified host context; preview, login, portal and editor responses carry noindex. No draft SEO or disabled page is discoverable through the sitemap.

Shared JSON requests time out after 30 seconds (180 seconds for AI). A timeout is not evidence the server did not commit a mutation; inspect the current list before retrying a creation. Downloaded copies or downloads already underway cannot be recalled by file deletion.

## Portal-only authentication

`siteSlug` requests a session restricted to that published site. A verified merchant browser Origin always forces the associated site scope, even when siteSlug is omitted. Verification returns `siteScopeId` and `siteSlug` (null for manager auth); scoped responses contain no owned-site list. A manager challenge cannot be redeemed from a merchant Origin. Scoped tokens cannot use any site-management route and cannot join/read another site or use an owner file-access override. The web stores portal tokens per slug separately from its manager session. `CORS_ORIGINS` must list trusted application origins only; merchant origins are discovered from verified domains.
