import { Router } from 'express';
import { db } from '../../db/database.js';
import { requireAuth } from '../../middleware/auth.js';
import { getGeneralFeedbackStats, getOverviewStats, getStaffRatings, listReviews } from '../reviews/reviews.service.js';

export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get('/', (_req, res) => {
  res.json({
    ...getOverviewStats(),
    staffRatings: getStaffRatings(),
    generalFeedback: getGeneralFeedbackStats(),
    recentReviews: listReviews({}, { limit: 5 }).rows,
  });
});
