# Souq Al-Hiraf (سوق الحرف)

The online shop for Saudi crafts and local products: dates, coffee, incense, pottery, palm-frond baskets and Sadu weaving. Arabic first, with an English version. Built with Next.js 15 (App Router) and Material UI 6.

## Run it

```bash
npm install
npm run dev     # http://localhost:3004
npm run build
npm start       # production server on port 3004
```

`/` redirects to `/ar`. Use `/en` for English.

## Routes

| Route | What it is |
|---|---|
| `/[locale]` | Home: hero, categories, best sellers, promo |
| `/[locale]/products` | Catalog. Filters, sort, search and page all live in the URL (`category`, `min`, `max`, `instock`, `rating`, `sort`, `q`, `page`, `view`) |
| `/[locale]/products/[slug]` | Product page with variants, add to cart and mini cart |
| `/[locale]/gift-box` | Gift box builder: pick a box size, fill it with dates, coffee and incense, add a card and gift wrap |
| `/[locale]/cart` | Cart, coupon, totals |
| `/[locale]/checkout` | Three-step checkout (address, delivery, payment) |
| `/[locale]/checkout/failed` | Shown when the payment is declined |
| `/[locale]/orders/[id]` | Order confirmation |
| `/[locale]/orders/[id]/track` | Order tracking: timeline, courier, ETA. Refreshes itself every 20 seconds until delivered |
| `/[locale]/about`, `/shipping`, `/contact` | Content pages (the contact page has a form) |
| `/[locale]/admin/orders`, `/admin/orders/[id]` | Staff order list and detail with status updates |
| `/[locale]/admin/products` | Products with price and stock edited in place (Enter saves, Esc cancels), and a bulk "mark out of stock" |
| `/[locale]/admin/settings` | Shipping fee and free-shipping threshold, VAT number, open/closed switch, notification emails |
| `/[locale]/admin/roles` | Permissions matrix for the Owner, Manager, Packer and Support roles |
| `/api/cart` | JSON of the current cart (`count`, `subtotal`, `lines`) |
| `/api/orders/[id]/tracking` | JSON of one order's tracking steps, courier and ETA |

The admin area has its own layout (side menu, slim top bar) and no shop header or footer.

**There is no sign-in on `/admin`.** It is a staff intranet build, so keep it off the public internet.

## Test cards

Use any 16 digits, any future expiry (`MM/YY`) and any 3-digit CVV.

| Card number ends with | Result |
|---|---|
| `0002` | Payment declined, goes to `/checkout/failed` |
| `0003` | Gateway error, the checkout error page shows |
| anything else | Order is created |

Cash on delivery and Apple Pay skip the card fields.

## Coupons

| Code | Effect |
|---|---|
| `WELCOME10` | 10% off, orders of 100 SAR or more |
| `FREESHIP` | Free shipping |
| `EXPIRED5` | Expired (shows the expired message) |

Shipping is 25 SAR and free over 300 SAR (both can be changed in the admin settings). Express delivery adds 35 SAR, cash on delivery adds 10 SAR. Prices include 15% VAT, and totals show the VAT part.

## Where things live

- Strings: `lib/dictionaries/ar.json` and `en.json` (same keys). `getDictionary(locale)` loads them on the server and pages pass them to client components as props.
- Products, categories, reviews: `data/*.json`. Product images are the placeholders in `public/products/`.
- Carts and orders: `lib/store.ts`, kept in memory. Restarting the server clears carts and re-creates the 14 sample orders. Order `HR-1004` is in transit and moves one tracking step every 2 minutes.
- Settings and roles: `lib/settings.ts`, `lib/roles.ts`, also in memory. Price and stock edits in the admin change the product records in memory and last until the server restarts.
- Server actions: `lib/actions.ts`. Prices and coupons: `lib/pricing.ts`, `lib/fees.ts`.

## Notes

- UI: Material UI 6 with emotion. Right-to-left layout comes from `stylis-plugin-rtl` and the theme `direction`; see `components/ThemeRegistry.tsx`.
- CSP: `middleware.ts` sends a strict `Content-Security-Policy` with a per-request nonce (also used by the emotion cache). Add new inline scripts or styles through that nonce. Only style attributes are allowed without it (`style-src-attr`), because next/image and Material UI write them.
- Fonts: the system font stack. There is no web font download.
