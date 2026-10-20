# Moon sign social images

`public/og/moon-<sign>.png` (1200x630) are static, generated once. To regenerate after a copy or design change:

1. From the repo root, write the sign data next to the page:

   ```
   npx tsx -e "import('./src/lib/moonSignContent.ts').then(m=>require('fs').writeFileSync('scripts/og-moon-cards/data.json',JSON.stringify(Object.values(m.moonSignDeepDiveContent).map(d=>({sign:d.sign,symbol:d.symbol,element:d.element,archetype:d.archetype,headline:d.headline})))))"
   ```

2. Run `python scripts/og-moon-cards/server.py public/og`. It serves this folder on 127.0.0.1:8124 and saves uploaded PNGs into `public/og`.
3. Run it from `scripts/og-moon-cards`, then open `http://127.0.0.1:8124/og.html` in a browser. It renders each card and uploads it; the tab title becomes "done 12".
4. Stop the server, delete `data.json`, commit the PNGs.
