import React from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '../i18n';
import '../styles/app-primitives.css';

const languageOrder = ['ar', 'fr', 'en'] as const;
const languageLabels: Record<(typeof languageOrder)[number], string> = {
  ar: 'العربية',
  fr: 'Français',
  en: 'English',
};

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useI18n();

  return (
    <div data-i18n-ignore="true" className="psp-floating-control">
      <span className="psp-floating-control__label">
        <Languages size={14} />
        {t('Language')}
      </span>

      <div className="psp-segmented-control">
        {languageOrder.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLanguage(item)}
            className={`psp-control-pill ${language === item ? 'psp-control-pill--active' : ''}`}
            aria-pressed={language === item}
            title={languageLabels[item]}
            >
              <span
                className={`text-xs font-black uppercase tracking-[0.08em] ${
                  language === item ? 'text-white' : 'text-slate-600'
                }`}
              >
                {item}
              </span>
            <span
              className={`text-xs font-semibold ${
                language === item ? 'text-white/90' : 'text-slate-500'
              }`}
            >
              {languageLabels[item]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
