import React from 'react';
import { BadgeCheck, Clock3, Heart, MapPin, MessageCircle, Quote, Star } from 'lucide-react';
import { PublicProviderPayload } from './types';

interface ProviderHeroProps {
  provider: PublicProviderPayload['provider'];
  providerLocation: string;
  ownerName: string;
  isFavorite: boolean;
  storiesCount?: number;
  onOpenStories?: () => void;
  onMessage: () => void;
  onRequest: () => void;
  onToggleFavorite: () => void;
}

const ProviderHero: React.FC<ProviderHeroProps> = ({
  provider,
  providerLocation,
  ownerName,
  isFavorite,
  storiesCount = 0,
  onOpenStories,
  onMessage,
  onRequest,
  onToggleFavorite,
}) => {
  return (
    <section id="provider-overview" className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_45px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap gap-3">
          {provider.preference.profileBadgeText ? (
            <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
              {provider.preference.profileBadgeText}
            </span>
          ) : null}
          {provider.isVerified ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <BadgeCheck size={14} />
              Verified provider
            </span>
          ) : null}
          {provider.preference.featuredOnHomepage ? (
            <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
              Featured
            </span>
          ) : null}
          {storiesCount > 0 ? (
            <span className="rounded-full bg-fuchsia-600 px-3 py-1 text-xs font-bold text-white">
              {storiesCount} active stor{storiesCount === 1 ? 'y' : 'ies'}
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="h-24 w-24 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">
            <img
              src={
                provider.avatarUrl ||
                provider.coverUrl ||
                'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80'
              }
              alt={provider.companyName}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-[34px] font-black tracking-tight text-slate-900">
              {provider.companyName}
            </h1>
            <div className="mt-2 text-sm font-semibold text-slate-500">
              {ownerName || 'Provider account'}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <MapPin size={15} />
                {providerLocation}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                {provider.serviceCoverage.label}
              </span>
              <span className="inline-flex items-center gap-2">
                <Star size={15} fill="currentColor" className="text-amber-400" />
                {Number(provider.averageRating || 0).toFixed(1)} ({provider.reviewsCount} reviews)
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 size={15} />
                {provider.responseTimeMinutes || 0} min
              </span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-[16px] leading-8 text-slate-600">
          {provider.description || 'This provider has not added a professional summary yet.'}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="psp-button psp-button--primary" onClick={onMessage}>
            <MessageCircle size={16} />
            Message provider
          </button>
          <button type="button" className="psp-button psp-button--secondary" onClick={onRequest}>
            <Quote size={16} />
            Request a quote
          </button>
          <button
            type="button"
            className="psp-control-pill"
            onClick={onToggleFavorite}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? 'Saved to favorites' : 'Save provider'}
          </button>
          {storiesCount > 0 && onOpenStories ? (
            <button
              type="button"
              className="psp-control-pill"
              onClick={onOpenStories}
            >
              View stories
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[30px] border border-white/80 shadow-[0_24px_45px_rgba(15,23,42,0.12)]">
        <img
          src={
            provider.coverUrl ||
            provider.avatarUrl ||
            'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80'
          }
          alt={provider.companyName}
          className="h-full min-h-[340px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.68))]" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
            {provider.primaryCategory?.name || 'Professional services'}
          </div>
          <div className="mt-3 text-[28px] font-black tracking-tight">{provider.companyName}</div>
          <div className="mt-2 text-sm text-white/80">{provider.serviceCoverage.label}</div>
        </div>
      </div>
    </section>
  );
};

export default ProviderHero;
