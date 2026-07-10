import React from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/exercises': 'Exercise Library',
  '/programs': 'My Programs',
  '/coach': 'AI Coach',
};

function resolveTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? '';
}

interface AppHeaderProps {
  onMenuClick: () => void;
}

/**
 * Compact mobile-first authenticated header.
 *
 * Structure:
 *   <header.app-header>          — sticky outer container; holds safe-area top padding only
 *     <div.app-header__bar>      — visible 56 px bar row; children centred vertically
 *       brand | page title | menu button
 *
 * Safe-area compensation is applied once, at the outer container level via CSS.
 * The inner bar row height is always 56 px regardless of device / inset.
 */
const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const pageTitle = resolveTitle(pathname);

  return (
    <header className="app-header">
      <div className="app-header__bar">
        {/* Brand */}
        <div className="app-header__brand">
          <img
            src="/app-icons/abgFit-192.png"
            alt="abgFit"
            className="app-header__logo"
          />
        </div>

        {/* Current page title */}
        <span className="app-header__page-title">{pageTitle}</span>

        {/* Hamburger */}
        <button
          className="app-header__menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          type="button"
        >
          <HamburgerIcon />
        </button>
      </div>
    </header>
  );
};

const HamburgerIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="2" y="5" width="18" height="2" rx="1" fill="currentColor" />
    <rect x="2" y="10" width="18" height="2" rx="1" fill="currentColor" />
    <rect x="2" y="15" width="18" height="2" rx="1" fill="currentColor" />
  </svg>
);

export default AppHeader;
