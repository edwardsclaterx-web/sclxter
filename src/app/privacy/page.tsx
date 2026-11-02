import { LegalNotice, LegalShell } from "@/components/legal-shell";

export const metadata = { title: "Privacy Policy — sclxter" };

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        sclxter (sclxter.com) is a website AI assistant for independent
        businesses. This policy explains what we collect, why we keep it, and
        who we share it with. Contact{" "}
        <a href="mailto:sclxter@outlook.com">sclxter@outlook.com</a>.
      </p>

      <h2>Who is responsible</h2>
      <p>
        For your account, billing, emails to us, and chats on sclxter.com,
        sclxter is the controller. For questions visitors ask on your own
        website through Ask anything, you are the controller and sclxter is
        the processor. That split is set out in the{" "}
        <a href="/dpa">Data Processing Addendum</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong className="font-medium text-fg">Accounts.</strong> Email,
          hashed password, when the account was created, and whether cover is
          current. Admin accounts also see shop names, join ids, and signup
          emails so support can work.
        </li>
        <li>
          <strong className="font-medium text-fg">Shop settings.</strong>{" "}
          Business name, public website URL, industry, contact details, tone,
          theme colours, notepad notes, and the embed id for Ask anything.
        </li>
        <li>
          <strong className="font-medium text-fg">Scans.</strong> When you run
          Scan website, we fetch public pages on the URL you saved and store
          extracted text in your notepad so the assistant can answer from your
          site.
        </li>
        <li>
          <strong className="font-medium text-fg">Chats.</strong> Messages
          visitors send to Ask anything on your site, Test AI on the
          dashboard, and Ask anything on sclxter.com. Owner support chat on
          Contact is between you and a person, not the AI.
        </li>
        <li>
          <strong className="font-medium text-fg">Billing.</strong> Whether
          setup is paid, remaining cover, and Stripe checkout references. We
          do not store full card numbers.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <p>
        To run your account, scan the site you authorise, answer visitor
        questions from your notes, take payment, and reply when you contact
        us. We do not sell your data. We do not use visitor chats to train a
        public model of our own.
      </p>
      <p>
        UK GDPR lawful bases we rely on: contract (providing the assistant
        you bought), legitimate interests (keeping the service secure and
        answering support), and consent where a visitor chooses to type a
        question. You remain responsible for telling visitors on your own
        site that an AI may answer them.
      </p>

      <h2>Who we share with</h2>
      <ul>
        <li>
          <strong className="font-medium text-fg">Stripe.</strong> Payments
          for setup and monthly cover. Stripe is a payment processor. Card
          details go to Stripe, not to our dashboard.
        </li>
        <li>
          <strong className="font-medium text-fg">Groq.</strong> The current
          model host. Visitor questions and the notes needed to answer them
          are sent so a reply can be generated. We do not put passwords,
          keys, or server secrets in those requests.
        </li>
      </ul>
      <p>
        Hosting for sclxter.com may also process data as a processor so the
        site can run. We only share what is needed for that job.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Account, notepad, and scan text stay while the account exists,
        including if cover lapses — lapsed shops keep data, and the live
        assistant on your website switches off until cover is current. If you
        want an account deleted, email{" "}
        <a href="mailto:sclxter@outlook.com">sclxter@outlook.com</a>. Chat
        logs are kept so you and support can see what was asked.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK GDPR you can ask for a copy of your personal data, a
        correction, deletion, restriction, or to object, and you can complain
        to the ICO (ico.org.uk). Email{" "}
        <a href="mailto:sclxter@outlook.com">sclxter@outlook.com</a>. We will
        need enough detail to find the right account.
      </p>

      <h2>Children</h2>
      <p>
        sclxter is sold to businesses. It is not aimed at children. Do not
        create an account for someone under 18.
      </p>

      <LegalNotice />
    </LegalShell>
  );
}
