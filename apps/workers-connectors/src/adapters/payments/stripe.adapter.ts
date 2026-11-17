import type { PaymentProviderAdapter } from '../payment-adapter.js';

export interface StripeConfig {
  apiKey: string;
  webhookSecret: string;
  accountId?: string;
}

export class StripeAdapter implements PaymentProviderAdapter {
  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.config = config;
  }

  async createTransfer(params: {
    amount: number;
    currency: string;
    beneficiary_id: string;
    idempotency_key: string;
  }): Promise<{ transfer_id: string; status: string }> {
    throw new Error('Stripe transfers are not implemented');
  }

  async getTransferStatus(transferId: string): Promise<{ status: string; settled_at?: string; fee?: number }> {
    throw new Error('Stripe transfer status is not implemented');
  }

  async refundTransfer(transferId: string, amount: number): Promise<{ refund_id: string; status: string }> {
    throw new Error('Stripe refunds are not implemented');
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    return false;
  }
}
