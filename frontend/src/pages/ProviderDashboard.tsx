import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Image,
  LayoutGrid,
  MapPinned,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  UserSquare2,
} from 'lucide-react';
import api from '../config/api';
import ProviderWorkspaceTopNav from '../components/provider/ProviderWorkspaceTopNav';
import { useI18n } from '../i18n';
import '../styles/app-primitives.css';

type ProviderStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
type ProviderPlan = 'basic' | 'pro' | 'business';
type CoverageMode = 'wilaya_only' | 'regional' | 'nationwide';

interface ProviderDashboardData {
  provider: {
    companyName: string;
    description?: string | null;
    city?: string | null;
    wilaya?: string | null;
    region?: string | null;
    addressLine?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    yearsOfExperience: number;
    primaryCategory?: { name: string } | null;
    user?: { firstName?: string; lastName?: string };
  };
  preference: {
    selectedPlan: ProviderPlan;
    featuredOnHomepage: boolean;
    profileBadgeText?: string | null;
    autoReplyEnabled: boolean;
  };
  coverage: {
    mode: CoverageMode;
    label: string;
    regions: string[];
  };
  planFeatures: {
    canUseProfileBadge: boolean;
    canUseServicePromoBadge: boolean;
    canFeatureOnHomepage: boolean;
    canFeatureServices: boolean;
  };
  stats: {
    totalServices: number;
    publishedServices: number;
    draftServices: number;
    pausedServices: number;
    featuredServices: number;
    reviewsCount: number;
    averageRating: string;
    responseTimeMinutes: number;
    completionPercentage: number;
    isVerified: boolean;
    status: ProviderStatus;
  };
  recentServices: Array<{
    id: string;
    name: string;
    status: 'draft' | 'published' | 'paused';
    price?: string | null;
    currencyCode: string;
    promoBadgeText?: string | null;
    showPromoBadge: boolean;
    category?: { name: string } | null;
  }>;
}

interface ProviderRequestItem {
  id: string;
  status: string;
  subject?: string | null;
  conversationId?: string | null;
}

interface ProviderConversationItem {
  id: string;
  unreadCount: number;
}

interface ProviderMediaItem {
  id: string;
  title: string;
  isPublished: boolean;
  isFeatured: boolean;
  isStory: boolean;
  likesCount: number;
  commentsCount: number;
}

interface ProviderNotificationItem {
  id: string;
  isRead: boolean;
}

type PromiseResponse<T> = { data?: { data?: T } };
type SignalTone = 'good' | 'warning' | 'critical';

const extractArray = <T,>(result: PromiseSettledResult<PromiseResponse<T[]>>): T[] => {
  if (result.status !== 'fulfilled') {
    return [];
  }

  return Array.isArray(result.value.data?.data) ? result.value.data!.data! : [];
};

