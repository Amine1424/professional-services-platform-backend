import React, { useMemo } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Navigation,
  Phone,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { buildGoogleMapsSearchUrl } from '../../lib/algeria';
import { PublicProviderPayload } from './types';

interface ProviderProfileDetailsProps {
  provider: PublicProviderPayload['provider'];
  providerLocation: string;
  customerGeo?: {
    preferredRegion?: string | null;
    preferredWilaya?: string | null;
  };
}

const formatMemberSince = (value?: string | null, locale = 'en-GB') => {
  if (!value) return '';

  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
};

const ProviderProfileDetails: React.FC<ProviderProfileDetailsProps> = ({
  provider,
  providerLocation,
}) => {
  const { locale, t } = useI18n();

  const mapsQuery = `${provider.companyName} ${provider.city || ''} ${provider.wilaya || ''} Algeria`.trim();
  const memberSinceLabel = formatMemberSince(provider.createdAt, locale);
  const coverageAreas = useMemo(() => {
    const regions = provider.serviceCoverage.regions || [];
    if (regions.length) {
      return regions;
    }

    return [provider.city, provider.wilaya, provider.region].filter(Boolean) as string[];
  }, [provider.city, provider.region, provider.serviceCoverage.regions, provider.wilaya]);

  return (
    <section id="provider-support" className="mb-10 border-t border-slate-200 py-10">
      <h2 className="mb-6 text-xl font-semibold text-slate-950">{t('Business Details')}</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-slate-500">
            {t('Contact Information')}
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <div className="text-sm text-slate-500">{t('Response time')}</div>
                <div className="font-medium text-slate-950">
                  {provider.responseTimeMinutes
                    ? `${provider.responseTimeMinutes} ${t('min')}`
                    : t('Not shared')}
                </div>
              </div>
            </div>

            {provider.contact.phoneNumber ? (
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">{t('Phone')}</div>
                  <a
                    href={`tel:${provider.contact.phoneNumber}`}
                    className="font-medium text-slate-950 transition hover:text-blue-600"
                  >
                    {provider.contact.phoneNumber}
                  </a>
                </div>
              </div>
            ) : null}

            {provider.contact.email ? (
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">{t('Email')}</div>
                  <a
                    href={`mailto:${provider.contact.email}`}
                    className="font-medium text-slate-950 transition hover:text-blue-600"
                  >
                    {provider.contact.email}
                  </a>
                </div>
              </div>
            ) : null}

            {provider.contact.website ? (
              <div className="flex items-start gap-3">
                <Globe size={18} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">{t('Website')}</div>
                  <a
                    href={provider.contact.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-slate-950 transition hover:text-blue-600"
                  >
                    {provider.contact.website}
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ) : null}

            {memberSinceLabel ? (
              <div className="flex items-start gap-3 border-t border-slate-200 pt-4">
                <Calendar size={18} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">{t('Member Since')}</div>
                  <div className="font-medium text-slate-950">{memberSinceLabel}</div>
                </div>
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-slate-500">
            {t('Service Area')}
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <div className="text-sm text-slate-500">{t('Based in')}</div>
                <div className="font-medium text-slate-950">{providerLocation}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm text-slate-500">{t('Service Coverage')}</div>
              <div className="flex flex-wrap gap-2">
                {coverageAreas.length ? (
                  coverageAreas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {provider.serviceCoverage.label}
                  </span>
                )}
              </div>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-xl bg-slate-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100" />
              <div className="relative flex aspect-[16/9] flex-col items-center justify-center p-6 text-center">
                <MapPin size={28} className="mb-2 text-blue-600" />
                <p className="text-sm text-slate-500">{providerLocation}</p>
                <a
                  href={buildGoogleMapsSearchUrl(mapsQuery)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                >
                  <Navigation size={14} />
                  {t('Open in Maps')}
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default ProviderProfileDetails;
