import express from 'express';

import {
  verifyQRToken
} from '../controllers/qr.controller.js';
const router = express.Router();

// GET /api/menu - Verify QR token and load menu
router.get('/', verifyQRToken);

export default router;