export type ServiceRequestStatus =
  | 'new'
  | 'reviewed'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RequestFilterKey =
  | 'all'
  | 'new'
  | 'quoted'
  | 'active'
  | 'closed';

interface StatusMeta {
  label: string;
  tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
  group: 'new' | 'quoted' | 'active' | 'closed';
}

export const REQUEST_STATUS_META: Record<string, StatusMeta> = {
  new: {
    label: 'جديد',
    tone: 'info',
    group: 'new',
  },
  reviewed: {
    label: 'تمت المراجعة',
    tone: 'neutral',
    group: 'active',
  },
  quoted: {
    label: 'تم إرسال عرض',
    tone: 'warning',
    group: 'quoted',
  },
  accepted: {
    label: 'تم القبول',
    tone: 'success',
    group: 'active',
  },
  in_progress: {
    label: 'قيد التنفيذ',
    tone: 'success',
    group: 'active',
  },
  completed: {
    label: 'مكتمل',
    tone: 'success',
    group: 'closed',
  },
  rejected: {
    label: 'مرفوض',
    tone: 'danger',
    group: 'closed',
  },
  cancelled: {
    label: 'ملغي',
    tone: 'danger',
    group: 'closed',
  },
};

export const REQUEST_FILTERS: Array<{
  key: RequestFilterKey;
  label: string;
}> = [
  { key: 'all', label: 'الكل' },
  { key: 'new', label: 'الجديدة' },
  { key: 'quoted', label: 'العروض' },
  { key: 'active', label: 'النشطة' },
  { key: 'closed', label: 'المغلقة' },
];

export const getRequestStatusMeta = (status?: string | null): StatusMeta => {
  if (!status) {
    return {
      label: 'غير محدد',
      tone: 'neutral',
      group: 'active',
    };
  }

  return (
    REQUEST_STATUS_META[status] || {
      label: status,
      tone: 'neutral',
      group: 'active',
    }
  );
};

export const matchesRequestFilter = (
  status: string,
  filter: RequestFilterKey
) => {
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

export const formatMoney = (
  amount?: string | number | null,
  currencyCode = 'DZD'
) => {
  if (amount === undefined || amount === null || amount === '') {
    return 'غير محدد';
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
    return 'حسب الحاجة';
  }

  if (min && max) {
    return `${formatMoney(min, currencyCode)} -> ${formatMoney(max, currencyCode)}`;
  }

  if (min) {
    return `ابتداءً من ${formatMoney(min, currencyCode)}`;
  }

  return `حتى ${formatMoney(max, currencyCode)}`;
};

export const formatRequestDate = (value?: string | null) => {
  if (!value) {
    return 'غير محدد';
  }

  return new Intl.DateTimeFormat('ar-DZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const getRequestsCountByFilter = (
  statuses: string[],
  filter: RequestFilterKey
) => statuses.filter((status) => matchesRequestFilter(status, filter)).length;
