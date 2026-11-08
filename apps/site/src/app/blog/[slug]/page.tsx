import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '../../../blog/JsonLd';
import RichText from '../../../blog/RichText';
import { POSTS, getPost } from '../../../blog/posts';
import { APP_URL, SITE_NAME, SITE_PATH, SITE_URL } from '../../../site-config';
import SiteFooter from '../../../components/SiteFooter';
import SiteHeader from '../../../components/SiteHeader';
import ui from '../../../components/ui.module.scss';
import styles from '../blog.module.scss';

export const dynamicParams = false;

export const generateStaticParams = () => POSTS.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.seoTitle,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `${SITE_PATH}/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE_PATH}/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.published,
      modifiedTime: post.updated,
      images: [{ url: `${SITE_PATH}${post.image}`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [`${SITE_PATH}${post.image}`],
    },
  };
}

export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const others = POSTS.filter((p) => p.slug !== post.slug);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.description,
              image: `${SITE_URL}${post.image}`,
              datePublished: post.published,
              dateModified: post.updated,
              mainEntityOfPage: url,
              inLanguage: 'en-IN',
              author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
              publisher: {
                '@type': 'Organization',
                name: SITE_NAME,
                logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png` },
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
                { '@type': 'ListItem', position: 3, name: post.title, item: url },
              ],
            },
            {
              '@type': 'FAQPage',
              mainEntity: post.faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ],
        }}
      />
      <SiteHeader />
      <main>
        <article className={styles.page}>
          <nav aria-label="Breadcrumb" className={styles.crumbs}>
            <ol>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
            </ol>
          </nav>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.meta}>
            <span>By {SITE_NAME}</span>
            <time dateTime={post.published}>{post.published}</time>
            <span>{post.readMinutes} min read</span>
          </p>
          <div className={styles.prose}>
            {post.body.map((b, i) => {
              const key = `${b.t}-${i}`;
              if (b.t === 'h2') return <h2 key={key}>{b.text}</h2>;
              if (b.t === 'p')
                return (
                  <p key={key}>
                    <RichText text={b.text} />
                  </p>
                );
              if (b.t === 'callout')
                return (
                  <aside key={key} className={styles.callout}>
                    <strong>{b.title}</strong>
                    <p>
                      <RichText text={b.text} />
                    </p>
                  </aside>
                );
              const List = b.t === 'ol' ? 'ol' : 'ul';
              return (
                <List key={key}>
                  {b.items.map((it) => (
                    <li key={it}>
                      <RichText text={it} />
                    </li>
                  ))}
                </List>
              );
            })}
            <h2>Frequently asked questions</h2>
            {post.faq.map((f) => (
              <details key={f.q} className={styles.qa}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>

          <aside className={styles.ctaBox}>
            <h2>Pay every card on one day</h2>
            <p>CreditQ works out your pay day, reminds you, and keeps your data on your phone.</p>
            <a href={APP_URL} className={`${ui.btn} ${ui.accent}`}>
              Open CreditQ
            </a>
          </aside>

          {others.length > 0 && (
            <section aria-labelledby="more">
              <h2 id="more" className={styles.moreTitle}>
                Keep reading
              </h2>
              <ul className={styles.posts}>
                {others.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`}>
                      <h3>{p.title}</h3>
                      <p>{p.excerpt}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
