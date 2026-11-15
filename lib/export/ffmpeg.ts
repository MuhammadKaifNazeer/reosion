/**
 * Local ffmpeg.wasm client.
 *
 * The official @ffmpeg/ffmpeg wrapper builds its worker with
 * `new URL(classWorkerURL, import.meta.url)`, which the bundler cannot
 * statically resolve, so we implement the small worker protocol here and
 * load the vendored worker script (`public/ffmpeg/ffmpeg-worker.mjs`,
 * produced by scripts/setup-vendor.mjs) from a blob URL at runtime.
 *
 * Everything runs locally in the user's browser: the core binary is vendored
 * at /ffmpeg and no network request leaves the machine during export.
 */

// Blob-URL module workers have no base URL, so module specifiers must be
// fully absolute (origin included) — relative/absolute paths cannot resolve.
const WORKER_URL = "/ffmpeg/ffmpeg-worker.mjs";
const CORE_URL = `${globalThis.location?.origin ?? ""}/ffmpeg/ffmpeg-core-esm.js`;
const WASM_URL = `${globalThis.location?.origin ?? ""}/ffmpeg/ffmpeg-core-esm.wasm`;

type ProgressData = { progress: number; time: number };

interface FfmpegClient {
  exec(args: string[]): Promise<unknown>;
  writeFile(path: string, data: Uint8Array): Promise<boolean>;
  readFile(path: string): Promise<Uint8Array>;
  deleteFile(path: string): Promise<boolean>;
  onProgress(handler: (data: ProgressData) => void): void;
  offProgress(handler: (data: ProgressData) => void): void;
}

let clientPromise: Promise<FfmpegClient> | null = null;

export function getFFmpeg(): Promise<FfmpegClient> {
  if (!clientPromise) {
    clientPromise = createClient().catch((error) => {
      // Allow a later retry if loading failed.
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

async function createClient(): Promise<FfmpegClient> {
  const source = await fetch(WORKER_URL).then((res) => {
    if (!res.ok) throw new Error(`ffmpeg worker unavailable (HTTP ${res.status})`);
    return res.text();
  });
  const blob = new Blob([source], { type: "text/javascript" });
  const worker = new Worker(URL.createObjectURL(blob), { type: "module" });

  const resolves = new Map<number, (value: unknown) => void>();
  const rejects = new Map<number, (reason: unknown) => void>();
  const progressCallbacks = new Set<(data: ProgressData) => void>();
  let nextId = 0;

  const ready = new Promise<void>((resolve, reject) => {
    worker.onmessage = ({ data }: MessageEvent) => {
      const { id, type, data: payload } = data as {
        id: number;
        type: string;
        data: unknown;
      };
      if (type === "PROGRESS") {
        for (const cb of progressCallbacks) cb(payload as ProgressData);
        return;
      }
      if (type === "ERROR") {
        rejects.get(id)?.(payload);
      } else {
        resolves.get(id)?.(payload);
      }
      resolves.delete(id);
      rejects.delete(id);
    };
    worker.onerror = (event) => reject(new Error(event.message));
    send("LOAD", { coreURL: CORE_URL, wasmURL: WASM_URL }).then(
      () => resolve(),
      reject,
    );
  });

  function send(type: string, payload?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      resolves.set(id, resolve);
      rejects.set(id, reject);
      worker.postMessage({ id, type, data: payload });
    });
  }

  await ready;

  return {
    exec: (args) => send("EXEC", { args }),
    writeFile: (path, data) => send("WRITE_FILE", { path, data }) as Promise<boolean>,
    readFile: (path) => send("READ_FILE", { path }) as Promise<Uint8Array>,
    deleteFile: (path) => send("DELETE_FILE", { path }) as Promise<boolean>,
    onProgress: (handler) => progressCallbacks.add(handler),
    offProgress: (handler) => progressCallbacks.delete(handler),
  };
}

/** Converts a data URL into the raw bytes ffmpeg.writeFile expects. */
export function dataURLToUint8(dataURL: string): Uint8Array {
  const base64 = dataURL.slice(dataURL.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes captured frames (PNG data URLs) into an MP4 blob with H.264.
 * Frames are written in order as frame_0000.png … and consumed with the
 * image2 demuxer at the project's frame rate.
 */
export async function encodeFramesToVideo(
  frames: string[],
  fps: number,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  for (let i = 0; i < frames.length; i++) {
    await ffmpeg.writeFile(
      `frame_${String(i).padStart(4, "0")}.png`,
      dataURLToUint8(frames[i]),
    );
  }

  const progressHandler = (data: { progress: number }) => {
    onProgress?.(Math.max(0, Math.min(1, data.progress)));
  };
  ffmpeg.onProgress(progressHandler);

  try {
    await ffmpeg.exec([
      "-framerate",
      String(fps),
      "-i",
      "frame_%04d.png",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-frames:v",
      String(frames.length),
      "-movflags",
      "+faststart",
      "out.mp4",
    ]);
  } finally {
    ffmpeg.offProgress(progressHandler);
  }

  const data = await ffmpeg.readFile("out.mp4");

  // Clean the virtual filesystem for the next export.
  await ffmpeg.deleteFile("out.mp4");
  for (let i = 0; i < frames.length; i++) {
    await ffmpeg.deleteFile(`frame_${String(i).padStart(4, "0")}.png`);
  }

  return new Blob([data.buffer as ArrayBuffer], { type: "video/mp4" });
}

/** Triggers a browser download for a blob (also used for auto-download). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // The <video> element may still use the URL; revoke later.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
