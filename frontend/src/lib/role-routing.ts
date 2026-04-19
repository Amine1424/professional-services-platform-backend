export type AppRole =
  | 'customer'
  | 'service_provider'
  | 'reviewer'
  | 'admin'
  | 'super_admin';

export interface StoredUser {
  id?: string;
  email?: string;
  role: AppRole;
  firstName?: string;
  lastName?: string;
}

export interface NavItem {
  label: string;
  path: string;
}

export const getStoredUser = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};

export const getDefaultRouteByRole = (role?: AppRole | string): string => {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin/dashboard';
    case 'reviewer':
      return '/reviewer/dashboard';
    case 'service_provider':
      return '/provider/dashboard';
    case 'customer':
    default:
      return '/customer/dashboard';
  }
};

export const getRoleMenuItems = (role?: AppRole | string): NavItem[] => {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return [
        { label: 'Overview', path: '/admin/dashboard' },
        { label: 'Users', path: '/admin/users' },
        { label: 'Providers', path: '/admin/providers' },
        { label: 'Categories', path: '/admin/categories' },
        { label: 'Review Inbox', path: '/admin/review-inbox' },
        { label: 'Regions', path: '/admin/regions' },
        { label: 'Reports', path: '/admin/reports' },
        { label: 'Content', path: '/admin/content' },
        { label: 'Reviewers', path: '/admin/reviewers' },
        { label: 'Settings', path: '/admin/settings' },
      ];

    case 'reviewer':
      return [
        { label: 'Overview', path: '/reviewer/dashboard' },
        { label: 'Pending Reviews', path: '/reviewer/pending' },
        { label: 'Review Inbox', path: '/reviewer/inbox' },
        { label: 'History', path: '/reviewer/history' },
        { label: 'Profile', path: '/reviewer/profile' },
      ];

    case 'service_provider':
      return [
        { label: 'Overview', path: '/provider/dashboard' },
        { label: 'Profile', path: '/provider/profile' },
        { label: 'Services', path: '/provider/services' },
        { label: 'Portfolio', path: '/provider/portfolio' },
        { label: 'Requests', path: '/provider/requests' },
        { label: 'Messages', path: '/provider/messages' },
        { label: 'Notifications', path: '/provider/notifications' },
        { label: 'Plans', path: '/provider/subscription' },
        { label: 'Settings', path: '/provider/settings' },
      ];

    case 'customer':
    default:
      return [
        { label: 'Overview', path: '/customer/dashboard' },
        { label: 'Explore', path: '/customer/explore' },
        { label: 'Messages', path: '/customer/messages' },
        { label: 'Requests', path: '/customer/orders' },
        { label: 'Favorites', path: '/customer/favorites' },
        { label: 'Notifications', path: '/customer/notifications' },
        { label: 'Reviews', path: '/customer/reviews' },
        { label: 'Subscription', path: '/customer/subscriptions' },
        { label: 'Profile', path: '/customer/profile' },
      ];
  }
};

export const getRoleDisplayName = (role?: AppRole | string): string => {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return 'Admin Workspace';
    case 'reviewer':
      return 'Reviewer Workspace';
    case 'service_provider':
      return 'Provider Workspace';
    case 'customer':
    default:
      return 'Customer Workspace';
  }
};

export const getNavByRole = getRoleMenuItems;
