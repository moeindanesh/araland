# API v1 contract

Base URL: http://localhost:4000/api. JSON; errors `{error: string}`. Auth `Authorization: Bearer <token>`. IDs are strings, dates ISO strings. All private endpoints check ownership. Native and web share `packages/shared/src/index.ts`.

- POST /auth/request `{phone,siteSlug?}` → `{challengeId, expiresIn, devCode?}`
- POST /auth/verify `{challengeId, code}` → `{token, user: {id,phone,name}, sites: Site[]}`
- GET /me → `{user}`
- GET /sites → `{sites}`
- POST /sites `{name,slug,templateId}` → `{site}`
- GET /sites/:id → `{site}`
- PATCH /sites/:id `{name?, draft?, seo?}` → `{site}`
- POST /sites/:id/publish → `{site}` (copy draft to published; publishedAt)
- POST /sites/:id/template `{templateId}` → `{site}` (reset draft to template defaults, preserve published)
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
- GET /sites/:id/files → `{files}`
- POST /sites/:id/files multipart(file,title,recipientPhone) → `{file}`
- GET /files/:id/download (owner or assigned site member only) → bytes
- POST /sites/:id/ai/image `{prompt}` → `{media}` or 503 when provider missing
- POST /sites/:id/media multipart(file) → `{media}` (optimized public image)
- GET /public/sites/:slug → `{site,forms,posts}` (published snapshot only; no private data)
- GET /public/domain/:hostname → `{slug}` (verified domain only)
- POST /public/sites/:slug/forms/:formId/submit `{values}` → `{ok}`
- POST /public/sites/:slug/visit → `{ok}`
- POST /public/sites/:slug/join (auth) → `{member}`
- GET /portal/:slug (auth) → `{site:{name,slug},files}` (site membership required)

Site: `{id,name,slug,templateId,status:'DRAFT'|'PUBLISHED',draft:SiteContent,published:SiteContent|null,publishedAt:string|null,updatedAt:string,seo:{title,description}}`.

SiteContent: `{brand:{name,tagline,primaryColor,logo?},sections:Section[]}`.
Section: `{id,type:'hero'|'services'|'about'|'testimonials'|'faq'|'contact'|'instagram'|'stories'|'blog',enabled,title,subtitle?,items?:{id,title,description?,image?,url?}[],image?,buttonText?,buttonUrl?}`.
TemplateId: `'orbit'|'bloom'|'forma'`.
Form fields: `{id,label,type:'text'|'email'|'phone'|'textarea'|'select',required,options?:string[]}[]`.

Lead: `{id,formTitle,values,fieldLabels,createdAt}`. `fieldLabels` maps field IDs to the labels displayed at submission time, and remains unchanged when a form is edited or deleted. Existing records default to `{}`. Member: `{id,phone,name?,createdAt}`. File: `{id,title,originalName,mimeType,size,recipientPhone,createdAt}`. Post: `{id,title,slug,excerpt,body,cover?,published,createdAt}`. Domain: `{id,hostname,status:'PENDING'|'VERIFIED',verificationToken,createdAt}`.

## Portal-only authentication

`siteSlug` requests a session restricted to that published site. A verified merchant browser Origin always forces the associated site scope, even when siteSlug is omitted. Verification returns `siteScopeId` and `siteSlug` (null for manager auth); scoped responses contain no owned-site list. A manager challenge cannot be redeemed from a merchant Origin. Scoped tokens cannot use any site-management route and cannot join/read another site or use an owner file-access override. The web stores portal tokens per slug separately from its manager session. `CORS_ORIGINS` must list trusted application origins only; merchant origins are discovered from verified domains.
