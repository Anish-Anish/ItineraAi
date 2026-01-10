import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  // Simple markdown parser for common patterns
  const parseMarkdown = (text: string) => {
    // Split by lines to handle line breaks
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
      // Headers
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={lineIndex} className="text-base font-bold mt-3 mb-2">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={lineIndex} className="text-lg font-bold mt-4 mb-2">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith("# ")) {
        elements.push(
          <h1 key={lineIndex} className="text-xl font-bold mt-4 mb-3">
            {line.substring(2)}
          </h1>
        );
      }
      // Bullet lists
      else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().substring(2);
        elements.push(
          <li key={lineIndex} className="ml-4 mb-1">
            {parseInlineMarkdown(content)}
          </li>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line.trim())) {
        const content = line.trim().replace(/^\d+\.\s/, "");
        elements.push(
          <li key={lineIndex} className="ml-4 mb-1 list-decimal">
            {parseInlineMarkdown(content)}
          </li>
        );
      }
      // Horizontal rule
      else if (line.trim() === "---" || line.trim() === "***") {
        elements.push(<hr key={lineIndex} className="my-3 border-gray-300" />);
      }
      // Empty line
      else if (line.trim() === "") {
        elements.push(<br key={lineIndex} />);
      }
      // Regular paragraph
      else {
        elements.push(
          <p key={lineIndex} className="mb-2">
            {parseInlineMarkdown(line)}
          </p>
        );
      }
    });

    return elements;
  };

  // Parse inline markdown (bold, italic, code, links)
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let key = 0;

    // Process text sequentially to avoid overlapping matches
    // Order matters: process ** before *, __ before _
    let processedText = text;
    const replacements: Array<{
      placeholder: string;
      element: React.ReactNode;
    }> = [];

    // Replace bold (**text**) first
    processedText = processedText.replace(
      /\*\*(.+?)\*\*/g,
      (match, content) => {
        const placeholder = `__BOLD_${key}__`;
        replacements.push({
          placeholder,
          element: (
            <strong key={key++} className="font-bold">
              {content}
            </strong>
          ),
        });
        return placeholder;
      }
    );

    // Replace bold (__text__)
    processedText = processedText.replace(/__(.+?)__/g, (match, content) => {
      const placeholder = `__BOLD_${key}__`;
      replacements.push({
        placeholder,
        element: (
          <strong key={key++} className="font-bold">
            {content}
          </strong>
        ),
      });
      return placeholder;
    });

    // Replace italic (*text*) - now safe since ** is already replaced
    processedText = processedText.replace(/\*(.+?)\*/g, (match, content) => {
      const placeholder = `__ITALIC_${key}__`;
      replacements.push({
        placeholder,
        element: (
          <em key={key++} className="italic">
            {content}
          </em>
        ),
      });
      return placeholder;
    });

    // Replace italic (_text_)
    processedText = processedText.replace(/_(.+?)_/g, (match, content) => {
      const placeholder = `__ITALIC_${key}__`;
      replacements.push({
        placeholder,
        element: (
          <em key={key++} className="italic">
            {content}
          </em>
        ),
      });
      return placeholder;
    });

    // Replace code (`text`)
    processedText = processedText.replace(/`(.+?)`/g, (match, content) => {
      const placeholder = `__CODE_${key}__`;
      replacements.push({
        placeholder,
        element: (
          <code
            key={key++}
            className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono"
          >
            {content}
          </code>
        ),
      });
      return placeholder;
    });

    // Replace links ([text](url))
    processedText = processedText.replace(
      /\[(.+?)\]\((.+?)\)/g,
      (match, linkText, url) => {
        const placeholder = `__LINK_${key}__`;
        replacements.push({
          placeholder,
          element: (
            <a
              key={key++}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {linkText}
            </a>
          ),
        });
        return placeholder;
      }
    );

    // Now split by placeholders and rebuild with React elements
    const segments = processedText.split(/(__(?:BOLD|ITALIC|CODE|LINK)_\d+__)/);

    return segments.map((segment, index) => {
      const replacement = replacements.find((r) => r.placeholder === segment);
      return replacement ? replacement.element : segment;
    });
  };

  return <div className={className}>{parseMarkdown(content)}</div>;
};

export default MarkdownRenderer;
