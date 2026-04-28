import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import '../../styles/app-primitives.css';

interface PublicAuthSceneProps {
  children: React.ReactNode;
  accent?: 'blue' | 'teal';
}

const ACCENT_STYLES: Record<NonNullable<PublicAuthSceneProps['accent']>, string> = {
  blue: 'from-blue-600 to-blue-500',
  teal: 'from-teal-600 to-teal-500',
};

const PublicAuthScene: React.FC<PublicAuthSceneProps> = ({
  children,
  accent = 'blue',
}) => {
  const { t } = useI18n();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/auth-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(248,250,252,0.96),rgba(248,250,252,0.92),rgba(241,245,249,0.88))]" />
        <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <header className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="psp-desktop-frame flex h-14 items-center justify-between">
          <Link to="/" className="group flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${ACCENT_STYLES[accent]} shadow-sm transition-shadow group-hover:shadow-md`}
            >
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">ProServices</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Back to marketplace')}</span>
            <span className="sm:hidden">{t('Back')}</span>
          </Link>
        </div>
      </header>

      {children}
    </div>
  );
};

export default PublicAuthScene;
