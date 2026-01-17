/**
 * Subscription Controller
 * Handles subscription plans, payments, and management
 */

import Subscription from '../models/subscription.model.js';
import User from '../models/users.model.js';
import asyncHandler from 'express-async-handler';
import vnpayService from '../services/vnpay.service.js';
import subscriptionService from '../services/subscription.service.js';

// @desc    Get available subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
export const getPlans = asyncHandler(async (req, res) => {
  const plans = Subscription.getPlanDetails();

  res.json({
    success: true,
    data: plans
  });
});

// @desc    Get current user's subscription
// @route   GET /api/subscriptions/me
// @access  Private
export const getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id });

  if (!subscription) {
    // Return free plan info if no subscription
    return res.json({
      success: true,
      data: {
        plan: 'free',
        status: 'active',
        ...Subscription.getPlanDetails().free
      }
    });
  }

  // Check if expired and update status
  if (subscription.end_date < new Date() && subscription.status === 'active') {
    subscription.status = 'expired';
    await subscription.save();
  }

  res.json({
    success: true,
    data: subscription
  });
});

// @desc    Create/Upgrade subscription
// @route   POST /api/subscriptions
// @access  Private
export const createSubscription = asyncHandler(async (req, res) => {
  const { plan, payment_method } = req.body;

  // Validate plan
  const planDetails = Subscription.getPlanDetails();
  if (!planDetails[plan]) {
    res.status(400);
    throw new Error('Invalid plan');
  }

  if (plan === 'free') {
    res.status(400);
    throw new Error('Cannot create subscription for free plan');
  }

  // Check existing subscription
  let subscription = await Subscription.findOne({ user: req.user._id });

  if (subscription && subscription.isActive()) {
    // Upgrade/Downgrade existing subscription
    const oldPlan = subscription.plan;
    subscription.plan = plan;
    subscription.price = planDetails[plan].price;
    subscription.max_concurrent_streams = planDetails[plan].max_concurrent_streams;
    
    // Extend end_date from current end_date
    const duration = planDetails[plan].duration;
    subscription.end_date = new Date(
      subscription.end_date.getTime() + duration * 24 * 60 * 60 * 1000
    );
    
    await subscription.save();

    return res.json({
      success: true,
      message: `Subscription upgraded from ${oldPlan} to ${plan}`,
      data: subscription
    });
  }

  // Create new subscription
  const price = planDetails[plan].price;
  const duration = planDetails[plan].duration;

  // TODO: Integrate actual payment gateway (VNPay, MoMo, etc.)
  // For now, we'll create subscription directly
  // In production, you should:
  // 1. Create payment request
  // 2. Redirect user to payment gateway
  // 3. Handle callback/webhook
  // 4. Create subscription after successful payment

  const newSubscription = await Subscription.create({
    user: req.user._id,
    plan,
    price,
    payment_method: payment_method || 'vnpay',
    status: 'active',
    start_date: new Date(),
    end_date: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
    payment_history: [{
      amount: price,
      payment_date: new Date(),
      status: 'success'
    }]
  });

  res.status(201).json({
    success: true,
    message: 'Subscription created successfully',
    data: newSubscription
  });
});

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/cancel
// @access  Private
export const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id });

  if (!subscription) {
    res.status(404);
    throw new Error('No active subscription found');
  }

  await subscription.cancel();

  res.json({
    success: true,
    message: 'Subscription cancelled. You can continue using until the end of billing period.',
    data: subscription
  });
});

// @desc    Renew/Resume subscription
// @route   POST /api/subscriptions/renew
// @access  Private
export const renewSubscription = asyncHandler(async (req, res) => {
  let subscription = await Subscription.findOne({ user: req.user._id });

  if (!subscription) {
    res.status(404);
    throw new Error('No subscription found');
  }

  if (subscription.status === 'cancelled') {
    // Resume cancelled subscription
    subscription.status = 'active';
    subscription.auto_renew = true;
    await subscription.save();

    return res.json({
      success: true,
      message: 'Subscription resumed',
      data: subscription
    });
  }

  // Renew expired or active subscription
  await subscription.renew();

  res.json({
    success: true,
    message: 'Subscription renewed successfully',
    data: subscription
  });
});

// @desc    Get payment history
// @route   GET /api/subscriptions/payment-history
// @access  Private
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id });

  if (!subscription) {
    return res.json({
      success: true,
      data: []
    });
  }

  res.json({
    success: true,
    data: subscription.payment_history
  });
});

// @desc    Start streaming (record active stream)
// @route   POST /api/subscriptions/start-stream
// @access  Private
export const startStream = asyncHandler(async (req, res) => {
  const { movie_id, device_id } = req.body;

  if (!movie_id || !device_id) {
    res.status(400);
    throw new Error('Movie ID and Device ID are required');
  }

  const subscription = await Subscription.findOne({ user: req.user._id });

  if (!subscription || !subscription.isActive()) {
    res.status(403);
    throw new Error('Active subscription required');
  }

  try {
    await subscription.startStream(device_id, movie_id);
    
    res.json({
      success: true,
      message: 'Stream started',
      active_streams: subscription.active_streams.length,
      max_streams: subscription.max_concurrent_streams
    });
  } catch (error) {
    res.status(403);
    throw new Error(error.message);
  }
});

