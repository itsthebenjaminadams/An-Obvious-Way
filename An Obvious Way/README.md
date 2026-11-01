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

**Important:** The contact form is a visual prototype and does not send real messages until you connect it to a form handling service. Do not add passwords, tokens, or API keys to this repository.
