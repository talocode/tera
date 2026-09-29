import { Buffer } from "buffer";

const target = globalThis as unknown as { Buffer?: typeof Buffer; process?: unknown };

if (!target.Buffer) target.Buffer = Buffer;

if (!target.process) {
  target.process = {
    browser: true,
    version: "v20.0.0",
    env: {},
    nextTick: (fn: () => void) => {
      queueMicrotask(fn);
    },
  };
}
