import { LegalNotice, LegalShell } from "@/components/legal-shell";

export const metadata = { title: "Refund & Cancellation Policy — sclxter" };

export default function RefundsPage() {
  return (
    <LegalShell title="Refund & Cancellation Policy">
      <p>
        sclxter is sold to businesses. This page explains how cancelling and
        refunds work. It sits alongside the{" "}
        <a href="/terms">Terms of Service</a>. Contact{" "}
        <a href="mailto:sclxter@outlook.com">sclxter@outlook.com</a>.
      </p>

      <h2>Setup fee (£299.99)</h2>
      <p>
        This pays for preparing your assistant: scanning your website,
        setting up your notes, and getting the widget ready. If you change
        your mind before setup has started, email us and we will refund the
        setup fee in full. Once setup is done, the setup fee is not
        refundable. If setup cannot be completed because of a problem on our
        side, we refund it in full.
      </p>

      <h2>Monthly cover (£74.99 a month)</h2>
      <p>
        You pay for cover in advance on Billing, 1 to 12 months at a time (a
        month is 30 days). Each payment is a one-off card payment through
        Stripe, not a rolling subscription: we do not keep your card for
        repeat charges, and nothing renews or is charged automatically.
      </p>

      <h2>How to cancel</h2>
      <p>
        There is nothing to switch off. To stop, just do not buy more months.
        Your cover runs to the end of the time you paid for, and then the
        dashboard and the assistant lock and the widget is hidden from your
        website. We do not refund part-used months.
      </p>

      <h2>Unused prepaid months</h2>
      <p>
        If you paid several months ahead and want to stop, email us. We will
        refund any whole months that have not started yet, minus Stripe&apos;s
        fee for those months.
      </p>

      <h2>If something goes wrong on our side</h2>
      <p>
        If sclxter is unavailable for a long stretch because of a fault on our
        side, tell us and we will extend your cover or refund the affected
        time.
      </p>

      <h2>Free codes</h2>
      <p>Free access codes have no cash value and cannot be refunded.</p>

      <h2>How refunds are paid</h2>
      <p>
        Refunds go back to the original card through Stripe, usually within
        5–10 working days.
      </p>

      <h2>Your data after you stop</h2>
      <p>
        Your account and notes are kept, and Billing stays open, so you can
        come back at any time. Email us if you want everything deleted.
      </p>

      <LegalNotice />
    </LegalShell>
  );
}
