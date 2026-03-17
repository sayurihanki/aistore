# Category Pages Troubleshooting Runbook

## Purpose

This runbook documents exactly how to diagnose and fix category pages that load but show:

- `Your search returned no results.`

in this project.

It is written for the specific stack used here:

- AEM Edge Delivery site pages (`*.aem.live`)
- Product List Page block (`blocks/product-list-page`)
- Adobe Commerce Catalog Service `productSearch`
- Config loaded from `/config.json` and cached in browser `sessionStorage`

---

## Quick Symptom Matrix

Use this table to identify the likely root cause quickly.

| Symptom | Likely Cause | Section |
| --- | --- | --- |
| Category page URL is `404` | Page not published / path mismatch | Step 2 |
| Page is `200` but no products for all category pages | Wrong store/store-view headers in config | Step 4 |
| API returns products but page still empty | Block `urlPath` mismatch on content page | Step 3 |
| Works in one browser, fails in another | Stale `sessionStorage.config` cache | Step 6 |
| Some categories work, others do not | Category indexing/assignment mismatch | Step 5 |

---

## Known Good Baseline (Bodea setup)

These are the expected Commerce scope values for this repo:

- Website code: `base`
- Store code: `bodea`
- Store view code: `bodeab2b`
- Store header: `Store: bodeab2b`
- Picker root category: `5` (Bodea)

Expected category page paths:

- `/server-racks`
- `/network-enclosures`
- `/power-cooling`
- `/cable-management`
- `/accessories`

Optional root page:

- `/bodea`

---

## Step 1: Confirm Site and Branch State

Run from repo root:

```bash
pwd
git status --short
```

Expected:

- You are in `.../jenhankib2bbodea`
- No unexpected local changes that could explain behavior

---

## Step 2: Confirm Category Page URLs Are Published

```bash
for p in server-racks network-enclosures power-cooling cable-management accessories bodea; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://main--jenhankib2bbodea--sayurihanki.aem.live/$p")
  echo "$p $code"
done
```

Expected:

- Category pages should be `200`
- If a page is `404`, publish/create that page first before deeper debugging

---

## Step 3: Validate Product List Page Block Config (`urlPath`)

For each page, inspect plain HTML:

```bash
curl -sL https://main--jenhankib2bbodea--sayurihanki.aem.live/server-racks.plain.html | sed -n '1,120p'
```

Check that each page contains:

- `<div class="product-list-page">`
- config row `urlPath` with value exactly matching Commerce `url_key`

Example expected:

```html
<div class="product-list-page">
  <div>
    <div>urlPath</div>
    <div>server-racks</div>
  </div>
</div>
```

Important:

- `urlPath` is compared against `categoryPath` filter value
- It must be the category key (for example `network-enclosures`), not a label or numeric ID

---

## Step 4: Validate Active Config in Repo and Live

### 4.1 Local file

```bash
cat config.json
```

Expected fields under `public.default`:

- `headers.all.Store = "bodeab2b"`
- `headers.cs.Magento-Store-Code = "bodea"`
- `headers.cs.Magento-Store-View-Code = "bodeab2b"`
- `headers.cs.Magento-Website-Code = "base"`
- `plugins.picker.rootCategory = "5"`

### 4.2 Live file served by site

```bash
curl -sL https://main--jenhankib2bbodea--sayurihanki.aem.live/config.json | jq '.'
```

Expected:

- Same values as local config
- If live config differs from repo config, deploy/publish issue exists

---

## Step 5: Validate Catalog Service Responses Directly

This checks whether the store scope actually has indexed category data.

```bash
ENDPOINT="https://na1.api.commerce.adobe.com/R2BTcyPc7knfUJMozF1oQQ/graphql"
read -r -d '' Q <<'EOF'
query q($filter:[SearchClauseInput!]) {
  productSearch(phrase:"", page_size:1, current_page:1, filter:$filter) { total_count }
}
EOF

for p in server-racks network-enclosures power-cooling cable-management accessories; do
  VARS=$(jq -cn --arg p "$p" '{filter:[{attribute:"categoryPath",eq:$p},{attribute:"visibility",in:["Search","Catalog, Search"]}]}')
  CNT=$(curl -sS "$ENDPOINT" \
    -H 'Content-Type: application/json' \
    -H 'Store: bodeab2b' \
    -H 'Magento-Store-Code: bodea' \
    -H 'Magento-Store-View-Code: bodeab2b' \
    -H 'Magento-Website-Code: base' \
    --data "$(jq -cn --arg q "$Q" --argjson v "$VARS" '{query:$q,variables:$v}')" \
    | jq -r '.data.productSearch.total_count // .errors')
  echo "$p => $CNT"
done
```

