/**
 * Subscription Middleware
 * Checks if user has active subscription before allowing access to premium content
 */

import Subscription from '../models/subscription.model.js';
import asyncHandler from 'express-async-handler';

/**
 * Check if user has active subscription
 * Attaches subscription object to req.subscription if active
 */
export const checkSubscription = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, please login');
  }

  // Get user's subscription
  const subscription = await Subscription.findOne({ user: req.user._id });

  // If no subscription or free plan, deny access
  if (!subscription) {
    res.status(403);
    throw new Error('Active subscription required to access this content');
  }

  // Check if subscription is active
  if (!subscription.isActive()) {
    res.status(403);
    throw new Error(`Your subscription has ${subscription.status}. Please renew to continue.`);
  }

  // Attach subscription to request
  req.subscription = subscription;

  next();
});

/**
 * Check if user can stream (based on concurrent streams limit)
 */
export const checkStreamLimit = asyncHandler(async (req, res, next) => {
  if (!req.subscription) {
    res.status(403);
    throw new Error('Subscription check failed');
  }

  if (!req.subscription.canStream()) {
    res.status(403);
    throw new Error(
      `Maximum concurrent streams (${req.subscription.max_concurrent_streams}) reached for your plan. ` +
      `Please stop another stream or upgrade your plan.`
    );
  }

  next();
});

/**
 * Check subscription plan (minimum required plan)
 * Usage: checkPlan('premium') - requires premium or higher
 */
export const checkPlan = (minPlan) => {
  const planHierarchy = {
    'free': 0,
    'basic': 1,
    'premium': 2,
    'family': 3
  };

  return asyncHandler(async (req, res, next) => {
    if (!req.subscription) {
      res.status(403);
      throw new Error('Subscription required');
    }

    const userPlanLevel = planHierarchy[req.subscription.plan] || 0;
    const requiredPlanLevel = planHierarchy[minPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      res.status(403);
      throw new Error(
        `This feature requires ${minPlan} plan or higher. ` +
        `Your current plan: ${req.subscription.plan}`
      );
    }

    next();
  });
};
