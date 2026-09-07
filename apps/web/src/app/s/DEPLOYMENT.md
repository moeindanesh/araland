# Published pages and custom domains

The page routes load only the API's published snapshot at request time. `/preview/orbit`, `/preview/bloom` and `/preview/forma` use template data and are excluded from indexing. `/s/:slug/blog/:postSlug` renders only an individually published post from a published site. Plain text bodies are escaped by React.

- Set `API_INTERNAL_URL` to the API base including `/api`, accessible from the Next server. Default: `http://localhost:4000/api`.
- Set `APP_HOST` to the primary control-panel hostname, or `APP_HOSTS` to a comma-separated list. `APP_URL` and `NEXT_PUBLIC_APP_URL` also work. Otherwise a non-IP hostname is treated as a customer domain. localhost and IP addresses remain development app hosts.
- Next proxy verifies each customer hostname against the API domain lookup before rewriting `/` to `/s/:slug`. `/blog/:postSlug` and existing `/s/:slug/blog/:postSlug` links work. Links cannot use a custom domain to show a different site's landing page or portal.
- `/portal` rewrites to the site's portal. Existing `/portal/:slug` links and `/login` are allowed for the mapped site. Browser sessions are isolated by origin, so the user may sign in separately on a customer domain. Login must retain its validated portal return path. The API remains responsible for membership and file authorization.
- Configure DNS A/CNAME records, reverse proxy forwarding of the original hostname, and valid HTTPS certificates for each domain. TXT verification alone does not provision routing or certificates. The API dynamically accepts CORS from HTTPS origins of verified domains attached to published sites. The frontend's public API URL must be reachable over HTTPS from customer domains.
- Domain lookup API outages render a clear 503 with `Retry-After: 60`; unknown/unverified domains produce 404. Published-page API outages enter the page error boundary instead of being presented as not-found. No unavailable response is cached.

No unverified domains, application secrets, server draft data, or raw HTML article bodies are passed through these routes.
