import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import PublicMarketplaceLayout from '../components/PublicMarketplaceLayout';
import { useI18n } from '../i18n';
import { getStoredUser } from '../lib/role-routing';
import '../styles/app-primitives.css';

type CategoryItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
};

type FeaturedProvider = {
  id: string;
  companyName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  wilaya?: string | null;
  region?: string | null;
  averageRating?: number | string | null;
  reviewsCount?: number | string | null;
  isVerified?: boolean;
  profileBadgeText?: string | null;
  primaryCategory?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
};

type StoryItem = {
  id: string;
  providerId: string;
  title?: string;
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
};

type DiscoveryHomePayload = {
  featuredProviders: FeaturedProvider[];
  featuredServices: Array<unknown>;
  stories: StoryItem[];
};

const fallbackCategories: CategoryItem[] = [
  {
    id: 'home-maintenance',
    name: 'Home Maintenance',
    slug: 'home-maintenance',
    description: 'Electricians, plumbers, carpenters, painters, and home repairs.',
  },
  {
    id: 'digital-services',
    name: 'Digital Services',
    slug: 'digital-services',
    description: 'Design, development, marketing, branding, and online business support.',
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Fitness, nutrition, beauty, and personal care professionals.',
  },
  {
    id: 'event-planning',
    name: 'Event Planning',
    slug: 'event-planning',
    description: 'Photography, decoration, catering, venues, and event execution.',
  },
];

const fallbackStories = [
  {
    id: 'story-1',
    title: "Ahmed's Tips",
    thumbnailUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'story-2',
    title: 'DIY Guides',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'story-3',
    title: 'Local Trends',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'story-4',
    title: 'Top Work',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=300&q=80',
  },
];

const fallbackProviderVisuals = [
  {
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    role: 'Graphic Designer',
    badge: 'Top Seller',
    tone: 'bg-amber-500',
  },
  {
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    role: 'Electrician',
    badge: 'Highly Rated',
    tone: 'bg-blue-600',
  },
  {
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    role: 'Fitness Coach',
    badge: 'Popular',
    tone: 'bg-emerald-500',
  },
  {
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    role: 'Plumber',
    badge: 'Certified Pro',
    tone: 'bg-indigo-600',
  },
];