const formatResponseTime = (minutes: number, t: (value?: string | null) => string) => {
  if (!minutes || minutes <= 0) {
    return t('Not set');
  }

  if (minutes < 60) {
    return `${minutes} ${t('min')}`;
  }

  const hours = minutes / 60;
  const rounded = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${rounded}h`;
};

const formatPlanLabel = (plan: ProviderPlan) => {
  switch (plan) {
    case 'business':
      return 'BUSINESS';
    case 'pro':
      return 'PRO';
    case 'basic':
    default:
      return 'BASIC';
  }
};

const getStatusMeta = (status: ProviderStatus, t: (value?: string | null) => string) => {
  switch (status) {
    case 'approved':
      return {
        label: t('Approved'),
        chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconClass: 'text-emerald-600',
      };
    case 'suspended':
      return {
        label: t('Suspended'),
        chipClass: 'bg-rose-50 text-rose-700 border-rose-200',
        iconClass: 'text-rose-600',
      };
    case 'rejected':
      return {
        label: t('Rejected'),
        chipClass: 'bg-amber-50 text-amber-700 border-amber-200',
        iconClass: 'text-amber-600',
      };
    case 'pending':
    default:
      return {
        label: t('Under review'),
        chipClass: 'bg-slate-100 text-slate-700 border-slate-200',
        iconClass: 'text-slate-600',
      };
  }
};

const getSignalTone = (tone: SignalTone) => {
  switch (tone) {
    case 'good':
      return {
        labelClass: 'text-emerald-700',
        pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        progressClass: 'bg-emerald-500',
      };
    case 'critical':
      return {
        labelClass: 'text-rose-700',
        pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
        progressClass: 'bg-rose-500',
      };
    case 'warning':
    default:
      return {
        labelClass: 'text-amber-700',
        pillClass: 'bg-amber-50 text-amber-700 border-amber-200',
        progressClass: 'bg-amber-500',
      };
  }
};

const getServiceStatusMeta = (status: 'draft' | 'published' | 'paused', t: (value?: string | null) => string) => {
  switch (status) {
    case 'published':
      return {
        label: t('Published'),
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'paused':
      return {
        label: t('Paused'),
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'draft':
    default:
      return {
        label: t('Draft'),
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
};

const ProviderDashboard: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<ProviderDashboardData | null>(null);
  const [requests, setRequests] = useState<ProviderRequestItem[]>([]);
  const [conversations, setConversations] = useState<ProviderConversationItem[]>([]);
  const [mediaItems, setMediaItems] = useState<ProviderMediaItem[]>([]);
  const [notifications, setNotifications] = useState<ProviderNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);

      const [
        dashboardResult,
        requestsResult,
        conversationsResult,
        mediaResult,
        notificationsResult,
      ] = await Promise.allSettled([
        api.get('/providers/me/dashboard'),
        api.get('/orders/provider'),
        api.get('/messages/conversations'),
        api.get('/provider-media/me'),
        api.get('/notifications/me'),
      ]);

      if (!active) {
        return;
      }

      if (dashboardResult.status !== 'fulfilled') {
        setError(
          dashboardResult.reason?.response?.data?.message || t('Failed to load the provider dashboard.')
        );
        setLoading(false);
        return;
      }

      setData((dashboardResult.value.data?.data || null) as ProviderDashboardData | null);
      setRequests(extractArray<ProviderRequestItem>(requestsResult as PromiseSettledResult<PromiseResponse<ProviderRequestItem[]>>));
      setConversations(
        extractArray<ProviderConversationItem>(
          conversationsResult as PromiseSettledResult<PromiseResponse<ProviderConversationItem[]>>
        )
      );

      if (mediaResult.status === 'fulfilled') {
        const items = Array.isArray(mediaResult.value.data?.data?.items)
          ? mediaResult.value.data!.data!.items
          : [];
        setMediaItems(items as ProviderMediaItem[]);
      } else {
        console.error('Failed to fetch provider media for dashboard', mediaResult.reason);
        setMediaItems([]);
      }

      setNotifications(
        extractArray<ProviderNotificationItem>(
          notificationsResult as PromiseSettledResult<PromiseResponse<ProviderNotificationItem[]>>
        )
      );
      setError(null);
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [t]);

  const derived = useMemo(() => {
    if (!data) {
      return null;
    }

    const statusMeta = getStatusMeta(data.stats.status, t);
    const averageRating = Number(data.stats.averageRating || 0);
    const pendingRequestsCount = requests.filter((item) =>
      ['new', 'reviewed'].includes(String(item.status || ''))
    ).length;
    const quotedRequestsCount = requests.filter((item) => item.status === 'quoted').length;
    const unreadMessagesCount = conversations.reduce(
      (total, item) => total + Number(item.unreadCount || 0),
      0
    );
    const unreadNotificationsCount = notifications.filter((item) => !item.isRead).length;
    const publishedPortfolioCount = mediaItems.filter(
      (item) => item.isPublished && !item.isStory
    ).length;
    const liveStoryCount = mediaItems.filter((item) => item.isPublished && item.isStory).length;
    const draftPortfolioCount = mediaItems.filter((item) => !item.isPublished).length;
    const totalMediaEngagement = mediaItems.reduce(
      (sum, item) => sum + Number(item.likesCount || 0) + Number(item.commentsCount || 0),
      0
    );

    const readinessItems = [
      {
        id: 'identity',
        label: t('Business identity'),
        completed: Boolean(data.provider.companyName && data.provider.primaryCategory?.name),
        href: '/provider/profile',
        icon: UserSquare2,
      },
      {
        id: 'avatar',
        label: t('Avatar image'),
        completed: Boolean(data.provider.avatarUrl),
        href: '/provider/profile',
        icon: UserSquare2,
      },
      {
        id: 'cover',
        label: t('Cover image'),
        completed: Boolean(data.provider.coverUrl),
        href: '/provider/profile',
        icon: Image,
      },
      {
        id: 'description',
        label: t('Public description'),
        completed: Boolean(data.provider.description),
        href: '/provider/profile',
        icon: BriefcaseBusiness,
      },
      {
        id: 'coverage',
        label: t('Location and coverage'),
        completed: Boolean(
          data.provider.city || data.provider.wilaya || data.coverage?.regions?.length
        ),
        href: '/provider/profile',
        icon: MapPinned,
      },
      {
        id: 'address',
        label: t('Address line'),
        completed: Boolean(data.provider.addressLine),
        href: '/provider/profile',
        icon: MapPinned,
      },
      {
        id: 'services',
        label: t('Published services'),
        completed: data.stats.publishedServices > 0,
        href: '/provider/services',
        icon: LayoutGrid,
      },
      {
        id: 'portfolio',
        label: t('Portfolio proof'),
        completed: publishedPortfolioCount >= 3,
        href: '/provider/portfolio',
        icon: Image,
      },
      {
        id: 'stories',
        label: t('Live story'),
        completed: liveStoryCount >= 1,
        href: '/provider/portfolio',
        icon: Sparkles,
      },
      {
        id: 'verification',
        label: t('Verification'),
        completed: data.stats.isVerified,
        href: '/provider/profile',
        icon: ShieldCheck,
      },
    ];

    const readinessCompleted = readinessItems.filter((item) => item.completed).length;
    const readinessScore = Math.round((readinessCompleted / readinessItems.length) * 100);
    const missingReadinessItems = readinessItems.filter((item) => !item.completed);

    const readinessState =
      readinessScore >= 85 && data.stats.status === 'approved'
        ? {
            label: t('Ready'),
            tone: 'good' as SignalTone,
            body: t('The public profile already carries enough trust signal to support conversion.'),
          }
        : readinessScore >= 60
          ? {
              label: t('Almost ready'),
              tone: 'warning' as SignalTone,
              body: t('A few visible gaps still weaken trust, moderation clarity, or conversion.'),
            }
          : {
              label: t('Needs work'),
              tone: 'critical' as SignalTone,
              body: t('Customers still see missing trust signals before they reach the request flow.'),
            };

    const responseTone: SignalTone =
      data.stats.responseTimeMinutes > 0 && data.stats.responseTimeMinutes <= 60
        ? 'good'
        : data.stats.responseTimeMinutes > 0 && data.stats.responseTimeMinutes <= 180
          ? 'warning'
          : 'critical';

    const ratingTone: SignalTone =
      data.stats.reviewsCount === 0 ? 'warning' : averageRating >= 4.5 ? 'good' : averageRating >= 4 ? 'warning' : 'critical';

    const profileTone: SignalTone =
      data.stats.completionPercentage >= 85
        ? 'good'
        : data.stats.completionPercentage >= 60
          ? 'warning'
          : 'critical';

    const servicesTone: SignalTone =
      data.stats.publishedServices > 0 && data.stats.draftServices <= data.stats.publishedServices
        ? 'good'
        : data.stats.publishedServices > 0
          ? 'warning'
          : 'critical';

    const nextAction = (() => {
      if (data.stats.status !== 'approved') {
        return {
          label: t('Review profile'),
          body: t('Account status still affects public visibility and readiness.'),
          to: '/provider/profile',
        };
      }

      if (pendingRequestsCount > 0) {
        return {
          label: t('Open requests'),
          body: t('Requests waiting for a first response should always come first.'),
          to: '/provider/requests',
        };
      }

      if (unreadMessagesCount > 0) {
        return {
          label: t('Reply in inbox'),
          body: t('Unread conversations still hold commercial context that can convert into booked work.'),
          to: '/provider/messages',
        };
      }

      if (missingReadinessItems.length > 0) {
        return {
          label: t('Review profile'),
          body: t('Public trust gaps still slow conversion before customers even message or request.'),
          to: missingReadinessItems[0]?.href || '/provider/profile',
        };
      }

      if (data.stats.draftServices > 0) {
        return {
          label: t('Manage services'),
          body: t('Draft services should become published offers or be cleaned out of the workspace.'),
          to: '/provider/services',
        };
      }

      if (publishedPortfolioCount < 3 || liveStoryCount < 1) {
        return {
          label: t('Open portfolio'),
          body: t('Proof of work still needs stronger coverage across portfolio and stories.'),
          to: '/provider/portfolio',
        };
      }

      return {
        label: t('Open requests'),
        body: t('The operational workspace is healthy. Stay close to fresh demand and follow-up.'),
        to: '/provider/requests',
      };
    })();

    const urgentItems = [
      pendingRequestsCount > 0
        ? {
            id: 'requests',
            icon: FileText,
            label: t('Pending requests'),
            count: pendingRequestsCount,
            description: t('Requests waiting for a first response.'),
            to: '/provider/requests',
          }
        : null,
      unreadMessagesCount > 0
        ? {
            id: 'messages',
            icon: MessageSquare,
            label: t('Unread messages'),
            count: unreadMessagesCount,
            description: t('Customer threads still unread in the inbox.'),
            to: '/provider/messages',
          }
        : null,
      data.stats.status !== 'approved'
        ? {
            id: 'moderation',
            icon: AlertTriangle,
            label: t('Moderation status'),
            count: 1,
            description: t('Account status still needs provider attention.'),
            to: '/provider/profile',
          }
        : null,
      data.stats.status === 'approved' && missingReadinessItems.length > 0
        ? {
            id: 'readiness',
            icon: ShieldCheck,
            count: missingReadinessItems.length,
            label: t('Public readiness blockers'),
            description: t('Public profile still has visible trust gaps.'),
            to: missingReadinessItems[0]?.href || '/provider/profile',
          }
        : null,
    ].filter(Boolean) as Array<{
      id: string;
      icon: React.ComponentType<{ className?: string; size?: number }>;
      label: string;
      count: number;
      description: string;
      to: string;
    }>;

    const workflowEntries = [
      {
        id: 'requests',
        icon: FileText,
        label: t('Requests'),
        value: pendingRequestsCount,
        helper: t('New leads, quoted work, and delivery follow-up.'),
        to: '/provider/requests',
      },
      {
        id: 'messages',
        icon: MessageSquare,
        label: t('Inbox'),
        value: unreadMessagesCount,
        helper: t('Unread customer threads and reply pressure.'),
        to: '/provider/messages',
      },
      {
        id: 'portfolio',
        icon: Image,
        label: t('Portfolio'),
        value: draftPortfolioCount,
        helper: t('Stories, proof of work, likes, comments, and drafts.'),
        to: '/provider/portfolio',
      },
      {
        id: 'services',
        icon: LayoutGrid,
        label: t('Services'),
        value: data.stats.draftServices,
        helper: t('Published offers, drafts, and featured service positioning.'),
        to: '/provider/services',
      },
      {
        id: 'profile',
        icon: UserSquare2,
        label: t('Profile'),
        value: missingReadinessItems.length,
        helper: t('Identity, moderation fields, and public trust basics.'),
        to: '/provider/profile',
      },
    ];

    const healthMetrics = [
      {
        id: 'response',
        label: t('Response time'),
        value: formatResponseTime(data.stats.responseTimeMinutes, t),
        tone: responseTone,
        progress: null as number | null,
        icon: Clock3,
      },
      {
        id: 'rating',
        label: t('Avg. rating'),
        value:
          data.stats.reviewsCount > 0 ? `${averageRating.toFixed(1)} / 5` : t('No reviews yet'),
        tone: ratingTone,
        progress: null as number | null,
        icon: Star,
      },
      {
        id: 'profile',
        label: t('Profile completion'),
        value: `${data.stats.completionPercentage}%`,
        tone: profileTone,
        progress: data.stats.completionPercentage,
        icon: ShieldCheck,
      },
      {
        id: 'services',
        label: t('Published services'),
        value: `${data.stats.publishedServices}/${data.stats.totalServices}`,
        tone: servicesTone,
        progress:
          data.stats.totalServices > 0
            ? Math.round((data.stats.publishedServices / data.stats.totalServices) * 100)
            : 0,
        icon: LayoutGrid,
      },
    ];

    return {
      statusMeta,
      averageRating,
      pendingRequestsCount,
      quotedRequestsCount,
      unreadMessagesCount,
      unreadNotificationsCount,
      publishedPortfolioCount,
      liveStoryCount,
      draftPortfolioCount,
      totalMediaEngagement,
      readinessItems,
      readinessCompleted,
      readinessScore,
      missingReadinessItems,
      readinessState,
      nextAction,
      urgentItems,
      workflowEntries,
      healthMetrics,
    };
  }, [conversations, data, mediaItems, notifications, requests, t]);

  if (loading) {
      return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f4f8fb_0%,#eef6f5_48%,#f8fafc_100%)]">
        <ProviderWorkspaceTopNav currentPage="dashboard" fluid />
        <div className="w-full px-4 py-6 md:px-8 md:py-8 2xl:px-10">
          <div className="psp-page-stack">
            <div className="psp-loading-block psp-loading-block--md" />
            <div className="psp-loading-block psp-loading-block--sm" />
            <div className="psp-loading-block psp-loading-block--sm" />
            <div className="psp-loading-block psp-loading-block--lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f4f8fb_0%,#eef6f5_48%,#f8fafc_100%)]">
        <ProviderWorkspaceTopNav currentPage="dashboard" fluid />
        <div className="w-full px-4 py-6 md:px-8 md:py-8 2xl:px-10">
          <div className="psp-error-state">
            <div className="font-bold">{t('Provider dashboard unavailable.')}</div>
            <div>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !derived) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f4f8fb_0%,#eef6f5_48%,#f8fafc_100%)]">
        <ProviderWorkspaceTopNav currentPage="dashboard" fluid />
        <div className="w-full px-4 py-6 md:px-8 md:py-8 2xl:px-10">
          <div className="psp-empty-state">{t('Provider dashboard data is not available.')}</div>
        </div>
      </div>
    );
  }

  const providerContactName =
    `${data.provider.user?.firstName || ''} ${data.provider.user?.lastName || ''}`.trim();
  const providerLocation =
    [data.provider.city, data.provider.wilaya].filter(Boolean).join(', ') ||
    data.coverage.label ||
    t('Location not completed');
  const experienceLabel =
    data.provider.yearsOfExperience > 0
      ? `${data.provider.yearsOfExperience} ${t('years')}`
      : t('Not specified');
  const readinessTone = getSignalTone(derived.readinessState.tone);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f8fb_0%,#eef6f5_48%,#f8fafc_100%)] text-slate-900">
      <ProviderWorkspaceTopNav
        currentPage="dashboard"
        pendingRequestsCount={derived.pendingRequestsCount}
        unreadMessagesCount={derived.unreadMessagesCount}
        unreadNotificationsCount={derived.unreadNotificationsCount}
        draftPortfolioCount={derived.draftPortfolioCount}
        fluid
      />

      <div className="w-full px-4 py-6 md:px-8 md:py-8 2xl:px-10">
        <div className="psp-page-stack">
          <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
            <div className="p-5 md:p-7">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                    {t('Provider control desk')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${derived.statusMeta.chipClass}`}
                  >
                    <ShieldCheck size={13} className={derived.statusMeta.iconClass} />
                    {derived.statusMeta.label}
                  </span>
                  {data.stats.isVerified ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <BadgeCheck size={13} />
                      {t('Verified')}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                    {formatPlanLabel(data.preference.selectedPlan)}
                  </span>
                </div>

                <div className="mt-6 flex items-start gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#d1fae5,#e0f2fe)] shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
                    {data.provider.avatarUrl ? (
                      <img
                        src={data.provider.avatarUrl}
                        alt={data.provider.companyName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xl font-black text-emerald-700">
                        {data.provider.companyName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-[30px] font-black tracking-tight text-slate-950 md:text-[34px]">
                      {data.provider.companyName}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                      {providerContactName ? <span>{providerContactName}</span> : null}
                      {providerContactName && data.provider.primaryCategory?.name ? <span>•</span> : null}
                      {data.provider.primaryCategory?.name ? (
                        <span>{data.provider.primaryCategory.name}</span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {providerLocation}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {t('Coverage')}: {data.coverage.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {t('Experience')}: {experienceLabel}
                      </span>
                    </div>

                    <p className="mt-5 max-w-[880px] text-[15px] leading-8 text-slate-600">
                      {t(
                        'This page keeps requests, inbox pressure, public readiness, and visibility levers in one operational surface.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {derived.urgentItems.length ? (
            <section className="psp-surface border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))]">
              <div className="psp-surface__header">
                <div>
                  <h2>{t('Needs your attention')}</h2>
                  <div className="psp-surface__sub">
                    {t('Start with operational pressure or public blockers before quieter growth work.')}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                {derived.urgentItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      className="group flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_16px_30px_rgba(15,23,42,0.05)] transition hover:border-emerald-200 hover:bg-emerald-50/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                          <Icon size={18} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{item.label}</span>
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                              {item.count}
                            </span>
                          </div>
                          <div className="mt-1 text-sm leading-6 text-slate-600">{item.description}</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {derived.workflowEntries.map((entry) => {
              const Icon = entry.icon;
              return (
                <Link
                  key={entry.id}
                  to={entry.to}
                  className="rounded-[26px] border border-white/80 bg-white p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-[1px] hover:border-emerald-200 hover:shadow-[0_24px_55px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon size={20} />
                    </span>
                    {entry.value > 0 ? (
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">
                        {entry.value > 99 ? '99+' : entry.value}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 text-[19px] font-black tracking-tight text-slate-950">
                    {entry.label}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">{entry.helper}</div>
                </Link>
              );
            })}
          </section>

          <section className="psp-surface">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  {t('Operational health')}
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-600">
                  {t('Use these signals to judge readiness, responsiveness, and visible service quality at a glance.')}
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                <Sparkles size={14} />
                {t('Quotes waiting')}: {derived.quotedRequestsCount}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {derived.healthMetrics.map((metric) => {
                const Icon = metric.icon;
                const tone = getSignalTone(metric.tone);
                return (
                  <article
                    key={metric.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={tone.labelClass} />
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        {metric.label}
                      </div>
                    </div>
                    <div className="mt-3 text-[24px] font-black tracking-tight text-slate-950">
                      {metric.value}
                    </div>
                    {metric.progress !== null ? (
                      <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${tone.progressClass}`}
                            style={{ width: `${Math.max(0, Math.min(metric.progress, 100))}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
            <article className="psp-surface">
              <div className="psp-surface__header">
                <div>
                  <h2>{t('Trust and completeness')}</h2>
                  <div className="psp-surface__sub">{derived.readinessState.body}</div>
                </div>
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${readinessTone.pillClass}`}
                >
                  {derived.readinessState.label}
                </span>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-slate-50/90 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      {t('Public readiness')}
                    </div>
                    <div className="mt-2 text-[30px] font-black tracking-tight text-slate-950">
                      {derived.readinessScore}%
                    </div>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
                    {derived.readinessCompleted}/{derived.readinessItems.length} {t('Completed').toLowerCase()}
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${readinessTone.progressClass}`}
                    style={{ width: `${derived.readinessScore}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {derived.readinessItems.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                            item.completed
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon size={17} />
                        </span>
                        <div>
                          <div className="text-sm font-black text-slate-900">{item.label}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {item.completed ? t('Completed') : t('Missing')}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex h-8 items-center rounded-full border px-2.5 text-xs font-bold ${
                          item.completed
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        {item.completed ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
                      </span>
                    </>
                  );

                  if (item.completed) {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-4"
                      >
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-4 transition hover:border-emerald-200 hover:bg-emerald-50/30"
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </article>

            <article className="psp-surface psp-surface--muted">
              <div className="psp-surface__header">
                <div>
                  <h2>{t('Growth and visibility')}</h2>
                  <div className="psp-surface__sub">
                    {t('Plan capabilities should stay visible but quieter than requests and inbox pressure.')}
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                  {formatPlanLabel(data.preference.selectedPlan)}
                </span>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    label: t('Homepage featuring'),
                    value: data.preference.featuredOnHomepage ? t('Enabled') : t('Off'),
                    helper: data.planFeatures.canFeatureOnHomepage
                      ? t('Homepage featuring can be switched on when visibility needs a boost.')
                      : t('Not available on current plan'),
                  },
                  {
                    label: t('Featured services'),
                    value: String(data.stats.featuredServices),
                    helper: data.planFeatures.canFeatureServices
                      ? t('Featured services increase how often premium offers are seen first.')
                      : t('Not available on current plan'),
                  },
                  {
                    label: t('AI reply support'),
                    value: data.preference.autoReplyEnabled ? t('Enabled') : t('Off'),
                    helper: t('Auto-reply stays secondary here, but it still affects response speed inside the inbox.'),
                  },
                  {
                    label: t('Profile badge'),
                    value:
                      data.preference.profileBadgeText || (data.planFeatures.canUseProfileBadge ? t('Available') : t('Off')),
                    helper: data.planFeatures.canUseProfileBadge
                      ? t('Use the badge carefully as a trust signal, not as visual noise.')
                      : t('Not available on current plan'),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_16px_32px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-black text-slate-900">{item.label}</div>
                      <div className="text-sm font-black text-slate-950">{item.value}</div>
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">{item.helper}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.04)] sm:grid-cols-3">
                {[
                  {
                    label: t('Portfolio'),
                    value: derived.publishedPortfolioCount,
                    sub: t('published items'),
                  },
                  {
                    label: t('Stories'),
                    value: derived.liveStoryCount,
                    sub: t('live now'),
                  },
                  {
                    label: t('Interactions'),
                    value: derived.totalMediaEngagement,
                    sub: t('likes + comments'),
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-[20px] bg-slate-50 px-4 py-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      {item.label}
                    </div>
                    <div className="mt-2 text-[22px] font-black text-slate-950">{item.value}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{item.sub}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/provider/subscription" className="psp-button psp-button--secondary">
                  {t('Manage visibility')}
                </Link>
                <Link to="/provider/portfolio" className="psp-button psp-button--ghost">
                  {t('Open portfolio')}
                </Link>
              </div>
            </article>
          </section>

          <section className="psp-surface">
            <div className="psp-surface__header">
              <div>
                <h2>{t('Recent services')}</h2>
                <div className="psp-surface__sub">
                  {t('Use recent service inventory as a support signal, not the main dashboard story.')}
                </div>
              </div>
              <Link to="/provider/services" className="psp-button psp-button--secondary">
                {t('View all services')}
              </Link>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: t('Published services'),
                  value: data.stats.publishedServices,
                  sub: t('currently visible'),
                },
                {
                  label: t('Draft'),
                  value: data.stats.draftServices,
                  sub: t('still private'),
                },
                {
                  label: t('Featured'),
                  value: data.stats.featuredServices,
                  sub: t('boosted offers'),
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {item.label}
                  </div>
                  <div className="mt-2 text-[24px] font-black text-slate-950">{item.value}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">{item.sub}</div>
                </div>
              ))}
            </div>

            {!data.recentServices.length ? (
              <div className="psp-empty-state">
                {t('No services exist yet. Publish the first service to unlock marketplace demand.')}
              </div>
            ) : (
              <div className="psp-list">
                {data.recentServices.map((service) => {
                  const serviceStatus = getServiceStatusMeta(service.status, t);

                  return (
                    <article key={service.id} className="psp-list-card">
                      <div className="psp-list-card__row">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="psp-list-card__title">{service.name}</h3>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${serviceStatus.className}`}
                            >
                              {serviceStatus.label}
                            </span>
                            {service.showPromoBadge && service.promoBadgeText ? (
                              <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white">
                                {service.promoBadgeText}
                              </span>
                            ) : null}
                          </div>
                          <div className="psp-list-card__meta">
                            {service.category?.name || t('No category')} •{' '}
                            {service.price ? `${service.price} ${service.currencyCode}` : t('Price on request')}
                          </div>
                        </div>
                        <Link to="/provider/services" className="psp-button psp-button--ghost">
                          {t('Manage services')}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