// @desc    End streaming (remove active stream)
// @route   POST /api/subscriptions/end-stream
// @access  Private
export const endStream = asyncHandler(async (req, res) => {
  const { device_id } = req.body;

  if (!device_id) {
    res.status(400);
    throw new Error('Device ID is required');
  }

  const subscription = await Subscription.findOne({ user: req.user._id });

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  await subscription.endStream(device_id);

  res.json({
    success: true,
    message: 'Stream ended',
    active_streams: subscription.active_streams.length
  });
});

// @desc    Get active streams
// @route   GET /api/subscriptions/active-streams
// @access  Private
export const getActiveStreams = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id })
    .populate('active_streams.movie', 'title poster_path');

  if (!subscription) {
    return res.json({
      success: true,
      data: [],
      max_streams: 1
    });
  }

  res.json({
    success: true,
    data: subscription.active_streams,
    max_streams: subscription.max_concurrent_streams
  });
});

// @desc    Get subscription statistics (Admin)
// @route   GET /api/subscriptions/admin/stats
// @access  Private (Admin)
export const getSubscriptionStats = asyncHandler(async (req, res) => {
  // Count by plan
  const byPlan = await Subscription.aggregate([
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$price' }
      }
    }
  ]);

  // Count by status
  const byStatus = await Subscription.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Total revenue
  const revenue = await Subscription.aggregate([
    {
      $unwind: '$payment_history'
    },
    {
      $match: {
        'payment_history.status': 'success'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$payment_history.amount' }
      }
    }
  ]);

  // Recent subscriptions
  const recent = await Subscription.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'username email');

  res.json({
    success: true,
    data: {
      by_plan: byPlan,
      by_status: byStatus,
      total_revenue: revenue[0]?.total || 0,
      recent_subscriptions: recent
    }
  });
});

// ============================================
// PAYMENT HANDLERS
// ============================================

// @desc    Handle VNPay payment return
// @route   GET /api/subscriptions/payment/return
// @access  Public (VNPay callback)
export const handlePaymentReturn = asyncHandler(async (req, res) => {
  try {
    const vnpParams = req.query;
    
    // Verify payment signature
    const verifyResult = vnpayService.verifyReturnUrl(vnpParams);
    
    if (!verifyResult.isValid) {
      return res.redirect(`${process.env.CLIENT_URL}/subscription/payment-failed?reason=invalid_signature`);
    }
    
    const isSuccess = vnpayService.isPaymentSuccess(verifyResult.responseCode);
    
    if (!isSuccess) {
      const message = vnpayService.getPaymentStatusMessage(verifyResult.responseCode);
      return res.redirect(`${process.env.CLIENT_URL}/subscription/payment-failed?reason=${encodeURIComponent(message)}`);
    }
    
    // Extract user ID from orderInfo
    // Format: "Subscription {plan} - User {userId}"
    const userIdMatch = verifyResult.orderInfo.match(/User (\w+)/);
    const userId = userIdMatch ? userIdMatch[1] : null;
    
    if (!userId) {
      return res.redirect(`${process.env.CLIENT_URL}/subscription/payment-failed?reason=invalid_order`);
    }
    
    // Process payment and create subscription
    const result = await subscriptionService.processPaymentReturn(vnpParams, userId);
    
    if (result.success) {
      return res.redirect(`${process.env.CLIENT_URL}/subscription/payment-success?txn=${result.transactionNo}`);
    } else {
      return res.redirect(`${process.env.CLIENT_URL}/subscription/payment-failed?reason=${encodeURIComponent(result.message)}`);
    }
  } catch (error) {
    console.error('Payment return error:', error);
    return res.redirect(`${process.env.CLIENT_URL}/subscription/payment-failed?reason=system_error`);
  }
});

// @desc    Handle VNPay IPN (Instant Payment Notification)
// @route   POST /api/subscriptions/payment/ipn
// @access  Public (VNPay webhook)
export const handlePaymentIPN = asyncHandler(async (req, res) => {
  try {
    const vnpParams = req.query;
    
    // Verify payment signature
    const verifyResult = vnpayService.verifyReturnUrl(vnpParams);
    
    if (!verifyResult.isValid) {
      return res.json({ RspCode: '97', Message: 'Invalid signature' });
    }
    
    const isSuccess = vnpayService.isPaymentSuccess(verifyResult.responseCode);
    
    if (!isSuccess) {
      return res.json({ RspCode: verifyResult.responseCode, Message: 'Payment failed' });
    }
    
    // Extract user ID
    const userIdMatch = verifyResult.orderInfo.match(/User (\w+)/);
    const userId = userIdMatch ? userIdMatch[1] : null;
    
    if (!userId) {
      return res.json({ RspCode: '99', Message: 'Invalid order info' });
    }
    
    // Check if already processed
    const existingSubscription = await Subscription.findOne({
      transaction_id: verifyResult.transactionNo
    });
    
    if (existingSubscription) {
      // Already processed
      return res.json({ RspCode: '00', Message: 'Success (already processed)' });
    }
    
    // Process payment
    await subscriptionService.processPaymentReturn(vnpParams, userId);
    
    return res.json({ RspCode: '00', Message: 'Success' });
  } catch (error) {
    console.error('Payment IPN error:', error);
    return res.json({ RspCode: '99', Message: 'System error' });
  }
});