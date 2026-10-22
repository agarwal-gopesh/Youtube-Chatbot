import { useState } from 'react';

/**
 * Converts timestamp string (e.g., "04:15", "1:22:40", "[14:32]") to total seconds
 */
function parseTimeToSeconds(raw) {
  if (!raw) return null;
  const clean = raw.replace(/[\[\]]/g, '').trim();
  const parts = clean.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

/**
 * Parses inline formatting:
 * - **bold**
 * - *italic*
 * - `inline code`
 * - Timestamps (e.g. 04:15, [14:32]) -> interactive YouTube jump links
 */
function renderInlineText(text, videoId) {
  if (!text) return null;

  // Tokenize by code, bold, italic, and timestamps
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[?\b(?:\d{1,2}:)?\d{2}:\d{2}\b\]?)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Inline Code
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="inline-code text-code-md">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="formatted-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }

    // Timestamp
    const tsMatch = part.match(/\[?(\b(?:\d{1,2}:)?\d{2}:\d{2}\b)\]?/);
    if (tsMatch) {
      const tsStr = tsMatch[1];
      const seconds = parseTimeToSeconds(tsStr);
      const ytLink = videoId && seconds !== null
        ? `https://www.youtube.com/watch?v=${videoId}&t=${seconds}`
        : null;

      if (ytLink) {
        return (
          <a
            key={idx}
            href={ytLink}
            target="_blank"
            rel="noopener noreferrer"
            className="timestamp-pill"
            title={`Jump to ${tsStr} on YouTube`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>play_arrow</span>
            <span>{tsStr}</span>
          </a>
        );
      }
      return <span key={idx} className="timestamp-pill-static">{tsStr}</span>;
    }

    return part;
  });
}

