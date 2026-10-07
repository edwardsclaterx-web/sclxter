# SCLXTER

Embeddable site assistant for independent businesses. The owner scans public pages, types extra notes, and visitors ask in plain language. Answers come only from that shop’s pages and notes.

This first slice is a local app: email and password (no Stripe), a dashboard, a HTML scan, a Groq-backed test chat on the server, and a fictional UK barber shop at `/demo`.

The product UI and the barber demo share one look: black and white, Inter, quiet.

## Run

Needs Node 22+.

```bash
npm install
cp .env.example .env.local
# Put GROQ_API_KEY in .env.local. Never commit it. Never put it on a customer website.
npm run dev
```

App: [http://127.0.0.1:4731](http://127.0.0.1:4731)

- Landing `/`
- Sign up `/signup`
- Dashboard `/dashboard`
- Barber demo `/demo` (widget already on the page)

In this environment the server also reads `GROQ_API_KEY` from the private secrets file if `.env.local` is empty.

## Widget

From the dashboard, copy the snippet. The barber demo already loads:

```html
<script src="http://127.0.0.1:4731/embed.js" data-id="northgate" async></script>
```

Chat always runs on the SCLXTER server. The customer site only loads a small script and an iframe.

## Honest limits

Groq’s free key is for proving the product. Rate limits and outages happen. A paid model on an adult-owned account comes later, before live customer sites.
