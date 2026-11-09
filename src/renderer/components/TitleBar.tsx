import React from 'react';
import { Minus, Square, X, SearchCode } from 'lucide-react';
import { APP_NAME } from '../../shared/constants';

interface TitleBarProps {
  currentFileName?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ currentFileName }) => {
  const handleMinimize = () => {
    window.filePeekApi?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.filePeekApi?.maximizeWindow();
  };

  const handleClose = () => {
    window.filePeekApi?.closeWindow();
  };

  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        <div className="titlebar-logo">
          <SearchCode size={16} />
        </div>
        <span>{APP_NAME}</span>
        {currentFileName && (
          <span className="titlebar-pill" title={currentFileName}>
            {currentFileName.length > 36 ? currentFileName.substring(0, 34) + '...' : currentFileName}
          </span>
        )}
      </div>

      <div className="titlebar-controls">
        <button
          className="titlebar-btn"
          onClick={handleMinimize}
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          className="titlebar-btn"
          onClick={handleMaximize}
          aria-label="Maximize"
          title="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          className="titlebar-btn close"
          onClick={handleClose}
          aria-label="Close"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>
    </header>
  );
};
