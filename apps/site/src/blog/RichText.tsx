import Link from 'next/link';
import type { ReactNode } from 'react';

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

/** Tiny inline formatter for post text: **bold** and [label](/path or https://url). */
export default function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = text.split(TOKEN).map((part, i) => {
    const key = `${i}-${part.slice(0, 12)}`;
    if (part.startsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      return href?.startsWith('http') ? (
        <a key={key} href={href}>
          {label}
        </a>
      ) : (
        <Link key={key} href={href ?? '/'}>
          {label}
        </Link>
      );
    }
    return part;
  });
  return <>{nodes}</>;
}
