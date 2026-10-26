import type { PaymentProviderAdapter } from '../payment-adapter.js';

export interface StablecoinConfig {
  network: 'ethereum' | 'polygon' | 'solana';
  rpcUrl: string;
  contractAddress: string;
  signerKey: string;
}

export class StablecoinAdapter implements PaymentProviderAdapter {
  private config: StablecoinConfig;

  constructor(config: StablecoinConfig) {
    this.config = config;
  }

  async createTransfer(params: {
    amount: number;
    currency: string;
    beneficiary_id: string;
    idempotency_key: string;
  }): Promise<{ transfer_id: string; status: string }> {
    throw new Error('Stablecoin transfers are not implemented');
  }

  async getTransferStatus(transferId: string): Promise<{ status: string; settled_at?: string; fee?: number }> {
    throw new Error('Stablecoin transfer status is not implemented');
  }

  async refundTransfer(transferId: string, amount: number): Promise<{ refund_id: string; status: string }> {
    throw new Error('Stablecoin refunds are not implemented');
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    return false;
  }
}
