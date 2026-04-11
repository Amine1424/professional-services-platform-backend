import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDefaultRouteByRole } from '../lib/role-routing';

type CategoryItem = { id: string; name: string; slug?: string; description?: string | null };
type ProviderItem = {
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
  primaryCategory?: { id: string; name: string; slug?: string } | null;
  preference?: { featuredOnHomepage?: boolean; profileBadgeText?: string | null } | null;
};
type MediaStory = {
  id: string;
  title?: string;
  thumbnailUrl?: string | null;
  provider?: { id: string; companyName: string; avatarUrl?: string | null };
};

const API_BASE = (process.env.REACT_APP_API_URL || '/api').replace(/\/$/, '');
const fallbackCategories: CategoryItem[] = [
  { id: '1', name: 'Home Maintenance', slug: 'home-maintenance', description: 'Electricians, plumbers, carpenters, painters, and home repairs.' },
  { id: '2', name: 'Digital Services', slug: 'digital-services', description: 'Design, development, marketing, branding, and online business support.' },
  { id: '3', name: 'Health & Wellness', slug: 'health-wellness', description: 'Fitness, nutrition, beauty, and personal care professionals.' },
  { id: '4', name: 'Event Planning', slug: 'event-planning', description: 'Photography, decoration, catering, venues, and event execution.' },
];
const fallbackStories: {
  id: string;
  label: string;
  avatar: string;
  accent: string;
  providerId?: string;
}[] = [
  { id: 's1', label: "Ahmed's Tips", avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', accent: 'bg-rose-500' },
  { id: 's2', label: 'DIY Guides', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', accent: 'bg-fuchsia-500' },
  { id: 's3', label: 'Local Trends', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', accent: 'bg-amber-500' },
  { id: 's4', label: 'Top Work', avatar: 'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=300&q=80', accent: 'bg-blue-500' },
];
const providerVisuals = [
  { image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80', role: 'Graphic Designer', badge: 'Top Seller', tone: 'bg-amber-500' },
  { image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80', role: 'Electrician', badge: 'Highly Rated', tone: 'bg-blue-600' },
  { image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80', role: 'Fitness Coach', badge: 'Popular', tone: 'bg-emerald-500' },
  { image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80', role: 'Plumber', badge: 'Certified Pro', tone: 'bg-indigo-600' },
];
const categoryVisuals = [
  { icon: '🏠', glow: 'from-orange-100 via-white to-orange-50' },
  { icon: '💼', glow: 'from-blue-100 via-white to-sky-50' },
  { icon: '🌿', glow: 'from-emerald-100 via-white to-teal-50' },
  { icon: '🎉', glow: 'from-slate-100 via-white to-indigo-50' },
];

const fetchArray = async <T,>(url: string): Promise<T[]> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const payload = await response.json();
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
  } catch {}
  return [];
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [serviceQuery, setServiceQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>(fallbackCategories);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [stories, setStories] = useState<MediaStory[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('accessToken');
  const currentUserRaw = localStorage.getItem('user');
  const currentUser = useMemo(() => {
    try {
      return currentUserRaw ? JSON.parse(currentUserRaw) : null;
    } catch {
      return null;
    }
  }, [currentUserRaw]);

  const isSignedIn = Boolean(token && currentUser);
  const dashboardRoute = getDefaultRouteByRole(currentUser?.role);
  const notificationsRoute = currentUser?.role === 'service_provider' ? '/provider/notifications' : currentUser?.role === 'customer' ? '/customer/notifications' : dashboardRoute;
  const messagesRoute = currentUser?.role === 'service_provider' ? '/provider/messages' : currentUser?.role === 'customer' ? '/customer/messages' : dashboardRoute;

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [providerItems, categoryItems, mediaItems] = await Promise.all([
        fetchArray<ProviderItem>(`${API_BASE}/public/featured-providers`),
        fetchArray<CategoryItem>(`${API_BASE}/public/categories`),
        fetchArray<MediaStory>(`${API_BASE}/public/latest-media`),
      ]);
      if (!active) return;
      setProviders(providerItems);
      setCategories(categoryItems.length ? categoryItems : fallbackCategories);
      setStories(mediaItems);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const navigateProtected = (path: string) => navigate(isSignedIn ? path : `/login?redirect=${encodeURIComponent(path)}`);
  const runSearch = () => {
    const params = new URLSearchParams();
    if (serviceQuery.trim()) params.set('q', serviceQuery.trim());
    if (locationQuery.trim()) params.set('loc', locationQuery.trim());
    if (categoryQuery.trim()) params.set('cat', categoryQuery.trim());
    navigateProtected(`/customer/explore${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const storyItems = useMemo(() => (stories.length ? stories.slice(0, 4).map((story, index) => ({
    id: story.id,
    label: story.title || story.provider?.companyName || 'New Story',
    avatar: story.provider?.avatarUrl || story.thumbnailUrl || fallbackStories[index % fallbackStories.length].avatar,
    providerId: story.provider?.id,
    accent: fallbackStories[index % fallbackStories.length].accent,
  })) : fallbackStories), [stories]);

  const providerCards = useMemo(() => {
    const source = providers.length ? providers.slice(0, 4) : providerVisuals.map((visual, index) => ({
      id: `fallback-${index}`,
      companyName: ['Sarah Hamed', 'Ali Mansour', 'Nour Alami', 'Omar Fehmi'][index],
      avatarUrl: null,
      coverUrl: null,
      city: ['Algiers', 'Oran', 'Constantine', 'Blida'][index],
      wilaya: null,
      region: null,
      averageRating: [4.8, 4.9, 4.7, 4.85][index],
      reviewsCount: [336, 530, 326, 335][index],
      isVerified: true,
      primaryCategory: { id: `c-${index}`, name: visual.role },
      preference: { featuredOnHomepage: true, profileBadgeText: visual.badge },
    }));
    return source.map((provider, index) => {
      const visual = providerVisuals[index % providerVisuals.length];
      return {
        id: provider.id,
        companyName: provider.companyName,
        role: provider.primaryCategory?.name || visual.role,
        image: provider.coverUrl || provider.avatarUrl || visual.image,
        rating: Number(provider.averageRating || 4.8),
        reviews: Number(provider.reviewsCount || 0),
        badge: provider.preference?.profileBadgeText || visual.badge,
        tone: visual.tone,
        location: [provider.city, provider.wilaya, provider.region].filter(Boolean).join(', ') || 'Algeria',
        verified: Boolean(provider.isVerified),
      };
    });
  }, [providers]);

  const heroProvider = providerCards[1] || providerCards[0];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_#f7faff_0%,_#dfe9f7_42%,_#d0ddf0_100%)] text-slate-900">
      <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/70 shadow-[0_40px_90px_rgba(80,108,154,0.18)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(76,122,214,0.16),_transparent_28%),radial-gradient(circle_at_left,_rgba(208,223,240,0.55),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,248,255,0.98))]" />
          <div className="absolute -left-16 top-36 h-64 w-64 rounded-full bg-sky-100/60 blur-3xl" />
          <div className="absolute -right-20 bottom-24 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="relative z-10 p-5 md:p-8 lg:p-10">
            <header className="flex flex-col gap-5 border-b border-slate-200/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <button onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20"><Sparkles size={20} /></div>
                <div><div className="text-[17px] font-extrabold tracking-tight text-slate-900">ProServices</div><div className="text-xs text-slate-500">Trusted local professionals</div></div>
              </button>

              <nav className="flex flex-wrap items-center gap-5 text-sm font-semibold text-slate-500">
                <button onClick={() => navigateProtected('/customer/explore')} className="border-b-2 border-blue-500 pb-1 text-slate-900">Explore</button>
                <button onClick={() => navigateProtected('/customer/explore')} className="pb-1 transition hover:text-slate-900">Categories</button>
                <button onClick={() => navigate('/join/provider')} className="pb-1 transition hover:text-slate-900">Become a Provider</button>
                {isSignedIn ? <button onClick={() => navigate(dashboardRoute)} className="pb-1 transition hover:text-slate-900">Dashboard</button> : null}
                <button onClick={() => navigate(messagesRoute)} className="inline-flex items-center gap-2 pb-1 transition hover:text-slate-900"><MessageCircle size={16} />Messages</button>
                <button onClick={() => navigate(notificationsRoute)} className="relative inline-flex items-center gap-2 pb-1 transition hover:text-slate-900" aria-label="Notifications"><Bell size={16} /><span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">3</span></button>
                {isSignedIn ? <button onClick={() => navigate(dashboardRoute)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">My Dashboard</button> : <button onClick={() => navigate('/login')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">Sign In</button>}
              </nav>
            </header>

            <section className="grid gap-8 pt-8 xl:grid-cols-[1.25fr_0.82fr] xl:items-center">
              <div className="max-w-[700px]">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm"><ShieldCheck size={14} />Verified local professionals, trusted by customers</div>
                <h1 className="max-w-[560px] text-[38px] font-black leading-[1.02] tracking-tight text-slate-900 md:text-[54px]">Find the Right Professional<span className="mt-1 block font-semibold text-slate-700">for Your Needs</span></h1>
                <p className="mt-5 max-w-[520px] text-[16px] leading-8 text-slate-500 md:text-[20px] md:leading-9">Connect with expert service providers in your area.</p>

                <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)]">
                  <div className="grid lg:grid-cols-[1.15fr_0.75fr_0.85fr_auto]">
                    <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 lg:border-b-0 lg:border-r"><Search size={18} className="text-slate-400" /><input value={serviceQuery} onChange={(event) => setServiceQuery(event.target.value)} placeholder="What service do you need?" className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400" /></div>
                    <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 lg:border-b-0 lg:border-r"><MapPin size={18} className="text-slate-400" /><input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Location" className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400" /><ChevronDown size={16} className="text-slate-400" /></div>
                    <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 lg:border-b-0 lg:border-r"><select value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"><option value="">All Categories</option>{categories.map((category) => <option key={category.id} value={category.slug || category.name}>{category.name}</option>)}</select><ChevronDown size={16} className="shrink-0 text-slate-400" /></div>
                    <button onClick={runSearch} className="flex items-center justify-center gap-2 bg-blue-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-blue-700">Search</button>
                  </div>
                </div>

                <div className="mt-8 rounded-[30px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_45px_rgba(15,23,42,0.06)] backdrop-blur">
                  <div className="flex flex-wrap items-center gap-5">
                    {storyItems.map((story) => (
                      <button key={story.id} onClick={() => story.providerId ? navigate(`/providers/${story.providerId}`) : undefined} className="group flex min-w-[86px] flex-col items-center gap-2 text-center">
                        <div className="relative"><div className="h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white shadow-lg ring-2 ring-slate-200"><img src={story.avatar} alt={story.label} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></div><span className={`absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white text-white shadow ${story.accent}`}>+</span></div>
                        <span className="max-w-[92px] truncate text-[13px] font-semibold text-slate-700">{story.label}</span>
                      </button>
                    ))}
                    <button className="flex min-w-[92px] flex-col items-center gap-2 text-center"><div className="grid h-[82px] w-[82px] place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"><span className="text-3xl leading-none">+</span></div><span className="text-[13px] font-semibold text-slate-700">Add Story</span></button>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 translate-x-10 translate-y-6 rounded-[34px] bg-[radial-gradient(circle_at_center,_rgba(94,129,219,0.16),_transparent_64%)] blur-2xl" />
                <div className="relative overflow-hidden rounded-[32px] border border-white/70 shadow-[0_30px_60px_rgba(45,69,109,0.18)]">
                  <img src={heroProvider?.image || 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80'} alt={heroProvider?.companyName || 'Top Rated Carpenter'} className="h-[520px] w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,24,40,0.04),rgba(16,24,40,0.68))]" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1 text-xs font-bold backdrop-blur">Top Rated</div><div className="max-w-[280px] text-[22px] font-black leading-tight md:text-[34px]">{heroProvider?.companyName || 'Top Rated Carpenters in Your City'}</div><div className="mt-2 text-base text-white/85">{heroProvider?.role || 'Professional Services'}</div></div>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-4 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur md:grid-cols-3">
              {[{ title: 'Post Your Request', description: 'Get quotes for verified professionals.', icon: BriefcaseBusiness, action: () => navigateProtected('/customer/orders') }, { title: 'Chat with Experts', description: 'Instant messaging with providers.', icon: MessageCircle, action: () => navigateProtected(messagesRoute) }, { title: 'Secure Payments', description: 'Safe and reliable transactions.', icon: WalletCards, action: () => navigateProtected('/customer/explore') }].map((item, index) => {
                const Icon = item.icon;
                return <button key={item.title} onClick={item.action} className={`flex items-start gap-4 rounded-[22px] px-4 py-4 text-left transition hover:bg-slate-50 ${index < 2 ? 'md:border-r md:border-slate-200' : ''}`}><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 shadow-inner"><Icon size={30} /></div><div><div className="text-[22px] font-extrabold tracking-tight text-slate-900">{item.title}</div><div className="mt-1 text-[15px] leading-7 text-slate-500">{item.description}</div></div></button>;
              })}
            </section>

            <section className="mt-12">
              <div className="text-center"><h2 className="text-[24px] font-black tracking-tight text-slate-900 md:text-[42px]">Featured Service Providers</h2></div>
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {(loading ? Array.from({ length: 4 }) : providerCards).map((item, index) => loading ? <div key={`provider-skeleton-${index}`} className="h-[360px] animate-pulse rounded-[26px] bg-white/80 shadow-[0_20px_45px_rgba(15,23,42,0.06)]" /> : <button key={(item as any).id} onClick={() => navigate(`/providers/${(item as any).id}`)} className="group overflow-hidden rounded-[26px] border border-white/80 bg-white/85 text-left shadow-[0_24px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(15,23,42,0.14)]"><div className="relative h-[260px] overflow-hidden"><img src={(item as any).image} alt={(item as any).companyName} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.72))]" /><span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-white shadow ${(item as any).tone}`}>{(item as any).badge}</span><div className="absolute inset-x-0 bottom-0 p-4 text-white"><div className="text-[22px] font-black leading-tight">{(item as any).companyName}</div><div className="mt-1 text-base text-white/85">{(item as any).role}</div></div></div><div className="space-y-3 px-4 py-4"><div className="flex items-center gap-1 text-amber-400">{Array.from({ length: 5 }).map((_, starIndex) => <Star key={`${(item as any).id}-star-${starIndex}`} size={16} fill="currentColor" />)}<span className="ml-2 text-sm font-semibold text-slate-600">{Number((item as any).rating || 0).toFixed(2)} Reviews</span></div><div className="flex items-center justify-between text-sm text-slate-500"><span>{(item as any).location}</span>{(item as any).verified ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">Verified</span> : null}</div></div></button>)}
              </div>
            </section>

            <section className="mt-14 grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
              <div>
                <h2 className="text-center text-[24px] font-black tracking-tight text-slate-900 md:text-[40px]">Browse by Category</h2>
                <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {categories.slice(0, 4).map((category, index) => <button key={category.id} onClick={() => navigateProtected(`/customer/explore${category.slug ? `?category=${encodeURIComponent(category.slug)}` : ''}`)} className="group rounded-[26px] border border-white/80 bg-white/85 p-5 text-left shadow-[0_20px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_rgba(15,23,42,0.12)]"><div className={`grid h-24 w-24 place-items-center rounded-[28px] bg-gradient-to-br ${categoryVisuals[index % categoryVisuals.length].glow} text-5xl shadow-inner`}><span>{categoryVisuals[index % categoryVisuals.length].icon}</span></div><div className="mt-6 text-[20px] font-extrabold tracking-tight text-slate-900">{category.name}</div><p className="mt-2 text-sm leading-7 text-slate-500">{category.description || 'Discover trusted providers in this category.'}</p></button>)}
                </div>
              </div>

              <div className="xl:pt-16">
                <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_45px_rgba(15,23,42,0.07)]">
                  <div className="flex items-center gap-4"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80" alt="Customer review" className="h-14 w-14 rounded-full object-cover" /><div><div className="text-[20px] font-extrabold text-slate-900">Customer Reviews</div><div className="text-sm text-slate-500">Real trust signals from customers.</div></div></div>
                  <p className="mt-6 text-[17px] leading-8 text-slate-600">Excellent service. Found the perfect handyman in minutes.</p>
                  <div className="mt-6 flex items-center gap-2"><div className="flex items-center gap-1 text-amber-400">{Array.from({ length: 5 }).map((_, index) => <Star key={`review-star-${index}`} size={18} fill="currentColor" />)}</div><span className="text-lg font-bold text-slate-700">5</span></div>
                  <button onClick={() => navigateProtected('/customer/explore')} className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Explore Providers<ArrowRight size={16} /></button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
