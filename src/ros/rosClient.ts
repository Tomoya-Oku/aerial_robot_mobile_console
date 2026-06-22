import {serviceName} from './topics';

type PendingCall = {
  resolve: (value: any) => void;
  reject: (reason?: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
};

type Subscription = {
  id: string;
  topic: string;
  callback: (message: any) => void;
};

export class RosBridgeClient {
  private socket?: WebSocket;
  private id = 0;
  private pending = new Map<string, PendingCall>();
  private subscriptions = new Map<string, Subscription>();

  constructor(private readonly url: string) {}

  connect(handlers: {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (message: string) => void;
  }) {
    this.close();
    this.socket = new WebSocket(this.url);
    this.socket.onopen = () => handlers.onOpen?.();
    this.socket.onclose = () => handlers.onClose?.();
    this.socket.onerror = event => handlers.onError?.(String(event));
    this.socket.onmessage = event => this.handleMessage(event.data);
  }

  close() {
    this.pending.forEach(call => {
      clearTimeout(call.timer);
      call.reject(new Error('ROS bridge connection closed'));
    });
    this.pending.clear();
    this.subscriptions.clear();
    this.socket?.close();
    this.socket = undefined;
  }

  callService<T = any>(name: string, type: string, args: Record<string, unknown> = {}, timeoutMs = 5000): Promise<T> {
    const id = this.nextId('call');
    const payload = {
      op: 'call_service',
      id,
      service: serviceName(name),
      type,
      args,
    };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`service timeout: ${name}`));
      }, timeoutMs);
      this.pending.set(id, {resolve, reject, timer});
      this.send(payload);
    });
  }

  publish(topic: string, type: string, message: Record<string, unknown> = {}) {
    this.send({op: 'advertise', topic, type});
    this.send({op: 'publish', topic, msg: message});
  }

  subscribe(topic: string, type: string, callback: (message: any) => void, throttleRate = 250) {
    const id = this.nextId('sub');
    this.subscriptions.set(id, {id, topic, callback});
    this.send({
      op: 'subscribe',
      id,
      topic,
      type,
      throttle_rate: throttleRate,
      queue_length: 1,
    });
    return () => {
      this.subscriptions.delete(id);
      try {
        this.send({op: 'unsubscribe', id, topic});
      } catch {
        // The socket may already be closed during React cleanup.
      }
    };
  }

  private send(payload: Record<string, unknown>) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('ROS bridge is not connected');
    }
    this.socket.send(JSON.stringify(payload));
  }

  private handleMessage(data: string | ArrayBuffer) {
    const text = typeof data === 'string' ? data : String(data);
    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      return;
    }

    if (payload.op === 'service_response' && payload.id) {
      const pending = this.pending.get(payload.id);
      if (!pending) {
        return;
      }
      clearTimeout(pending.timer);
      this.pending.delete(payload.id);
      if (payload.result === false) {
        pending.reject(new Error(payload.values?.message || 'service call failed'));
      } else {
        pending.resolve(payload.values);
      }
      return;
    }

    if (payload.op === 'publish') {
      this.subscriptions.forEach(subscription => {
        if (subscription.topic === payload.topic) {
          subscription.callback(payload.msg);
        }
      });
    }
  }

  private nextId(prefix: string) {
    this.id += 1;
    return `${prefix}:${Date.now()}:${this.id}`;
  }
}
