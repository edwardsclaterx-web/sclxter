import { LegalNotice, LegalShell } from "@/components/legal-shell";

export const metadata = { title: "Data Processing Addendum — sclxter" };

export default function DpaPage() {
  return (
    <LegalShell title="Data Processing Addendum">
      <p>
        This short addendum sits with the{" "}
        <a href="/terms">Terms of Service</a>. It covers visitor chats and
        related content on your website when you use sclxter. Contact{" "}
        <a href="mailto:sclxter@outlook.com">sclxter@outlook.com</a>.
      </p>

      <h2>Roles</h2>
      <p>
        You (the business) are the controller of questions visitors ask on
        your site through Ask anything, and of the website text you ask us to
        scan. sclxter is the processor: we handle that content only to
        provide the assistant.
      </p>
      <p>
        sclxter is the controller of your login, billing, and messages you
        send on sclxter.com. That is described in the{" "}
        <a href="/privacy">Privacy Policy</a>, not here.
      </p>

      <h2>What we process</h2>
      <p>
        Visitor questions and answers; notepad and scan text you store so the
        assistant can reply; widget theme and public id needed to show Ask
        anything. You decide what goes on your public pages before a scan.
      </p>

      <h2>Instructions</h2>
      <p>
        We process that content to scan the URL you save, answer visitors,
        show Test AI on your dashboard, and keep the service working. We do
        not use it for other businesses. We do not sell it.
      </p>

      <h2>Sub-processors</h2>
      <p>
        Groq generates AI replies from the question and the notes we send.
        Stripe takes payment for your account (your billing data, not visitor
        chats). Hosting for sclxter.com stores the records the product needs.
      </p>

      <h2>Security and deletion</h2>
      <p>
        Access is behind signed-in accounts. Passwords are stored hashed.
        Secrets stay on the server. If you ask us to delete a shop, we will
        remove the stored account and notepad we hold for it, except records
        the law says we must keep (for example payment evidence).
      </p>

      <h2>Your duties</h2>
      <p>
        Only scan a site you are allowed to scan. Tell visitors, if UK law
        requires it, that an AI on your site may answer them. Do not put
        special category data in the notepad unless you have a lawful reason.
      </p>

      <p>English law and the courts of England and Wales.</p>

      <LegalNotice />
    </LegalShell>
  );
}
