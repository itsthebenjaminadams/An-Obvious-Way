# AOW Website

Website for An Obvious Way (anobviousway.com). Served by the Cloudflare Worker `an-obvious-way` and deployed from GitHub.

## Project layout

- `public/index.html` - homepage
- `public/services/index.html` - services
- `public/portfolio/index.html` - portfolio
- `public/about/index.html` - about
- `public/contact/index.html` - contact
- `public/sitemap.xml` - the five public canonical URLs
- `public/assets/style.css` - theme and layout
- `public/assets/app.js` - animations and interactions

## Cloudflare Workers deployment

Cloudflare builds this repository from its root with no build command. Wrangler serves the static files in `public`, with no Worker script. The existing custom domain is managed in the Cloudflare dashboard, not in this repository.

- Pull request branches use `npx wrangler preview`. The `previews` block enables that command without any preview-specific bindings.
- The production branch is `main`, deployed with `npx wrangler deploy`.

Keep changes on a branch until the preview passes. After merging, confirm the release badge and any changed behavior on anobviousway.com.

## Editing

Edit the relevant HTML, CSS or JavaScript in `public`. No build is required for local content checks.

The contact page uses a `mailto:` link to open a quote-request draft addressed to `contact@anobviousway.com`. The home and services pages link to specific quote topics on the contact page; those links prefill the service in the email draft. The site does not collect submissions or send email itself. Do not add passwords, tokens, or API keys to this repository.

The homepage console intro plays in the page, not over it. It plays on every homepage visit or reload, including visits from another AOW page. It can be skipped or replayed, and is disabled with reduced motion. Navigation and quote links are plain HTML and work without JavaScript.

## BIOS release number

The static `data-bios-release` block in `public/index.html` is the only source for the version and release-build time shown in the homepage and its intro. It starts at `1.0`. For each subsequent user-visible production release, update its `data-bios-version` text to the next tenth from the last verified live number (`1.0` → `1.1`, and `1.9` → `2.0`). In the same block update the `<time>` machine timestamp and visible label to the matching UTC build time, accurate to the minute. The build time is not a claim about the exact moment Cloudflare published it. Carry the change with the release; do not bump it for drafts, retries, or checks. Verify the version and timestamp on the live homepage and in Replay intro before preparing another bump.

On Contact, each service also has a selectable webmail template that works without JavaScript. When changing a service email draft, keep its mailto subject/body and the matching webmail template aligned.

The homepage intro animates an original inline SVG signal array in three phases. The FX button in the site header reduces decorative motion for this browser without changing the accent theme. The site always honors the operating system’s reduced-motion preference.

When a public page URL changes, keep its canonical link, Open Graph URL, and the sitemap in sync. Crawler policy is managed outside this repository; do not add a replacement robots.txt here.
