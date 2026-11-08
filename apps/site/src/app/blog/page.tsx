import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '../../blog/JsonLd';
import { POSTS } from '../../blog/posts';
import { SITE_NAME, SITE_PATH, SITE_URL } from '../../site-config';
import SiteFooter from '../../components/SiteFooter';
import SiteHeader from '../../components/SiteHeader';
import styles from './blog.module.scss';

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
      <SiteHeader />
      <main className={styles.page}>
        <nav aria-label="Breadcrumb" className={styles.crumbs}>
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-current="page">Blog</li>
          </ol>
        </nav>
        <h1 className={styles.title}>Credit card guides for India</h1>
        <p className={styles.sub}>Practical, plain-language help for paying every card on time.</p>
        <ul className={styles.posts}>
          {POSTS.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`}>
                <p className={styles.cardMeta}>
                  <time dateTime={p.published}>{p.published}</time> · {p.readMinutes} min read
                </p>
                <h2>{p.title}</h2>
                <p>{p.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
