import { Router } from 'express';
import { urlController } from '../controllers/url.controller.js';

export const apiRouter = Router();

apiRouter.post('/urls', urlController.create);
apiRouter.get('/urls/:code', urlController.getStats);
apiRouter.delete('/urls/:code', urlController.delete);
