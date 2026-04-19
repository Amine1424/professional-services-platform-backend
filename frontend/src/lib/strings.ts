const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const toDate = (value?: string | number | Date | null) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const slugifyValue = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const formatDateLabel = (value?: string | number | Date | null) => {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : 'Unknown date';
};

export const formatDateTimeLabel = (value?: string | number | Date | null) => {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : 'Unknown time';
};
