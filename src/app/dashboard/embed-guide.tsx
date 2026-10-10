"use client";

import { Button } from "@/components/ui/button";

type Guide = {
  name: string;
  intro: string;
  steps: string[];
  check: string;
};

const TYPES: Guide[] = [
  {
    name: "Custom HTML",
    intro:
      "Use this if you (or your web person) can edit the HTML files or the shared footer that wraps every page.",
    steps: [
      "Copy the code in the box below. Take the whole line, including <script, data-id, and </script>. That data-id is this business only — do not swap it for another shop.",
      "Open the file that appears on every page. On most sites that is footer.html, a layout file, or the bottom of index.html.",
      "Scroll to the very bottom. Find the line that says </body>.",
      "Paste the code on a new line just above </body>. Do not put it in the <head>. Do not paste it twice.",
      "Save the file. If you use a host with a Publish or Deploy button (Netlify, GitHub Pages, an FTP upload), publish now so visitors get the new file.",
      "Open your live website in a new tab, using the public https address — not a file you opened from your computer.",
      "Look at the bottom of the page for the Ask anything button. Click it and ask a short question to confirm this shop’s assistant answers.",
    ],
    check:
      "If you do not see Ask anything: refresh the page (Ctrl+Shift+R or Cmd+Shift+R), check you pasted the whole tag, and confirm you are on the published site. Do not add a second copy of the code on the same page.",
  },
  {
    name: "WordPress",
    intro:
      "You need to be logged in as an administrator. The safest path is a header-and-footer plugin so a theme update does not wipe the code.",
    steps: [
      "Copy the code in the box below in one piece. The data-id belongs to this business.",
      "In WordPress, open Plugins → Add New. Search for “WPCode” or “Insert Headers and Footers”. Install and Activate one of those.",
      "Open the plugin. Look for a box labelled Footer, Body, or “scripts in footer”.",
      "Paste the code into that footer box. Save or Update.",
      "If you would rather edit the theme: Appearance → Theme File Editor → footer.php. Find </body> and paste the same code just above it, then click Update File. A plugin is safer.",
      "If you use Elementor, Divi, or another page builder that replaces the footer, open that builder’s Theme Builder / Footer / Custom code area and paste the same code there instead of footer.php.",
      "Clear cache if you use WP Rocket, LiteSpeed, Cloudflare, or a host cache button. Then log out of WordPress (or open a private window).",
      "Visit the public homepage. You should see Ask anything at the bottom. Click it and send a test question.",
    ],
    check:
      "If the button is missing, purge cache again and view the site logged out. After a theme update, open the plugin and confirm the code is still in the footer box.",
  },
  {
    name: "Squarespace",
    intro:
      "Code injection has to be on a Squarespace plan that includes it (Business and above on most sites). You need to be the site owner or an admin.",
    steps: [
      "Copy the code in the box below. Keep the data-id as it is — that is this business’s assistant.",
      "Log in to Squarespace and open this website.",
      "Click Settings (the gear). Open Developer tools, then Code injection. On some sites the path is Settings → Advanced → Code injection.",
      "Find the Footer box. Click in it and paste the code. Leave Header empty unless you already use it for something else.",
      "Click Save.",
      "Do not also paste the same code into a page’s code block. The Footer box already puts Ask anything on every page.",
      "Click the site title or the eye icon and choose the live website — not the editor canvas.",
      "On the live page, look at the bottom for Ask anything. Open it and ask a test question.",
    ],
    check:
      "If you cannot see Code injection, your plan does not include it — Squarespace will ask you to upgrade. After saving, hard-refresh the live URL. Turn off any setting that says it strips custom scripts.",
  },
  {
    name: "Wix",
    intro:
      "You need a Wix plan that allows Custom code, and you must Publish — the editor preview often hides the button.",
    steps: [
      "Copy the code in the box below, including the data-id for this business.",
      "Log in to Wix and open this site.",
      "Click Settings in the left menu. Open Custom code (sometimes under Advanced → Custom code).",
      "Click Add code. Name it Ask anything so you can find it later.",
      "Paste the code into the Code snippet box.",
      "Under Add Code to Pages, choose All pages. Under Place Code in, choose Body — end.",
      "Click Apply, then click Publish at the top right. Wait until Wix says the site is published.",
      "Open the published web address (your real domain or the wixsite.com link) in a new tab. Do not judge it from the editor.",
      "Look at the bottom of the page for Ask anything. Click it and send a test question.",
    ],
    check:
      "If Custom code is missing, your plan does not include it. If you use a cookie banner, allow this script or new visitors will not see the button. Do not put the code in a single HTML box on one page — use site-wide Custom code.",
  },
  {
    name: "Shopify",
    intro:
      "You need to be a store owner or staff member who can edit the theme. Checkout pages will not show Ask anything — that is normal.",
    steps: [
      "Copy the code in the box below. The data-id is this business’s assistant.",
      "In Shopify admin, go to Online Store → Themes.",
      "On the theme that is live, click the three dots (or Customize’s neighbour) and choose Edit code. If you want a safety net, first click Duplicate, then edit the copy.",
      "In the left file list open layout, then theme.liquid.",
      "Scroll to the bottom of the file. Find </body>.",
      "Paste the code on a new line just above </body>. Click Save.",
      "If you edited a duplicate, go back to Themes and click Publish on that theme when you are happy.",
      "Open your shop’s public web address (not the admin). Look at the bottom of the homepage for Ask anything. Click it and ask a test question.",
    ],
    check:
      "If the button is missing, confirm you saved theme.liquid and you are viewing the published theme. After a theme or app update, open theme.liquid again and check the code is still above </body>. The Shopify checkout will not show the button.",
  },
  {
    name: "Webflow",
    intro:
      "Custom code needs a paid Webflow site plan. The Designer canvas usually will not show Ask anything until you publish.",
    steps: [
      "Copy the code in the box below, including this business’s data-id.",
      "Open the site in Webflow.",
      "Click the W menu or the site name, then Site settings (not page settings).",
      "Open the Custom code tab.",
      "Paste the code into the Footer code box (sometimes labelled “Before </body> tag”).",
      "Click Save changes.",
      "Go back to the Designer and click Publish. Tick your webflow.io domain and any custom domain, then Publish.",
      "Open the published URL in a new tab. Look at the bottom for Ask anything. Click it and send a test question.",
    ],
    check:
      "Starter / free hosting will not run this code. If you already pasted it in Footer code, do not also add it on a single page’s custom code or you will get two buttons. After a cookie-banner change, allow this script.",
  },
  {
    name: "Google Sites",
    intro:
      "Google Sites has no site-wide footer script. You add the same code to each page where you want Ask anything.",
    steps: [
      "Copy the code in the box below. Use this exact tag — the data-id is this business.",
      "Open your Google Site and click the page you want visitors to use.",
      "Click Insert on the right, then Embed, then the Embed code tab.",
      "Paste the code and click Next, then Insert. Drag the embed box if you need to, but you can leave it near the bottom of the page.",
      "Click Publish (or Republish) at the top right. Confirm Publish.",
      "Click the published link (or Visit). That is the public URL, not the editor.",
      "Scroll the live page. You should see Ask anything. Click it and ask a test question.",
      "Repeat Insert → Embed → Embed code on any other page that should show the assistant. Use the same code each time.",
    ],
    check:
      "Some Google Workspace schools and companies block embeds. If the box is empty on the live site, ask the admin to allow embeds. After you change the code, republish every page you added it to.",
  },
  {
    name: "Framer",
    intro:
      "Custom code has to be on a Framer site plan that includes it. The canvas preview often hides the button until you publish.",
    steps: [
      "Copy the code in the box below. Keep this business’s data-id.",
      "Open the Framer project for this website.",
      "Click the Site settings gear (or the project name → Site settings).",
      "Open General, then scroll to Custom code.",
      "Paste the code into End of <body>. Do not use a Code component on a single frame if you want it on every page.",
      "Close settings. Click Publish (or Update if the site is already live).",
      "Wait until Framer finishes publishing. Open the published domain in a new tab.",
      "Look at the bottom of the page for Ask anything. Click it and send a test question.",
    ],
    check:
      "If End of <body> is locked, your plan does not include custom code. After publishing, hard-refresh so you are not seeing an old build. Do not paste the code twice.",
  },
];

function SnippetBox({ snippet }: { snippet: string }) {
  return (
    <div className="space-y-2">
      <pre className="overflow-x-auto border border-line bg-surface p-3 text-xs leading-6 text-fg">
        {snippet}
      </pre>
      <Button
        type="button"
        variant="ghost"
        onClick={() => void navigator.clipboard.writeText(snippet)}
      >
        Copy this code
      </Button>
    </div>
  );
}

export function EmbedGuide({ snippet }: { snippet: string }) {
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
          <div className="space-y-4 px-4 pb-6 text-sm leading-6 text-muted">
            <p>{t.intro}</p>
            <SnippetBox snippet={snippet} />
            <ol className="list-decimal space-y-3 pl-5 text-fg">
              {t.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p>{t.check}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
