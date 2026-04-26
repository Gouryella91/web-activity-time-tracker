// src/utils/pageContentExtractor.ts

/**
 * Extracts relevant content from a webpage for credibility analysis
 */
export class PageContentExtractor {
  /**
   * Gets the current page's content and metadata
   */
  static extractPageContent(): {
    title: string;
    url: string;
    author: string;
    description: string;
    content: string;
    textContent: string;
  } {
    return {
      title: this.extractTitle(),
      url: window.location.href,
      author: this.extractAuthor(),
      description: this.extractDescription(),
      content: this.extractMainContent(),
      textContent: this.extractTextContent()
    };
  }

  /**
   * Extracts the page title
   */
  private static extractTitle(): string {
    // Try meta og:title first
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle) return ogTitle;

    // Fall back to regular title
    return document.title || 'No title found';
  }

  /**
   * Extracts the author information
   */
  private static extractAuthor(): string {
    // Try meta author tag
    const authorMeta = document.querySelector('meta[name="author"]')?.getAttribute('content');
    if (authorMeta) return authorMeta;

    // Try article:author
    const articleAuthor = document.querySelector('meta[property="article:author"]')?.getAttribute('content');
    if (articleAuthor) return articleAuthor;

    // Try to find author in common class names
    const authorElement = document.querySelector('[class*="author"], [class*="by-line"], [class*="byline"]');
    if (authorElement) return authorElement.textContent?.trim() || 'Unknown';

    return 'Unknown author';
  }

  /**
   * Extracts the page description/meta description
   */
  private static extractDescription(): string {
    // Try og:description
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    if (ogDesc) return ogDesc;

    // Try regular description
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
    if (metaDesc) return metaDesc;

    return 'No description found';
  }

  /**
   * Extracts the main content of the page
   */
  private static extractMainContent(): string {
    // Try to find article/main content
    const article = document.querySelector('article');
    if (article) return article.innerHTML;

    const main = document.querySelector('main');
    if (main) return main.innerHTML;

    // Fall back to body
    return document.body.innerHTML.substring(0, 10000);
  }

  /**
   * Extracts readable text content from the page
   */
  private static extractTextContent(): string {
    // Remove script and style tags
    const clone = document.body.cloneNode(true) as HTMLElement;
    const scripts = clone.querySelectorAll('script, style, noscript');
    scripts.forEach(s => s.remove());

    // Get text content
    let text = clone.textContent || '';

    // Clean up whitespace
    text = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');

    // Limit to first 5000 characters
    return text.substring(0, 5000);
  }

  /**
   * Extracts all links from the page
   */
  static extractLinks(): string[] {
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(a => (a as HTMLAnchorElement).href)
      .filter(href => href && !href.startsWith('javascript:'));

    return [...new Set(links)].slice(0, 20); // Return unique links, max 20
  }

  /**
   * Counts mentions of citations/sources
   */
  static countCitations(): number {
    const citationPatterns = [
  /\[[\d\]]+/g, // [1], [2], etc.
  /\(source:|According to:|From:\)/gi,
  /https?:\/\/[^\s]+/g // URLs
];


    let count = 0;
    const textContent = document.body.textContent || '';

    citationPatterns.forEach(pattern => {
      const matches = textContent.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  /**
   * Detects publication date
   */
  static extractPublicationDate(): string {
    // Try to find publication date meta tags
    const published = document.querySelector('meta[property="article:published_time"], meta[name="publication_date"]')?.getAttribute('content');
    if (published) return published;

    // Try to find in common class names
    const dateElement = document.querySelector('[class*="date"], [class*="published"], [class*="posted"]');
    if (dateElement) return dateElement.textContent?.trim() || 'Unknown';

    return 'Unknown date';
  }

  /**
   * Simple sentiment/tone analysis
   */
  static analyzeTone(): {
    emotionalWords: number;
    sensationalWords: number;
  } {
    const textContent = (document.body.textContent || '').toLowerCase();

    const emotionalWords = [
      'amazing', 'shocking', 'incredible', 'unbelievable', 'stunning',
      'devastating', 'tragic', 'horrible', 'terrible', 'awful'
    ];

    const sensationalWords = [
      'breaking', 'exclusive', 'must', 'urgent', 'critical',
      'dangerous', 'crisis', 'scandal', 'drama'
    ];

    let emotionalCount = 0;
    let sensationalCount = 0;

    emotionalWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = textContent.match(regex);
      if (matches) emotionalCount += matches.length;
    });

    sensationalWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = textContent.match(regex);
      if (matches) sensationalCount += matches.length;
    });

    return { emotionalWords: emotionalCount, sensationalWords: sensationalCount };
  }
}
