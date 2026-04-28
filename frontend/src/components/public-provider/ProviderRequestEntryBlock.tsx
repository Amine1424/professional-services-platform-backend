import React from 'react';
import { MessageCircle, Send, Zap } from 'lucide-react';
import { useI18n } from '../../i18n';
import { PublicProviderPayload } from './types';

interface ProviderRequestEntryBlockProps {
  provider: PublicProviderPayload['provider'];
  onMessage: () => void;
  onRequest: () => void;
}

const ProviderRequestEntryBlock: React.FC<ProviderRequestEntryBlockProps> = ({
  provider,
  onMessage,
  onRequest,
}) => {
  const { t } = useI18n();

  const responseTimeLabel =
    provider.responseTimeMinutes && provider.responseTimeMinutes > 0
      ? provider.responseTimeMinutes < 60
        ? `${t('Usually responds within')} ${provider.responseTimeMinutes} ${t('min')}`
        : `${t('Usually responds within')} ${Math.ceil(provider.responseTimeMinutes / 60)} ${t(
            'hours'
          )}`
      : t('Response time shown after the provider receives the brief');

  return (
    <section className="relative z-10 -mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Zap size={16} className="text-blue-600" />
            <span>
              <span className="font-medium text-slate-950">{provider.responseRate || 0}%</span>{' '}
              {t('response rate')}
            </span>
          </div>
          <div className="hidden h-4 w-px bg-slate-200 sm:block" />
          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-950">{responseTimeLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMessage}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-slate-900"
          >
            <MessageCircle size={16} />
            {t('Message')}
          </button>

          <button
            type="button"
            onClick={onRequest}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Send size={16} />
            {t('Request a Quote')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProviderRequestEntryBlock;
