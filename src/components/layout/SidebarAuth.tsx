import React from 'react';
import { LogIn, UserPlus, Info, MoreVertical, LogOut } from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  initials?: string;
}

interface SidebarAuthProps {
  user?: UserProfile | null;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onOpenAbout?: () => void;
  onSignOut?: () => void;
}

export const SidebarAuth: React.FC<SidebarAuthProps> = ({
  user = null,
  onSignIn,
  onSignUp,
  onOpenAbout,
  onSignOut
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // If user is logged in: show avatar, username, email, account menu
  if (user) {
    const initials = user.initials || user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

    return (
      <div className="sidebar-auth-card authenticated">
        <div className="profile-avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="profile-avatar-img" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="profile-info">
          <span className="profile-name">{user.name}</span>
          <span className="profile-email">{user.email}</span>
        </div>
        <div className="auth-menu-wrapper">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="icon-btn-subtle"
            title="Account Menu"
            aria-label="Account Menu"
          >
            <MoreVertical size={15} />
          </button>
          {isMenuOpen && (
            <div className="auth-dropdown-menu">
              <button onClick={onOpenAbout} className="auth-dropdown-item">
                <Info size={14} />
                <span>About Avis</span>
              </button>
              <button onClick={onSignOut} className="auth-dropdown-item danger">
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // UI Placeholder for unauthenticated state: Sign In / Sign Up
  return (
    <div className="sidebar-auth-card unauthenticated">
      <div className="auth-action-row">
        <button
          onClick={onSignIn}
          className="auth-btn auth-btn-signin"
          title="Sign In to Avis"
        >
          <LogIn size={13} />
          <span>Sign In</span>
        </button>
        <button
          onClick={onSignUp}
          className="auth-btn auth-btn-signup"
          title="Create an Avis Account"
        >
          <UserPlus size={13} />
          <span>Sign Up</span>
        </button>
      </div>

      <button
        onClick={onOpenAbout}
        className="icon-btn-subtle"
        title="About Avis"
        aria-label="About Avis"
      >
        <Info size={15} />
      </button>
    </div>
  );
};
