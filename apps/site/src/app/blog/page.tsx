import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '../../blog/JsonLd';
import { POSTS } from '../../blog/posts';
import { SITE_NAME, SITE_PATH, SITE_URL } from '../../site-config';
import styles from '../site.module.scss';

export const metadata: Metadata = {
  title: 'Credit card guides for India',
  description:
    'Plain-language guides on credit card due dates, billing cycles and paying several cards on time, from the makers of CreditQ.',
  alternates: { canonical: `${SITE_PATH}/blog` },
  openGraph: {
    url: `${SITE_PATH}/blog`,
    title: 'CreditQ blog: credit card guides',
    images: [`${SITE_PATH}/og.png`],
  },
};

export default function BlogIndex() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: `${SITE_NAME} blog`,
          url: `${SITE_URL}/blog`,
          blogPost: POSTS.map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: `${SITE_URL}/blog/${p.slug}`,
            datePublished: p.published,
          })),
        }}
      />
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          CreditQ
        </Link>
        <nav aria-label="Sections" className={styles.links}>
          <Link href="/#features">Features</Link>
          <Link href="/#pay-day">Pay day</Link>
          <Link href="/blog">Blog</Link>
        </nav>
      </header>
      <main className={styles.article}>
        <nav aria-label="Breadcrumb" className={styles.crumbs}>
          <Link href="/">Home</Link> / <span>Blog</span>
        </nav>
        <h1>Credit card guides for India</h1>
        <p className={styles.sub}>Practical, plain-language help for paying every card on time.</p>
        <ul className={styles.posts}>
          {POSTS.map((p) => (
            <li key={p.slug} className={styles.card}>
              <h2>
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p>{p.excerpt}</p>
              <p className={styles.meta}>
                <time dateTime={p.published}>{p.published}</time> · {p.readMinutes} min read
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
