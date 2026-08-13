# Likha — Marketplace/Shop Structure & Status

Snapshot of what's built for the Marketplace/Shop feature (buyer side + seller side), what's stubbed, and what's missing relative to `PROJECT_SPEC.md`. Last updated 2026-08-13 after a pass that fixed the top items from the original gap list (stock integrity, listing management, cart persistence, revenue accounting, creator shop tab, buyer cancellation).

---

## 1. How it's wired up

**Single screen, two modes.** [`app/(tabs)/shop.tsx`](app/(tabs)/shop.tsx) is one screen with a segmented control: **Browse** (buyer) vs **My Shop** (seller). There's no separate seller-mode tab/app — every user is both buyer and seller through the same screen depending on the toggle.

**Data model** ([`types/index.ts`](types/index.ts)): `Listing`, `CartLine`, `Order`/`OrderItem`, `CreatorOrder`, `DashboardStats`/`TopListing`, `Address`. Backed by Supabase tables via migrations `0006`–`0019`.

**State stores** (Zustand, in `store/`): `listing-store`, `cart-store` (now persisted), `order-store` (buyer), `dashboard-store` (seller analytics + order fulfillment).

**Delivery for physical items is intentionally out-of-app.** There's no courier/shipping integration and none is planned as a near-term gap — coordination (drop-off point, courier booking, handoff timing) happens over the existing chat feature. Both the buyer's order detail screen and the seller's order detail screen now surface a **"Contact Seller" / "Contact Buyer"** button whenever an order has physical items, which opens (or creates) a direct conversation with the other party.

---

## 2. Buyer side

| Flow | Screen(s) | Status |
|---|---|---|
| Browse/discover listings | `shop.tsx` (Browse mode) via [`ListingGrid`](components/ListingGrid.tsx) | ✅ Search by title/tags, filter by product type and category. Only **active** listings appear (deactivated ones are invisible to buyers). |
| Listing detail | [`app/listing/[id].tsx`](app/listing/[id].tsx) | ✅ Image carousel, price, creator link, description, tags, stock/instant-download messaging, linked portfolio project, quantity stepper, Add to Cart / Buy Now. |
| Cart | [`app/cart.tsx`](app/cart.tsx), [`store/cart-store.ts`](store/cart-store.ts) | ✅ **Now persisted** via `zustand/persist` + `@react-native-async-storage/async-storage` — survives app restarts. |
| Checkout | [`app/checkout.tsx`](app/checkout.tsx) | ✅ Shipping address (physical items only), GCash/Card selection, manual proof-of-payment upload, order summary, place order. Order placement is now a single atomic Postgres RPC (`place_order`) instead of two separate inserts, so a failed item insert (e.g. insufficient stock) can no longer leave an orphaned empty order behind. |
| Order history | [`app/orders.tsx`](app/orders.tsx) | ✅ List of buyer's own orders with status, total, kind. |
| Order detail | [`app/order/[id].tsx`](app/order/[id].tsx) | ✅ Status timeline, itemized breakdown, shipping address, payment verification status, digital re-download (gated to `delivered`). **New:** buyer can **cancel** an order while it's still `processing`, and a **Contact Seller** button appears for physical-item orders. |

**Remaining buyer-side gaps:**
- No reviews/ratings anywhere (spec explicitly deferred this).
- No wishlist/saved listings, no "Shop the look" tagging inside portfolio projects.
- No real payment gateway — GCash/Card are labels only; payment happens off-app and is verified by the seller from an uploaded screenshot.
- Cart persistence is device-local, not per-account — switching accounts on the same device currently shares one cart. Acceptable for now; would need a per-user storage key if that becomes a real scenario.

---

## 3. Seller side (My Shop)

