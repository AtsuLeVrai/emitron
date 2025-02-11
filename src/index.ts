/**
 * Represents a value that can be emitted by the event emitter.
 * Can be any unknown value or array of unknown values.
 */
export type EventValue = unknown | unknown[];

/**
 * Unwraps a Promise type to get its resolved value type.
 * If T is a function, extracts its first parameter type.
 * Otherwise, returns T directly.
 *
 * @template T - The type to unwrap
 */
export type UnwrapPromise<T> = T extends Promise<infer U>
  ? U
  : T extends (first: infer P, ...args: unknown[]) => unknown
    ? P
    : T;

/**
 * Extracts the parameters from a function type.
 * Returns the first parameter type if T is a function, otherwise returns T.
 *
 * @template T - The type to extract parameters from
 */
type ExtractParameters<T> = T extends (...args: infer P) => unknown ? P[0] : T;

/**
 * Converts a property type to a function type.
 * - If T is a function, preserves its parameters but changes return type to void | Promise<void>
 * - If T is an array, creates a function that takes the array as parameters
 * - Otherwise creates a function that takes the unwrapped property type as parameter
 *
 * @template T - The property type to convert
 */
export type PropertyToFunction<T> = T extends (...args: infer P) => unknown
  ? (...args: P) => void | Promise<void>
  : T extends unknown[]
    ? (...args: T) => void | Promise<void>
    : (event: UnwrapPromise<ExtractParameters<T>>) => void | Promise<void>;

/**
 * Represents an event handler function.
 *
 * @template T - The event value type
 */
export type Handler<T> = PropertyToFunction<T>;

/**
 * Represents a wildcard event handler that can handle any event type.
 *
 * @template T - The events map type
 */
export type WildcardHandler<T> = <K extends keyof T>(
  type: K,
  event: T[K] extends unknown[] ? T[K] : [UnwrapPromise<T[K]>],
) => void | Promise<void>;

/**
 * A Set containing event handlers for a specific event type.
 *
 * @template T - The event value type
 */
export type EventHandlerList<T extends EventValue> = Set<Handler<T>>;

/**
 * A Set containing wildcard handlers that can handle any event type.
 *
 * @template T - The events map type
 */
export type WildcardHandlerList<T> = Set<WildcardHandler<T>>;

/**
 * Represents the handler maps for a specific event type.
 * Contains both regular handlers and once-only handlers.
 *
 * @template T - The event value type
 */
export interface EventHandlerMap<T extends EventValue> {
  /** Regular event handlers */
  handlers: EventHandlerList<T>;
  /** Handlers that will be removed after first execution */
  onceHandlers: EventHandlerList<T>;
}

/**
 * Configuration options for creating an Emitron instance.
 *
 * @template Events - The events map type
 */
export interface EmitronOptions<Events> {
  /** Maximum number of listeners per event type. Defaults to 10 */
  maxListeners?: number;
  /** Initial event types to initialize */
  initialEvents?: Array<keyof Events>;
}

/**
 * The main interface defining all available methods on an Emitron instance.
 *
 * @template Events - The events map type defining event names and their value types
 */
export interface EmitronSchema<Events> {
  /**
   * Adds an event listener for the specified event type.
   *
   * @template K - The event type key
   * @param type - The event type to listen for
   * @param handler - The handler function to call when the event occurs
   * @returns The Emitron instance for chaining
   */
  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this;

  /**
   * Removes an event listener for the specified event type.
   *
   * @template K - The event type key
   * @param type - The event type to remove listener from
   * @param handler - The handler function to remove
   * @returns The Emitron instance for chaining
   */
  off<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this;

  /**
   * Emits an event of the specified type with the given arguments.
   *
   * @template K - The event type key
   * @param type - The event type to emit
   * @param args - The arguments to pass to the event handlers
   * @returns The Emitron instance for chaining
   */
  emit<K extends keyof Events>(
    type: K,
    ...args: Events[K] extends (...args: infer P) => unknown
      ? P
      : [UnwrapPromise<Events[K]>]
  ): this;

  /**
   * Adds a wildcard event listener that will be called for all event types.
   *
   * @param handler - The wildcard handler function
   * @returns The Emitron instance for chaining
   */
  onAny(handler: WildcardHandler<Events>): this;

