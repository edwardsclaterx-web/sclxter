/** Public copy scanned from kbarbers.co.uk for this preview assistant only. */

export const KBARBERS_SCAN_NOTES: Array<{
  title: string;
  url: string;
  body: string;
}> = [
  {
    title: "Homepage",
    url: "https://www.kbarbers.co.uk/",
    body: `K Barbers Emporium, Billericay. World-class men's barbering. Tagline: ‘The K Way - often imitated... never mistaken’. Follow @kbarbersemporium.
Phone 01277 652272. Email info@kbarbers.co.uk. Address 129 High Street, Billericay, Essex CM12 9AH.
Barber hours (as listed on the homepage): Monday–Friday 8.30am–7.00pm; Saturday 7.30am–5.00pm; Sunday closed.
Koffee Club hours listed on the same homepage footer: Monday–Friday 9.00am–4.00pm; Saturday 8.00am–4.30pm; Sunday closed. A second footer block lists Koffee Club Monday–Friday 8.30am–5.30pm with the same Saturday and Sunday.
This preview does not take bookings and is not the live shop website. Get the assistant for a real site at https://sclxter.com/buy`
  },
  {
    title: "About",
    url: "https://www.kbarbers.co.uk/about-us/",
    body: `Opened in Leigh-on-Sea in 2007. Second, larger superstore in Billericay in 2017; Leigh store moved across in 2020. Unique K reception team. About 18 years on. Founder Kevin Vorley MCSRSB — Director and Professional Master Craftsman.
Mission: ‘The K Barbers Emporium is all about you the customer.’ Aim: unique individual experience and a 21st century barbershop with a difference. #theKway — Quality, Consistency and Continuity. ‘It pays to look and feel good. Good grooming is our business…’
Services described: classic styling haircuts, classic clean shaves, beard trims, Directors Lounge / Directors chair one-to-one with founder Kevin Vorley. Site said prices are reviewed every 4 months (note dated 19 February 2026) but did not list pound amounts on the scanned pages — do not invent prices; say they book online and to check the live site or call.`,
  },
  {
    title: "Billericay superstore",
    url: "https://www.kbarbers.co.uk/k-barbers-emporium-billericay/",
    body: `Barbering the K Way. Multi-award-winning barbershop, 18 years; 13 years at Leigh-on-Sea (2007–2019) and now the Billericay supershop (from 2017). It's all about #theKway! Quality, Consistency and Continuity.
Team on that page: Kevin (British Grand Master Barber and global educator), James, Daniel and Chloe — senior through junior. Mixed male and female, all fully employed (not chair renters). Over 5000 registered clients. Open 6 days Mon–Sat, appointments and walk-ins when available. Recruiting 1–2 more qualified barbers.
Retail (coordinators May and Alicia): own K product range (hair, skin, beard, shave, waxes, creams, shampoo); official Morgans Pomade outlet (since 1873); Freshheads Essex hair tonics; Gabri hair tonics. No checkout on this preview page.
Customer comments from 2025 Billericay Community Awards praise employed staff, community, coffee lounge, west-end quality, Kevin and the team.`,
  },
  {
    title: "Team",
    url: "https://www.kbarbers.co.uk/k-barbers-emporium-billericay/",
    body: `Kevin Vorley — Head Barber/Owner, award-winning British Grandmaster Barber, three decades in the industry.
James Gardner — Senior Barber from day one; mentors newer barbers.
Daniel Reynolds — Intermediate Barber, progressed from apprentice.
Mason — Junior Barber, in the industry since 2023.
Alicia Goodrum — Salon Coordinator and Team Manager; customer care, marketing, social.
May Vorley — Salon Co-ordinator, Kevin’s youngest daughter; products and Koffee Club social.
The site also mentioned Chloe on the team list and new team members arriving.`,
  },
  {
    title: "Koffee Club",
    url: "https://www.kbarbers.co.uk/koffee-club/",
    body: `Koffee Club sits inside K Barbers Emporium, open to barber clients and the public. Local Essex bakery suppliers. Exclusive roast with Freshwell Coffee, West Horndon — beans and ground retail. Social @koffeeclub129.
Baristas named on the page: Shania (Head Barista & Coffee Club Manager, ~3 years), Alisha (7 years), Annie (over a year). Another homepage-style note mentioned Tyler, Ella and Shania as a barista team.
Koffee Club page opening: Mon–Fri 8am–5pm, Saturdays 8am–4.30pm, hours may change. Launch promotion: registered K clients get a discounted price on a selection of hot drinks at the till. Do not invent a drink menu or prices.`,
  },
  {
    title: "Contact and recruiting",
    url: "https://www.kbarbers.co.uk/contact-us/",
    body: `Contact: 129 High Street, Billericay, Essex CM12 9AH. Phone 01277 652272. Email info@kbarbers.co.uk (contact form also showed info@kbarber.com). Bookings page on the live site was not readable during this scan (server error); they ask customers to book an appointment online on the live site. This preview cannot book.
Recruiting (https://www.kbarbers.co.uk/k-recruiting/): Saturday assistant, apprenticeship, junior/intermediate/senior barber, ladies hairdresser for Lady K’s, receptionist, sales trainer, assistant/salon manager, partner barber. Employed, self-employed, or either; full or part time.`,
  },
];

export const KBARBERS_NOTEPAD = KBARBERS_SCAN_NOTES.map(
  (note) => `### ${note.title}\nSource: ${note.url}\n${note.body}`,
).join("\n\n");

export const KBARBERS_SCAN_TEXT = KBARBERS_SCAN_NOTES.map(
  (note) => `${note.title} (${note.url})\n${note.body}`,
).join("\n\n");
