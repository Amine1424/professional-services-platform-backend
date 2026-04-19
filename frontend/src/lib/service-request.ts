export type ServiceRequestStatus =
  | 'new'
  | 'reviewed'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RequestFilterKey = 'all' | 'new' | 'quoted' | 'active' | 'closed';

interface StatusMeta {
  label: string;
  tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
  group: 'new' | 'quoted' | 'active' | 'closed';
  nextAction: string;
}

export const REQUEST_STATUS_META: Record<string, StatusMeta> = {
  new: {
    label: 'New',
    tone: 'info',
    group: 'new',
    nextAction: 'Needs first review from the provider.',
  },
  reviewed: {
    label: 'Reviewed',
    tone: 'neutral',
    group: 'active',
    nextAction: 'Provider reviewed the brief and may send a quote next.',
  },
  quoted: {
    label: 'Quote sent',
    tone: 'warning',
    group: 'quoted',
    nextAction: 'Waiting for the customer to accept, reject, or continue the discussion.',
  },
  accepted: {
    label: 'Accepted',
    tone: 'success',
    group: 'active',
    nextAction: 'The quote was accepted and work can move into execution.',
  },
  in_progress: {
    label: 'In progress',
    tone: 'success',
    group: 'active',
    nextAction: 'The provider marked the request as underway.',
  },
  completed: {
    label: 'Completed',
    tone: 'success',
    group: 'closed',
    nextAction: 'The request lifecycle is complete.',
  },
  rejected: {
    label: 'Rejected',
    tone: 'danger',
    group: 'closed',
    nextAction: 'The request or quote was rejected and is no longer active.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'danger',
    group: 'closed',
    nextAction: 'The customer cancelled the request before completion.',
  },
};

export const REQUEST_FILTERS: Array<{ key: RequestFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'quoted', label: 'Quotes' },
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
];

export const getRequestStatusMeta = (status?: string | null): StatusMeta => {
  if (!status) {
    return {
      label: 'Unknown',
      tone: 'neutral',
      group: 'active',
      nextAction: 'Open the request to inspect the latest details.',
    };
  }

  return (
    REQUEST_STATUS_META[status] || {
      label: status,
      tone: 'neutral',
      group: 'active',
      nextAction: 'Open the request to inspect the latest details.',
    }
  );
};

export const matchesRequestFilter = (status: string, filter: RequestFilterKey) => {
  if (filter === 'all') {
    return true;
  }

  const meta = getRequestStatusMeta(status);

  if (filter === 'new') {
    return status === 'new';
  }

  if (filter === 'quoted') {
    return status === 'quoted';
  }

  return meta.group === filter;
};

export const formatMoney = (amount?: string | number | null, currencyCode = 'DZD') => {
  if (amount === undefined || amount === null || amount === '') {
    return 'Not specified';
  }

  const numeric = Number(amount);
  if (Number.isNaN(numeric)) {
    return `${amount} ${currencyCode}`;
  }

  return `${numeric.toLocaleString('en-US')} ${currencyCode}`;
};

export const formatMoneyRange = (
  min?: string | number | null,
  max?: string | number | null,
  currencyCode = 'DZD'
) => {
  if (!min && !max) {
    return 'Based on scope';
  }

  if (min && max) {
    return `${formatMoney(min, currencyCode)} - ${formatMoney(max, currencyCode)}`;
  }

  if (min) {
    return `Starting from ${formatMoney(min, currencyCode)}`;
  }

  return `Up to ${formatMoney(max, currencyCode)}`;
};

export const formatRequestDate = (value?: string | null) => {
  if (!value) {
    return 'Not specified';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const getRequestsCountByFilter = (statuses: string[], filter: RequestFilterKey) => {
  return statuses.filter((status) => matchesRequestFilter(status, filter)).length;
};