const categoryVisuals = [
  { icon: 'HM', glow: 'from-orange-100 via-white to-orange-50' },
  { icon: 'DS', glow: 'from-blue-100 via-white to-sky-50' },
  { icon: 'HW', glow: 'from-emerald-100 via-white to-teal-50' },
  { icon: 'EV', glow: 'from-slate-100 via-white to-indigo-50' },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useMemo(() => getStoredUser(), []);

  const [serviceQuery, setServiceQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>(fallbackCategories);
  const [homePayload, setHomePayload] = useState<DiscoveryHomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [homeResponse, categoriesResponse] = await Promise.all([
          api.get('/discovery/home'),
          api.get('/discovery/categories'),
        ]);

        if (!active) return;

        setHomePayload(homeResponse.data?.data || null);
        setCategories(categoriesResponse.data?.data?.length ? categoriesResponse.data.data : fallbackCategories);
        setWarning(null);
      } catch {
        if (!active) return;
        setWarning(t('Live marketplace data is temporarily unavailable. Showing curated examples.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [t]);

  const runSearch = () => {
    const params = new URLSearchParams();

    if (serviceQuery.trim()) params.set('q', serviceQuery.trim());
    if (locationQuery.trim()) params.set('loc', locationQuery.trim());
    if (categoryQuery.trim()) params.set('category', categoryQuery.trim());

    navigate(`/explore${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleAddStory = () => {
    if (currentUser?.role === 'service_provider') {
      navigate('/provider/portfolio');
      return;
    }

    navigate('/join/provider');
  };

  const storyItems = useMemo(() => {
    if (homePayload?.stories?.length) {
      return homePayload.stories.slice(0, 4).map((story, index) => ({
        id: story.id,
        label: story.title || `${t('Story')} ${index + 1}`,
        image: story.thumbnailUrl || story.mediaUrl || fallbackStories[index % fallbackStories.length].thumbnailUrl,
        providerId: story.providerId,
      }));
    }

    return fallbackStories.map((story, index) => ({
      id: story.id,
      label: story.title,
      image: story.thumbnailUrl,
      providerId: '',
    }));
  }, [homePayload, t]);

  const providerCards = useMemo(() => {
    const featuredProviders = homePayload?.featuredProviders?.length
      ? homePayload.featuredProviders.slice(0, 4)
      : fallbackProviderVisuals.map((visual, index) => ({
          id: `fallback-${index}`,
          companyName: ['Sarah Hamed', 'Ali Mansour', 'Nour Alami', 'Omar Fehmi'][index],
          averageRating: [4.8, 4.9, 4.7, 4.85][index],
          reviewsCount: [336, 530, 326, 335][index],
          isVerified: true,
          profileBadgeText: visual.badge,
          primaryCategory: {
            id: `fallback-category-${index}`,
            name: visual.role,
          },
          city: ['Algiers', 'Oran', 'Constantine', 'Blida'][index],
          coverUrl: visual.image,
        }));

    return featuredProviders.map((provider, index) => {
      const visual = fallbackProviderVisuals[index % fallbackProviderVisuals.length];

        return {
          id: provider.id,
          companyName: provider.companyName,
          role: provider.primaryCategory?.name || visual.role,
          image: ('coverUrl' in provider ? provider.coverUrl : null) || ('avatarUrl' in provider ? provider.avatarUrl : null) || visual.image,
          rating: Number(provider.averageRating || 4.8),
        reviews: Number(provider.reviewsCount || 0),
        badge: provider.profileBadgeText || visual.badge,
        tone: visual.tone,
        location:
          [
            'city' in provider ? provider.city : null,
            'wilaya' in provider ? provider.wilaya : null,
            'region' in provider ? provider.region : null,
          ]
            .filter(Boolean)
            .join(', ') || t('Algeria'),
        verified: Boolean(provider.isVerified),
      };
    });
  }, [homePayload, t]);

  const heroProvider = providerCards[1] || providerCards[0];

  return (
    <PublicMarketplaceLayout
      activeNav="explore"
      backgroundImageUrl="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2200&q=80"
    >
      <section className="grid gap-8 pt-8 xl:grid-cols-[1.25fr_0.82fr] xl:items-center">
        <div className="max-w-[700px]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
            <BadgeCheck size={14} />
            {t('Verified local professionals, trusted by customers')}
          </div>
          <h1 className="max-w-[560px] text-[38px] font-black leading-[1.02] tracking-tight text-slate-900 md:text-[54px]">
            {t('Find the Right Professional')}
            <span className="mt-1 block font-semibold text-slate-700">{t('for Your Needs')}</span>
          </h1>
          <p className="mt-5 max-w-[520px] text-[16px] leading-8 text-slate-500 md:text-[20px] md:leading-9">
            {t(
              'Connect with trusted service providers in Algeria, compare quality signals, and move from search to request without friction.'
            )}
          </p>

          <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)]">
            <div className="grid lg:grid-cols-[1.15fr_0.75fr_0.85fr_auto]">
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 lg:border-b-0 lg:border-r">
                <Search size={18} className="text-slate-400" />
                <input
                  value={serviceQuery}
                  onChange={(event) => setServiceQuery(event.target.value)}
                  placeholder={t('What service do you need?')}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 lg:border-b-0 lg:border-r">
                <MapPin size={18} className="text-slate-400" />
                <input
                  value={locationQuery}
                  onChange={(event) => setLocationQuery(event.target.value)}
                  placeholder={t('Location / Wilaya')}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
                <ChevronDown size={16} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 lg:border-b-0 lg:border-r">
                <select
                  value={categoryQuery}
                  onChange={(event) => setCategoryQuery(event.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="">{t('All Categories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug || category.id}>
                      {t(category.name)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="shrink-0 text-slate-400" />
              </div>
              <button
                onClick={runSearch}
                className="flex items-center justify-center gap-2 bg-blue-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {t('Search')}
              </button>
            </div>
          </div>

          {warning ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {warning}
            </div>
          ) : null}

          <div className="mt-8 rounded-[30px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_45px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-5">
              {storyItems.map((story) => (
                <button
                  key={story.id}
                  onClick={() =>
                    story.providerId
                      ? navigate(
                          `/providers/${story.providerId}?storyId=${encodeURIComponent(story.id)}`
                        )
                      : undefined
                  }
                  className="group flex min-w-[86px] flex-col items-center gap-2 text-center"
                >
                  <div className="relative">
                    <div className="h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white shadow-lg ring-2 ring-slate-200">
                      <img
                        src={story.image}
                        alt={story.label}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-blue-600 text-white shadow">
                      +
                    </span>
                  </div>
                  <span className="max-w-[92px] truncate text-[13px] font-semibold text-slate-700">
                    {story.label}
                  </span>
                </button>
              ))}
              <button onClick={handleAddStory} className="flex min-w-[92px] flex-col items-center gap-2 text-center">
                <div className="grid h-[82px] w-[82px] place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
                  <span className="text-3xl leading-none">+</span>
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  {currentUser?.role === 'service_provider'
                    ? t('Add Story')
                    : t('Become a Provider')}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 translate-x-10 translate-y-6 rounded-[34px] bg-[radial-gradient(circle_at_center,_rgba(94,129,219,0.16),_transparent_64%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-white/70 shadow-[0_30px_60px_rgba(45,69,109,0.18)]">
            <img
              src={
                heroProvider?.image ||
                'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80'
              }
              alt={heroProvider?.companyName || t('Top Rated Professional')}
              className="h-[520px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,24,40,0.04),rgba(16,24,40,0.68))]" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1 text-xs font-bold backdrop-blur">
                {t('Top Rated')}
              </div>
              <div className="max-w-[280px] text-[22px] font-black leading-tight md:text-[34px]">
                {heroProvider?.companyName || t('Top Rated Professionals Near You')}
              </div>
              <div className="mt-2 text-base text-white/85">
                {heroProvider?.role || t('Professional Services')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>{t('Start with one clear next step')}</h2>
            <div className="psp-surface__sub">
              {t(
                'Search is still the main entry. These shortcuts are for users who already know whether they want to explore, message, or request.'
              )}
            </div>
          </div>
          <button
            type="button"
            className="psp-button psp-button--secondary"
            onClick={() => navigate('/explore')}
          >
            {t('Open marketplace')}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: t('Browse verified providers'),
              description: t('Use ranking and category filters to shortlist faster.'),
              icon: Sparkles,
              action: () => navigate('/explore?sort=verified'),
            },
            {
              title: t('Open messages'),
              description: t('Continue provider conversations without restarting discovery.'),
              icon: MessageCircle,
              action: () =>
                navigate(
                  currentUser?.role === 'customer'
                    ? '/customer/messages'
                    : currentUser?.role === 'service_provider'
                      ? '/provider/messages'
                      : '/login?redirect=%2Fcustomer%2Fmessages'
                ),
            },
            {
              title: t('Create a request'),
              description: t('Move from trust into a real commercial brief and next step.'),
              icon: BriefcaseBusiness,
              action: () =>
                navigate(
                  currentUser?.role === 'customer'
                    ? '/customer/orders'
                    : '/login?redirect=%2Fcustomer%2Forders'
                ),
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                  <Icon size={18} />
                </div>
                <div className="mt-4 text-[18px] font-extrabold tracking-tight text-slate-900">
                  {item.title}
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-[24px] font-black tracking-tight text-slate-900 md:text-[42px]">
            {t('Featured Service Providers')}
          </h2>
          <div className="text-sm font-medium text-slate-500">
            {t('Top visibility providers, ranked by featured status, trust signals, and quality.')}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? (
                <div className="psp-loading-stack md:col-span-2 xl:col-span-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`provider-skeleton-${index}`}
                      className="psp-loading-block psp-loading-block--lg"
                    />
                  ))}
                </div>
              )
            : providerCards.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/providers/${item.id}`)}
                  className="group overflow-hidden rounded-[26px] border border-white/80 bg-white/85 text-left shadow-[0_24px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(15,23,42,0.14)]"
                >
                  <div className="relative h-[260px] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.companyName}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.72))]" />
                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-white shadow ${item.tone}`}
                    >
                      {item.badge}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <div className="text-[22px] font-black leading-tight">{item.companyName}</div>
                      <div className="mt-1 text-base text-white/85">{item.role}</div>
                    </div>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={`${item.id}-star-${starIndex}`} size={16} fill="currentColor" />
                      ))}
                      <span className="ml-2 text-sm font-semibold text-slate-600">
                        {item.rating.toFixed(1)} {t('rating')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{item.location}</span>
                      {item.verified ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          {t('Verified')}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm font-semibold text-slate-500">
                      {item.reviews} {t('reviews')}
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </section>

      <section id="categories" className="mt-14">
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-[24px] font-black tracking-tight text-slate-900 md:text-[40px]">
            {t('Browse by Category')}
          </h2>
          <div className="text-sm font-medium text-slate-500">
            {t('Open the service family first, then compare trust signals and response speed.')}
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="psp-button psp-button--secondary"
            >
              {t('Explore all providers')}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {categories.slice(0, 4).map((category, index) => (
            <button
              key={category.id}
              onClick={() =>
                navigate(
                  `/explore${category.slug ? `?category=${encodeURIComponent(category.slug)}` : ''}`
                )
              }
              className="group rounded-[26px] border border-white/80 bg-white/85 p-5 text-left shadow-[0_20px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_rgba(15,23,42,0.12)]"
            >
              <div
                className={`grid h-24 w-24 place-items-center rounded-[28px] bg-gradient-to-br ${categoryVisuals[index % categoryVisuals.length].glow} text-[26px] font-black tracking-tight text-slate-700 shadow-inner`}
              >
                {categoryVisuals[index % categoryVisuals.length].icon}
              </div>
              <div className="mt-6 text-[20px] font-extrabold tracking-tight text-slate-900">
                {t(category.name)}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {t(category.description || 'Discover trusted providers in this category.')}
              </p>
            </button>
          ))}
        </div>
      </section>
    </PublicMarketplaceLayout>
  );
};

export default Home;
