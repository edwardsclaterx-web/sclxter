import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";

export const metadata = { title: "FAQ — sclxter" };

function Brand() {
  return <strong>sclxter</strong>;
}

const items: { q: ReactNode; a: ReactNode }[] = [
  {
    q: (
      <>
        What is <Brand />?
      </>
    ),
    a: (
      <>
        <Brand /> provides AI assistants for independent businesses. Your
        assistant can answer customer questions, explain your services, help
        visitors find what they need and turn website visitors into enquiries.
      </>
    ),
  },
  {
    q: (
      <>
        How does the <Brand /> AI assistant work?
      </>
    ),
    a: (
      <>
        <Brand /> connects to your business website and builds a knowledge base
        from your services, FAQs, contact information, opening hours and other
        relevant information. The AI then uses that information to respond to
        customers naturally.
      </>
    ),
  },
  {
    q: <>Does the AI understand my specific business?</>,
    a: (
      <>
        Yes. Each <Brand /> assistant is built around the individual business it
        represents. A barber, plumber, restaurant or estate agent can each have
        an assistant focused specifically on their services and customers.
      </>
    ),
  },
  {
    q: <>Do I need to manually enter all my business information?</>,
    a: (
      <>
        No. <Brand /> can scan your website and automatically extract relevant
        information to build your business knowledge base. You can then review
        and update the information where necessary.
      </>
    ),
  },
  {
    q: <>Can the AI answer questions that aren&apos;t in my FAQ?</>,
    a: (
      <>
        Yes. The assistant isn&apos;t limited to preset questions. It can
        understand natural-language questions and use your business knowledge to
        generate relevant responses.
      </>
    ),
  },
  {
    q: <>Will the AI make up information about my business?</>,
    a: (
      <>
        <Brand /> is designed to answer using the information available in your
        business knowledge base. If the required information isn&apos;t
        available, the assistant should say that rather than inventing an
        answer.
      </>
    ),
  },
  {
    q: <>Do I need to replace my existing website?</>,
    a: (
      <>
        No. <Brand /> is designed to work with your existing website. A small
        integration connects the assistant to your site without requiring you to
        rebuild it.
      </>
    ),
  },
  {
    q: (
      <>
        What types of businesses can use <Brand />?
      </>
    ),
    a: (
      <>
        <Brand /> is designed for independent businesses across a wide range of
        industries, including barbers, salons, tradespeople, restaurants, gyms,
        garages, estate agents and many others.
      </>
    ),
  },
];

export default async function FaqPage() {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 md:px-8 md:py-20">
        <h1 className="text-3xl font-medium tracking-tight">FAQ</h1>
        <dl className="mt-12 space-y-10">
          {items.map((item, i) => (
            <div key={i}>
              <dt className="font-bold leading-6">{item.q}</dt>
              <dd className="mt-3 font-normal leading-7 text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
