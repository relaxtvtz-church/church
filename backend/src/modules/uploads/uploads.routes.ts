import { Router, type NextFunction, type Request, type Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { imageUpload, saveImage } from '../../middleware/upload.js';
import { ApiError } from '../../utils/http.js';

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

uploadsRouter.post('/image', (req: Request, res: Response, next: NextFunction) => {
  imageUpload(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }
    if (!req.file) {
      next(new ApiError(400, 'Choose an image to upload.'));
      return;
    }
    saveImage(req.file)
      .then((url) => res.status(201).json({ url, message: 'Image uploaded.' }))
      .catch(next);
  });
});

uploadsRouter.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});
