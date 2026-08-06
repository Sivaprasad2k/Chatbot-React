import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { ArtifactViewer } from './ArtifactViewer';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-card">
      <div className="code-block-header">
        <span>{language || 'code'}</span>
        <button onClick={handleCopy} className="code-copy-btn">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <pre className="code-block-pre">
        <code>{code}</code>
      </pre>

      <ArtifactViewer code={code} language={language || ''} />
    </div>
  );
};