| Flow | Screen(s) | Status |
|---|---|---|
| **Listings** *(new tab)* | `shop.tsx` → My Shop → **Listings** | ✅ Full list of the seller's own listings (active + inactive), price, stock, product type, and a tap-to-toggle **Active/Inactive** pill. Tapping a row opens the edit screen. |
| Create listing | [`app/listing/new.tsx`](app/listing/new.tsx) + [`ListingForm`](components/ListingForm.tsx) | ✅ Unchanged: title, description, price, product type, category, photos, stock or digital file, optional linked project. |
| **Edit / deactivate / delete listing** *(new)* | [`app/listing/[id]/edit.tsx`](app/listing/[id]/edit.tsx) | ✅ Reuses `ListingForm` (product type locked after publish — switching digital↔physical would break the category/file/stock constraints tied to it). Footer actions: **Deactivate/Reactivate** (soft toggle via `is_active`, listing stays owner-visible but disappears from Browse/public shop) and **Delete** (hard delete, confirmed — past orders keep their item snapshot regardless). An Edit button also appears directly on the listing detail screen for the owner. |
| Analytics dashboard | `shop.tsx` → My Shop → Analytics | ✅ Now split into **Confirmed revenue** vs **Pending verification** (previously a single "Revenue" figure counted unverified — and even rejected — orders). Rejected orders are now excluded from all dashboard totals, matching how cancelled orders were already excluded. Top-5 listings are ranked off *confirmed* sales only, so a burst of unverified orders can't distort what's actually selling. |
| Order fulfillment | `shop.tsx` → My Shop → Orders, + [`app/creator-order/[id].tsx`](app/creator-order/[id].tsx) | ✅ Advance status, reject (while `processing`), verify payment (required before advancing). **New:** Contact Buyer button for physical-item orders. |

**Remaining seller-side gaps:**
- No per-listing analytics (only aggregate + top-5 revenue ranking).
- No shipping/courier integration — by design (see §1); shipping fee is still a flat ₱80 constant (`SHIPPING_FEE` in `checkout.tsx`), not seller-configurable.
- No digital file versioning (re-uploading a file in the edit screen replaces it outright, no history).
- No commission/custom-work requests (spec §3) — out of scope so far.
- Orders spanning listings from *multiple* different sellers share one `orders.status` field — if that scenario is ever common (today's UI doesn't prevent a mixed-seller cart), fulfillment status would need to move to a per-seller granularity. Not addressed in this pass; flagging since it's a schema-level assumption worth knowing about.

---

## 4. Data integrity fixes (this pass)

1. **Stock oversell prevented, not just floored.** The `0008` stock-decrement trigger used to clamp at zero (`greatest(stock - qty, 0)`), silently allowing oversells under concurrent purchases. It now raises an exception when stock would go negative, aborting the insert.
2. **Order placement is atomic.** `placeOrder()` used to run two separate client-side inserts (`orders`, then `order_items`); a failure on the second call (e.g. the stock check above) left a real order row with zero items. Placement now goes through a single `place_order` Postgres function — either the whole order lands or none of it does.
3. **Stock restores on cancel/reject.** A new trigger (`0017`) puts reserved units back into inventory when an order transitions to `cancelled` or `rejected`, so a rejected/cancelled order no longer permanently locks up stock.
4. **Sellers can't buy their own listings.** Enforced at three layers (`0020`): the listing detail screen hides Add to Cart/Buy Now for the owner and shows a note instead; `cart-store.addItem` refuses to add a listing the signed-in user created (and the cart screen self-heals any such line left over from before this fix); `place_order` rejects the purchase server-side even if a client bypasses the UI entirely.

---

## 5. Payments & trust (deliberately stubbed)

Per `PROJECT_SPEC.md` §5, there is no real payment gateway integration. The flow is unchanged from before this pass:
1. Buyer picks GCash or Card as a label only, pays manually outside the app, and uploads a screenshot as proof.
2. Seller reviews the image and taps "Verify payment" before advancing fulfillment.
3. Digital file download unlocks once the order reaches `delivered`.

Revenue accounting (§3 above) now reflects this honestly — pending/unverified money is shown separately from confirmed revenue instead of being blended together.

---

## 6. What's next (not yet started)

Everything still deferred per the spec: reviews, commissions/escrow, real payment gateway, wishlists, "shop the look" tagging inside projects, per-listing analytics, digital file versioning, and (if it turns out to matter) per-seller order status for mixed-seller carts.
