import { urlService } from '../services/url.service.js';

export class UrlController {
  /**
   * @param {import('../services/url.service.js').UrlService} [service]
   */
  constructor(service = urlService) {
    this.service = service;
  }

  /**
   * POST /api/urls
   */
  create = (req, res, next) => {
    try {
      const result = this.service.createShortUrl(req.body);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/urls/:code
   */
  getStats = (req, res, next) => {
    try {
      const { code } = req.params;
      const result = this.service.getShortUrl(code);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/urls/:code
   */
  delete = (req, res, next) => {
    try {
      const { code } = req.params;
      this.service.deleteShortUrl(code);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /:code
   */
  redirect = (req, res, next) => {
    try {
      const { code } = req.params;
      const originalUrl = this.service.resolveShortUrl(code);
      return res.redirect(302, originalUrl);
    } catch (err) {
      // If requested via browser GET, we can render simple error HTML or JSON error depending on Accept header,
      // or pass to error handler with proper status (404/410)
      next(err);
    }
  };

  /**
   * GET /health
   */
  health = (req, res) => {
    return res.status(200).json({
      success: true,
      data: {
        status: 'ok',
      },
    });
  };
}

export const urlController = new UrlController();
