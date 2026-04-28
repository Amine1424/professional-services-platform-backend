import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  MessageCircle,
  TreePine,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import MarketplaceCategories from '../components/marketplace/MarketplaceCategories';
import MarketplaceFeaturedProviders from '../components/marketplace/MarketplaceFeaturedProviders';
import MarketplaceHero from '../components/marketplace/MarketplaceHero';
import MarketplaceLandingLayout from '../components/marketplace/MarketplaceLandingLayout';
import MarketplaceQuickActions from '../components/marketplace/MarketplaceQuickActions';
import MarketplaceStoryRail from '../components/marketplace/MarketplaceStoryRail';
import {
  MarketplaceCategoryCardItem,
  MarketplaceCategorySelectItem,
  MarketplaceProviderCardItem,
  MarketplaceQuickActionItem,
  MarketplaceStoryCardItem,
} from '../components/marketplace/types';
import { useI18n } from '../i18n';
import {
  getBranchSubcategories,
  MarketplaceCategory,
} from '../lib/categories';
import { WILAYA_TO_REGION } from '../lib/algeria';
import { getStoredUser } from '../lib/role-routing';
import '../styles/app-primitives.css';

type FeaturedProvider = {
  id: string;
  companyName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  wilaya?: string | null;
  region?: string | null;
  averageRating?: number | string | null;
  reviewsCount?: number | string | null;
  yearsOfExperience?: number | null;
  responseTimeMinutes?: number | null;
  startingPrice?: number | null;
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
  providerName?: string;
  providerAvatarUrl?: string | null;
  providerLocation?: string | null;
};

type DiscoveryHomePayload = {
  featuredProviders: FeaturedProvider[];
  featuredServices: Array<unknown>;
  stories: StoryItem[];
};

const defaultProviderImage =
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80';

const formatResponseTimeLabel = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) {
    return null;
  }

  if (minutes < 60) {
    return `Usually responds in ${minutes} minutes`;
  }

  const hours = Math.round(minutes / 60);
  return `Usually responds in ${hours} hour${hours > 1 ? 's' : ''}`;
};

