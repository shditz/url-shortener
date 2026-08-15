import { Router } from 'express';
import { urlController } from '../controllers/url.controller.js';

export const redirectRouter = Router();

redirectRouter.get('/:code', urlController.redirect);
