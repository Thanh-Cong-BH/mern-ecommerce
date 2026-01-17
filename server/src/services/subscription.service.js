/**
 * Subscription Service
 * Business logic for subscription management
 */

import Subscription from '../models/subscription.model.js';
import User from '../models/users.model.js';
import vnpayService from './vnpay.service.js';

class SubscriptionService {
  /**
   * Get plan details
   */
  getPlans() {
    return Subscription.getPlanDetails();
  }

  /**
   * Get user's subscription
   */
  async getUserSubscription(userId) {
    let subscription = await Subscription.findOne({ user: userId });

    // If no subscription, return free plan
    if (!subscription) {
      const plans = this.getPlans();
      return {
        plan: 'free',
        status: 'active',
        ...plans.free,
        user: userId
      };
    }

    // Check if expired
    if (subscription.end_date < new Date() && subscription.status === 'active') {
      subscription.status = 'expired';
      await subscription.save();
    }

    return subscription;
  }

  /**
   * Create payment URL for subscription
   */
  async createPaymentUrl(userId, plan, ipAddr) {
    const plans = this.getPlans();
    
    if (!plans[plan]) {
      throw new Error('Invalid plan');
    }

    if (plan === 'free') {
      throw new Error('Cannot create payment for free plan');
    }

    const planDetails = plans[plan];
    const amount = planDetails.price;

    // Create payment URL
    const paymentUrl = vnpayService.createPaymentUrl({
      userId,
      plan,
      amount,
      ipAddr
    });

    return {
      paymentUrl,
      amount,
      plan: planDetails
    };
  }

  /**
   * Process payment callback from VNPay
   */
  async processPaymentReturn(vnpParams, userId) {
    // Verify payment
    const verifyResult = vnpayService.verifyReturnUrl(vnpParams);

    if (!verifyResult.isValid) {
      throw new Error('Invalid payment signature');
    }

    const isSuccess = vnpayService.isPaymentSuccess(verifyResult.responseCode);
    const statusMessage = vnpayService.getPaymentStatusMessage(verifyResult.responseCode);

    if (!isSuccess) {
      return {
        success: false,
        message: statusMessage,
        responseCode: verifyResult.responseCode
      };
    }

    // Extract plan from orderInfo
    // Format: "Subscription {plan} - User {userId}"
    const planMatch = verifyResult.orderInfo.match(/Subscription (\w+)/);
    const plan = planMatch ? planMatch[1] : null;

    if (!plan) {
      throw new Error('Cannot extract plan from order info');
    }

    // Create or update subscription
    const subscription = await this.createOrUpdateSubscription(
      userId,
      plan,
      verifyResult.transactionNo,
      verifyResult.amount
    );

    return {
      success: true,
      message: 'Payment successful',
      subscription,
      transactionNo: verifyResult.transactionNo
    };
  }

  /**
   * Create or update subscription after successful payment
   */
  async createOrUpdateSubscription(userId, plan, transactionId, amount) {
    const plans = this.getPlans();
    const planDetails = plans[plan];

    if (!planDetails) {
      throw new Error('Invalid plan');
    }

    // Check existing subscription
    let subscription = await Subscription.findOne({ user: userId });

    if (subscription && subscription.isActive()) {
      // Upgrade existing subscription
      const oldPlan = subscription.plan;
      subscription.plan = plan;
      subscription.price = planDetails.price;
      subscription.max_concurrent_streams = planDetails.max_concurrent_streams;
      
      // Extend end_date
      const duration = planDetails.duration;
      subscription.end_date = new Date(
        subscription.end_date.getTime() + duration * 24 * 60 * 60 * 1000
      );

      // Add to payment history
      subscription.payment_history.push({
        amount,
        payment_date: new Date(),
        transaction_id: transactionId,
        status: 'success'
      });

      await subscription.save();

      return subscription;
    }

    // Create new subscription
    const duration = planDetails.duration;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    subscription = await Subscription.create({
      user: userId,
      plan,
      price: planDetails.price,
      payment_method: 'vnpay',
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      max_concurrent_streams: planDetails.max_concurrent_streams,
      transaction_id: transactionId,
      payment_history: [{
        amount,
        payment_date: new Date(),
        transaction_id: transactionId,
        status: 'success'
      }]
    });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId) {
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    await subscription.cancel();
    return subscription;
  }

  /**
   * Renew subscription
   */
  async renewSubscription(userId) {
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    // For manual renewal, user should go through payment process
    // This method is for auto-renewal or resuming cancelled subscription
    
    if (subscription.status === 'cancelled') {
      subscription.status = 'active';
      subscription.auto_renew = true;
      await subscription.save();
      return subscription;
    }

    // For expired subscriptions, user needs to make payment again
    if (subscription.status === 'expired') {
      throw new Error('Expired subscription. Please make payment to renew.');
    }

    await subscription.renew();
    return subscription;
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId) {
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      return [];
    }

    return subscription.payment_history;
  }

  /**
   * Check if user can stream
   */
  async canUserStream(userId) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription || typeof subscription.isActive !== 'function') {
      // Free plan or no subscription object
      return {
        canStream: true,
        maxStreams: 1,
        currentStreams: 0
      };
    }

    if (!subscription.isActive()) {
      return {
        canStream: false,
        reason: 'No active subscription'
      };
    }

    const canStream = subscription.canStream();

    return {
      canStream,
      maxStreams: subscription.max_concurrent_streams,
      currentStreams: subscription.active_streams.length
    };
  }

  /**
   * Start a stream
   */
  async startStream(userId, movieId, deviceId) {
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (!subscription.isActive()) {
      throw new Error('No active subscription');
    }

    await subscription.startStream(deviceId, movieId);
    return subscription;
  }

  /**
   * End a stream
   */
  async endStream(userId, deviceId) {
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      return;
    }

    await subscription.endStream(deviceId);
    return subscription;
  }

  /**
   * Get subscription statistics (Admin)
   */
  async getStatistics() {
    const stats = await Subscription.aggregate([
      {
        $facet: {
          byPlan: [
            {
              $group: {
                _id: '$plan',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$price' }
              }
            }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          totalRevenue: [
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
          ]
        }
      }
    ]);

    return stats[0];
  }
}

export default new SubscriptionService();