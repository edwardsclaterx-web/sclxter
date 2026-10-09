const TYPES: { name: string; steps: string[]; extra: string }[] = [
  {
    name: "Custom HTML",
    steps: [
      "Copy the snippet above in one piece, including the data-id attribute.",
      "Open the layout or footer file that wraps every page.",
      "Paste the snippet just before the closing </body> tag so the assistant loads on all pages.",
      "Save, deploy, then open a published URL — not a file:// preview.",
    ],
    extra:
      "If Ask anything does not show: hard-refresh, confirm the script tag was not split by the editor, and check the browser console for a blocked request to this host. Pages served through a strict CSP need this host allowed for script-src. Do not paste the snippet twice on the same page.",
  },
  {
    name: "WordPress",
    steps: [
      "In wp-admin go to Appearance → Theme File Editor and open footer.php, or use a header/footer scripts plugin if you do not want to edit the theme.",
      "Paste the snippet just before </body> in footer.php, or in the plugin’s footer / scripts box.",
      "Update the file or save the plugin.",
      "View the live site while logged out so a cache plugin is not hiding the bar.",
    ],
    extra:
      "A child theme or a scripts plugin survives theme updates; footer.php in a parent theme often does not. Purge WP Rocket, Cloudflare, or similar after pasting. If a page builder replaces the theme footer, put the snippet in that builder’s footer or custom-code slot instead.",
  },
  {
    name: "Squarespace",
    steps: [
      "Open Settings → Developer tools → Code injection.",
      "Paste the snippet into the Footer box so it runs on every page.",
      "Save, then view the live site rather than the editor canvas.",
    ],
    extra:
      "Code injection needs a Squarespace plan that includes it. After pasting, turn off any setting that strips custom scripts. Injection is site-wide from that Footer box — do not paste the same snippet into individual page code blocks as well.",
  },
  {
    name: "Wix",
    steps: [
      "Go to Settings → Custom code → Add code.",
      "Name it Ask anything, load it on all pages, and choose Body — end.",
      "Paste the snippet, apply, then Publish. Preview is not enough — open the published URL.",
    ],
    extra:
      "Custom code is limited on some Wix plans. If you use a cookie banner, allow this script or new visitors will not see the button. Do not drop the snippet into a single HTML embed on one page; use site-wide custom code.",
  },
  {
    name: "Shopify",
    steps: [
      "Online Store → Themes → Edit code.",
      "Open layout/theme.liquid and paste the snippet just before </body>.",
      "Save. Preview the theme, then publish if this is the live theme.",
    ],
    extra:
      "Paste on an unpublished duplicate first if you want a safe check. After an app or theme update, confirm theme.liquid still has the snippet. Checkout pages do not use theme.liquid, so the assistant will not appear there — that is expected.",
  },
  {
    name: "Webflow",
    steps: [
      "Open Site settings → Custom code.",
      "Paste the snippet into Footer code so it loads on every published page.",
      "Save, then Publish to the live domain. Designer preview often hides custom code.",
    ],
    extra:
      "Custom code needs a paid Webflow site plan, not the free Starter plan. If you use a cookie/consent banner, allow this script. Do not add the same snippet on a single page’s custom code if it is already in Footer code, or Ask anything will appear twice.",
  },
  {
    name: "Google Sites",
    steps: [
      "Google Sites does not let you paste a raw footer script on every page the way a normal host does.",
      "On each page where you want Ask anything, Insert → Embed → Embed code, and paste the snippet.",
      "Publish the site, then open the public URL (not the Sites editor).",
    ],
    extra:
      "The embed is per page — copy it onto any other page that should show the assistant. Some Google Workspace policies block third-party embeds; if the box stays empty, check that embeds are allowed for the site. After you change the snippet, republish.",
  },
  {
    name: "Framer",
    steps: [
      "In the Framer project open Site settings → General → Custom code.",
      "Paste the snippet into End of <body> so it runs on all pages.",
      "Publish (or update the live site). The canvas preview may not show the button until you open the published URL.",
    ],
    extra:
      "Custom code is available on Framer site plans that include it. If you only add a Code component on one frame, the assistant will not appear site-wide — use End of <body> instead. After publishing, hard-refresh in case the CDN is still serving the previous build.",
  },
];

export function EmbedGuide() {
  return (
    <div className="mt-6 divide-y divide-line border border-line">
      {TYPES.map((t) => (
        <details key={t.name} className="group bg-bg">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-fg marker:content-none [&::-webkit-details-marker]:hidden">
            <span>{t.name}</span>
            <span
              aria-hidden
              className="text-xs leading-none text-muted transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="space-y-3 px-4 pb-5 text-sm leading-6 text-muted">
            <ol className="list-decimal space-y-2 pl-5">
              {t.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p>{t.extra}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
