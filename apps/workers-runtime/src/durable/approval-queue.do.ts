import { DurableObject } from 'cloudflare:workers';

interface ApprovalQueueItem {
  id: string;
  runId: string;
  stepId: string;
  approverId: string;
  requestedAt: string;
  expiresAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export class ApprovalQueue extends DurableObject {
  private queue: Map<string, ApprovalQueueItem> = new Map();

  constructor(state: any, env: any) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'enqueue':
        return this.enqueue(request);
      case 'dequeue':
        return this.dequeue(request);
      case 'list':
        return this.listPending();
      case 'decide':
        return this.decide(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async enqueue(request: Request): Promise<Response> {
    const item = await request.json() as ApprovalQueueItem;
    this.queue.set(item.id, item);

    return new Response(JSON.stringify({ ok: true, item }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async dequeue(request: Request): Promise<Response> {
    const body = await request.json() as { approverId: string };
    const items = Array.from(this.queue.values())
      .filter((i) => i.approverId === body.approverId && i.status === 'pending');

    return new Response(JSON.stringify({ ok: true, items }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private listPending(): Response {
    const items = Array.from(this.queue.values())
      .filter((i) => i.status === 'pending');

    return new Response(JSON.stringify({ ok: true, items }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async decide(request: Request): Promise<Response> {
    const body = await request.json() as { id: string; decision: 'approved' | 'rejected'; reason: string };
    const item = this.queue.get(body.id);

    if (!item) {
      return new Response(JSON.stringify({ ok: false, reason: 'not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (item.status !== 'pending') {
      return new Response(JSON.stringify({ ok: false, reason: 'already_decided' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    item.status = body.decision;
    this.queue.set(body.id, item);

    return new Response(JSON.stringify({ ok: true, item }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
