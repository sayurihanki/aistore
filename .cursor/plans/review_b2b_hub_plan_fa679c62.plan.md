---
name: Review B2B Hub Plan
overview: Assessment of the proposed Green-Themed B2B My Account Hub plan, identifying strengths and areas for improvement based on codebase analysis.
todos: []
isProject: false
---

# Review: Green-Themed B2B My Account Hub Plan

## What Is Good

### 1. Strong precedent alignment with `live-block`

The plan correctly identifies the `live-block` pattern as the architectural template. The existing [live-block.js](blocks/live-block/live-block.js) already demonstrates `safeRequest`, parallel API fetching via `Promise.all`, `readBlockConfig`-based authoring, and `events.on('authenticated')` refresh hooks. The hub block can follow this pattern almost line-for-line, which de-risks the implementation significantly.

### 2. All listed APIs actually exist

Every API function listed in step 1 (`getCustomer`, `getOrderHistoryList`, `getCompany`, `getCompanyCredit`, `getCompanyUsers`, `getCompanyRoles`, `negotiableQuotes`, `getQuoteTemplates`, `getRequisitionLists`) is confirmed to exist in the corresponding drop-in packages. The initializers for all of them are already in `scripts/initializers/`.

### 3. Correct decision to keep `commerce-account-nav` over `commerce-account-sidebar`

The nav block at [commerce-account-nav.js](blocks/commerce-account-nav/commerce-account-nav.js) is the one used in Cypress tests (the `.commerce-account-nav__item__title` selector is referenced in `verifyB2BQuoteToOrderPlacement.spec.js`). Keeping it avoids breaking existing test infrastructure. The sidebar block is a separate, parallel implementation that could cause confusion.

### 4. Correct identification of CSS gaps

The analysis of which B2B module CSS files need work is accurate:

- **Empty (need full styling):** `commerce-company-users.css`, `commerce-company-credit.css`, `commerce-b2b-requisition-list.css`, `commerce-b2b-requisition-list-view.css`
- **Minimal (need expansion):** `commerce-company-roles-permissions.css`
- **Already styled:** `commerce-company-structure.css` (minor tweaks only)

### 5. Route preservation is the right call

Not changing `/customer/`* route contracts is essential. The hub is additive composition on `/customer/account`, not a replacement of module pages.

### 6. Permission-aware navigation with `false` handling

The plan correctly identifies the existing permission model: `permissions[key] === false` means explicitly disabled (hidden even for admins), while `!permissions[key]` means not granted. Preserving this is critical.

### 7. `minified-view` support is confirmed

Both `commerce-orders-list` and `commerce-addresses` already support `minified-view: true` via `readBlockConfig`. This config key is already wired to the drop-in renderers.

---

## What Could Improve

### 1. Missing: Performance budget for 9 parallel API calls

The hub block proposes fetching from 5 different drop-in packages (`account`, `company-management`, `quote-management`, `requisition-list`, `purchase-order`) with 9+ API calls. The existing `live-block` only makes 5 calls from 3 packages. Each initializer triggers a separate JS bundle load plus GraphQL request.

**Recommendation:** Add a loading strategy to the plan:

- Tier the calls: fetch `getCustomer` + `getCompany` + `getOrderHistoryList` eagerly (above-the-fold summary cards), then lazy-load `getCompanyUsers`, `getCompanyRoles`, `negotiableQuotes`, `getQuoteTemplates`, `getRequisitionLists` after first paint.
- Consider a `show-module-cards` config that defaults to `false` so the heavy B2B calls are opt-in.
- Set explicit `pageSize` limits (e.g., `pageSize: 1`) for count-only queries to minimize payload.

### 2. Missing: Feature-flag gating before API calls

Not all tenants have all B2B features enabled. The plan mentions permission-aware *rendering* but not permission-aware *fetching*. Calling `getCompanyCredit()` or `negotiableQuotes()` on a tenant without those features will produce GraphQL errors (not just empty results).

**Recommendation:** Before each API group, check the relevant feature flag:

- `companyEnabled()` before company APIs (already used in `commerce-b2b-negotiable-quote.js`)
- Check `is_requisition_list_active` before requisition list API
- Check `Magento_NegotiableQuote` permission before quote APIs
- Wrap each group in `safeRequest` *and* skip the call entirely when the feature is disabled.

### 3. Missing: `_commerce-account-hub.json` model file

The plan mentions a new authorable block interface (config keys: `title`, `rows-limit`, `show-orders`, etc.) but does not mention creating a `_commerce-account-hub.json` DA model file. No existing commerce blocks have model files, but the plan's config surface is complex enough to warrant one for DA authoring.

