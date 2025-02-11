import { beforeEach, describe, expect, test, vi } from "vitest";
import { Emitron } from "../src/index.js";

interface TestEvents {
  simpleEvent: string;
  multiArgsEvent: (arg1: string, arg2: number) => void;
  arrayEvent: string[];
  asyncEvent: Promise<string>;
}

describe("Emitron", () => {
  let emitron: Emitron<TestEvents>;

  beforeEach(() => {
    emitron = new Emitron<TestEvents>();
  });

  describe("Constructor", () => {
    test("should create instance with default options", () => {
      expect(emitron.getMaxListeners()).toBe(10);
    });

    test("should create instance with custom maxListeners", () => {
      const customEmitron = new Emitron<TestEvents>({ maxListeners: 20 });
      expect(customEmitron.getMaxListeners()).toBe(20);
    });

    test("should initialize with initial events", () => {
      const customEmitron = new Emitron<TestEvents>({
        initialEvents: ["simpleEvent"],
      });
      expect(customEmitron.hasListeners("simpleEvent")).toBe(false);
      expect(customEmitron.listenerCount("simpleEvent")).toBe(0);
    });
  });

  describe("Event Handling", () => {
    test("should add and trigger event listener", () => {
      const handler = vi.fn();
      emitron.on("simpleEvent", handler);
      emitron.emit("simpleEvent", "test");
      expect(handler).toHaveBeenCalledWith("test");
    });

    test("should handle multiple arguments", () => {
      const handler = vi.fn();
      emitron.on("multiArgsEvent", handler);
      emitron.emit("multiArgsEvent", "test", 42);
      expect(handler).toHaveBeenCalledWith("test", 42);
    });

    test("should handle array events", () => {
      const handler = vi.fn();
      emitron.on("arrayEvent", handler);
      emitron.emit("arrayEvent", ["item1", "item2"]);
      expect(handler).toHaveBeenCalledWith(["item1", "item2"]);
    });

    test("should remove event listener", () => {
      const handler = vi.fn();
      emitron.on("simpleEvent", handler);
      emitron.off("simpleEvent", handler);
      emitron.emit("simpleEvent", "test");
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Once Events", () => {
    test("should trigger once event only one time", () => {
      const handler = vi.fn();
      emitron.once("simpleEvent", handler);
      emitron.emit("simpleEvent", "first");
      emitron.emit("simpleEvent", "second");
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith("first");
    });
  });

  describe("Wildcard Events", () => {
    test("should handle wildcard events", () => {
      const handler = vi.fn();
      emitron.onAny(handler);
      emitron.emit("simpleEvent", "test");
      expect(handler).toHaveBeenCalledWith("simpleEvent", ["test"]);
    });

    test("should remove wildcard handler", () => {
      const handler = vi.fn();
      emitron.onAny(handler);
      emitron.offAny(handler);
      emitron.emit("simpleEvent", "test");
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Async Events", () => {
    test("should handle async events", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      emitron.on("asyncEvent", handler);
      await emitron.emitAsync("asyncEvent", await Promise.resolve("test"));
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("Event Iterator", () => {
    test("should create event iterator", async () => {
      const iterator = emitron.events("simpleEvent");
      const promise = iterator.next();
      emitron.emit("simpleEvent", "test");
      const result = await promise;
      expect(result.value).toBe("test");
    });
  });

  describe("Utility Methods", () => {
    test("should clear specific event type", () => {
      const handler = vi.fn();
      emitron.on("simpleEvent", handler);
      emitron.clear("simpleEvent");
      emitron.emit("simpleEvent", "test");
      expect(handler).not.toHaveBeenCalled();
    });

    test("should clear all events", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitron.on("simpleEvent", handler1);
      emitron.onAny(handler2);
      emitron.clearAll();
      emitron.emit("simpleEvent", "test");
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    test("should get correct listener count", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitron.on("simpleEvent", handler1);
      emitron.once("simpleEvent", handler2);
      expect(emitron.listenerCount("simpleEvent")).toBe(2);
    });

    test("should get all listeners", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitron.on("simpleEvent", handler1);
      emitron.once("simpleEvent", handler2);
      const listeners = emitron.listeners("simpleEvent");
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });
  });
});
