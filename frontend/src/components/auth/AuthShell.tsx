import React from 'react';
import { ArrowLeft, LucideIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/auth.css';

interface AuthHighlight {
  icon: LucideIcon;
  title: string;
  description: string;
  value?: string;
}

interface AuthShellProps {
  badge: string;
  title: string;
  subtitle: string;
  asideTitle: string;
  asideDescription: string;
  highlights: AuthHighlight[];
  children: React.ReactNode;
  footer?: React.ReactNode;
  intentNote?: string | null;
}

const AuthShell: React.FC<AuthShellProps> = ({
  badge,
  title,
  subtitle,
  asideTitle,
  asideDescription,
  highlights,
  children,
  footer,
  intentNote,
}) => {
  return (
    <div className="auth-shell">
      <div className="auth-shell__container">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link to="/" className="auth-brand">
            <span className="auth-brand__icon">
              <Sparkles size={18} />
            </span>
            <span>
              <span className="auth-brand__title">ProServices</span>
              <span className="auth-brand__sub">Trusted local professionals in Algeria</span>
            </span>
          </Link>

          <Link to="/" className="auth-backlink">
            <ArrowLeft size={15} />
            Back to marketplace
          </Link>
        </div>

        <div className="auth-shell__card">
          <aside className="auth-shell__aside">
            <div className="auth-shell__eyebrow">{badge}</div>
            <h1 className="auth-shell__aside-title">{asideTitle}</h1>
            <p className="auth-shell__aside-copy">{asideDescription}</p>

            {intentNote ? (
              <div className="auth-shell__intent">
                <div className="auth-shell__intent-label">Saved intent</div>
                <div>{intentNote}</div>
              </div>
            ) : null}

            <div className="auth-shell__highlight-grid">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="auth-shell__highlight">
                    <div className="auth-shell__highlight-icon">
                      <Icon size={18} />
                    </div>
                    <div className="auth-shell__highlight-title">{item.title}</div>
                    {item.value ? <div className="auth-shell__highlight-value">{item.value}</div> : null}
                    <div className="auth-shell__highlight-copy">{item.description}</div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="auth-shell__content">
            <div className="auth-shell__content-header">
              <div className="auth-shell__content-badge">{badge}</div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>

            <div>{children}</div>

            {footer ? <div className="auth-shell__footer">{footer}</div> : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
