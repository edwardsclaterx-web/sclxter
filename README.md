# SCLXTER

Embeddable site assistant for independent businesses. The owner scans public pages, types extra notes, and visitors ask in plain language. Answers come only from that shop’s pages and notes.

This first slice is a local app: owner sign-in (one password, hashed on the server only), a dashboard, a HTML scan, a Groq-backed test chat on the server, and a fictional UK barber shop at `/demo`.

The product UI and the barber demo share one look: black and white, Inter, quiet.

## Run

Needs Node 22+.

```bash
npm install
cp .env.example .env.local
# Put GROQ_API_KEY in .env.local. Never commit it. Never put it on a customer website.
# Owner password: SCLXTER_PASSWORD — hashed on the server, never in git, HTML, or the browser.
# Stripe test keys: STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY — server only. Never commit them.
npm run dev
```

App: [http://127.0.0.1:4731](http://127.0.0.1:4731)

- Product homepage `/` (SCLXTER, one plan: £299.99 setup then £74.99/month)
- Sign up `/signup`
- Dashboard `/dashboard`
- Demo `/demo` — fictional Northgate Barbers (not the homepage)
- FAQ `/faq` and Contact `/contact` (`sclxter@outlook.com`)

In this environment the server also reads `GROQ_API_KEY` from the private secrets file if `.env.local` is empty.

On Vercel, shop data cannot live in a local JSON file. Set a KV store (`KV_REST_API_URL` and `KV_REST_API_TOKEN`) or a Blob store (`BLOB_READ_WRITE_TOKEN`) on the project. Never commit those values.

## Widget

From the dashboard, copy the snippet. The barber demo already loads:

```html
<script src="http://127.0.0.1:4731/embed.js" data-id="northgate" async></script>
```

Chat always runs on the SCLXTER server. The customer site only loads a small script and an iframe.

## Honest limits

Groq’s free key is for proving the product. Rate limits and outages happen. A paid model on an adult-owned account comes later, before live customer sites.
