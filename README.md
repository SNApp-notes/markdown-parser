# @snapp-notes/markdown-parser

[![Test](https://github.com/SNApp-notes/markdown-parser/actions/workflows/test.yml/badge.svg)](https://github.com/SNApp-notes/markdown-parser/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/SNApp-notes/markdown-parser/badge.svg?branch=master)](https://coveralls.io/github/SNApp-notes/markdown-parser?branch=master)
[![LICENSE MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/NApp-notes/markdown-parser/blob/master/LICENSE)

Simple Markdown Parser that returns an Abstract Syntax Tree (AST) with location information.

## Installation

```bash
npm install @snapp-notes/markdown-parser
```

## Features

- 📝 Parse markdown into a structured AST
- 📍 Location tracking for every node
- 🎯 Support for common markdown elements:
  - Headers (H1-H6)
  - Code blocks with language specification
  - Bold text (`**` and `__`)
  - Italic text (`*` and `_`)
  - Inline links
  - List items
  - Plain text
- 🚀 Built with PEG.js/Peggy for reliable parsing
- 📦 ES Module support
- 💪 TypeScript definitions included

## Usage

### Basic Example

```javascript
import { parse } from '@snapp-notes/markdown-parser';

const markdown = '# Hello World\nThis is **bold** text.';
const ast = parse(markdown);

console.log(ast);
```

Output:
```javascript
[
  {
    type: 'header',
    content: '# Hello World',
    level: 1,
    loc: { start: { offset: 0, line: 1, column: 1 }, end: { ... } }
  },
  {
    type: 'text',
    content: '\n',
    loc: { ... }
  },
  {
    type: 'text',
    content: 'This is '
  },
  {
    type: 'bold',
    content: '**bold**',
    loc: { ... }
  },
  {
    type: 'text',
    content: ' text.'
  }
]
```

### Parsing Headers

```javascript
import { parse } from '@snapp-notes/markdown-parser';

const ast = parse('# H1\n## H2\n### H3');

// Each header node contains:
// - type: 'header'
// - content: full header text including # symbols
// - level: number (1-6)
// - loc: location information
```

### Parsing Code Blocks

```javascript
import { parse } from '@snapp-notes/markdown-parser';

const markdown = `\`\`\`javascript
const greeting = "Hello";
console.log(greeting);
\`\`\``;

const ast = parse(markdown);

// Code node contains:
// - type: 'code'
// - content: code content (includes leading newline)
// - language: 'javascript' (or empty string if not specified)
// - loc: location information
```

### Parsing Inline Formatting

```javascript
import { parse } from '@snapp-notes/markdown-parser';

// Bold text
parse('**bold text**');  // or '__bold text__'

// Italic text
parse('*italic text*');  // or '_italic text_'

// Mixed formatting
const ast = parse('This is **bold** and *italic* text');
```

### Parsing Links

```javascript
import { parse } from '@snapp-notes/markdown-parser';

const ast = parse('[Google](https://google.com)');

// Link node contains:
// - type: 'link'
// - text: 'Google'
// - url: 'https://google.com'
// - content: '[Google](https://google.com)'
// - loc: location information
```

### Parsing Lists

```javascript
import { parse } from '@snapp-notes/markdown-parser';

const markdown = `* Item 1
* Item 2
* Item 3`;

const ast = parse(markdown);

// List nodes contain:
// - type: 'list'
// - content: '* Item text'
// - loc: location information
```

### Complex Document

```javascript
import { parse } from '@snapp-notes/markdown-parser';

const markdown = `# My Document

This is a paragraph with **bold** and *italic* text.

Visit [my website](https://example.com) for more info.

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

* Feature 1
* Feature 2
`;

const ast = parse(markdown);

// The AST will contain a mix of different node types
ast.forEach(node => {
  console.log(`${node.type}: ${node.content?.substring(0, 30)}...`);
});
```

## API

### `parse(input: string, options?: { startRule?: string }): MarkdownNode[]`

Parses a markdown string and returns an array of AST nodes.

**Parameters:**
- `input` (string): The markdown text to parse
- `options` (optional): Parser options
  - `startRule` (optional): The grammar rule to start parsing from (default: 'start')

**Returns:** An array of `MarkdownNode` objects

**Throws:** `SyntaxError` if the input cannot be parsed

### Node Types

#### TextNode
```typescript
interface TextNode {
  type: 'text' | 'bold' | 'italic' | 'list';
  content: string;
  loc: Location;
}
```

Used for plain text, bold text, italic text, and list items.

#### HeaderNode
```typescript
interface HeaderNode {
  type: 'header';
  content: string;
  level: number;  // 1-6
  loc: Location;
}
```

#### CodeNode
```typescript
interface CodeNode {
  type: 'code';
  content: string;
  language?: string;
  loc: Location;
}
```

Note: The `content` includes a leading newline character.

#### LinkNode
```typescript
interface LinkNode {
  type: 'link';
  text: string;
  url: string;
  content: string;
  loc: Location;
}
```

#### Location
```typescript
interface Location {
  start: Position;
  end: Position;
}

interface Position {
  offset: number;  // Character offset from start
  line: number;    // Line number (1-based)
  column: number;  // Column number (1-based)
}
```

## Error Handling

The parser throws a `SyntaxError` when it encounters invalid markdown:

```javascript
import { parse, SyntaxError } from '@snapp-notes/markdown-parser';

try {
  const ast = parse('');  // Empty input
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error('Parse error:', error.message);
    console.error('Expected:', error.expected);
    console.error('Found:', error.found);
    console.error('Location:', error.location);
  }
}
```

## Supported Markdown Syntax

| Element | Syntax | Example |
|---------|--------|---------|
| Header | `#` to `######` | `# Title` |
| Bold | `**text**` or `__text__` | `**bold**` |
| Italic | `*text*` or `_text_` | `*italic*` |
| Link | `[text](url)` | `[Google](https://google.com)` |
| Code Block | ` ```lang\ncode\n``` ` | ` ```js\ncode\n``` ` |
| List Item | `* item` | `* Item 1` |

## Limitations

- Nested formatting (e.g., bold within italic) is not fully supported
- Only unordered lists with `*` are supported
- No support for:
  - Blockquotes
  - Tables
  - Images
  - Horizontal rules
  - Strikethrough
  - Task lists

## Development

### Build

Generate the parser from the grammar file:

```bash
npm run build
```

### Testing

Run the test suite:

```bash
npm test
```

Watch mode for development:

```bash
npm run test:watch
```

## Grammar

The parser is built using [Peggy](https://peggyjs.org/) (formerly PEG.js). The grammar file is located at `src/grammar.peggy`.

To modify the parser, edit the grammar file and rebuild:

```bash
npm run build
```

## Contributing

Contributions are welcome! Please ensure all tests pass before submitting a pull request.

```bash
npm run build
npm test
```

## License

Licensed under [MIT](http://opensource.org/licenses/MIT) license

Copyright (c) 2025 [Jakub T. Jankiewicz](https://jcubic.pl/me)
