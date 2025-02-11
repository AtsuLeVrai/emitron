import { bench, describe } from "vitest";
import { Emitron } from "../src/index.js";

interface BenchEvents {
  simple: string;
  multiple: (arg1: string, arg2: number) => void;
  array: string[];
}

describe("Emitron Benchmarks", () => {
  const createEmitron = () => {
    const emitron = new Emitron<BenchEvents>();
    const handler = () => {};
    emitron.on("simple", handler);
    emitron.on("multiple", handler);
    emitron.on("array", handler);
    return { emitron, handler };
  };

  bench("emit simple event", () => {
    const { emitron } = createEmitron();
    emitron.emit("simple", "test");
  });

  bench("emit multiple args event", () => {
    const { emitron } = createEmitron();
    emitron.emit("multiple", "test", 42);
  });

  bench("emit array event", () => {
    const { emitron } = createEmitron();
    emitron.emit("array", ["item1", "item2", "item3"]);
  });

  bench("add and remove listener", () => {
    const { emitron, handler } = createEmitron();
    emitron.on("simple", handler);
    emitron.off("simple", handler);
  });

  bench("add and trigger once listener", () => {
    const { emitron } = createEmitron();
    emitron.once("simple", () => {});
    emitron.emit("simple", "test");
  });

  bench("wildcard listener", () => {
    const { emitron } = createEmitron();
    emitron.onAny(() => {});
    emitron.emit("simple", "test");
  });
});
