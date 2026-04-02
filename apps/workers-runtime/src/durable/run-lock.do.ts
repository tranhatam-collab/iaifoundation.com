import { DurableObject } from 'cloudflare:workers';

export class RunLock extends DurableObject {
  private runId: string | null = null;
  private locked: boolean = false;
  private lockHolder: string | null = null;

  constructor(state: any, env: any) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'acquire':
        return this.acquireLock(request);
      case 'release':
        return this.releaseLock(request);
      case 'status':
        return this.getStatus();
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async acquireLock(request: Request): Promise<Response> {
    if (this.locked) {
      return new Response(JSON.stringify({ ok: false, reason: 'already_locked' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as { holder: string };
    this.locked = true;
    this.lockHolder = body.holder;

    return new Response(JSON.stringify({ ok: true, holder: this.lockHolder }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async releaseLock(request: Request): Promise<Response> {
    const body = await request.json() as { holder: string };

    if (this.lockHolder !== body.holder) {
      return new Response(JSON.stringify({ ok: false, reason: 'not_holder' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    this.locked = false;
    this.lockHolder = null;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private getStatus(): Response {
    return new Response(JSON.stringify({
      locked: this.locked,
      holder: this.lockHolder,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
