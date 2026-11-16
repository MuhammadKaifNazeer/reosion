/**
 * Native video encoding (WebCodecs + mediabunny).
 *
 * Frames arrive as transferable ImageBitmaps from the sandbox runtime and are
 * streamed straight into a VideoSampleSource, which encodes them with the
 * browser's WebCodecs VideoEncoder and muxes them into an MP4 container —
 * no intermediate PNG files, no ffmpeg.wasm.
 *
 * Feature detection is explicit: if WebCodecs or an encodable codec is not
 * available, `pickNativeCodec` returns null and the caller must fall back to
 * the ffmpeg.wasm path.
 */
import {
  BufferTarget,
  Mp4OutputFormat,
  Output,
  Quality,
  VideoSample,
  VideoSampleSource,
  getFirstEncodableVideoCodec,
  type VideoCodec,
} from "mediabunny";

export interface NativeCodecInfo {
  codec: VideoCodec;
  /** Output width in px (even — H.264 requires even dimensions). */
  width: number;
  /** Output height in px (even). */
  height: number;
}

/** H.264 does not encode odd dimensions; round down to even. */
export function evenDimensions(width: number, height: number): {
  width: number;
  height: number;
} {
  const even = (n: number) => Math.max(2, n - (n % 2));
  return { width: even(width), height: even(height) };
}

/**
 * Picks the best natively encodable codec for the output format.
 * Returns null when WebCodecs is unavailable or no codec can encode
 * the requested dimensions.
 */
export async function pickNativeCodec(
  width: number,
  height: number,
): Promise<NativeCodecInfo | null> {
  if (typeof window === "undefined") return null;
  if (typeof VideoFrame === "undefined" || typeof VideoEncoder === "undefined") {
    return null;
  }
  const { width: w, height: h } = evenDimensions(width, height);
  try {
    const codec = await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], {
      width: w,
      height: h,
    });
    if (!codec) return null;
    return { codec, width: w, height: h };
  } catch {
    return null;
  }
}

/**
 * Streams ImageBitmap frames into an MP4 (H.264/VP9/AV1) via WebCodecs.
 * `addBitmap` awaits the encoder pipeline, so backpressure is applied
 * naturally by the sequential capture loop.
 */
export class NativeVideoEncoder {
  private readonly output: Output<Mp4OutputFormat, BufferTarget>;
  private readonly source: VideoSampleSource;
  private readonly info: NativeCodecInfo;
  private rescaleCanvas: OffscreenCanvas | null;
  private readonly fps: number;
  private started = false;

  constructor(info: NativeCodecInfo, fps: number) {
    this.info = info;
    this.fps = fps;
    this.output = new Output({
      format: new Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new BufferTarget(),
    });
    this.source = new VideoSampleSource({
      codec: info.codec,
      quality: new Quality("high"),
    });
    this.output.addVideoTrack(this.source);
    this.rescaleCanvas = null;
  }

  async start(): Promise<void> {
    await this.output.start();
    this.started = true;
  }

  /** Adds one frame. The bitmap is NOT closed here — caller closes it. */
  async addBitmap(
    bitmap: ImageBitmap,
    timestampSec: number,
    durationSec?: number,
  ): Promise<void> {
    if (!this.started) throw new Error("encoder not started");
    let source: CanvasImageSource = bitmap;
    const { width, height } = this.info;
    if (bitmap.width !== width || bitmap.height !== height) {
      const canvas = (this.rescaleCanvas ??= new OffscreenCanvas(width, height));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("rescale canvas unavailable");
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
      source = canvas;
    }
    const sample = new VideoSample(source, {
      timestamp: timestampSec,
      duration: durationSec ?? 1 / this.fps,
    });
    await this.source.add(sample);
    sample.close();
  }

  /** Closes the track, finalizes the container and returns the MP4 blob. */
  async finish(): Promise<Blob> {
    this.source.close();
    await this.output.finalize();
    const buffer = this.output.target?.buffer;
    if (!buffer || buffer.byteLength === 0) {
      throw new Error("encoder produced an empty file");
    }
    return new Blob([buffer], { type: "video/mp4" });
  }
}
