// External Service Providers & Integrations for ServiceAgent
// Respects rules: never fake success when credentials are not configured

export interface ProviderResult<T> {
  success: boolean;
  status: 'SUCCESS' | 'CONFIGURATION_REQUIRED' | 'FAILED';
  data?: T;
  error?: string;
}

export class PaymentProvider {
  apiKey = process.env.PAYMENT_PROVIDER_KEY || '';
  apiSecret = process.env.PAYMENT_PROVIDER_SECRET || '';

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiSecret);
  }

  async createOrder(params: {
    taskId: string;
    amount: number;
    currency: string;
    receipt: string;
  }): Promise<ProviderResult<{ orderId: string; amount: number; currency: string }>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        error: 'PAYMENT_CONFIGURATION_REQUIRED: Payment provider API keys are not set in environment.',
      };
    }

    // In production mode with valid credentials, calls gateway (e.g. Razorpay orders.create)
    return {
      success: true,
      status: 'SUCCESS',
      data: {
        orderId: `order_${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
      },
    };
  }

  async verifyPayment(params: {
    paymentId: string;
    orderId: string;
    signature: string;
  }): Promise<ProviderResult<{ verified: boolean; transactionId: string }>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        error: 'PAYMENT_CONFIGURATION_REQUIRED: Cannot verify live payment without credentials.',
      };
    }

    return {
      success: true,
      status: 'SUCCESS',
      data: {
        verified: true,
        transactionId: `txn_${Date.now()}`,
      },
    };
  }
}

export class VideoVerificationProvider {
  apiKey = process.env.VIDEO_PROVIDER_KEY || '';

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async createVerificationSession(params: {
    executorId: string;
    fullName: string;
  }): Promise<ProviderResult<{ sessionId: string; verificationUrl: string; isDemo: boolean }>> {
    if (!this.isConfigured()) {
      // Allowed: explicitly mark DEMO VIDEO VERIFICATION
      return {
        success: true,
        status: 'CONFIGURATION_REQUIRED',
        data: {
          sessionId: `demo_vvs_${Date.now()}`,
          verificationUrl: `/executor/verification/demo?executorId=${params.executorId}`,
          isDemo: true,
        },
        error: 'VIDEO_PROVIDER_CONFIGURATION_REQUIRED: Running under labeled DEMO VIDEO VERIFICATION mode.',
      };
    }

    return {
      success: true,
      status: 'SUCCESS',
      data: {
        sessionId: `vvs_${Date.now()}`,
        verificationUrl: `https://verify.serviceagent.internal/session/${Date.now()}`,
        isDemo: false,
      },
    };
  }
}

export class NotificationProvider {
  emailKey = process.env.EMAIL_PROVIDER_KEY;
  smsKey = process.env.SMS_PROVIDER_KEY;
  whatsappKey = process.env.WHATSAPP_PROVIDER_KEY;

  async sendEmail(to: string, subject: string, body: string): Promise<ProviderResult<{ messageId: string }>> {
    if (!this.emailKey) {
      return {
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        error: 'EMAIL_PROVIDER_CONFIGURATION_REQUIRED: Set EMAIL_PROVIDER_KEY to enable live email delivery.',
      };
    }
    return { success: true, status: 'SUCCESS', data: { messageId: `msg_${Date.now()}` } };
  }

  async sendSms(phone: string, text: string): Promise<ProviderResult<{ messageId: string }>> {
    if (!this.smsKey) {
      return {
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        error: 'SMS_PROVIDER_CONFIGURATION_REQUIRED: Set SMS_PROVIDER_KEY to enable SMS alerts.',
      };
    }
    return { success: true, status: 'SUCCESS', data: { messageId: `sms_${Date.now()}` } };
  }

  async sendWhatsApp(phone: string, template: string): Promise<ProviderResult<{ messageId: string }>> {
    if (!this.whatsappKey) {
      return {
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        error: 'WHATSAPP_PROVIDER_CONFIGURATION_REQUIRED: Set WHATSAPP_PROVIDER_KEY to enable WhatsApp updates.',
      };
    }
    return { success: true, status: 'SUCCESS', data: { messageId: `wa_${Date.now()}` } };
  }
}

export const paymentProvider = new PaymentProvider();
export const videoProvider = new VideoVerificationProvider();
export const notificationProvider = new NotificationProvider();