  /**
   * Removes a wildcard event listener.
   *
   * @param handler - The wildcard handler function to remove
   * @returns The Emitron instance for chaining
   */
  offAny(handler: WildcardHandler<Events>): this;

  /**
   * Adds a one-time event listener that will be removed after first execution.
   *
   * @template K - The event type key
   * @param type - The event type to listen for
   * @param handler - The handler function to call once
   * @returns The Emitron instance for chaining
   */
  once<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this;

  /**
   * Emits an event asynchronously, waiting for all handlers to complete.
   *
   * @template K - The event type key
   * @param type - The event type to emit
   * @param args - The arguments to pass to the event handlers
   * @returns Promise resolving to the Emitron instance
   */
  emitAsync<K extends keyof Events>(
    type: K,
    ...args: Events[K] extends (...args: infer P) => unknown
      ? P
      : [UnwrapPromise<Events[K]>]
  ): Promise<this>;

  /**
   * Adds an asynchronous event listener. Currently equivalent to `on()`.
   *
   * @template K - The event type key
   * @param type - The event type to listen for
   * @param handler - The handler function to call
   * @returns The Emitron instance for chaining
   */
  onAsync<K extends keyof Events>(type: K, handler: Handler<Events[K]>): this;

  /**
   * Removes all listeners for the specified event type.
   *
   * @template K - The event type key
   * @param type - The event type to clear
   * @returns The Emitron instance for chaining
   */
  clear<K extends keyof Events>(type: K): this;

  /**
   * Removes all listeners for all event types.
   *
   * @returns The Emitron instance for chaining
   */
  clearAll(): this;

  /**
   * Returns the number of listeners for the specified event type.
   *
   * @template K - The event type key
   * @param type - The event type to count listeners for
   * @returns The number of listeners
   */
  listenerCount<K extends keyof Events>(type: K): number;

  /**
   * Returns an array of all listeners for the specified event type.
   *
   * @template K - The event type key
   * @param type - The event type to get listeners for
   * @returns Array of handler functions
   */
  listeners<K extends keyof Events>(type: K): readonly Handler<Events[K]>[];

  /**
   * Checks if there are any listeners for the specified event type.
   *
   * @template K - The event type key
   * @param type - The event type to check
   * @returns True if there are listeners, false otherwise
   */
  hasListeners<K extends keyof Events>(type: K): boolean;

  /**
   * Creates an async iterator for the specified event type.
   *
   * @template K - The event type key
   * @param type - The event type to iterate
   * @returns AsyncIterableIterator of event values
   */
  events<K extends keyof Events>(
    type: K,
  ): AsyncIterableIterator<UnwrapPromise<Events[K]>>;

  /**
   * Alias for clearAll(). Removes all listeners.
   *
   * @returns The Emitron instance for chaining
   */
  cleanup(): this;

  /**
   * Sets the maximum number of listeners per event type.
   *
   * @param n - The maximum number of listeners
   * @returns The Emitron instance for chaining
   */
  setMaxListeners(n: number): this;

  /**
   * Gets the current maximum number of listeners per event type.
   *
   * @returns The maximum number of listeners
   */
  getMaxListeners(): number;
}

/**
 * A strongly-typed event emitter with support for synchronous and asynchronous events,
 * wildcard listeners, and TypeScript type safety.
 *
 * Features:
 * - Type-safe event emission and handling
 * - Synchronous and asynchronous event emission
 * - Wildcard event listeners
 * - One-time event listeners
 * - Configurable maximum listeners per event
 * - Async iteration of events
 *
 * @template Events - A type mapping event names to their value types
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   userJoined: { userId: string; timestamp: number };
 *   messageReceived: [message: string, from: string];
 *   disconnect: () => void;
 * }
 *
 * const emitter = new Emitron<MyEvents>();
 *
 * emitter.on('userJoined', ({ userId, timestamp }) => {
 *   console.log(`User ${userId} joined at ${timestamp}`);
 * });
 *
 * emitter.emit('userJoined', { userId: '123', timestamp: Date.now() });
 * ```
 */
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
