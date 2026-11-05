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

      <h2>Who we are</h2>
      <p>
        sclxter is run by David Sclater, a sole trader in the UK. Contact{" "}
        <a href="mailto:sclxter@outlook.com">sclxter@outlook.com</a> for
        anything about your data.
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
          <strong className="font-medium text-fg">Sign-in codes.</strong>{" "}
          6-digit sign-in codes are emailed through Resend and expire after a
          few minutes.
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
      <p>
        We use these processors, and only share what each needs for its job:
      </p>
      <ul>
        <li>
          <strong className="font-medium text-fg">Stripe.</strong> Payments
          for setup and monthly cover. Card details go to Stripe, not to our
          dashboard.
        </li>
        <li>
          <strong className="font-medium text-fg">Vercel.</strong> Hosting
          for sclxter.com.
        </li>
        <li>
          <strong className="font-medium text-fg">Upstash.</strong> The Redis
          database (provided through Vercel) that stores accounts, shop
          settings, notes, and chats.
        </li>
        <li>
          <strong className="font-medium text-fg">Groq.</strong> The current
          model host for AI replies. Visitor questions and the notes needed to
          answer them are sent so a reply can be generated. We do not put
          passwords, keys, or server secrets in those requests.
        </li>
        <li>
          <strong className="font-medium text-fg">Resend.</strong> Sends the
          sign-in code emails.
        </li>
      </ul>

      <h2>International transfers</h2>
      <p>
        Groq, Vercel, Upstash, and Resend may process data in the United
        States. Those transfers rely on the UK International Data Transfer
        Addendum, the UK Extension to the EU–US Data Privacy Framework, or
        equivalent safeguards.
      </p>

      <h2>Cookies and browser storage</h2>
      <ul>
        <li>
          <strong className="font-medium text-fg">sclxter_session.</strong> A
          strictly necessary cookie that keeps you signed in, for up to 30
          days or until you sign out.
        </li>
        <li>
          <strong className="font-medium text-fg">sclxter_otp.</strong> A
          strictly necessary cookie that links a sign-in code to your browser
          while you enter it. It lasts 10 minutes and is cleared once you are
          signed in.
        </li>
        <li>
          <strong className="font-medium text-fg">Session storage.</strong>{" "}
          The Ask anything widget keeps the current conversation, an unsent
          draft, and whether it is open in your browser&apos;s session
          storage, so a chat survives moving between pages. The site also
          remembers if you dismissed the renewal reminder and avoids reload
          loops after an update. Session storage is cleared when you close
          the tab.
        </li>
      </ul>
      <p>
        We do not use analytics or advertising cookies, so there is no cookie
        banner.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Account, notepad, scan text, and chat logs stay while the account
        exists, including if cover lapses, so you can pick up where you left
        off. If you ask us to delete an account, we delete its data within 30
        days of the request. Stripe keeps its own payment records for as long
        as the law requires (around 6 years for tax).
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK GDPR you can ask for a copy of your personal data, a
        correction, deletion, restriction, or to object, and you can complain
        to the ICO (ico.org.uk). Email{" "}
        <a href="mailto:sclxter@outlook.com">sclxter@outlook.com</a>. We will
        need enough detail to find the right account, and we reply within one
        month.
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
