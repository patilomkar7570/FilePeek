import React from 'react';
import { SearchCode, Sun, Moon, Laptop, Settings as SettingsIcon, Plus } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../shared/constants';
import { ThemeMode } from '../../shared/types';

interface HeaderProps {
  theme: ThemeMode;
  onThemeCycle: () => void;
  onOpenSettings: () => void;
  isInspectingFile: boolean;
  onNewInspection: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeCycle,
  onOpenSettings,
  isInspectingFile,
  onNewInspection,
}) => {
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={17} />;
      case 'dark':
        return <Moon size={17} />;
      default:
        return <Laptop size={17} />;
    }
  };

  const getThemeTitle = () => {
    switch (theme) {
      case 'light':
        return 'Theme: Light (Click to switch)';
      case 'dark':
        return 'Theme: Dark (Click to switch)';
      default:
        return 'Theme: System (Click to switch)';
    }
  };

  return (
    <header className="app-header">
      <div className="app-brand" style={{ cursor: isInspectingFile ? 'pointer' : 'default' }} onClick={isInspectingFile ? onNewInspection : undefined}>
        <div className="brand-icon-box">
          <SearchCode size={20} />
        </div>
        <div className="brand-text-col">
          <span className="brand-name">{APP_NAME}</span>
          <span className="brand-tagline">{APP_TAGLINE}</span>
        </div>
      </div>

      <div className="header-actions">
        {isInspectingFile && (
          <button className="peek-btn peek-btn-secondary" onClick={onNewInspection} title="Inspect another file">
            <Plus size={15} />
            <span>New Inspection</span>
          </button>
        )}

        <button
          className="peek-btn peek-btn-ghost"
          onClick={onThemeCycle}
          title={getThemeTitle()}
          style={{ padding: '8px 10px' }}
        >
          {getThemeIcon()}
        </button>

        <button
          className="peek-btn peek-btn-ghost"
          onClick={onOpenSettings}
          title="Settings & Privacy"
          style={{ padding: '8px 10px' }}
        >
          <SettingsIcon size={17} />
        </button>
      </div>
    </header>
  );
};
