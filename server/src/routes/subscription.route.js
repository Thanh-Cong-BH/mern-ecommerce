/**
 * Subscription Routes
 * Defines all subscription-related API endpoints
 */

import express from 'express';
const router = express.Router();

import {
  getPlans,
  getMySubscription,
  createSubscription,
  cancelSubscription,
  renewSubscription,
  getPaymentHistory,
  startStream,
  endStream,
  getActiveStreams,
  getSubscriptionStats,
  handlePaymentReturn,
  handlePaymentIPN
} from '../controllers/subscription.controller.js';

import { protect, admin } from '../middlewares/jwt-auth.js';

// ============================================
// PUBLIC ROUTES
// ============================================
router.get('/plans', getPlans);                                // GET /api/subscriptions/plans

// Payment callback routes (VNPay will call these)
router.get('/payment/return', handlePaymentReturn);            // GET /api/subscriptions/payment/return
router.post('/payment/ipn', handlePaymentIPN);                 // POST /api/subscriptions/payment/ipn

// ============================================
// PROTECTED ROUTES (require authentication)
// ============================================
router.use(protect);

router.get('/me', getMySubscription);                          // GET /api/subscriptions/me
router.post('/', createSubscription);                          // POST /api/subscriptions
router.put('/cancel', cancelSubscription);                     // PUT /api/subscriptions/cancel
router.post('/renew', renewSubscription);                      // POST /api/subscriptions/renew
router.get('/payment-history', getPaymentHistory);             // GET /api/subscriptions/payment-history

// Stream management
router.post('/start-stream', startStream);                     // POST /api/subscriptions/start-stream
router.post('/end-stream', endStream);                         // POST /api/subscriptions/end-stream
router.get('/active-streams', getActiveStreams);               // GET /api/subscriptions/active-streams

// ============================================
// ADMIN ROUTES
// ============================================
router.get('/admin/stats', admin, getSubscriptionStats);       // GET /api/subscriptions/admin/stats

export default router;