const buildProviderBadges = (provider: FeaturedProvider) => {
  const badges: Array<'verified' | 'top_rated' | 'fast_response'> = [];

  if (provider.isVerified) {
    badges.push('verified');
  }

  if (Number(provider.averageRating || 0) >= 4.7) {
    badges.push('top_rated');
  }

  if ((provider.responseTimeMinutes || 0) > 0 && (provider.responseTimeMinutes || 0) <= 180) {
    badges.push('fast_response');
  }

  return badges;
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useMemo(() => getStoredUser(), []);

  const [serviceQuery, setServiceQuery] = useState('');
  const [selectedRootCategoryId, setSelectedRootCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
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
        setCategories(categoriesResponse.data?.data || []);
        setWarning(null);
      } catch {
        if (!active) return;
        setHomePayload(null);
        setCategories([]);
        setWarning(t('Live marketplace data is temporarily unavailable. Please try again shortly.'));
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
    if (selectedSubcategoryId) {
      params.set('category', selectedSubcategoryId);
    } else if (selectedRootCategoryId) {
      params.set('category', selectedRootCategoryId);
    }
    if (selectedRegion.trim()) params.set('region', selectedRegion.trim());
    if (selectedWilaya.trim()) params.set('wilaya', selectedWilaya.trim());

    navigate(`/explore${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const rootCategories = useMemo<MarketplaceCategoryCardItem[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        iconUrl: category.iconUrl,
        providerCount: category.providerCount,
      })),
    [categories]
  );

  const rootCategoryOptions = useMemo<MarketplaceCategorySelectItem[]>(
    () =>
      rootCategories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    [rootCategories]
  );

  const subcategoryOptions = useMemo<MarketplaceCategorySelectItem[]>(
    () =>
      selectedRootCategoryId
        ? getBranchSubcategories(categories, selectedRootCategoryId).map((category) => ({
            id: category.id,
            name: category.name,
            label: category.label,
          }))
        : [],
    [categories, selectedRootCategoryId]
  );

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(Object.values(WILAYA_TO_REGION))).sort((left, right) =>
        left.localeCompare(right, 'ar', { sensitivity: 'base' })
      ),
    []
  );

  const wilayaOptions = useMemo(
    () =>
      selectedRegion
        ? Object.entries(WILAYA_TO_REGION)
            .filter(([, region]) => region === selectedRegion)
            .map(([wilaya]) => wilaya)
            .sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }))
        : [],
    [selectedRegion]
  );

  const storyItems = useMemo<MarketplaceStoryCardItem[]>(
    () =>
      (homePayload?.stories || []).slice(0, 12).map((story, index) => ({
        id: story.id,
        providerId: story.providerId,
        label: story.title || `${t('Story')} ${index + 1}`,
        image: story.thumbnailUrl || story.mediaUrl,
        providerName: story.providerName,
        providerAvatarUrl: story.providerAvatarUrl,
        providerLocation: story.providerLocation,
        isLive: index < 2,
      })),
    [homePayload, t]
  );

  const providerCards = useMemo<MarketplaceProviderCardItem[]>(
    () =>
      (homePayload?.featuredProviders || []).slice(0, 6).map((provider) => ({
        id: provider.id,
        companyName: provider.companyName,
        headline: provider.headline || provider.primaryCategory?.name || t('Professional Services'),
        role: provider.primaryCategory?.name || t('Professional Services'),
        image: provider.coverUrl || provider.avatarUrl || defaultProviderImage,
        avatarUrl: provider.avatarUrl || provider.coverUrl || defaultProviderImage,
        rating: Number(provider.averageRating || 0),
        reviews: Number(provider.reviewsCount || 0),
        badge: provider.profileBadgeText || null,
        location: [provider.city, provider.wilaya, provider.region].filter(Boolean).join(', ') || t('Algeria'),
        verified: Boolean(provider.isVerified),
        startingPrice: provider.startingPrice || null,
        yearsOfExperience: provider.yearsOfExperience || null,
        responseTimeLabel: formatResponseTimeLabel(provider.responseTimeMinutes),
        badges: buildProviderBadges(provider),
      })),
    [homePayload, t]
  );

  const quickActions = useMemo<MarketplaceQuickActionItem[]>(() => {
    const openMessages = () =>
      navigate(
        currentUser?.role === 'customer'
          ? '/customer/messages'
          : currentUser?.role === 'service_provider'
            ? '/provider/messages'
            : '/login?redirect=%2Fcustomer%2Fmessages'
      );

    return [
      {
        id: 'emergency',
        title: t('Emergency Services'),
        description: t('Get help fast for urgent issues'),
        icon: AlertCircle,
        actionLabel: t('Open explore'),
        onClick: () => navigate('/explore?sort=verified'),
      },
      {
        id: 'repairs',
        title: t('Home Repairs'),
        description: t('Browse providers for common home service work'),
        icon: Wrench,
        actionLabel: t('Open explore'),
        onClick: () => navigate('/explore'),
      },
      {
        id: 'messages',
        title: t('Messages'),
        description: t('Continue active conversations without restarting discovery'),
        icon: MessageCircle,
        actionLabel: t('Open inbox'),
        onClick: openMessages,
      },
      {
        id: 'outdoor',
        title:
          currentUser?.role === 'service_provider'
            ? t('Publish Work')
            : currentUser?.role === 'customer'
              ? t('Requests')
              : t('Become a Provider'),
        description:
          currentUser?.role === 'service_provider'
            ? t('Open portfolio tools and publish new work or stories')
            : currentUser?.role === 'customer'
              ? t('Move from discovery into live service requests')
              : t('Create a provider account and start publishing services'),
        icon: currentUser?.role === 'service_provider' ? Sparkles : TreePine,
        actionLabel:
          currentUser?.role === 'service_provider'
            ? t('Open portfolio')
            : currentUser?.role === 'customer'
              ? t('Open requests')
              : t('Join now'),
        onClick: () =>
          navigate(
            currentUser?.role === 'service_provider'
              ? '/provider/portfolio'
              : currentUser?.role === 'customer'
                ? '/customer/orders'
                : '/join/provider'
          ),
      },
    ];
  }, [currentUser?.role, navigate, t]);

  const heroProvider = providerCards[0] || null;

  return (
    <MarketplaceLandingLayout>
      <div className="bg-white">
        <MarketplaceHero
          serviceQuery={serviceQuery}
          selectedRootCategoryId={selectedRootCategoryId}
          selectedSubcategoryId={selectedSubcategoryId}
          selectedRegion={selectedRegion}
          selectedWilaya={selectedWilaya}
          rootCategories={rootCategoryOptions}
          subcategories={subcategoryOptions}
          regions={regionOptions}
          wilayas={wilayaOptions}
          heroProvider={heroProvider}
          onServiceQueryChange={setServiceQuery}
          onRootCategoryChange={(value) => {
            setSelectedRootCategoryId(value);
            setSelectedSubcategoryId('');
          }}
          onSubcategoryChange={setSelectedSubcategoryId}
          onRegionChange={(value) => {
            setSelectedRegion(value);
            setSelectedWilaya('');
          }}
          onWilayaChange={setSelectedWilaya}
          onSearch={runSearch}
          onOpenHeroProvider={
            heroProvider ? () => navigate(`/providers/${heroProvider.id}`) : undefined
          }
        />

        {warning ? (
          <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {warning}
            </div>
          </div>
        ) : null}

        <MarketplaceStoryRail
          stories={storyItems}
          loading={loading}
          onOpenStory={(story) =>
            story.providerId
              ? navigate(`/providers/${story.providerId}?storyId=${encodeURIComponent(story.id)}`)
              : undefined
          }
        />

        <MarketplaceQuickActions actions={quickActions} />

        <MarketplaceFeaturedProviders
          providers={providerCards}
          loading={loading}
          onOpenProvider={(providerId) => navigate(`/providers/${providerId}`)}
          onExploreAll={() => navigate('/explore')}
        />

        <MarketplaceCategories
          categories={rootCategories.slice(0, 8)}
          loading={loading}
          onOpenCategory={(category) =>
            navigate(`/explore${category.slug ? `?category=${encodeURIComponent(category.slug)}` : ''}`)
          }
          onExploreAll={() => navigate('/explore')}
        />
      </div>
    </MarketplaceLandingLayout>
  );
};

export default Home;
