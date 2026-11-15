/**
 * /sandbox — bootstrap document for the sandboxed preview iframe.
 *
 * `public/runtime.js` is NOT loaded via <script src>: a sandboxed
 * (opaque-origin) iframe cannot make same-origin subresource requests.
 * Instead this document starts with a tiny inline bootstrap that listens for
 * an EXECUTE postMessage carrying the runtime source, which the parent
 * application fetches locally and hands over.
 */
export function GET(): Response {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Reosion runtime</title>
    <style>
      /* The stage fills the iframe exactly; the parent visually scales it. */
      html, body { margin: 0; padding: 0; background: #09090b; overflow: hidden; }
      #stage { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="stage"></div>
    <script>
      (function () {
        "use strict";
        // Only accept messages from our single opener (the parent app).
        var opener = window.parent;
        // The runtime bundle must execute exactly once per document: a second
        // EXECUTE would stack a duplicate React instance and message pump
        // inside this iframe. (The parent also guards against this.)
        var executed = false;
        window.addEventListener("message", function (event) {
          if (event.source !== opener) return;
          var data = event.data;
          if (!data || typeof data !== "object") return;
          if (data.type === "EXECUTE") {
            if (executed) return;
            executed = true;
            var sources = data.sources || [];
            for (var i = 0; i < sources.length; i++) {
              // Executes the runtime bundle built from this repository.
              // eslint-disable-next-line no-eval
              (0, eval)(sources[i]);
            }
          }
        });
      })();
    </script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // never cache the sandbox doc; runtime behavior is injected per session
      "cache-control": "no-store",
      // must not be framed anywhere except our own origin pages
      "x-frame-options": "SAMEORIGIN",
    },
  });
}
