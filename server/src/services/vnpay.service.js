/**
 * VNPay Service
 * Handle VNPay payment gateway for subscriptions
 * Fixed for Movie Streaming Platform
 */

import crypto from 'crypto';
import querystring from 'qs';
import moment from 'moment';

class VNPayService {
  constructor() {
    this.vnpayConfig = {
      vnp_TmnCode: process.env.VNPAY_TMN_CODE,
      vnp_HashSecret: process.env.VNPAY_SECRET,
      vnp_Url: process.env.VNPAY_URL,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/subscription/payment/return'
    };
  }

  /**
   * Sort object by key
   */
  sortObject(obj) {
    const sorted = {};
    const str = [];
    let key;
    
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    
    return sorted;
  }

  /**
   * Create payment URL for subscription
   * @param {Object} subscriptionData - Subscription information
   * @param {string} subscriptionData.userId - User ID
   * @param {string} subscriptionData.plan - Subscription plan (basic, premium, family)
   * @param {number} subscriptionData.amount - Amount in VND
   * @param {string} subscriptionData.ipAddr - User IP address
   * @returns {string} Payment URL
   */
  createPaymentUrl(subscriptionData) {
    const { userId, plan, amount, ipAddr } = subscriptionData;
    
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderId = moment(date).format('DDHHmmss'); // Simple order ID
    
    // VNPay parameters
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpayConfig.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Subscription ${plan} - User ${userId}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPay requires amount * 100
      vnp_ReturnUrl: this.vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    };

    // Sort parameters
    vnp_Params = this.sortObject(vnp_Params);

    // Create signature
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    // Create payment URL
    const paymentUrl = this.vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

    return paymentUrl;
  }

  /**
   * Verify VNPay return/IPN
   * @param {Object} vnpParams - VNPay return parameters
   * @returns {Object} Verification result
   */
  verifyReturnUrl(vnpParams) {
    const secureHash = vnpParams['vnp_SecureHash'];
    
    // Remove hash params
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort parameters
    const sortedParams = this.sortObject(vnpParams);

    // Create signature
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Verify
    const isValid = secureHash === signed;

    return {
      isValid,
      responseCode: vnpParams['vnp_ResponseCode'],
      transactionNo: vnpParams['vnp_TransactionNo'],
      amount: parseInt(vnpParams['vnp_Amount']) / 100,
      orderInfo: vnpParams['vnp_OrderInfo'],
      txnRef: vnpParams['vnp_TxnRef'],
      bankCode: vnpParams['vnp_BankCode'],
      payDate: vnpParams['vnp_PayDate']
    };
  }

  /**
   * Check if payment is successful
   * @param {string} responseCode - VNPay response code
   * @returns {boolean}
   */
  isPaymentSuccess(responseCode) {
    return responseCode === '00';
  }

  /**
   * Get payment status message
   * @param {string} responseCode - VNPay response code
   * @returns {string}
   */
  getPaymentStatusMessage(responseCode) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '13': 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Các lỗi khác'
    };

    return messages[responseCode] || 'Lỗi không xác định';
  }

  /**
   * Create refund request (if needed)
   * @param {Object} refundData
   */
  createRefundRequest(refundData) {
    // TODO: Implement refund logic if needed
    throw new Error('Refund feature not implemented yet');
  }
}

export default new VNPayService();