**Recommendation:** Either:

- Create `blocks/commerce-account-hub/_commerce-account-hub.json` with field definitions matching the config keys, OR
- Explicitly state that config will be table-based only (like `live-block`) and skip the model file.

### 4. Multi-permission nav logic needs specification

Step 3 says the nav should support "newline/comma-separated ACL IDs" with OR semantics. The current code in [commerce-account-nav.js](blocks/commerce-account-nav/commerce-account-nav.js) reads a single permission string (line 38). The plan should specify the exact parsing logic.

**Recommendation:** Add pseudocode to the plan:

```javascript
const permissionRaw = /* read from DOM */;
const permissionKeys = permissionRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
const hasPermission = permissionKeys.length === 0
  || permissionKeys.includes('all')
  || permissionKeys.some(key => permissions[key] === true);
const isExplicitlyDisabled = permissionKeys.some(key => permissions[key] === false);
```

Also clarify: does `false` on *any* key in the list hide the item, or only if *all* keys are `false`? The plan says OR semantics for showing, but does not specify the `false` override behavior for multi-key entries.

### 5. `ui-ux-portability-package` mirror is not addressed

Every block in `blocks/` is duplicated in `ui-ux-portability-package/blocks/`. The plan creates a new block and modifies CSS in 6+ files but does not mention syncing changes to the portability package.

**Recommendation:** Add a step: "Mirror all new/changed block files to `ui-ux-portability-package/blocks/`" or explicitly state the package will be synced separately.

### 6. CSS step 5 is underspecified

"Fill currently minimal B2B module CSS" for 6 blocks is a large styling task. The plan says "reusing the same visual system already used in customer/orders/company-profile blocks" but does not identify which reference CSS to follow.

**Recommendation:** Name the specific reference file. `commerce-company-profile.css` (4,912 bytes, already fully styled with green tokens) is the best template. The plan should say: "Use [commerce-company-profile.css](blocks/commerce-company-profile/commerce-company-profile.css) as the reference for container layout, card styling, typography tokens, and spacing."

### 7. DA content composition (step 6) is vague

Step 6 says "Update DA content composition" but this repo only provides block logic/styles -- DA content is authored externally at `content.da.live`. The plan should clarify whether this step means:

- Providing documentation/instructions for DA authors, OR
- Creating a template page in the repo, OR
- Something else entirely.

If it means authoring content in DA, that is outside the scope of code changes and should be a separate task.

### 8. Missing: Cleanup subscription on block removal

The `live-block` uses `DOMNodeRemoved` (deprecated) for cleanup. The new hub block should use a `MutationObserver` or `disconnectedCallback` pattern instead.

**Recommendation:** Use a `MutationObserver` on the block's parent to detect removal, or document that the block uses the same pattern as `live-block` with a note to modernize later.

### 9. Test cases are good but missing edge cases

The test scenarios cover the happy path well. Missing cases:

- **B2C-only tenant:** A user without any company association visits `/customer/account`. The hub should gracefully show only account/orders data, not empty company cards.
- **Partial B2B tenant:** Company enabled but negotiable quotes disabled. Hub should show company cards but hide quote cards.
- **Session expiry during hub load:** If auth expires mid-fetch, the refresh token pattern (from `live-block`) should handle this, but it should be tested.

### 10. Security: innerHTML usage in render functions

The `live-block` uses `innerHTML` with template literals containing data values (e.g., `config.title`, `activity.label`). If the hub block follows this pattern, it must ensure all values inserted via `innerHTML` are escaped. The plan should note that `textContent` or DOM creation should be preferred over `innerHTML` for any user-derived or API-derived data.

---

## Summary Assessment


| Aspect              | Rating     | Notes                                              |
| ------------------- | ---------- | -------------------------------------------------- |
| Architecture        | Strong     | Follows proven `live-block` pattern                |
| API surface         | Strong     | All APIs confirmed available                       |
| Route safety        | Strong     | Preserves all existing URLs                        |
| Permission model    | Good       | Needs multi-key `false` semantics clarified        |
| Performance         | Needs work | 9 parallel calls need tiered loading               |
| Feature gating      | Needs work | Must check feature flags before API calls          |
| CSS scope           | Needs work | 4 blocks need full styling; reference not named    |
| DA composition      | Needs work | Unclear if in-repo or external authoring           |
| Portability package | Missing    | No mention of `ui-ux-portability-package` sync     |
| Security            | Needs note | Prefer `textContent` over `innerHTML` for API data |


