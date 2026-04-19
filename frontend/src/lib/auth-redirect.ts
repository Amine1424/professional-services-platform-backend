export type AuthLocationState = {
  from?: string;
};

export const getSafeRedirectTarget = (
  search: string,
  state?: AuthLocationState | null
) => {
  const redirectParam = new URLSearchParams(search).get('redirect');
  const candidate = redirectParam || state?.from || '';

  if (!candidate.startsWith('/') || candidate.startsWith('/login')) {
    return null;
  }

  return candidate;
};

export const withRedirect = (path: string, redirectTarget: string | null) => {
  if (!redirectTarget) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}redirect=${encodeURIComponent(redirectTarget)}`;
};

export const describeRedirectIntent = (redirectTarget: string | null) => {
  if (!redirectTarget) return null;

  if (redirectTarget.includes('intent=request')) {
    return 'You will return to the provider page with the request form ready to continue.';
  }

  if (redirectTarget.includes('intent=message')) {
    return 'You will return directly to continue the conversation flow with the provider.';
  }

  if (redirectTarget.includes('intent=favorite')) {
    return 'You will return to the provider page and complete the save-to-favorites action.';
  }

  if (redirectTarget.startsWith('/customer/messages')) {
    return 'You will return directly to the customer inbox after authentication.';
  }

  if (redirectTarget.startsWith('/customer/orders')) {
    return 'You will return directly to the requests workspace after authentication.';
  }

  if (redirectTarget.startsWith('/providers/')) {
    return 'You will return to the same provider page after authentication.';
  }

  return 'You will return to the page you were trying to access.';
};