Expected:

- Non-zero counts for categories with products (for this scenario, `12`)

Interpretation:

- If all are `0`: wrong scope, indexing gap, or wrong categoryPath values
- If API returns data but page still empty: client-side caching/config issue or content mismatch

---

## Step 6: Eliminate Browser Config Cache Issues

This app caches config in browser `sessionStorage` key `config`.
If store headers changed recently, users may continue using old scope until cache expiry.

### Browser-level reset

1. Open DevTools.
2. Go to `Application` tab.
3. Open `Session Storage` for the site origin.
4. Delete key `config`.
5. Hard refresh page (`Cmd+Shift+R` on macOS).

### Why this matters

- Old cached config can keep old headers (`default`, `main_website_store`) even after live config file is fixed.

---

## Step 7: Validate Header Navigation Behavior

This confirms UI links align with expected category pages.

File:

- `blocks/header/header.js`

Expected `CATALOG_CATEGORIES`:

- `Bodea`
- `Server Racks`
- `Network Enclosures`
- `Power & Cooling`
- `Cable Management`
- `Accessories`

Fallback paths are generated from label text:

- `"Power & Cooling"` -> `/power-cooling`

If nav links are wrong:

- Check nav fragment content and whether existing links are being preserved over fallback links.

---

## Step 8: Validate Picker Root Category

File:

- `config.json`

Expected:

```json
"plugins": {
  "picker": {
    "rootCategory": "5"
  }
}
```

Notes:

- This affects authoring picker tree only.
- It does not directly change runtime category page filtering.

---

## Step 9: Run Static Checks After Any Changes

```bash
jq . config.json >/dev/null
jq . default-site.json >/dev/null
jq . demo-config.json >/dev/null
npm run lint
```

Expected:

- JSON parse passes
- Lint passes

---

## Step 10: End-to-End Acceptance Checklist

A fix is complete only if all are true:

- All expected category page URLs return `200`
- Each category page `.plain.html` has correct `urlPath`
- Live `/config.json` uses expected store/store-view headers
- Direct `productSearch` query returns non-zero per category path
- Browser with cleared session config shows products on category pages
- `npm run lint` passes

---

## Common Root Causes and Fixes

### Root Cause A: Wrong store headers in config

Fix:

- Update `config.json`:
  - `Store: bodeab2b`
  - `Magento-Store-Code: bodea`
  - `Magento-Store-View-Code: bodeab2b`
  - `Magento-Website-Code: base`

### Root Cause B: Category page exists but wrong `urlPath`

Fix:

- Update PLP block config to exact category key (for example `network-enclosures`).

### Root Cause C: Session cache stale

Fix:

- Clear `sessionStorage.config`
- Hard refresh

### Root Cause D: Missing page publish

Fix:

- Publish/create page path (for example `/network-enclosures` or `/bodea`).

### Root Cause E: Catalog index/store-view mismatch

Fix:

- Confirm Commerce store hierarchy and assignments for target store view
- Re-sync/reindex Commerce Catalog Service for the correct environment/store view

---

## Optional Fast Recheck Script

Use this after any fix:

```bash
for p in server-racks network-enclosures power-cooling cable-management accessories; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://main--jenhankib2bbodea--sayurihanki.aem.live/$p")
  echo "page $p http=$code"
done

ENDPOINT="https://na1.api.commerce.adobe.com/R2BTcyPc7knfUJMozF1oQQ/graphql"
read -r -d '' Q <<'EOF'
query q($filter:[SearchClauseInput!]) {
  productSearch(phrase:"", page_size:1, current_page:1, filter:$filter) { total_count }
}
EOF
for p in server-racks network-enclosures power-cooling cable-management accessories; do
  VARS=$(jq -cn --arg p "$p" '{filter:[{attribute:"categoryPath",eq:$p},{attribute:"visibility",in:["Search","Catalog, Search"]}]}')
  CNT=$(curl -sS "$ENDPOINT" \
    -H 'Content-Type: application/json' \
    -H 'Store: bodeab2b' \
    -H 'Magento-Store-Code: bodea' \
    -H 'Magento-Store-View-Code: bodeab2b' \
    -H 'Magento-Website-Code: base' \
    --data "$(jq -cn --arg q "$Q" --argjson v "$VARS" '{query:$q,variables:$v}')" \
    | jq -r '.data.productSearch.total_count // "err"')
  echo "api $p total_count=$CNT"
done
```

---

## Change History For This Incident

During this incident, the following classes of fixes were applied:

- Store scope moved from legacy default store to Bodea store view in config
- Header category list aligned to Bodea category family
- Template default root category aligned to Bodea (`5`)
- Runtime config cache handling hardened to avoid stale scope retention

