import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { message } from 'antd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownPreviewProps {
  content: string;
  isDarkMode?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  isDarkMode = false,
}) => {
  const [localDarkMode, setLocalDarkMode] = useState(isDarkMode);

  useEffect(() => {
    setLocalDarkMode(isDarkMode);
  }, [isDarkMode]);

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error('浏览器不支持Clipboard API');
      }
      await navigator.clipboard.writeText(content);
      message.success('复制成功');
    } catch (err) {
      console.error('复制失败:', err);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        textArea.remove();

        if (successful) {
          message.success('复制成功');
        } else {
          throw new Error('复制命令执行失败');
        }
      } catch (fallbackErr) {
        console.error('降级复制方案失败:', fallbackErr);
        message.error('复制失败，请尝试手动复制');
      }
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    padding: '32px',
    backgroundColor: localDarkMode ? '#1f1f1f' : '#ffffff',
    color: localDarkMode ? '#ffffff' : '#000000',
    borderRadius: '12px',
    boxShadow: localDarkMode 
      ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
      : '0 4px 16px rgba(0, 0, 0, 0.08)',
    marginTop: '24px',
    marginBottom: '24px',
    transition: 'all 0.3s ease'
  };

  const copyButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    padding: '6px 16px',
    backgroundColor: localDarkMode ? '#30363d' : '#f0f1f2',
    color: localDarkMode ? '#ffffff' : '#1f2329',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    boxShadow: localDarkMode 
      ? '0 2px 4px rgba(0, 0, 0, 0.2)' 
      : '0 2px 6px rgba(0, 0, 0, 0.06)'
  };

  const markdownStyle: React.CSSProperties = {
    padding: '0 24px',
    maxWidth: '1080px',
    margin: '0 auto',
    fontSize: '15px',
    lineHeight: '1.7',
    color: localDarkMode ? '#ffffff' : '#1f2329'
  };

  // 我们不需要单独定义Code组件，直接在ReactMarkdown的components属性中定义

  return (
    <div style={containerStyle}>
      <button onClick={handleCopy} style={copyButtonStyle}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3H4C3.45 3 3 3.45 3 4V16C3 16.55 3.45 17 4 17H16C16.55 17 17 16.55 17 16V4C17 3.45 16.55 3 16 3ZM15 15H5V5H15V15Z" fill={localDarkMode ? '#ffffff' : '#1f2329'}/>
          <path d="M20 7H8C7.45 7 7 7.45 7 8V20C7 20.55 7.45 21 8 21H20C20.55 21 21 20.55 21 20V8C21 7.45 20.55 7 20 7ZM19 19H9V9H19V19Z" fill={localDarkMode ? '#ffffff' : '#1f2329'}/>
        </svg>
        复制
      </button>
      <div className="markdown-preview" style={markdownStyle}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            code: ({className, children, ...props}) => {
              const match = /language-(\w+)/.exec(className || '');
              const content = String(children).replace(/\n$/, '');
              
              if (match) {
                return (
                  <SyntaxHighlighter
                    style={localDarkMode ? tomorrow as any : prism as any}
                    language={match[1]}
                    PreTag="div"
                    showLineNumbers
                    customStyle={{
                      margin: '16px 0',
                      padding: '20px',
                      borderRadius: '8px',
                      border: `1px solid ${localDarkMode ? '#30363d' : '#e5e6e8'}`,
                      backgroundColor: localDarkMode ? '#161b22' : '#f7f8fa'
                    }}
                  >
                    {content}
                  </SyntaxHighlighter>
                );
              }
              
              return (
                <code
                  className={className}
                  style={{
                    padding: '3px 8px',
                    fontSize: '14px',
                    borderRadius: '4px',
                    backgroundColor: localDarkMode ? '#161b22' : '#f7f8fa',
                    color: localDarkMode ? '#e6edf3' : '#1f2329',
                    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                    border: `1px solid ${localDarkMode ? '#30363d' : '#e5e6e8'}`,
                    wordBreak: 'break-word'
                  }}
                >
                  {content}
                </code>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownPreview;