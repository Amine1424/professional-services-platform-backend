import React from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { useI18n } from '../../i18n';
import {
  buildGoogleMapsSearchUrl,
  estimateTravelLabel,
} from '../../lib/algeria';
import { PublicProviderPayload } from './types';

interface ProviderProfileDetailsProps {
  provider: PublicProviderPayload['provider'];
  providerLocation: string;
  customerGeo?: {
    preferredRegion?: string | null;
    preferredWilaya?: string | null;
  };
}

const ProviderProfileDetails: React.FC<ProviderProfileDetailsProps> = ({
  provider,
  providerLocation,
  customerGeo,
}) => {
  const { t } = useI18n();

  const mapsQuery = `${provider.companyName} ${provider.city || ''} ${provider.wilaya || ''} Algeria`.trim();
  const travelEstimate = estimateTravelLabel({
    providerCoverageMode: provider.serviceCoverage.mode,
    providerWilaya: provider.wilaya,
    providerRegion: provider.region,
    customerWilaya: customerGeo?.preferredWilaya,
    customerRegion: customerGeo?.preferredRegion,
  });

  return (
    <section id="provider-reach" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>{t('Operational details')}</h2>
            <div className="psp-surface__sub">
              {t(
                'Keep booking context, coverage, and contact visibility in one compact support block.'
              )}
            </div>
          </div>
        </div>

        <div className="psp-detail-grid">
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">{t('Primary category')}</div>
            <div className="psp-detail-item__value">
              {provider.primaryCategory?.name || t('Not specified')}
            </div>
          </div>
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">{t('Base location')}</div>
            <div className="psp-detail-item__value">{providerLocation}</div>
          </div>
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">{t('Service coverage')}</div>
            <div className="psp-detail-item__value">{provider.serviceCoverage.label}</div>
          </div>
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">{t('Travel estimate')}</div>
            <div className="psp-detail-item__value">{travelEstimate}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] bg-slate-50 px-4 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Email')}
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-700">
              {provider.contact.email || t('Hidden')}
            </div>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-4 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Phone')}
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-700">
              {provider.contact.phoneNumber || t('Hidden')}
            </div>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-4 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Address')}
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-700">
              {provider.contact.addressLine || t('Hidden')}
            </div>
          </div>
        </div>
      </article>

      <article className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>{t('Location handoff')}</h2>
            <div className="psp-surface__sub">
              {t(
                'Use map handoff only when visit planning or on-site scope matters.'
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
            <MapPin size={13} />
            {t('Map destination')}
          </div>
          <div className="mt-4 text-[24px] font-black tracking-tight text-slate-900">
            {provider.companyName}
          </div>
          <div className="mt-2 text-sm leading-7 text-slate-600">{providerLocation}</div>
          <div className="mt-4 text-sm leading-7 text-slate-600">
            {t(
              'Open external navigation only when the customer needs to validate an on-site visit or travel fit.'
            )}
          </div>
        </div>

        <a
          href={buildGoogleMapsSearchUrl(mapsQuery)}
          target="_blank"
          rel="noreferrer"
          className="psp-button psp-button--secondary mt-5"
        >
          <Navigation size={16} />
          <ExternalLink size={14} />
          {t('Open in Google Maps')}
        </a>
      </article>
    </section>
  );
};

export default ProviderProfileDetails;
