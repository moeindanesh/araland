# Mobile delivery status

Implemented Expo SDK 57 / React Native 0.86.3 / HeroUI Native 1.0.9 manager app, Persian RTL with bundled user-supplied IRANYekanX Farsi numeral font and cream/forest design.

## Typography update on 2026-09-06

- Bundled the original Regular, Medium, DemiBold and Bold TTF files from the supplied font package; no conversion or synthetic bold is used.
- All application Text instances share the default face, TextInput uses Regular, and HeroUI Native theme tokens/Button.Label select the matching weights.
- App waits for all faces before rendering; a font-load failure has a retry screen. OS-owned dialogs and the font-error fallback necessarily use system text rendering.
- Action labels wrap with adequate line height and expanding button height; loading indicators use the correct contrast and expose the busy accessibility state.
- Content inputs and section controls disable during save/publication, including native keyboard editing of a focused input, so a late edit is not overwritten by the completed save response.
- Audience search normalizes Persian/Arabic/Latin digits on both query and record values; trimmed and case-insensitive text matching is preserved.

## Working implementation

- SecureStore OTP login (Persian digits accepted), persisted session, server logout revocation.
- Create/select sites, real API dashboard and explicit empty/error states.
- Content sections: edit/add/reorder/toggle/delete, structured items (FAQ, stories, Instagram, services), draft save/publication, unsaved-change guard.
- Three template activation/reset flows.
- Image upload/optimization for primary sections and item images; AI image API adapter.
- Form creation/edit/deletion with text/phone/email/textarea/select fields; leads/members search.
- Blog creation/edit/publish/unpublish/delete, including clearing cover through PATCH cover:null.
- Domain registration and exact TXT instructions araland-verification=TOKEN.
- Private file upload; authenticated download; native sharing sheet; temporary downloaded file removed afterward.
- Brand/SEO settings, network timeouts, loading and retry states.

## Verification on 2026-09-06

- `bun run --filter @araland/mobile typecheck`: passes with TypeScript 6.0.3 after the font change.
- `CI=1 bunx expo install --check`: all dependencies up to date and SDK-compatible.
- `bun run mobile:export`: successfully creates iOS and Android Hermes bundles, approximately 4.2 MB each; all four IRANYekanX TTF assets are present. No Uniwind theme errors.
- API implementation/contracts inspected, including optional fields, nullable cover, ownership routes and upload size limits.
- Search normalization checked directly for Latin, Persian, Arabic and mixed-digit phone numbers, partial matches, trimmed queries and email letter casing.

Real startup succeeded through Expo Go 57.0.9 on the available iPhone 16 Pro simulator (iOS 18.5). The original localhost bind used IPv6 while the manifest referenced IPv4; starting Metro with `NODE_OPTIONS=--dns-result-order=ipv4first` fixed the connection. Cold starts after restarting the host and rebuilding Metro's cache with `--clear` showed the running app, but subsequent development reloads reproduced `Cannot find native module 'ExpoAsset'`. Initializing Expo before other imports did not fix the reload failure, so the experimental import-order change was reverted. Temporary runtime instrumentation was removed. This host reload issue remains unresolved.

Simulator screenshots showed IRANYekanX rendering in the login screen and the restored session's manager dashboard. The installed Expo Go host reported React Native 0.86.2; the JavaScript project uses the Expo-recommended 0.86.3. The successful cold startup is not a stable-runtime or full-flow test. Expo Go's introduction sheet covered part of the page, and Simulator was unavailable to the enabled UI control tool; full interaction flows, permissions, keyboard/accessibility behavior, physical devices, Android runtime and store release remain unverified.

### Final dependency and host check

- The official Expo versions API (`https://api.expo.dev/v2/versions/latest`, SDK `57.0.0` entry, checked 2026-09-06) recommends exactly `expo ~57.0.20`, React Native `0.86.3`, and Expo Go `57.0.9` for both iOS and Android. The installed iOS host is that release; changing the host or downgrading React Native is not supported by this evidence.
- `CI=1 bunx expo install --check` reports dependencies are up to date. `expo-asset 57.0.16`, `expo-constants 57.0.17` and `expo-modules-core 57.0.16` are present transitively and match Expo's bundled versions. Autolinking discovers the `ExpoAsset` pod and `AssetModule`; the package is not missing.
- `bunx expo-modules-autolinking verify --verbose` warns about duplicate physical installations under Bun's isolated dependency layout. However, Expo's enabled monorepo resolver was checked and selects one canonical path for Expo, ExpoAsset, core, font, React Native and worklets on both platforms. The warnings are real; they do not establish that duplicate modules caused the observed reload error. See `https://docs.expo.dev/guides/monorepos/`.
- The root cause of the development reload failure is still unknown. No dependency edits, downgrade, or native build was made based on an unproven hypothesis. The next inexpensive isolation step is running the same app with development mode disabled: `NODE_OPTIONS=--dns-result-order=ipv4first bun run --filter @araland/mobile start --localhost --no-dev --minify --clear`, then opening the project in the existing simulator. This is a diagnostic step, not a verified fix. A project-specific native development build is appropriate if that comparison still fails.

Run instructions and device LAN URL configuration are in README.md and .env.example. Set server API_PUBLIC_URL to a device-accessible address for uploaded media.
