import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  upcoming?: boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Exercise Library',
    path: '/exercises',
    icon: <DumbbellIcon />,
  },
  {
    label: 'My Programs',
    path: '/programs',
    icon: <ProgramsIcon />,
    upcoming: true,
  },
  {
    label: 'AI Coach',
    path: '/coach',
    icon: <CoachIcon />,
    upcoming: true,
  },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: 'Exercise Import',
    path: '/admin/exercise-import',
    icon: <ImportIcon />,
    adminOnly: true,
  },
];

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-out navigation drawer for authenticated users.
 *
 * Header structure mirrors AppHeader:
 *   <div.app-drawer__header>        — outer container; holds safe-area top padding only
 *     <div.app-drawer__header-bar>  — visible 56 px bar row; children centred vertically
 *
 * Safe-area compensation is applied once, at the outer container level via CSS.
 */
const AppDrawer: React.FC<AppDrawerProps> = ({ open, onClose }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleNav = (path: string, upcoming?: boolean) => {
    if (upcoming) return;
    onClose();
    navigate(path);
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`app-drawer__backdrop${open ? ' app-drawer__backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <nav
        className={`app-drawer${open ? ' app-drawer--open' : ''}`}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Header: outer container takes safe-area padding; inner bar row is always 56 px */}
        <div className="app-drawer__header">
          <div className="app-drawer__header-bar">
            <div className="app-drawer__brand">
              <img
                src="/app-icons/abgFit-192.png"
                alt="abgFit"
                className="app-drawer__logo"
              />
            </div>
            <button
              className="app-drawer__close-btn"
              onClick={onClose}
              aria-label="Close navigation menu"
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="app-drawer__user">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'User avatar'}
                className="app-drawer__avatar"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="app-drawer__user-info">
              <span className="app-drawer__user-name">
                {user.displayName ?? 'User'}
              </span>
              <span className="app-drawer__user-email">{user.email}</span>
            </div>
          </div>
        )}

        {/* Main nav links */}
        <ul className="app-drawer__nav" role="list">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  className={`app-drawer__nav-item${
                    isActive ? ' app-drawer__nav-item--active' : ''
                  }${item.upcoming ? ' app-drawer__nav-item--upcoming' : ''}`}
                  onClick={() => handleNav(item.path, item.upcoming)}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  disabled={item.upcoming}
                >
                  <span className="app-drawer__nav-icon">{item.icon}</span>
                  <span className="app-drawer__nav-label">{item.label}</span>
                  {item.upcoming && (
                    <span className="app-drawer__nav-badge">Soon</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Admin section */}
        <div className="app-drawer__section-divider" aria-hidden="true" />
        <p className="app-drawer__section-label">Admin</p>
        <ul className="app-drawer__nav" role="list">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  className={`app-drawer__nav-item${
                    isActive ? ' app-drawer__nav-item--active' : ''
                  } app-drawer__nav-item--admin`}
                  onClick={() => handleNav(item.path)}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="app-drawer__nav-icon">{item.icon}</span>
                  <span className="app-drawer__nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Sign out */}
        <div className="app-drawer__footer">
          <button
            className="app-drawer__signout-btn"
            onClick={handleSignOut}
            type="button"
          >
            <SignOutIcon />
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
};

// --- Inline SVG icons ---

function DumbbellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="10" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="18" y="10" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="8" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="17" y="8" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ProgramsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="7" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CoachIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.527 3.655 1.44 5.16L2 22l4.84-1.44A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default AppDrawer;
