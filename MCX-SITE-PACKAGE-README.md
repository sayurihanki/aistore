# MCX Homepage Site Package

This archive contains everything needed to run the MCX (Marine Corps Exchange) homepage experience at http://localhost:3000/.

## What's Included

- **index.html** – Entry point; loads the homepage shell
- **drafts/** – Main content (`index.plain.html`) with all homepage blocks
- **fragments/** – Header (mcx-nav) and footer (mcx-footer) fragments
- **blocks/** – All MCX blocks (hero, product cards, category grid, newsletter, etc.)
- **styles/** – MCX theme, fonts, and storefront styles
- **scripts/** – AEM/EDS runtime, commerce integration, and Adobe drop-ins
- **models/** – Component models and definitions
- **plugins/** – Experimentation and other plugins
- **tools/** – Build and verification scripts
- **fstab.yaml** – Content source configuration
- **package.json** – Dependencies and scripts

## How to Run

1. **Install dependencies**
   ```bash
   npm install
   ```
   This installs packages and runs `postinstall` to copy Adobe Commerce drop-ins into `scripts/__dropins__`.

2. **Start the local server**
   ```bash
   npm start
   ```
   Or: `aem up --html-folder .da`

3. **Open in browser**
   Navigate to http://localhost:3000/

## Site Structure

The homepage is composed of:

- **Shell**: Header (nav) + main content + footer
- **Content blocks**: mcx-announcement-bar, mcx-hero, mcx-ticker, mcx-benefits, mcx-category-grid, mcx-product-cards, mcx-deal-countdown, mcx-promo-strip, mcx-featured-collections, mcx-brands, mcx-editorial-cards, mcx-newsletter, mcx-footer

## Notes

- **node_modules** is not included; run `npm install` after extracting.
- **Content source**: `fstab.yaml` points to `https://content.da.live/sayurihanki/usmccsmymcx/` for live content. The local `drafts/` and `fragments/` folders provide the preview experience.
- **Adobe Commerce**: The site integrates with Adobe Commerce drop-ins (cart, checkout, PDP, etc.). Full commerce functionality requires a configured Adobe Commerce backend.

---
Generated for MCX Homepage Preview package.
