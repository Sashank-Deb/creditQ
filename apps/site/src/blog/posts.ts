export type Block =
  | { t: 'h2'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'callout'; title: string; text: string };

export interface Post {
  slug: string;
  title: string;
  /** Shorter title for search results (about 50 characters before the site name). */
  seoTitle: string;
  /** Meta description: aim for 150 to 160 characters. */
  description: string;
  /** Short line for cards and social. */
  excerpt: string;
  keywords: string[];
  published: string;
  updated: string;
  readMinutes: number;
  image: string;
  body: Block[];
  faq: { q: string; a: string }[];
}

export const POSTS: Post[] = [
  {
    slug: 'never-miss-credit-card-due-date',
    title: 'How to Never Miss a Credit Card Due Date in India: A Practical System',
    seoTitle: 'Never Miss a Credit Card Due Date: India Guide',
    description:
      'Missed a credit card due date? Here is a simple 7-step system for India: pay days, two reminders, calendar alerts and one weekly sitting for all your cards.',
    excerpt:
      'Late fees and interest add up fast. A simple routine of one pay day and two reminders keeps every card on time.',
    keywords: [
      'credit card due date reminder',
      'how to avoid late payment credit card',
      'credit card payment reminder India',
      'never miss credit card bill',
      'credit card late fee',
    ],
    published: '2026-11-08',
    updated: '2026-11-08',
    readMinutes: 7,
    image: '/og-blog-never-miss-credit-card-due-date.png',
    body: [
      {
        t: 'p',
        text: 'If you hold two or three credit cards, you already know the problem: each card has its own statement date, its own due date and its own app. One busy week and a bill slips past you. This guide is a practical system for Indian cardholders to make sure that never happens, with or without autopay.',
      },
      { t: 'h2', text: 'Why credit card due dates get missed' },
      {
        t: 'ul',
        items: [
          'Every card has a different billing cycle, so due dates are scattered across the month.',
          'People confuse the statement date (when the bill is generated) with the due date (when it must be paid).',
          'SMS and email reminders arrive once, get buried, and are easy to swipe away.',
          'Paying on the due date itself is risky: a bank holiday, a weekend or a slow payment channel can make the payment post late.',
        ],
      },
      { t: 'h2', text: 'What a missed due date really costs' },
      {
        t: 'p',
        text: 'Terms differ by issuer, so always check your card’s most important terms and conditions. In general, missing the due date can mean a late payment fee, interest on the outstanding balance (many Indian issuers charge in the region of 3.5% to 3.99% per month), and the loss of the interest-free period on new purchases. If a bill stays unpaid for a month or more, it can also be reported as overdue to credit bureaus and hurt your credit score.',
      },
      {
        t: 'callout',
        title: 'The good news',
        text: 'Almost all of this is avoidable with a routine that takes a couple of minutes a month.',
      },
      { t: 'h2', text: 'A 7-step system that works' },
      {
        t: 'ol',
        items: [
          '**Write down two dates per card.** The statement date and the payment due date. Both are on your latest statement. Put them in one place, not five apps.',
          '**Pick a pay day, not a due date.** Choose a day a few days before the earliest due date. Five days is a comfortable lead: it survives weekends, bank holidays and a delayed payment.',
          '**Pay all cards in one sitting.** Cards whose due dates fall within a week of each other can share one pay day. One calendar slot, one trip to your banking app.',
          '**Use two reminders.** One on your pay day, and one on the due date for anything still open. The second one is your safety net.',
          '**Put it in your calendar.** A calendar alert on a full-day event is far harder to miss than a notification from an app you do not open daily.',
          '**Pay the full statement balance when you can.** If cash is tight, always pay at least the minimum amount due on time, then clear the rest as soon as possible.',
          '**Mark it paid.** Closing the loop tells you the card is done for the cycle and stops the reminders.',
        ],
      },
      { t: 'h2', text: 'What about autopay?' },
      {
        t: 'p',
        text: 'Autopay is useful, but it is not a complete answer. It can fail if the linked account has insufficient balance, if a mandate expires, or if the bank changes the card. Many people use autopay for the minimum due as a safety net and still keep a manual reminder to pay the full amount. Whatever you choose, a reminder you trust is still worth having.',
      },
      { t: 'h2', text: 'Common mistakes to avoid' },
      {
        t: 'ul',
        items: [
          'Paying on the very last day, especially when it falls on a weekend or holiday.',
          'Relying on a single SMS as the only reminder.',
          'Assuming a payment from another bank is instant. UPI, NEFT and card-to-card routes can take time to reflect.',
          'Forgetting a card you rarely use. Small balances still attract late fees.',
        ],
      },
      { t: 'h2', text: 'How CreditQ automates the routine' },
      {
        t: 'p',
        text: 'CreditQ is a free reminder app built around exactly this system. You add a card with its bill date and due date. CreditQ works out one **pay day** for each group of cards, moves it off weekends and holidays, and reminds you. You can add the pay days to your calendar as full-day events that list every card and its due date. Everything stays encrypted on your phone: there is no account, and it works offline. See [how pay day is calculated](/#pay-day) or [try the pay day calculator](/#playground).',
      },
      {
        t: 'p',
        text: 'This article is general information, not financial advice. Check your card issuer’s terms for the exact fees, interest and grace rules that apply to you.',
      },
    ],
    faq: [
      {
        q: 'How many days before the due date should I pay my credit card bill?',
        a: 'A lead of about five days is a good default. It leaves room for weekends, bank holidays and payment channels that take a day or two to reflect.',
      },
      {
        q: 'What is the minimum amount due?',
        a: 'It is the smallest payment that stops a late payment fee and keeps the account in good standing. Paying only the minimum still lets interest build on the rest, so pay the full balance when you can.',
      },
      {
        q: 'Is autopay enough to avoid missing a payment?',
        a: 'Not always. Autopay can fail if the account balance is low or the mandate lapses. Keep an independent reminder as a backup.',
      },
      {
        q: 'Can I get one reminder for all my cards?',
        a: 'Yes. Group cards whose due dates are within a week of each other and pay them on a single pay day. CreditQ does this grouping for you.',
      },
    ],
  },
  {
    slug: 'credit-card-statement-date-vs-due-date',
    title: 'Credit Card Statement Date vs Due Date: How the Billing Cycle Works',
    seoTitle: 'Credit Card Statement Date vs Due Date Explained',
    description:
      'Statement date vs due date explained for India: how the billing cycle, interest-free period and minimum due work, and the best day to pay your credit card bill.',
    excerpt:
      'The statement date and the due date are not the same thing. Understand the billing cycle and you will know exactly when to pay.',
    keywords: [
      'credit card statement date vs due date',
      'credit card billing cycle',
      'credit card interest free period',
      'when to pay credit card bill',
      'credit card due date calculator',
    ],
    published: '2026-11-08',
    updated: '2026-11-08',
    readMinutes: 6,
    image: '/og-blog-statement-date-vs-due-date.png',
    body: [
      {
        t: 'p',
        text: 'Two dates control almost everything about a credit card bill: the statement date and the due date. They are easy to mix up, and mixing them up is one of the most common reasons people pay late or lose their interest-free period. Here is how the billing cycle works, in plain language.',
      },
      { t: 'h2', text: 'Statement date: when the bill is generated' },
      {
        t: 'p',
        text: 'The statement date (also called the billing date) is the day your card issuer closes the cycle and generates your bill. Everything you spent since the last statement date appears on this statement, along with your total amount due and your minimum amount due. The cycle usually runs for about a month.',
      },
      { t: 'h2', text: 'Due date: the last day to pay' },
      {
        t: 'p',
        text: 'The payment due date is the last day to pay without a late payment fee and without interest on the statement balance. It is usually a couple of weeks after the statement date. Many Indian issuers set it roughly 15 to 20 days later, but your card’s exact gap is printed on your statement.',
      },
      {
        t: 'callout',
        title: 'A quick example',
        text: 'Statement date 18 Nov, payment due date 6 Dec. Purchases made up to 18 Nov are on this bill, and the whole amount is due by 6 Dec. A purchase on 19 Nov lands on the next statement.',
      },
      { t: 'h2', text: 'The interest-free period' },
      {
        t: 'p',
        text: 'The interest-free (grace) period is the time between making a purchase and the due date for the bill that includes it. Spend just after your statement date and you get the longest window, often up to around 45 to 50 days, because the purchase waits for the next statement and then for its due date. The catch: the grace period usually applies only if you pay the full statement balance by the due date.',
      },
      { t: 'h2', text: 'What happens if you pay only the minimum due' },
      {
        t: 'p',
        text: 'Paying the minimum amount due keeps you from a late payment fee and from being treated as overdue, but the unpaid balance starts to attract interest, and you generally lose the interest-free period on new purchases until you clear the balance. It is a safety net, not a plan.',
      },
      { t: 'h2', text: 'When is the best day to pay?' },
      {
        t: 'ul',
        items: [
          'Not on the due date itself. Choose a pay day a few days earlier so weekends, holidays and processing time cannot make you late.',
          'After the statement is generated, because that is when the final amount is known.',
          'When you can group it with other cards, so you handle all your bills in one sitting.',
        ],
      },
      { t: 'h2', text: 'How to find your two dates' },
      {
        t: 'ol',
        items: [
          'Open your latest statement (email, PDF or the bank’s app).',
          'Find “Statement date” or “Billing date”.',
          'Find “Payment due date”.',
          'Note both for each card. They repeat every month, though the day can shift slightly for short months.',
        ],
      },
      { t: 'h2', text: 'Can you change the billing date?' },
      {
        t: 'p',
        text: 'Some issuers let you request a different billing cycle date, which helps if you want your due dates to line up closer together. Ask your issuer; it is not available on every card, and rules change over time.',
      },
      { t: 'h2', text: 'Track both dates with CreditQ' },
      {
        t: 'p',
        text: 'CreditQ asks for exactly these two dates when you add a card. It then works out your pay day, never earlier than the statement date and never later than your lead time before the due date, moving it off weekends and bank holidays. When you pay, you mark the bill paid and the card moves to the paid deck until its next statement date. Try the [pay day calculator](/#playground) to see how your own dates behave.',
      },
      {
        t: 'p',
        text: 'This article is general information, not financial advice. Billing terms vary by issuer, so confirm details on your statement.',
      },
    ],
    faq: [
      {
        q: 'Is the statement date the same as the due date?',
        a: 'No. The statement date is when your bill is generated. The due date is the last day to pay it, usually a couple of weeks later.',
      },
      {
        q: 'What is the interest-free period on a credit card?',
        a: 'It is the time between a purchase and the due date of the bill that includes it. It usually applies only when you pay the full statement balance by the due date.',
      },
      {
        q: 'How long after the statement date is the payment due?',
        a: 'It varies by issuer. Many set it roughly 15 to 20 days after the statement date. Your statement shows the exact date.',
      },
      {
        q: 'What is the best date to pay a credit card bill?',
        a: 'A few days before the due date, after the statement is generated. That avoids weekend, holiday and processing delays.',
      },
    ],
  },
];

export const getPost = (slug: string): Post | undefined => POSTS.find((p) => p.slug === slug);
