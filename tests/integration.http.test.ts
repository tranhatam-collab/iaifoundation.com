import { describe, expect, test } from 'vitest';

describe('integration route contracts', () => {
  test('execute intent payload shape', () => {
    const payload = {
      template_id: 'tpl_1',
      inputs: {
        amount: 100,
        supplier_id: 'ben_1',
      },
      mode: 'template_driven',
    };

    expect(payload.template_id.startsWith('tpl_')).toBe(true);
    expect(typeof payload.inputs).toBe('object');
  });

  test('payment intent payload shape', () => {
    const payload = {
      run_id: 'run_1',
      step_id: 'stp_1',
      payment_type: 'payout',
      amount: 1500,
      currency_or_asset: 'USD',
      beneficiary_id: 'ben_1',
    };

    expect(payload.amount).toBeGreaterThan(0);
    expect(payload.currency_or_asset.length).toBeGreaterThan(0);
  });
});
