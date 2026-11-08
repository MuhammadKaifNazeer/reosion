import { describe, expect, it } from "vitest";
import { isParentMessage, isRuntimeMessage, toProtocolError } from "@/lib/protocol/messages";

describe("message protocol validation", () => {
  it("accepts known parent -> runtime messages", () => {
    expect(isParentMessage({ type: "LOAD_CODE", code: "", paused: true })).toBe(true);
    expect(isParentMessage({ type: "SET_TIME", time: 1.5 })).toBe(true);
    expect(isParentMessage({ type: "PLAY", from: 0 })).toBe(true);
    expect(isParentMessage({ type: "PAUSE" })).toBe(true);
    expect(isParentMessage({ type: "SEEK", time: 0.1 })).toBe(true);
    expect(isParentMessage({ type: "RESIZE", width: 100, height: 100 })).toBe(true);
    expect(isParentMessage({ type: "RESET" })).toBe(true);
    expect(isParentMessage({ type: "CAPTURE_FRAME", frameId: 3 })).toBe(true);
  });

  it("rejects unknown or malformed parent messages", () => {
    expect(isParentMessage({ type: "EXPLODE" })).toBe(false);
    expect(isParentMessage(null)).toBe(false);
    expect(isParentMessage({})).toBe(false);
    expect(isParentMessage("PLAY")).toBe(false);
  });

  it("accepts known runtime -> parent messages", () => {
    expect(isRuntimeMessage({ type: "READY" })).toBe(true);
    expect(isRuntimeMessage({ type: "RUNTIME_ERROR", error: { message: "x" } })).toBe(true);
    expect(isRuntimeMessage({ type: "RENDER_ERROR", error: { message: "x" } })).toBe(true);
    expect(isRuntimeMessage({ type: "DURATION", duration: 3 })).toBe(true);
    expect(isRuntimeMessage({ type: "FRAME", frameId: 0, dataURL: "", width: 1, height: 1 })).toBe(true);
    expect(isRuntimeMessage({ type: "TIME", time: 0.1 })).toBe(true);
    expect(isRuntimeMessage({ type: "LOAD_CODE" })).toBe(false);
  });

  it("normalizes thrown values into protocol errors", () => {
    const e = toProtocolError(new Error("boom"));
    expect(e.message).toBe("boom");
    expect(toProtocolError("plain")).toEqual({ message: "plain" });
    expect(toProtocolError(42).message).toBe("Unknown error");
  });
});
