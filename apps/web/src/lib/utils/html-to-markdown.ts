// ==========================================================================
// File    : html-to-markdown.ts
// Project : MarkWrite
// Layer   : Utility
// Purpose : Convert HTML content to Markdown format for export.
//
// Author  : AuraEG Team
// Created : 2026-03-26
// ==========================================================================

import TurndownService from 'turndown';

// --------------------------------------------------------------------------
// [SECTION] Turndown Configuration
// --------------------------------------------------------------------------

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
});

// [*] Custom rule for strikethrough
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`,
});

// --------------------------------------------------------------------------
// [SECTION] Conversion Function
// --------------------------------------------------------------------------

/**
 * Convert HTML content to Markdown format.
 * @param html - The HTML string to convert
 * @returns The Markdown representation of the HTML
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html.trim() === '') {
    return '';
  }

  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error('[htmlToMarkdown] Conversion failed:', error);
    return html;
  }
}
