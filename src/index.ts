export type EventValue = unknown | unknown[];

export type UnwrapPromise<T> = T extends Promise<infer U>
  ? U
  : T extends (first: infer P, ...args: unknown[]) => unknown
    ? P
    : T;

type ExtractParameters<T> = T extends (...args: infer P) => unknown ? P[0] : T;

export type PropertyToFunction<T> = T extends (...args: infer P) => unknown
  ? (...args: P) => void | Promise<void>
  : T extends unknown[]
    ? (...args: T) => void | Promise<void>
    : (event: UnwrapPromise<ExtractParameters<T>>) => void | Promise<void>;

export type Handler<T> = PropertyToFunction<T>;

export type WildcardHandler<T> = <K extends keyof T>(
  type: K,
  event: T[K] extends unknown[] ? T[K] : [UnwrapPromise<T[K]>],
) => void | Promise<void>;

export type EventHandlerList<T extends EventValue> = Set<Handler<T>>;

export type WildcardHandlerList<T> = Set<WildcardHandler<T>>;

export interface EventHandlerMap<T extends EventValue> {
  handlers: EventHandlerList<T>;
  onceHandlers: EventHandlerList<T>;
}

export interface EmitronOptions<Events> {
  maxListeners?: number;
  initialEvents?: Array<keyof Events>;
}

export interface EmitronSchema<Events> {
  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this;
  off<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this;
  emit<K extends keyof Events>(
    type: K,
    ...args: Events[K] extends (...args: infer P) => unknown
      ? P
      : [UnwrapPromise<Events[K]>]
  ): this;
  onAny(handler: WildcardHandler<Events>): this;
  offAny(handler: WildcardHandler<Events>): this;
  once<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this;
  emitAsync<K extends keyof Events>(
    type: K,
    ...args: Events[K] extends (...args: infer P) => unknown
      ? P
      : [UnwrapPromise<Events[K]>]
  ): Promise<this>;
  onAsync<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this;
  clear<K extends keyof Events>(type: K): this;
  clearAll(): this;
  listenerCount<K extends keyof Events>(type: K): number;
  listeners<K extends keyof Events>(type: K): readonly Handler<Events[K]>[];
  hasListeners<K extends keyof Events>(type: K): boolean;
  events<K extends keyof Events>(
    type: K,
  ): AsyncIterableIterator<UnwrapPromise<Events[K]>>;
  cleanup(): this;
  setMaxListeners(n: number): this;
  getMaxListeners(): number;
}

export class Emitron<Events> implements EmitronSchema<Events> {
  readonly #events = new Map<
    keyof Events,
    EventHandlerMap<Events[keyof Events]>
  >();
  readonly #wildcardHandlers: WildcardHandlerList<Events> = new Set();
  #maxListeners: number;

  constructor(options: EmitronOptions<Events> = {}) {
    this.#maxListeners = options.maxListeners ?? 10;

    if (options.initialEvents) {
      for (const eventType of options.initialEvents) {
        this.#events.set(eventType, {
          handlers: new Set(),
          onceHandlers: new Set(),
        });
      }
    }
  }

  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this {
    const handlers = this.#getEventHandlers(type);
    handlers.handlers.add(handler);
    return this;
  }

  off<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this {
    const handlers = this.#getEventHandlers(type);
    handlers.handlers.delete(handler);
    handlers.onceHandlers.delete(handler);
    return this;
  }

  emit<K extends keyof Events>(
    type: K,
    ...args: Events[K] extends (...args: infer P) => unknown
      ? P
      : [UnwrapPromise<Events[K]>]
  ): this {
    const handlers = this.#getEventHandlers(type);
    const allHandlers = [...handlers.handlers, ...handlers.onceHandlers];

    handlers.onceHandlers.clear();

    for (const handler of allHandlers) {
      if (Array.isArray(args)) {
        (handler as unknown as (...a: typeof args) => void | Promise<void>)(
          ...args,
        );
      } else {
        (handler as Handler<Events[K]>)(args);
      }
    }

    for (const wildcardHandler of this.#wildcardHandlers) {
      wildcardHandler(
        type,
        args as Events[K] extends unknown[]
          ? Events[K]
          : [UnwrapPromise<Events[K]>],
      );
    }

    return this;
  }

  async emitAsync<K extends keyof Events>(
    type: K,
    ...args: Events[K] extends (...args: infer P) => unknown
      ? P
      : [UnwrapPromise<Events[K]>]
  ): Promise<this> {
    const handlers = this.#getEventHandlers(type);
    const allHandlers = [...handlers.handlers, ...handlers.onceHandlers];

    handlers.onceHandlers.clear();

    const promises: Promise<void>[] = [];

    for (const handler of allHandlers) {
      promises.push(
        Promise.resolve().then(() => {
          if (Array.isArray(args)) {
            return (
              handler as unknown as (...a: typeof args) => void | Promise<void>
            )(...args);
          }
          return (handler as Handler<Events[K]>)(args);
        }),
      );
    }

    for (const wildcardHandler of this.#wildcardHandlers) {
      promises.push(
        Promise.resolve().then(() =>
          wildcardHandler(
            type,
            args as Events[K] extends unknown[]
              ? Events[K]
              : [UnwrapPromise<Events[K]>],
          ),
        ),
      );
    }

    await Promise.all(promises);
    return this;
  }

  onAny(handler: WildcardHandler<Events>): this {
    this.#wildcardHandlers.add(handler);
    return this;
  }

  offAny(handler: WildcardHandler<Events>): this {
    this.#wildcardHandlers.delete(handler);
    return this;
  }

  once<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this {
    const handlers = this.#getEventHandlers(type);
    handlers.onceHandlers.add(handler);
    return this;
  }

  onAsync<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this {
    return this.on(type, handler);
  }

  async *events<K extends keyof Events>(
    type: K,
  ): AsyncIterableIterator<UnwrapPromise<Events[K]>> {
    while (true) {
      yield await new Promise<UnwrapPromise<Events[K]>>((resolve) => {
        const handler: Handler<Events[K]> = ((
          value: UnwrapPromise<Events[K]>,
        ) => {
          resolve(value);
        }) as Handler<Events[K]>;
        this.once(type, handler);
      });
    }
  }

  clear<K extends keyof Events>(type: K): this {
    this.#events.delete(type);
    return this;
  }

  clearAll(): this {
    this.#events.clear();
    this.#wildcardHandlers.clear();
    return this;
  }

  listenerCount<K extends keyof Events>(type: K): number {
    const handlers = this.#events.get(type);
    return handlers ? handlers.handlers.size + handlers.onceHandlers.size : 0;
  }

  listeners<K extends keyof Events>(type: K): readonly Handler<Events[K]>[] {
    const handlers = this.#events.get(type);
    return handlers
      ? [...Array.from(handlers.handlers), ...Array.from(handlers.onceHandlers)]
      : [];
  }

  hasListeners<K extends keyof Events>(type: K): boolean {
    return this.listenerCount(type) > 0;
  }

  cleanup(): this {
    return this.clearAll();
  }

  setMaxListeners(n: number): this {
    this.#maxListeners = n;
    return this;
  }

  getMaxListeners(): number {
    return this.#maxListeners;
  }

  #getEventHandlers<K extends keyof Events>(
    type: K,
  ): EventHandlerMap<Events[K]> {
    if (!this.#events.has(type)) {
      this.#events.set(type, {
        handlers: new Set(),
        onceHandlers: new Set(),
      });
    }
    return this.#events.get(type) as EventHandlerMap<Events[K]>;
  }
}
