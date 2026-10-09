const TYPES: { name: string; steps: string[]; extra: string }[] = [
  {
    name: "custom HTML",
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
];

export function EmbedGuide() {
  return (
    <div className="mt-6 divide-y divide-line border border-line">
      {TYPES.map((t) => (
        <details key={t.name} className="group bg-bg">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm text-fg marker:content-none [&::-webkit-details-marker]:hidden">
            {t.name}
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
