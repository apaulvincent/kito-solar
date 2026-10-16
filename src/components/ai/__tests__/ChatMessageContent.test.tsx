// src/components/ai/__tests__/ChatMessageContent.test.tsx
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatMessageContent } from '../ChatMessageContent';

describe('ChatMessageContent Markdown & Math Renderer', () => {
  it('renders bold, headings, and bullet lists properly as HTML elements', () => {
    const markdown = `### 1. Too Much Voltage for the Inverter
* **Panel Voltage:** A single 580W panel produces around **50 Volts**.
* **Inverter Limit:** Safe limit of **500V to 600V**.`;

    const html = renderToStaticMarkup(
      createElement(ChatMessageContent, { content: markdown, isUser: false })
    );

    // Verify it creates semantic HTML tags rather than raw asterisks/hashes
    expect(html).toContain('<h3');
    expect(html).toContain('1. Too Much Voltage for the Inverter</h3>');
    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('Panel Voltage:</strong>');
    expect(html).toContain('50 Volts</strong>');
    expect(html).not.toContain('### 1.');
  });

  it('renders KaTeX math expressions properly without crashing', () => {
    const mathMarkdown = `A single string: $16 \\times 50\\text{V} = 800\\text{V}$.`;

    const html = renderToStaticMarkup(
      createElement(ChatMessageContent, { content: mathMarkdown, isUser: false })
    );

    expect(html).toContain('katex');
  });

  it('renders user messages as simple pre-wrapped text', () => {
    const userMsg = 'I want 16 panels on a Deye inverter';
    const html = renderToStaticMarkup(
      createElement(ChatMessageContent, { content: userMsg, isUser: true })
    );

    expect(html).toContain('whitespace-pre-wrap');
    expect(html).toContain('I want 16 panels on a Deye inverter');
  });
});
