// src/content/contentScript.ts

import { PageContentExtractor } from '../../utils/pageContentExtractor';

/**
 * Content script that runs on every page
 * Listens for messages from popup and extracts page content
 */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    try {
      const pageContent = PageContentExtractor.extractPageContent();
      const links = PageContentExtractor.extractLinks();
      const citations = PageContentExtractor.countCitations();
      const publicationDate = PageContentExtractor.extractPublicationDate();
      const tone = PageContentExtractor.analyzeTone();

      sendResponse({
        success: true,
        data: {
          ...pageContent,
          links,
          citationCount: citations,
          publicationDate,
          tone
        }
      });
    } catch (error) {
      console.error('Error extracting page content:', error);
      sendResponse({
        success: false,
        error: 'Failed to extract page content'
      });
    }
  }
});

console.log('Content script loaded and ready to analyze pages');