/**
 * Code Block with copy functionality
 */
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText?.(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block-wrap">
      <div className="code-block-header">
        <span className="code-block-lang text-code-md">{lang || 'code'}</span>
        <button type="button" className="code-copy-btn text-label-sm" onClick={handleCopy}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {copied ? 'check' : 'content_copy'}
          </span>
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="code-pre text-code-md">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * StructuredResponse Component
 * Parses raw LLM Markdown into structured Stitch components:
 * - Intro paragraphs
 * - Numbered Stage Cards (.stage-card) with timestamp badges
 * - Key Takeaways / Callout boxes (.callout.tertiary)
 * - Bullet lists (.markdown-bullet-list)
 * - Code blocks
 * - Direct Video Citations (.citations-section)
 */
export default function StructuredResponse({ content, videoId }) {
  if (!content) return null;

  // 1. Extract all unique timestamps mentioned in the response to populate Direct Citations row
  const citations = [];
  const tsMatches = content.matchAll(/(?:at\s+|around\s+|timestamp\s+|\[)?(\b(?:\d{1,2}:)?\d{2}:\d{2}\b)(?:\])?(?:\s*[:-]?\s*([^\n.,]+))?/gi);
  const seenSeconds = new Set();

  for (const match of tsMatches) {
    const tsStr = match[1];
    const sec = parseTimeToSeconds(tsStr);
    if (sec !== null && !seenSeconds.has(sec)) {
      seenSeconds.add(sec);
      const rawLabel = (match[2] || '').trim();
      const cleanLabel = rawLabel.replace(/^[-–—:]\s*/, '').slice(0, 32);
      citations.push({
        ts: tsStr,
        seconds: sec,
        label: cleanLabel || 'Video Segment',
      });
    }
  }

  // 2. Parse text blocks
  const blocks = [];
  const lines = content.split('\n');
  let currentBlockType = null;
  let currentBlockLines = [];

  function flushBlock() {
    if (currentBlockLines.length === 0) return;
    blocks.push({
      type: currentBlockType || 'paragraph',
      lines: [...currentBlockLines],
    });
    currentBlockLines = [];
    currentBlockType = null;
  }

  let inCodeBlock = false;
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          type: 'code',
          code: currentBlockLines.join('\n'),
          lang: codeLang,
        });
        currentBlockLines = [];
        inCodeBlock = false;
      } else {
        flushBlock();
        inCodeBlock = true;
        codeLang = line.trim().replace(/^```/, '') || '';
      }
      continue;
    }

    if (inCodeBlock) {
      currentBlockLines.push(line);
      continue;
    }

    // Callout / Blockquote (starts with > or **Key Takeaway** or **मुख्य निष्कर्ष**)
    const isCalloutLine = line.trim().startsWith('>') ||
      line.trim().startsWith('**Key Takeaway') ||
      line.trim().startsWith('**Key Analysis') ||
      line.trim().startsWith('**मुख्य निष्कर्ष') ||
      line.trim().startsWith('**मुख्य विश्लेषण');

    if (isCalloutLine) {
      if (currentBlockType !== 'callout') {
        flushBlock();
        currentBlockType = 'callout';
      }
      currentBlockLines.push(line.replace(/^>\s*/, ''));
      continue;
    }

    // Numbered stage or step (e.g., "1. Cryogenic Upper Stage", "Stage 1:", "1) ...")
    const isStageLine = /^(?:###\s*)?(?:\d+[\.\)]|\bStage\s+\d+:?)\s+(.+)/i.test(line.trim());
    if (isStageLine) {
      flushBlock();
      // Collect stage header and following description lines
      const stageMatch = line.trim().match(/^(?:###\s*)?(?:(\d+)[\.\)]|\bStage\s+(\d+):?)\s+(.+)/i);
      const stageNum = stageMatch ? (stageMatch[1] || stageMatch[2]) : '1';
      let rest = stageMatch ? stageMatch[3] : line.trim();

      // Check if title has a timestamp like "[04:15]" or "(14:32)"
      let stageTs = null;
      const tsInTitle = rest.match(/[\(\[]?(\b(?:\d{1,2}:)?\d{2}:\d{2}\b)[\)\]]?/);
      if (tsInTitle) {
        stageTs = tsInTitle[1];
        rest = rest.replace(tsInTitle[0], '').trim();
      }

      // Check for colon separating title and description: "Title: Description"
      let stageTitle = rest;
      let stageDesc = '';
      if (rest.includes(':')) {
        const splitPos = rest.indexOf(':');
        stageTitle = rest.slice(0, splitPos).trim();
        stageDesc = rest.slice(splitPos + 1).trim();
      } else if (rest.includes(' - ')) {
        const splitPos = rest.indexOf(' - ');
        stageTitle = rest.slice(0, splitPos).trim();
        stageDesc = rest.slice(splitPos + 3).trim();
      }

      blocks.push({
        type: 'stage',
        num: stageNum,
        title: stageTitle,
        ts: stageTs,
        desc: stageDesc,
      });
      continue;
    }

    // Markdown Headings
    if (/^#{1,3}\s+/.test(line.trim())) {
      flushBlock();
      const level = line.trim().match(/^(#{1,3})\s+/)[1].length;
      const headingText = line.trim().replace(/^#{1,3}\s+/, '');
      blocks.push({
        type: `heading-${level}`,
        text: headingText,
      });
      continue;
    }

    // Bullet list item
    if (/^[\*\-]\s+/.test(line.trim())) {
      if (currentBlockType !== 'bullet-list') {
        flushBlock();
        currentBlockType = 'bullet-list';
      }
      currentBlockLines.push(line.trim().replace(/^[\*\-]\s+/, ''));
      continue;
    }

    // Empty line separates blocks
    if (!line.trim()) {
      flushBlock();
      continue;
    }

    // Regular paragraph line
    if (currentBlockType !== 'paragraph') {
      flushBlock();
      currentBlockType = 'paragraph';
    }
    currentBlockLines.push(line);
  }

  flushBlock();

  // Group adjacent stage blocks into a stage-grid
  const renderedElements = [];
  let currentStageBatch = [];

  function flushStageBatch(keyPrefix) {
    if (currentStageBatch.length === 0) return;
    renderedElements.push(
      <div key={`stage_grid_${keyPrefix}`} className="stage-grid">
        {currentStageBatch.map((st, sIdx) => {
          const tsSeconds = st.ts ? parseTimeToSeconds(st.ts) : null;
          const ytLink = videoId && tsSeconds !== null
            ? `https://www.youtube.com/watch?v=${videoId}&t=${tsSeconds}`
            : null;

          return (
            <div key={sIdx} className="stage-card">
              <div className="stage-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <span className="stage-num text-code-md">{st.num}</span>
                  <span className="stage-title text-headline-sm">{renderInlineText(st.title, videoId)}</span>
                </div>
                {st.ts && (
                  ytLink ? (
                    <a
                      href={ytLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="timestamp-btn text-code-md"
                      title={`Jump to ${st.ts} on YouTube`}
                    >
                      {st.ts}
                    </a>
                  ) : (
                    <span className="timestamp-btn text-code-md">{st.ts}</span>
                  )
                )}
              </div>
              {st.desc && (
                <div className="stage-desc text-body-md">
                  {renderInlineText(st.desc, videoId)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
    currentStageBatch = [];
  }

  blocks.forEach((block, idx) => {
    if (block.type === 'stage') {
      currentStageBatch.push(block);
      return;
    }

    flushStageBatch(idx);

    if (block.type === 'code') {
      renderedElements.push(
        <CodeBlock key={idx} code={block.code} lang={block.lang} />
      );
    } else if (block.type === 'callout') {
      const calloutText = block.lines.join(' ');
      // Detect title if starts with **Title:**
      let calloutTitle = 'Key Takeaway / मुख्य विश्लेषण:';
      let bodyText = calloutText;
      const titleMatch = calloutText.match(/^\*\*([^*:]+)(?::\*\*|\*\*:\s*|\*\*\s*)(.*)/);
      if (titleMatch) {
        calloutTitle = titleMatch[1].trim() + ':';
        bodyText = titleMatch[2].trim();
      }

      renderedElements.push(
        <div key={idx} className="callout tertiary animate-fade-in">
          <span className="material-symbols-outlined">verified</span>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span className="text-headline-sm callout-title">{calloutTitle}</span>
            <div className="text-body-md callout-text" style={{ marginTop: 4 }}>
              {renderInlineText(bodyText, videoId)}
            </div>
          </div>
        </div>
      );
    } else if (block.type === 'bullet-list') {
      renderedElements.push(
        <ul key={idx} className="markdown-bullet-list">
          {block.lines.map((li, liIdx) => (
            <li key={liIdx} className="markdown-bullet-item text-body-md">
              <span className="bullet-dot" />
              <div className="bullet-content">
                {renderInlineText(li, videoId)}
              </div>
            </li>
          ))}
        </ul>
      );
    } else if (block.type.startsWith('heading-')) {
      const level = block.type.split('-')[1];
      const Tag = `h${level}`;
      renderedElements.push(
        <Tag key={idx} className={`markdown-h${level} text-headline-sm`}>
          {renderInlineText(block.text, videoId)}
        </Tag>
      );
    } else {
      // Paragraph
      renderedElements.push(
        <p key={idx} className="text-body-md response-text-block">
          {renderInlineText(block.lines.join(' '), videoId)}
        </p>
      );
    }
  });

  flushStageBatch('end');

  return (
    <div className="structured-response-container">
      {/* Body elements (paragraphs, stage cards, callouts, lists, code) */}
      <div className="structured-body">
        {renderedElements}
      </div>

      {/* Direct Video Citations footer if timestamps were detected */}
      {citations.length > 0 && (
        <div className="citations-section">
          <span className="text-label-sm citations-label">
            <span className="material-symbols-outlined">videocam</span>
            Direct Video Citations ({citations.length}):
          </span>
          <div className="citations-row">
            {citations.map((c) => (
              <a
                key={c.ts + c.label}
                href={`https://www.youtube.com/watch?v=${videoId}&t=${c.seconds}`}
                target="_blank"
                rel="noopener noreferrer"
                className="citation-btn text-label-md"
                title={`Jump to ${c.ts} in this video`}
              >
                <span className="material-symbols-outlined">play_arrow</span>
                <span className="text-code-md citation-ts">{c.ts}</span>
                <span className="citation-label truncate">{c.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
