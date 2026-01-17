import { Router } from 'express';
import { allowImageMineTypes } from '../constants.js';

import {
  getInfo,
  updateInfo,
  changePassword,
  isExistedEmail,
  isExistedPhone
} from '../controllers/account.controller.js';

// Import subscription controller instead of orders
import {
  getMySubscription,
  cancelSubscription,
  getPaymentHistory
} from '../controllers/subscription.controller.js';

// Import watchlist and history controllers
import {
  getWatchlist
} from '../controllers/watchlist.controller.js';

import {
  getContinueWatching
} from '../controllers/viewhistory.controller.js';

import { isAuthorized } from '../middlewares/jwt-auth.js';
import UploadUtils from '../utils/UploadUtils.js';

const router = Router();
const upload = UploadUtils.multerUpload('/users/', allowImageMineTypes);

// Account info routes
router.route('/')
  .get(isAuthorized, getInfo)
  .patch(
    isAuthorized,
    upload.single('avatar'),
    UploadUtils.handleFilePath('avatar'),
    updateInfo
  );

router.patch('/change-password', isAuthorized, changePassword);
router.get('/is-existed-email/:email', isExistedEmail);
router.get('/is-existed-phone/:phone', isExistedPhone);

// ============================================
// REMOVED: Address routes (not needed for movie streaming)
// ============================================

// ============================================
// REPLACED: Orders → Subscriptions
// ============================================
router.route('/subscription')
  .get(isAuthorized, getMySubscription);

router.patch('/subscription/cancel', isAuthorized, cancelSubscription);
router.get('/subscription/payment-history', isAuthorized, getPaymentHistory);

// ============================================
// NEW: Watchlist routes (user's personal watchlist)
// ============================================
router.get('/watchlist', isAuthorized, getWatchlist);

// ============================================
// NEW: Watch history routes
// ============================================
router.get('/history', isAuthorized);
router.get('/history/continue-watching', isAuthorized, getContinueWatching);
router.get('/history/stats', isAuthorized);

export default router;