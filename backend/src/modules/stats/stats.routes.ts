import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/http.js';
import { getGeneralFeedbackStats, getOverviewStats, getStaffRatings, listReviews } from '../reviews/reviews.service.js';

export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [overview, staffRatings, generalFeedback, recent] = await Promise.all([
      getOverviewStats(),
      getStaffRatings(),
      getGeneralFeedbackStats(),
      listReviews({}, { limit: 5 }),
    ]);
    res.json({
      ...overview,
      staffRatings,
      generalFeedback,
      recentReviews: recent.rows,
    });
  }),
);
