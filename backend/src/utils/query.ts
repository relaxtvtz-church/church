import type { Request } from 'express';
import { CATEGORIES } from './format.js';
import type { ReviewFilters } from '../modules/reviews/reviews.service.js';

const str = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const int = (value: unknown): number | undefined => {
  const text = str(value);
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isInteger(parsed) ? parsed : undefined;
};

const dateBound = (value: unknown, endOfDay: boolean): string | undefined => {
  const text = str(value);
  if (!text) return undefined;
  if (text.length === 10) return endOfDay ? `${text}T23:59:59.999Z` : `${text}T00:00:00.000Z`;
  return text;
};

export const parseReviewFilters = (query: Request['query']): ReviewFilters => {
  const category = str(query.category);
  const status = str(query.status);
  const rating = int(query.rating);

  return {
    staffId: int(query.staffId),
    category: category && CATEGORIES.includes(category as (typeof CATEGORIES)[number]) ? category : undefined,
    rating: rating && rating >= 1 && rating <= 5 ? rating : undefined,
    status: status && ['new', 'reviewed', 'archived'].includes(status) ? status : undefined,
    dateFrom: dateBound(query.dateFrom, false),
    dateTo: dateBound(query.dateTo, true),
    search: str(query.search)?.slice(0, 120),
  };
};
