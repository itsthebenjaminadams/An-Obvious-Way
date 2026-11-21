# AOW Website

Website for An Obvious Way (anobviousway.com). Hosted with Cloudflare Pages, deployed from GitHub.

## Project layout

- `public/index.html` - homepage
- `public/services/index.html` - services
- `public/portfolio/index.html` - portfolio
- `public/about/index.html` - about
- `public/contact/index.html` - contact
- `public/assets/style.css` - theme and layout
- `public/assets/app.js` - animations and interactions

## Cloudflare Pages Git integration settings

1. Cloudflare dashboard > Workers & Pages > Create application > Pages > Connect to Git.
2. Connect GitHub and select this repository.
3. Framework preset: None.
4. Production branch: main.
5. Build command: leave blank.
6. Build output directory: `public`.
7. Root directory: repository root / blank.
8. Save and Deploy.
9. Under your Pages project, add the custom domain `anobviousway.com` after verifying the pages.dev URL.

## Editing

Edit the relevant HTML or CSS file directly in GitHub and click Commit changes on `main`. Cloudflare will publish the updated site automatically.

The contact page uses a `mailto:` link to open a quote-request draft addressed to `contact@anobviousway.com`. The home and services pages link to specific quote topics on the contact page; those links prefill the service in the email draft. The site does not collect submissions or send email itself. Do not add passwords, tokens, or API keys to this repository.

The homepage console intro plays in the page, not over it. It plays only on a direct or external homepage visit once per browser tab, can be skipped/replayed, and is disabled with reduced motion. Navigation and quote links are plain HTML and work without JavaScript.

## BIOS release number

The homepage’s `data-bios-version` attribute in `public/index.html` is the only source of truth for the version shown in the retro console intro. It starts at `1.0`. For each subsequent user-visible production release, change only that version value from the last verified live number to the next tenth (`1.0` → `1.1`, and `1.9` → `2.0`). Carry the bump with the release; do not bump it for drafts, retries, or checks. Verify the new number on the live homepage (use Replay intro if needed) before preparing another bump.
