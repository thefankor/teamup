import { useEffect } from 'react';

const SITE_NAME = 'TeamUp';
const DEFAULT_DESCRIPTION =
    'TeamUp - платформа для поиска проектов, команды и участников.';

function ensureMetaTag(selector, attrName, attrValue) {
    let tag = document.head.querySelector(selector);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attrName, attrValue);
        document.head.appendChild(tag);
    }
    return tag;
}

function ensureCanonicalLink() {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
    }
    return link;
}

export function SeoMeta({
    title,
    description = DEFAULT_DESCRIPTION,
    canonicalPath,
    ogImage = '/vite.svg',
    ogType = 'website',
    noindex = false,
}) {
    useEffect(() => {
        const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
        const canonicalUrl = canonicalPath
            ? new URL(canonicalPath, siteUrl).toString()
            : window.location.href;

        document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

        const descriptionTag = ensureMetaTag('meta[name="description"]', 'name', 'description');
        descriptionTag.setAttribute('content', description);

        const robotsTag = ensureMetaTag('meta[name="robots"]', 'name', 'robots');
        robotsTag.setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow');

        const ogTitleTag = ensureMetaTag('meta[property="og:title"]', 'property', 'og:title');
        ogTitleTag.setAttribute('content', title || SITE_NAME);

        const ogDescriptionTag = ensureMetaTag(
            'meta[property="og:description"]',
            'property',
            'og:description',
        );
        ogDescriptionTag.setAttribute('content', description);

        const ogTypeTag = ensureMetaTag('meta[property="og:type"]', 'property', 'og:type');
        ogTypeTag.setAttribute('content', ogType);

        const ogUrlTag = ensureMetaTag('meta[property="og:url"]', 'property', 'og:url');
        ogUrlTag.setAttribute('content', canonicalUrl);

        const ogImageTag = ensureMetaTag('meta[property="og:image"]', 'property', 'og:image');
        ogImageTag.setAttribute('content', new URL(ogImage, siteUrl).toString());

        const twitterCardTag = ensureMetaTag(
            'meta[name="twitter:card"]',
            'name',
            'twitter:card',
        );
        twitterCardTag.setAttribute('content', 'summary_large_image');

        const twitterTitleTag = ensureMetaTag(
            'meta[name="twitter:title"]',
            'name',
            'twitter:title',
        );
        twitterTitleTag.setAttribute('content', title || SITE_NAME);

        const twitterDescriptionTag = ensureMetaTag(
            'meta[name="twitter:description"]',
            'name',
            'twitter:description',
        );
        twitterDescriptionTag.setAttribute('content', description);

        const canonical = ensureCanonicalLink();
        canonical.setAttribute('href', canonicalUrl);
    }, [canonicalPath, description, noindex, ogImage, ogType, title]);

    return null;
}
