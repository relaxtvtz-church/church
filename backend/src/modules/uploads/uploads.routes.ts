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
    try {
      if (!req.file) throw new ApiError(400, 'Choose an image to upload.');
      res.status(201).json({ url: saveImage(req.file), message: 'Image uploaded.' });
    } catch (uploadError) {
      next(uploadError);
    }
  });
});
