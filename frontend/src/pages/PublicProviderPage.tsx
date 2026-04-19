import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PublicMarketplaceLayout from '../components/PublicMarketplaceLayout';
import StoryViewer from '../components/stories/StoryViewer';
import api from '../config/api';
import ProviderHero from '../components/public-provider/ProviderHero';
import ProviderMediaSection from '../components/public-provider/ProviderMediaSection';
import ProviderProfileDetails from '../components/public-provider/ProviderProfileDetails';
import ProviderQuickNav from '../components/public-provider/ProviderQuickNav';
import ProviderRequestPanel from '../components/public-provider/ProviderRequestPanel';
import ProviderReviewsSection from '../components/public-provider/ProviderReviewsSection';
import ProviderServicesSection from '../components/public-provider/ProviderServicesSection';
import ProviderStoriesSection from '../components/public-provider/ProviderStoriesSection';
import {
  MediaComment,
  PublicProviderPayload,
  ReviewItem,
} from '../components/public-provider/types';
import { getStoredUser } from '../lib/role-routing';
import '../styles/app-primitives.css';

interface ProviderRequestForm {
  serviceId: string;
  subject: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  currencyCode: string;
  preferredDate: string;
  initialMessage: string;
}

const emptyReviewForm = {
  rating: 5,
  comment: '',
};

const emptyRequestForm: ProviderRequestForm = {
  serviceId: '',
  subject: '',
  description: '',
  budgetMin: '',
  budgetMax: '',
  currencyCode: 'DZD',
  preferredDate: '',
  initialMessage: '',
};

const PublicProviderPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useMemo(() => getStoredUser(), []);
  const token = localStorage.getItem('accessToken');
  const intent = searchParams.get('intent');
  const storyIdParam = searchParams.get('storyId');

  const [data, setData] = useState<PublicProviderPayload | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [commentsMap, setCommentsMap] = useState<Record<string, MediaComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [actionMediaId, setActionMediaId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [requestForm, setRequestForm] = useState<ProviderRequestForm>(emptyRequestForm);
  const [customerGeo, setCustomerGeo] = useState<{
    preferredRegion?: string | null;
    preferredWilaya?: string | null;
  }>({});
  const [storyReplyDraft, setStoryReplyDraft] = useState('');
  const [replyingToStory, setReplyingToStory] = useState(false);
  const likedMapRef = useRef<Record<string, boolean>>({});
  const commentDraftsRef = useRef<Record<string, string>>({});

  const buildProviderUrl = useCallback(
    (overrides?: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(overrides || {}).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          next.delete(key);
          return;
        }

        next.set(key, value);
      });

      const query = next.toString();
      return `/providers/${id}${query ? `?${query}` : ''}`;
    },
    [id, searchParams]
  );

  const loadPage = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);

      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }

        const [providerRes, reviewsRes] = await Promise.all([
          api.get(`/public-providers/${id}`),
          api.get(`/provider-reviews/provider/${id}`),
        ]);

        const payload = providerRes.data?.data || null;
        setData(payload);
        setReviews(reviewsRes.data?.data || []);

        if (payload?.media?.length) {
          const nextComments: Record<string, MediaComment[]> = {};
          payload.media.forEach((item: PublicProviderPayload['media'][number]) => {
            nextComments[item.id] = item.latestComments || [];
          });
          setCommentsMap(nextComments);
        } else {
          setCommentsMap({});
        }
      } catch (requestError: any) {
        if (silent) {
          toast.error(requestError.response?.data?.message || 'Failed to refresh provider data.');
          return;
        }

        setData(null);
        setReviews([]);
        setError(requestError.response?.data?.message || 'Failed to load the provider page.');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  const loadFavoritesState = useCallback(async () => {
    if (!token) {
      setIsFavorite(false);
      return;
    }

    try {
      const response = await api.get('/favorites/providers');
      const items = response.data?.data || [];
      setIsFavorite(items.some((item: { id: string }) => item.id === id));
    } catch {
      setIsFavorite(false);
    }
  }, [id, token]);

  const loadViewerState = useCallback(async () => {
    if (!token || !id || currentUser?.role !== 'customer') {
      setLikedMap({});
      setReviewForm(emptyReviewForm);
      setHasExistingReview(false);
      setCustomerGeo({});
      return;
    }

    try {
      const [interactionsRes, customerReviewsRes, customerPreferencesRes] = await Promise.all([
        api.get(`/provider-media/provider/${id}/interactions`),
        api.get('/provider-reviews/me'),
        api.get('/customers/me/preferences'),
      ]);

      const likedMediaIds: string[] = interactionsRes.data?.data?.likedMediaIds || [];
      setLikedMap(
        likedMediaIds.reduce<Record<string, boolean>>((acc, mediaId) => {
          acc[mediaId] = true;
          return acc;
        }, {})
      );

      const myReviews = customerReviewsRes.data?.data || [];
      const existingReview = myReviews.find(
        (item: { providerId?: string }) => item.providerId === id
      );
      const preferences = customerPreferencesRes.data?.data || {};
      setCustomerGeo({
        preferredRegion: preferences.preferredRegion || null,
        preferredWilaya: preferences.preferredWilaya || null,
      });

      if (existingReview) {
        setHasExistingReview(true);
        setReviewForm({
          rating: Number(existingReview.rating) || 5,
          comment: existingReview.comment || '',
        });
      } else {
        setHasExistingReview(false);
        setReviewForm(emptyReviewForm);
      }
    } catch {
      setLikedMap({});
      setHasExistingReview(false);
      setCustomerGeo({});
    }
  }, [currentUser?.role, id, token]);

  const updateMediaItem = useCallback(
    (
      mediaId: string,
      updater: (item: PublicProviderPayload['media'][number]) => PublicProviderPayload['media'][number]
    ) => {
      setData((current) =>
        current
          ? {
              ...current,
              media: current.media.map((item) =>
                item.id === mediaId ? updater(item) : item
              ),
            }
          : current
      );
    },
    []
  );

  useEffect(() => {
    if (!id) return;

    void loadPage();
    void loadFavoritesState();
    void loadViewerState();
  }, [id, loadFavoritesState, loadPage, loadViewerState]);

  useEffect(() => {
    likedMapRef.current = likedMap;
  }, [likedMap]);

  useEffect(() => {
    commentDraftsRef.current = commentDrafts;
  }, [commentDrafts]);

  useEffect(() => {
    if (!storyIdParam || !data?.stories?.length) {
      return;
    }

    if (!data.stories.some((story) => story.id === storyIdParam)) {
      const next = new URLSearchParams(searchParams);
      next.delete('storyId');
      setSearchParams(next, { replace: true });
    }
  }, [data?.stories, searchParams, setSearchParams, storyIdParam]);

  useEffect(() => {
    if (!id || !intent || !token || currentUser?.role !== 'customer') return;

    const clearIntent = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('intent');
      setSearchParams(next, { replace: true });
    };

    if (intent === 'message') {
      clearIntent();
      navigate(`/customer/messages?providerId=${id}`, { replace: true });
      return;
    }

    if (intent === 'request') {
      setShowRequestForm(true);
      clearIntent();
      return;
    }

    if (intent === 'favorite') {
      if (!isFavorite) {
        void api
          .post(`/favorites/providers/${id}`)
          .then(() => {
            setIsFavorite(true);
            toast.success('Provider added to favorites.');
            void loadPage({ silent: true });
          })
          .catch((requestError: any) => {
            toast.error(requestError.response?.data?.message || 'Failed to update favorites.');
          })
          .finally(() => clearIntent());
      } else {
        clearIntent();
      }
    }
  }, [currentUser?.role, id, intent, isFavorite, loadPage, navigate, searchParams, setSearchParams, token]);

  const requireCustomerForPath = useCallback(
    (redirectPath: string) => {
      if (!token) {
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        return false;
      }

      if (currentUser?.role !== 'customer') {
        toast.error('This action is available for customer accounts only.');
        return false;
      }

      return true;
    },
    [currentUser?.role, navigate, token]
  );

  const requireCustomer = useCallback(
    (requestedIntent: 'message' | 'request' | 'favorite' | 'review') =>
      requireCustomerForPath(buildProviderUrl({ intent: requestedIntent })),
    [buildProviderUrl, requireCustomerForPath]
  );

  const setStoryContext = useCallback(
    (storyId: string | null) => {
      const next = new URLSearchParams(searchParams);

      if (storyId) {
        next.set('storyId', storyId);
      } else {
        next.delete('storyId');
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleContact = () => {
    if (!requireCustomer('message')) return;
    navigate(`/customer/messages?providerId=${id}`);
  };

  const handleRequest = (serviceId = '', subject = '') => {
    if (!requireCustomer('request')) return;

    setRequestForm((current) => ({
      ...current,
      serviceId,
      subject,
    }));
    setShowRequestForm(true);
  };

  const handleExploreCategory = (categorySlug: string) => {
    navigate(`/explore?category=${encodeURIComponent(categorySlug)}`);
  };

  const toggleFavorite = async () => {
    if (!requireCustomer('favorite')) return;

    try {
      if (isFavorite) {
        await api.delete(`/favorites/providers/${id}`);
        setIsFavorite(false);
        toast.success('Provider removed from favorites.');
      } else {
        await api.post(`/favorites/providers/${id}`);
        setIsFavorite(true);
        toast.success('Provider added to favorites.');
      }

      await loadPage({ silent: true });
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update favorites.');
    }
  };

  const submitReview = async () => {
    if (!requireCustomer('review')) return;

    try {
      await api.post(`/provider-reviews/provider/${id}`, reviewForm);
      toast.success('Review submitted.');
      await Promise.all([loadPage({ silent: true }), loadViewerState()]);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to submit the review.');
    }
  };

  const submitRequest = async () => {
    if (!requireCustomer('request')) return;

    if (!requestForm.description.trim()) {
      toast.error('Request description is required.');
      return;
    }

    try {
      setSubmittingRequest(true);
      const response = await api.post('/orders', {
        providerId: id,
        serviceId: requestForm.serviceId || null,
        subject: requestForm.subject || null,
        description: requestForm.description,
        budgetMin: requestForm.budgetMin ? Number(requestForm.budgetMin) : null,
        budgetMax: requestForm.budgetMax ? Number(requestForm.budgetMax) : null,
        currencyCode: requestForm.currencyCode,
        preferredDate: requestForm.preferredDate || null,
        initialMessage: requestForm.initialMessage || requestForm.description,
      });

      toast.success('Service request sent.');
      setShowRequestForm(false);
      setRequestForm(emptyRequestForm);
      navigate(
        response.data?.data?.id
          ? `/customer/orders?requestId=${response.data.data.id}`
          : '/customer/orders'
      );
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to submit the request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const refreshMediaComments = useCallback(async (mediaId: string) => {
    try {
      const response = await api.get(`/provider-media/${mediaId}/comments`);
      setCommentsMap((current) => ({ ...current, [mediaId]: response.data?.data || [] }));
    } catch {
      toast.error('Failed to refresh comments.');
    }
  }, []);

  const handleToggleLike = useCallback(async (mediaId: string) => {
    if (!requireCustomerForPath(buildProviderUrl())) return;

    const wasLiked = Boolean(likedMapRef.current[mediaId]);
    const nextLiked = !wasLiked;

    setActionMediaId(mediaId);
    setLikedMap((current) => {
      const nextState = { ...current, [mediaId]: nextLiked };
      likedMapRef.current = nextState;
      return nextState;
    });
    updateMediaItem(mediaId, (item) => ({
      ...item,
      likesCount: Math.max(0, Number(item.likesCount || 0) + (nextLiked ? 1 : -1)),
    }));

    try {
      if (wasLiked) {
        await api.delete(`/provider-media/${mediaId}/like`);
      } else {
        await api.post(`/provider-media/${mediaId}/like`);
      }
    } catch (requestError: any) {
      setLikedMap((current) => {
        const nextState = { ...current, [mediaId]: wasLiked };
        likedMapRef.current = nextState;
        return nextState;
      });
      updateMediaItem(mediaId, (item) => ({
        ...item,
        likesCount: Math.max(0, Number(item.likesCount || 0) + (wasLiked ? 1 : -1)),
      }));
      toast.error(requestError.response?.data?.message || 'Failed to update like state.');
    } finally {
      setActionMediaId(null);
    }
  }, [buildProviderUrl, requireCustomerForPath, updateMediaItem]);

  const handleAddComment = useCallback(async (mediaId: string) => {
    if (!requireCustomerForPath(buildProviderUrl())) return;

    const body = commentDraftsRef.current[mediaId]?.trim();
    if (!body) {
      toast.error('Write a comment first.');
      return;
    }

    const optimisticComment: MediaComment = {
      id: `temp-comment-${mediaId}-${Date.now()}`,
      authorName: 'Sending...',
      body,
      createdAt: new Date().toISOString(),
    };

    try {
      setActionMediaId(mediaId);
      setCommentDrafts((current) => {
        const nextDrafts = { ...current, [mediaId]: '' };
        commentDraftsRef.current = nextDrafts;
        return nextDrafts;
      });
      setCommentsMap((current) => ({
        ...current,
        [mediaId]: [optimisticComment, ...(current[mediaId] || [])],
      }));

      updateMediaItem(mediaId, (item) => ({
        ...item,
        commentsCount: Math.max(0, Number(item.commentsCount || 0) + 1),
        latestComments: [optimisticComment, ...(item.latestComments || [])].slice(0, 3),
      }));

      const response = await api.post(`/provider-media/${mediaId}/comments`, { body });
      const createdComment = response.data?.data as MediaComment | undefined;

      if (createdComment) {
        setCommentsMap((current) => ({
          ...current,
          [mediaId]: (current[mediaId] || []).map((comment) =>
            comment.id === optimisticComment.id ? createdComment : comment
          ),
        }));

        updateMediaItem(mediaId, (item) => ({
          ...item,
          latestComments: (item.latestComments || []).map((comment) =>
            comment.id === optimisticComment.id ? createdComment : comment
          ),
        }));
      }

      toast.success('Comment added.');
    } catch (requestError: any) {
      setCommentDrafts((current) => {
        const nextDrafts = { ...current, [mediaId]: body };
        commentDraftsRef.current = nextDrafts;
        return nextDrafts;
      });
      setCommentsMap((current) => ({
        ...current,
        [mediaId]: (current[mediaId] || []).filter(
          (comment) => comment.id !== optimisticComment.id
        ),
      }));
      updateMediaItem(mediaId, (item) => ({
        ...item,
        commentsCount: Math.max(0, Number(item.commentsCount || 0) - 1),
        latestComments: (item.latestComments || []).filter(
          (comment) => comment.id !== optimisticComment.id
        ),
      }));
      toast.error(requestError.response?.data?.message || 'Failed to add the comment.');
    } finally {
      setActionMediaId(null);
    }
  }, [buildProviderUrl, requireCustomerForPath, updateMediaItem]);

  const handleCommentDraftChange = useCallback((mediaId: string, value: string) => {
    setCommentDrafts((current) => {
      const nextDrafts = { ...current, [mediaId]: value };
      commentDraftsRef.current = nextDrafts;
      return nextDrafts;
    });
  }, []);

  const stories = data?.stories || [];
  const activeStoryIndex = storyIdParam
    ? stories.findIndex((story) => story.id === storyIdParam)
    : -1;
  const activeStory =
    activeStoryIndex >= 0 && activeStoryIndex < stories.length
      ? stories[activeStoryIndex]
      : null;

  const openStory = (storyId: string) => {
    setStoryReplyDraft('');
    setStoryContext(storyId);
  };

  const closeStory = () => {
    setStoryReplyDraft('');
    setStoryContext(null);
  };

  const goPrevStory = () => {
    if (activeStoryIndex <= 0) return;
    openStory(stories[activeStoryIndex - 1].id);
  };

  const goNextStory = () => {
    if (activeStoryIndex < 0 || activeStoryIndex >= stories.length - 1) return;
    openStory(stories[activeStoryIndex + 1].id);
  };

  const handleStoryReply = async () => {
    if (!activeStory) return;

    const redirectPath = buildProviderUrl({ storyId: activeStory.id });

    if (!requireCustomerForPath(redirectPath)) return;

    if (!storyReplyDraft.trim()) {
      toast.error('Write a reply first.');
      return;
    }

    try {
      setReplyingToStory(true);
      const response = await api.post(`/provider-media/stories/${activeStory.id}/reply`, {
        body: storyReplyDraft.trim(),
      });

      const redirectTo =
        response.data?.data?.redirectTo ||
        `/customer/messages?conversationId=${response.data?.data?.conversationId || ''}`;

      toast.success('Reply sent successfully.');
      navigate(redirectTo);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to send the story reply.');
    } finally {
      setReplyingToStory(false);
    }
  };

  if (loading) {
    return (
      <PublicMarketplaceLayout activeNav="explore">
        <div className="grid gap-6 pt-8">
          <div className="h-[320px] animate-pulse rounded-[30px] bg-white/80" />
          <div className="h-[220px] animate-pulse rounded-[28px] bg-white/80" />
          <div className="h-[420px] animate-pulse rounded-[28px] bg-white/80" />
        </div>
      </PublicMarketplaceLayout>
    );
  }

  if (error || !data) {
    return (
      <PublicMarketplaceLayout activeNav="explore">
        <div className="pt-8">
          <div className="psp-error-state">
            <div className="font-bold">Provider page unavailable.</div>
            <div>{error || 'This provider could not be found.'}</div>
            <button
              type="button"
              className="psp-button psp-button--primary mt-4"
              onClick={() => navigate('/explore')}
            >
              Back to Explore
            </button>
          </div>
        </div>
      </PublicMarketplaceLayout>
    );
  }

  const { provider, services, media } = data;
  const providerLocation =
    [provider.city, provider.wilaya, provider.region].filter(Boolean).join(', ') || 'Algeria';
  const ownerName = `${provider.owner.firstName} ${provider.owner.lastName}`.trim();

  const canReplyToStory = Boolean(token && currentUser?.role === 'customer');
  const replyButtonLabel = !token
    ? 'Sign in to reply'
    : currentUser?.role !== 'customer'
      ? 'Customer account required'
      : 'Reply in chat';
  const replyPlaceholder = !token
    ? 'Sign in with a customer account to reply to this story.'
    : currentUser?.role !== 'customer'
      ? 'Story replies are available to customer accounts.'
      : 'Reply to this story...';

  return (
    <PublicMarketplaceLayout activeNav="explore">
      <div className="grid gap-8 pt-8">
        <ProviderHero
          provider={provider}
          providerLocation={providerLocation}
          ownerName={ownerName}
          isFavorite={isFavorite}
          storiesCount={stories.length}
          onOpenStories={() => {
            if (stories[0]) {
              openStory(stories[0].id);
            }
          }}
          onMessage={handleContact}
          onRequest={() => handleRequest()}
          onToggleFavorite={toggleFavorite}
        />

        <ProviderQuickNav
          hasStories={stories.length > 0}
          servicesCount={services.length}
          mediaCount={media.length}
          reviewsCount={reviews.length}
          responseTimeMinutes={provider.responseTimeMinutes || 0}
        />

        <ProviderRequestPanel
          visible={showRequestForm}
          services={services}
          requestForm={requestForm}
          submitting={submittingRequest}
          onClose={() => setShowRequestForm(false)}
          onChange={(field, value) =>
            setRequestForm((current) => ({
              ...current,
              [field]: value,
            }))
          }
          onSubmit={() => void submitRequest()}
        />

        <ProviderServicesSection
          services={services}
          onRequest={handleRequest}
          onExploreCategory={handleExploreCategory}
        />

        <ProviderStoriesSection stories={stories} onOpenStory={openStory} />

        <ProviderMediaSection
          media={media}
          commentsMap={commentsMap}
          commentDrafts={commentDrafts}
          likedMap={likedMap}
          actionMediaId={actionMediaId}
          onRefreshComments={refreshMediaComments}
          onToggleLike={handleToggleLike}
          onDraftChange={handleCommentDraftChange}
          onAddComment={handleAddComment}
        />

        <ProviderProfileDetails
          provider={provider}
          providerLocation={providerLocation}
          customerGeo={customerGeo}
        />

        <ProviderReviewsSection
          reviews={reviews}
          reviewForm={reviewForm}
          hasExistingReview={hasExistingReview}
          onRatingChange={(rating) =>
            setReviewForm((current) => ({
              ...current,
              rating,
            }))
          }
          onCommentChange={(comment) =>
            setReviewForm((current) => ({
              ...current,
              comment,
            }))
          }
          onSubmit={() => void submitReview()}
        />
      </div>

      <StoryViewer
        stories={stories}
        activeIndex={activeStory ? activeStoryIndex : null}
        replyDraft={storyReplyDraft}
        replying={replyingToStory}
        replyButtonLabel={replyButtonLabel}
        replyPlaceholder={replyPlaceholder}
        replyInputDisabled={!canReplyToStory}
        replyActionDisabled={replyingToStory || (canReplyToStory && !storyReplyDraft.trim())}
        onReplyDraftChange={setStoryReplyDraft}
        onReply={handleStoryReply}
        onClose={closeStory}
        onPrev={goPrevStory}
        onNext={goNextStory}
        onProviderAction={() => closeStory()}
        providerActionLabel="Browse provider profile"
      />
    </PublicMarketplaceLayout>
  );
};

export default PublicProviderPage;
