import React from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
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
            <h2>Reach, trust, and booking context</h2>
            <div className="psp-surface__sub">
              Keep only the support context needed after the service and proof sections are already
              clear.
            </div>
          </div>
        </div>

        <div className="psp-detail-grid">
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">Primary category</div>
            <div className="psp-detail-item__value">
              {provider.primaryCategory?.name || 'Not specified'}
            </div>
          </div>
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">Base location</div>
            <div className="psp-detail-item__value">{providerLocation}</div>
          </div>
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">Service coverage</div>
            <div className="psp-detail-item__value">{provider.serviceCoverage.label}</div>
          </div>
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">Travel estimate</div>
            <div className="psp-detail-item__value">{travelEstimate}</div>
          </div>
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">Plan</div>
            <div className="psp-detail-item__value">
              {provider.preference.selectedPlan.toUpperCase()}
            </div>
          </div>
          <div className="psp-detail-item">
            <div className="psp-detail-item__label">Moderation status</div>
            <div className="psp-detail-item__value capitalize">{provider.status}</div>
          </div>
        </div>

        <div className="mt-6 psp-summary-strip">
          <span className="psp-summary-chip">
            <strong>Email</strong>
            {provider.contact.email || 'Hidden'}
          </span>
          <span className="psp-summary-chip">
            <strong>Phone</strong>
            {provider.contact.phoneNumber || 'Hidden'}
          </span>
          <span className="psp-summary-chip">
            <strong>Address</strong>
            {provider.contact.addressLine || 'Hidden'}
          </span>
        </div>
      </article>

      <article className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>Location handoff</h2>
            <div className="psp-surface__sub">
              Use map handoff only when visit planning or on-site scope matters. It is supporting
              context, not the main decision surface.
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
            <MapPin size={13} />
            Map destination
          </div>
          <div className="mt-4 text-[24px] font-black tracking-tight text-slate-900">
            {provider.companyName}
          </div>
          <div className="mt-2 text-sm leading-7 text-slate-600">{providerLocation}</div>

          <div className="mt-5 psp-summary-strip">
            <span className="psp-summary-chip">
              <strong>Coverage</strong>
              {provider.serviceCoverage.label}
            </span>
            <span className="psp-summary-chip">
              <strong>Travel fit</strong>
              {travelEstimate}
            </span>
            <span className="psp-summary-chip">
              <ExternalLink size={14} />
              <strong>Maps handoff</strong>
              external navigation only when needed
            </span>
          </div>
        </div>

        <a
          href={buildGoogleMapsSearchUrl(mapsQuery)}
          target="_blank"
          rel="noreferrer"
          className="psp-button psp-button--primary mt-5"
        >
          <Navigation size={16} />
          Open in Google Maps
        </a>
      </article>
    </section>
  );
};

export default ProviderProfileDetails;
