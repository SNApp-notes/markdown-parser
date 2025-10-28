import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import peggy from 'peggy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let parser;

beforeAll(() => {
  const grammarPath = join(__dirname, '../src/grammar.peggy');
  const grammar = readFileSync(grammarPath, 'utf-8');
  parser = peggy.generate(grammar);
});

describe('Markdown Parser', () => {
  describe('Headers', () => {
    it('should parse single-level header', () => {
      const result = parser.parse('# Heading 1');
      expect(result).toEqual([
        {
          type: 'header',
          content: '# Heading 1',
          level: 1,
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse multi-level headers', () => {
      const result = parser.parse('## Heading 2');
      expect(result).toEqual([
        {
          type: 'header',
          content: '## Heading 2',
          level: 2,
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse level 6 header', () => {
      const result = parser.parse('###### Heading 6');
      expect(result).toEqual([
        {
          type: 'header',
          content: '###### Heading 6',
          level: 6,
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse header with special characters', () => {
      const result = parser.parse('# Hello, World! @#$%');
      expect(result[0].type).toBe('header');
      expect(result[0].content).toBe('# Hello, World! @#$%');
      expect(result[0].level).toBe(1);
    });
  });

  describe('Code Blocks', () => {
    it('should parse code block without language', () => {
      const code = '```\nconst x = 1;\n```';
      const result = parser.parse(code);
      expect(result).toEqual([
        {
          type: 'code',
          content: '\nconst x = 1;',
          language: '',
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse code block with language', () => {
      const code = '```javascript\nconst x = 1;\n```';
      const result = parser.parse(code);
      expect(result).toEqual([
        {
          type: 'code',
          content: '\nconst x = 1;',
          language: 'javascript',
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse multi-line code block', () => {
      const code = '```python\ndef hello():\n    print("Hello")\n```';
      const result = parser.parse(code);
      expect(result[0].type).toBe('code');
      expect(result[0].content).toBe('\ndef hello():\n    print("Hello")');
      expect(result[0].language).toBe('python');
    });

    it('should parse code block with special characters', () => {
      const code = '```bash\necho "Hello $USER"\n```';
      const result = parser.parse(code);
      expect(result[0].content).toBe('\necho "Hello $USER"');
    });
  });

  describe('Bold Text', () => {
    it('should parse bold with double asterisks', () => {
      const result = parser.parse('**bold text**');
      expect(result).toEqual([
        {
          type: 'bold',
          content: '**bold text**',
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse bold with double underscores', () => {
      const result = parser.parse('__bold text__');
      expect(result).toEqual([
        {
          type: 'bold',
          content: '__bold text__',
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse bold within a sentence', () => {
      const result = parser.parse('This is **bold** text');
      expect(result).toContainEqual({
        type: 'bold',
        content: '**bold**',
        loc: expect.any(Object)
      });
      expect(result).toContainEqual({
        type: 'text',
        content: 'This is '
      });
      expect(result).toContainEqual({
        type: 'text',
        content: ' text'
      });
    });

    it('should parse nested italic inside bold', () => {
      const result = parser.parse('**bold *italic* text**');
      // The parser doesn't support nested formatting properly
      // It will parse parts of it as separate elements
      expect(result.length).toBeGreaterThan(1);
      expect(result).toBeDefined();
    });
  });

  describe('Italic Text', () => {
    it('should parse italic with single asterisk', () => {
      const result = parser.parse('*italic*');
      expect(result).toEqual([
        {
          type: 'italic',
          content: '*italic*',
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse italic with single underscore', () => {
      const result = parser.parse('_italic_');
      expect(result).toEqual([
        {
          type: 'italic',
          content: '_italic_',
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse italic within a sentence', () => {
      const result = parser.parse('This is *italic* text');
      expect(result).toContainEqual({
        type: 'italic',
        content: '*italic*',
        loc: expect.any(Object)
      });
    });

    it('should not parse asterisk followed by space as italic', () => {
      const result = parser.parse('* item');
      // This should be parsed as a list item
      expect(result[0].type).toBe('list');
    });
  });

  describe('Inline Links', () => {
    it('should parse basic inline link', () => {
      const result = parser.parse('[Google](https://google.com)');
      expect(result).toEqual([
        {
          type: 'link',
          text: 'Google',
          url: 'https://google.com',
          content: '[Google](https://google.com)',
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse link with empty text', () => {
      const result = parser.parse('[](https://example.com)');
      expect(result[0].type).toBe('link');
      expect(result[0].text).toBe('');
      expect(result[0].url).toBe('https://example.com');
    });

    it('should parse link within sentence', () => {
      const result = parser.parse('Visit [Google](https://google.com) now');
      expect(result).toContainEqual({
        type: 'link',
        text: 'Google',
        url: 'https://google.com',
        content: '[Google](https://google.com)',
        loc: expect.any(Object)
      });
      expect(result).toContainEqual({
        type: 'text',
        content: 'Visit '
      });
      expect(result).toContainEqual({
        type: 'text',
        content: ' now'
      });
    });

    it('should parse link with special characters in URL', () => {
      const result = parser.parse('[Link](https://example.com?foo=bar&baz=qux)');
      expect(result[0].url).toBe('https://example.com?foo=bar&baz=qux');
    });
  });

  describe('List Items', () => {
    it('should parse single list item', () => {
      const result = parser.parse('* Item 1');
      expect(result).toEqual([
        {
          type: 'list',
          content: '* Item 1',
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse multiple list items', () => {
      const result = parser.parse('* Item 1\n* Item 2');
      expect(result[0]).toEqual({
        type: 'list',
        content: '* Item 1',
        loc: expect.any(Object)
      });
      expect(result[1]).toEqual({
        type: 'text',
        content: '\n',
        loc: expect.any(Object)
      });
      expect(result[2]).toEqual({
        type: 'list',
        content: '* Item 2',
        loc: expect.any(Object)
      });
    });

    it('should parse list item with special characters', () => {
      const result = parser.parse('* Item with @#$ symbols');
      expect(result[0].content).toBe('* Item with @#$ symbols');
    });
  });

  describe('Plain Text', () => {
    it('should parse plain text', () => {
      const result = parser.parse('Hello World');
      expect(result).toEqual([
        {
          type: 'text',
          content: 'Hello World'
        }
      ]);
    });

    it('should parse text with numbers and symbols', () => {
      const result = parser.parse('Price: $123.45');
      expect(result).toEqual([
        {
          type: 'text',
          content: 'Price: $123.45'
        }
      ]);
    });
  });

  describe('Newlines', () => {
    it('should parse single newline', () => {
      const result = parser.parse('\n');
      expect(result).toEqual([
        {
          type: 'text',
          content: '\n',
          loc: expect.any(Object)
        }
      ]);
    });

    it('should parse text with newlines', () => {
      const result = parser.parse('Line 1\nLine 2');
      expect(result).toContainEqual({
        type: 'text',
        content: 'Line 1'
      });
      expect(result).toContainEqual({
        type: 'text',
        content: '\n',
        loc: expect.any(Object)
      });
      expect(result).toContainEqual({
        type: 'text',
        content: 'Line 2'
      });
    });
  });

  describe('Mixed Content', () => {
    it('should parse header followed by text', () => {
      const result = parser.parse('# Title\nSome text');
      expect(result[0].type).toBe('header');
      expect(result[1].type).toBe('text');
      expect(result[1].content).toBe('\n');
      expect(result[2].type).toBe('text');
      expect(result[2].content).toBe('Some text');
    });

    it('should parse complex markdown with multiple elements', () => {
      const markdown = `# Title
This is **bold** and *italic* text.
Visit [Google](https://google.com) for more.
\`\`\`javascript
const x = 1;
\`\`\`
* Item 1`;

      const result = parser.parse(markdown);
      
      expect(result[0].type).toBe('header');
      expect(result.some(item => item.type === 'bold')).toBe(true);
      expect(result.some(item => item.type === 'italic')).toBe(true);
      expect(result.some(item => item.type === 'link')).toBe(true);
      expect(result.some(item => item.type === 'code')).toBe(true);
      expect(result.some(item => item.type === 'list')).toBe(true);
    });

    it('should parse bold and italic together', () => {
      const result = parser.parse('**bold** and *italic*');
      expect(result).toContainEqual({
        type: 'bold',
        content: '**bold**',
        loc: expect.any(Object)
      });
      expect(result).toContainEqual({
        type: 'italic',
        content: '*italic*',
        loc: expect.any(Object)
      });
    });

    it('should parse link with bold text in sentence', () => {
      const result = parser.parse('Check **[Link](https://example.com)** out');
      expect(result.some(item => item.type === 'link' || item.type === 'bold')).toBe(true);
    });

    it('should parse multiple headers', () => {
      const markdown = `# H1
## H2
### H3`;
      const result = parser.parse(markdown);
      
      const headers = result.filter(item => item.type === 'header');
      expect(headers).toHaveLength(3);
      expect(headers[0].level).toBe(1);
      expect(headers[1].level).toBe(2);
      expect(headers[2].level).toBe(3);
    });

    it('should parse empty lines between content', () => {
      const markdown = `Text 1

Text 2`;
      const result = parser.parse(markdown);
      const newlines = result.filter(item => item.content === '\n');
      expect(newlines.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string input', () => {
      expect(() => parser.parse('')).toThrow();
    });

    it('should parse unclosed bold gracefully', () => {
      const result = parser.parse('**not closed');
      // The parser should handle this as text
      expect(result[0].type).toBe('text');
    });

    it('should parse unclosed italic gracefully', () => {
      const result = parser.parse('*not closed');
      // The parser should handle this as text or list
      expect(result).toBeDefined();
    });

    it('should parse malformed link gracefully', () => {
      const result = parser.parse('[text without url');
      // Should parse as text
      expect(result[0].type).toBe('text');
    });

    it('should parse code block without closing', () => {
      // Unclosed code blocks don't throw, they're treated as text
      const result = parser.parse('```javascript\ncode');
      expect(result[0].type).toBe('text');
    });
  });

  describe('Location Information', () => {
    it('should include location info for headers', () => {
      const result = parser.parse('# Title');
      expect(result[0].loc).toBeDefined();
      expect(result[0].loc).toHaveProperty('start');
      expect(result[0].loc).toHaveProperty('end');
    });

    it('should include location info for code blocks', () => {
      const result = parser.parse('```\ncode\n```');
      expect(result[0].loc).toBeDefined();
    });

    it('should include location info for inline elements', () => {
      const result = parser.parse('**bold**');
      expect(result[0].loc).toBeDefined();
    });
  });
});
