import type { Project } from "@/lib/types";

export interface Example {
  slug: string;
  title: string;
  description: string;
  code: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
}

const CACHING_CODE_B64 =
  "aW1wb3J0IHsgbW90aW9uIH0gZnJvbSAiZnJhbWVyLW1vdGlvbiI7CmltcG9ydCB7IHVzZVRpbWUgfSBmcm9tICJAcmVvc2lvbi9ydW50aW1lIjsKCi8qIC0tLS0tLS0tLS0gdG9rZW5zIC0tLS0tLS0tLS0gKi8KY29uc3QgQyA9IHsKICBiZzogIiMwODA5MGEiLAogIGJvcmRlcjogInJnYmEoMjU1LDI1NSwyNTUsMC4xKSIsCiAgc3VyZmFjZTogInJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLAogIHQyOiAicmdiYSgyNTUsMjU1LDI1NSwwLjUpIiwKICBhY2NlbnQ6ICIjODE4Y2Y4IiwKICBhY2NlbnRTb2Z0OiAiI2E1YjRmYyIsCiAgb2s6ICIjNmVlN2I3IiwKfTsKY29uc3QgU0FOUyA9ICciSW50ZXIiLCBzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sICJTZWdvZSBVSSIsIHNhbnMtc2VyaWYnOwpjb25zdCBNT05PID0gJyJKZXRCcmFpbnMgTW9ubyIsIHVpLW1vbm9zcGFjZSwgU0ZNb25vLVJlZ3VsYXIsIE1lbmxvLCBtb25vc3BhY2UnOwoKY29uc3QgY2FyZCA9IHsKICBib3JkZXJSYWRpdXM6IDE2LAogIGJvcmRlcjogIjFweCBzb2xpZCAiICsgQy5ib3JkZXIsCiAgYmFja2dyb3VuZDogQy5zdXJmYWNlLAp9Owpjb25zdCBncmFkVGV4dCA9IHsKICBiYWNrZ3JvdW5kOiAibGluZWFyLWdyYWRpZW50KDE4MGRlZywgI2ZmZiAzMCUsICM4YThmOTgpIiwKICBXZWJraXRCYWNrZ3JvdW5kQ2xpcDogInRleHQiLAogIGJhY2tncm91bmRDbGlwOiAidGV4dCIsCiAgY29sb3I6ICJ0cmFuc3BhcmVudCIsCn07CmNvbnN0IGNlbnRlciA9IHsgZGlzcGxheTogImZsZXgiLCBhbGlnbkl0ZW1zOiAiY2VudGVyIiwganVzdGlmeUNvbnRlbnQ6ICJjZW50ZXIiIH07Cgpjb25zdCBlYXNlID0gKHgpID0+IHsKICBpZiAoeCA8PSAwKSByZXR1cm4gMDsKICBpZiAoeCA+PSAxKSByZXR1cm4gMTsKICBjb25zdCBYID0gKHMpID0+IDMgKiAwLjIyICogcyAqICgxIC0gcykgKiAoMSAtIHMpICsgMyAqIDAuMzYgKiBzICogcyAqICgxIC0gcykgKyBzICogcyAqIHM7CiAgY29uc3QgWSA9IChzKSA9PiAzICogcyAqICgxIC0gcykgKiAoMSAtIHMpICsgMyAqIHMgKiBzICogKDEgLSBzKSArIHMgKiBzICogczsKICBsZXQgbG8gPSAwLCBoaSA9IDE7CiAgZm9yIChsZXQgaSA9IDA7IGkgPCAyNDsgaSsrKSB7CiAgICBjb25zdCBtID0gKGxvICsgaGkpIC8gMjsKICAgIGlmIChYKG0pIDwgeCkgbG8gPSBtOyBlbHNlIGhpID0gbTsKICB9CiAgcmV0dXJuIFkoKGxvICsgaGkpIC8gMik7Cn07CmNvbnN0IGNsYW1wID0gKHgpID0+IE1hdGgubWluKDEsIE1hdGgubWF4KDAsIHgpKTsKY29uc3QgcHJvZyA9IChsdCwgZGVsYXkgPSAwLCBkdXIgPSAwLjgpID0+IGVhc2UoY2xhbXAoKGx0IC0gZGVsYXkpIC8gZHVyKSk7Cgpjb25zdCBydiA9IChsdCwgZCA9IDApID0+IHsKICBjb25zdCBwID0gcHJvZyhsdCwgZCwgMC44KTsKICByZXR1cm4geyBvcGFjaXR5OiBwLCB5OiAoMSAtIHApICogMTggfTsKfTsKY29uc3QgcG9wID0gKGx0LCBkID0gMCkgPT4gewogIGNvbnN0IHAgPSBwcm9nKGx0LCBkLCAwLjYpOwogIHJldHVybiB7IG9wYWNpdHk6IHAsIHNjYWxlOiAwLjg1ICsgMC4xNSAqIHAgfTsKfTsKY29uc3QgbXMgPSAodG8sIGx0LCBkZWxheSkgPT4KICBNYXRoLnJvdW5kKHRvICogcHJvZyhsdCwgZGVsYXksIDEuNCkpICsgIiBtcyI7Cgpjb25zdCBQID0gewogIHVzZXI6ICJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00IDR2MiBNMTIgMTFhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4IiwKICBzZXJ2ZXI6ICJNNCA0aDE2djZINHogTTQgMTRoMTZ2Nkg0eiBNOCA3aC4wMSBNOCAxN2guMDEiLAogIGRiOiAiTTQgNmMwLTEuNyAzLjYtMyA4LTNzOCAxLjMgOCAzLTMuNiAzLTggMy04LTEuMy04LTN6IE00IDZ2NmMwIDEuNyAzLjYgMyA4IDNzOC0xLjMgOC0zVjYgTTQgMTJ2NmMwIDEuNyAzLjYgMyA4IDNzOC0xLjMgOC0zdi02IiwKICBib2x0OiAiTTEzIDJMNCAxNGg3bC0xIDggOS0xMmgtN3oiLAogIGNsb2NrOiAiTTEyIDIxYTkgOSAwIDEgMCAwLTE4IDkgOSAwIDAgMCAwIDE4eiBNMTIgN3Y1bDMgMiIsCiAgc2VhcmNoOiAiTTExIDE5YTggOCAwIDEgMCAwLTE2IDggOCAwIDAgMCAwIDE2eiBNMjEgMjFsLTQuMy00LjMiLAp9OwoKZnVuY3Rpb24gSWNvbihwcm9wcykgewogIGNvbnN0IHsgZCwgc2l6ZSA9IDI0LCBsdCA9IDAsIGRyYXcgPSBmYWxzZSwgZGVsYXkgPSAwLCB3ID0gMS42IH0gPSBwcm9wczsKICBjb25zdCBwID0gZHJhdyA/IHByb2cobHQsIGRlbGF5LCAxLjQpIDogMTsKICByZXR1cm4gKAogICAgPHN2ZyB3aWR0aD17c2l6ZX0gaGVpZ2h0PXtzaXplfSB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIgogICAgICBzdHJva2VXaWR0aD17d30gc3Ryb2tlTGluZWNhcD0icm91bmQiIHN0cm9rZUxpbmVqb2luPSJyb3VuZCI+CiAgICAgIDxtb3Rpb24ucGF0aCBkPXtkfSBzdHlsZT17eyBwYXRoTGVuZ3RoOiBwIH19IC8+CiAgICA8L3N2Zz4KICApOwp9CgpmdW5jdGlvbiBJY29uQm94KHsgaWNvbiwgc2l6ZSA9IDY0IH0pIHsKICByZXR1cm4gKAogICAgPGRpdiBzdHlsZT17ewogICAgICAuLi5jZW50ZXIsIHdpZHRoOiBzaXplLCBoZWlnaHQ6IHNpemUsIGJvcmRlclJhZGl1czogMTIsCiAgICAgIGJvcmRlcjogIjFweCBzb2xpZCAiICsgQy5ib3JkZXIsIGJhY2tncm91bmQ6ICJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiwgY29sb3I6IEMuYWNjZW50U29mdCwKICAgIH19PgogICAgICA8SWNvbiBkPXtQW2ljb25dfSBzaXplPXtzaXplICogMC40Nn0gLz4KICAgIDwvZGl2PgogICk7Cn0KCmZ1bmN0aW9uIE5vZGUoeyBpY29uLCBsYWJlbCwgbHQsIGQgfSkgewogIHJldHVybiAoCiAgICA8bW90aW9uLmRpdiBzdHlsZT17eyAuLi5wb3AobHQsIGQpLCBkaXNwbGF5OiAiZmxleCIsIGZsZXhEaXJlY3Rpb246ICJjb2x1bW4iLCBhbGlnbkl0ZW1zOiAiY2VudGVyIiwgZ2FwOiAxNiB9fT4KICAgICAgPGRpdiBzdHlsZT17eyAuLi5jYXJkLCAuLi5jZW50ZXIsIHdpZHRoOiAxNDAsIGhlaWdodDogMTQwIH19PgogICAgICAgIDxJY29uQm94IGljb249e2ljb259IHNpemU9ezcyfSAvPgogICAgICA8L2Rpdj4KICAgICAgPHNwYW4gc3R5bGU9e3sgZm9udEZhbWlseTogTU9OTywgZm9udFNpemU6IDE4LCBjb2xvcjogQy50MiB9fT57bGFiZWx9PC9zcGFuPgogICAgPC9tb3Rpb24uZGl2PgogICk7Cn0KCmZ1bmN0aW9uIExpbmsoeyBsdCwgZCB9KSB7CiAgY29uc3Qgb24gPSBsdCA+PSBkOwogIGNvbnN0IGsgPSBvbiA/ICgobHQgLSBkKSAvIDEuOCkgJSAxIDogMDsKICBjb25zdCBrayA9IGsgKiBrICogKDMgLSAyICogayk7CiAgcmV0dXJuICgKICAgIDxkaXYgc3R5bGU9e3sgcG9zaXRpb246ICJyZWxhdGl2ZSIsIHdpZHRoOiAxNzAsIGhlaWdodDogMSwgbWFyZ2luQm90dG9tOiAzNiwgYmFja2dyb3VuZDogInJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiIH19PgogICAgICA8c3BhbiBzdHlsZT17ewogICAgICAgIHBvc2l0aW9uOiAiYWJzb2x1dGUiLCB0b3A6IC00LCBsZWZ0OiAoa2sgKiAxMDApICsgIiUiLCB3aWR0aDogOSwgaGVpZ2h0OiA5LAogICAgICAgIGJvcmRlclJhZGl1czogIjUwJSIsIGJhY2tncm91bmQ6IEMuYWNjZW50LCBvcGFjaXR5OiBvbiA/IE1hdGguc2luKGsgKiBNYXRoLlBJKSA6IDAsCiAgICAgIH19IC8+CiAgICA8L2Rpdj4KICApOwp9CgpmdW5jdGlvbiBTMSh7IGx0IH0pIHsKICByZXR1cm4gKAogICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAiZmxleCIsIGZsZXhEaXJlY3Rpb246ICJjb2x1bW4iLCBhbGlnbkl0ZW1zOiAiY2VudGVyIiwgZ2FwOiAzMiwgdGV4dEFsaWduOiAiY2VudGVyIiB9fT4KICAgICAgPG1vdGlvbi5kaXYgc3R5bGU9e3sgLi4ucG9wKGx0LCAwLjEpLCAuLi5jYXJkLCAuLi5jZW50ZXIsIHdpZHRoOiAxMzIsIGhlaWdodDogMTMyLCBjb2xvcjogQy5hY2NlbnRTb2Z0IH19PgogICAgICAgIDxJY29uIGQ9e1AuYm9sdH0gc2l6ZT17NjR9IGx0PXtsdH0gZHJhdyBkZWxheT17MC40fSB3PXsxLjR9IC8+CiAgICAgIDwvbW90aW9uLmRpdj4KICAgICAgPG1vdGlvbi5kaXYgc3R5bGU9e3sKICAgICAgICAuLi5ydihsdCwgMC41KSwgZm9udEZhbWlseTogTU9OTywgZm9udFNpemU6IDE4LCB0ZXh0VHJhbnNmb3JtOiAidXBwZXJjYXNlIiwKICAgICAgICBsZXR0ZXJTcGFjaW5nOiAiMC4zZW0iLCBjb2xvcjogQy50MiwKICAgICAgfX0+CiAgICAgICAgUGVyZm9ybWFuY2UKICAgICAgPC9tb3Rpb24uZGl2PgogICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAiaGlkZGVuIiwgcGFkZGluZ0JvdHRvbTogMTIgfX0+CiAgICAgICAgPG1vdGlvbi5kaXYgc3R5bGU9e3sKICAgICAgICAgIC4uLmdyYWRUZXh0LCB5OiAoKDEgLSBwcm9nKGx0LCAwLjcsIDEpKSAqIDExMCkgKyAiJSIsCiAgICAgICAgICBmb250U2l6ZTogMTIwLCBmb250V2VpZ2h0OiA2MDAsIGxpbmVIZWlnaHQ6IDEsIGxldHRlclNwYWNpbmc6ICItMC4wM2VtIiwKICAgICAgICB9fT4KICAgICAgICAgIENhY2hpbmcKICAgICAgICA8L21vdGlvbi5kaXY+CiAgICAgIDwvZGl2PgogICAgICA8bW90aW9uLnAgc3R5bGU9e3sgLi4ucnYobHQsIDEuNCksIG1hcmdpbjogMCwgZm9udFNpemU6IDMwLCBjb2xvcjogQy50MiB9fT4KICAgICAgICBXaHkgdGhlIHNlY29uZCByZXF1ZXN0IGlzIGZhc3RlciB0aGFuIHRoZSBmaXJzdC4KICAgICAgPC9tb3Rpb24ucD4KICAgIDwvZGl2PgogICk7Cn0KCmZ1bmN0aW9uIFMyKHsgbHQgfSkgewogIHJldHVybiAoCiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICJmbGV4IiwgZmxleERpcmVjdGlvbjogImNvbHVtbiIsIGFsaWduSXRlbXM6ICJjZW50ZXIiLCBnYXA6IDU2IH19PgogICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICJmbGV4IiwgYWxpZ25JdGVtczogImNlbnRlciIsIGdhcDogMjQgfX0+CiAgICAgICAgPE5vZGUgaWNvbj0idXNlciIgbGFiZWw9IkNsaWVudCIgbHQ9e2x0fSBkPXswLjF9IC8+CiAgICAgICAgPExpbmsgbHQ9e2x0fSBkPXsxfSAvPgogICAgICAgIDxOb2RlIGljb249InNlcnZlciIgbGFiZWw9IlNlcnZlciIgbHQ9e2x0fSBkPXswLjN9IC8+CiAgICAgICAgPExpbmsgbHQ9e2x0fSBkPXsyLjJ9IC8+CiAgICAgICAgPE5vZGUgaWNvbj0iZGIiIGxhYmVsPSJEYXRhYmFzZSIgbHQ9e2x0fSBkPXswLjV9IC8+CiAgICAgIDwvZGl2PgogICAgICA8bW90aW9uLmRpdiBzdHlsZT17eyAuLi5ydihsdCwgMS42KSwgLi4uY2FyZCwgZGlzcGxheTogImZsZXgiLCBhbGlnbkl0ZW1zOiAiY2VudGVyIiwgZ2FwOiAyNCwgcGFkZGluZzogIjIwcHggMzJweCIgfX0+CiAgICAgICAgPHNwYW4gc3R5bGU9e3sgY29sb3I6IEMuYWNjZW50U29mdCwgZGlzcGxheTogImZsZXgiIH19PjxJY29uIGQ9e1AuY2xvY2t9IHNpemU9ezM0fSAvPjwvc3Bhbj4KICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250RmFtaWx5OiBNT05PLCBmb250U2l6ZTogNDQsIGZvbnRXZWlnaHQ6IDUwMCwgbWluV2lkdGg6IDE3MCB9fT57bXMoNDgwLCBsdCwgMS44KX08L3NwYW4+CiAgICAgICAgPHNwYW4gc3R5bGU9e3sgZm9udFNpemU6IDI2LCBjb2xvcjogQy50MiB9fT5vbiBldmVyeSBzaW5nbGUgcmVxdWVzdDwvc3Bhbj4KICAgICAgPC9tb3Rpb24uZGl2PgogICAgPC9kaXY+CiAgKTsKfQoKZnVuY3Rpb24gTGFuZSh7IGxhYmVsLCB0bywgb2ssIGx0LCBkIH0pIHsKICBjb25zdCBiYXJEdXIgPSBvayA/IDAuNCA6IDEuNjsKICBjb25zdCBjaGlwRCA9IGQgKyAwLjUgKyBiYXJEdXI7CiAgY29uc3QgdG9uZSA9IG9rCiAgICA/IHsgYm9yZGVyOiAiMXB4IHNvbGlkIHJnYmEoNTIsMjExLDE1MywwLjMpIiwgYmFja2dyb3VuZDogInJnYmEoNTIsMjExLDE1MywwLjEpIiwgY29sb3I6IEMub2sgfQogICAgOiB7IGJvcmRlcjogIjFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LDAuMTUpIiwgYmFja2dyb3VuZDogInJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLCBjb2xvcjogInJnYmEoMjU1LDI1NSwyNTUsMC43KSIgfTsKICByZXR1cm4gKAogICAgPG1vdGlvbi5kaXYgc3R5bGU9e3sgLi4ucnYobHQsIGQpLCBkaXNwbGF5OiAiZmxleCIsIGZsZXhEaXJlY3Rpb246ICJjb2x1bW4iLCBnYXA6IDE2IH19PgogICAgICA8ZGl2IHN0eWxlPXt7IGZvbnRGYW1pbHk6IE1PTk8sIGZvbnRTaXplOiAyMCwgY29sb3I6IEMudDIgfX0+e2xhYmVsfTwvZGl2PgogICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICJmbGV4IiwgYWxpZ25JdGVtczogImNlbnRlciIsIGdhcDogMjAgfX0+CiAgICAgICAgPGRpdiBzdHlsZT17eyAuLi5jYXJkLCAuLi5jZW50ZXIsIHdpZHRoOiA3MiwgaGVpZ2h0OiA3MiwgY29sb3I6IEMuYWNjZW50U29mdCB9fT4KICAgICAgICAgIDxJY29uIGQ9e1AudXNlcn0gc2l6ZT17MzJ9IC8+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBzdHlsZT17eyBwb3NpdGlvbjogInJlbGF0aXZlIiwgaGVpZ2h0OiAxLCBmbGV4OiAxLCBiYWNrZ3JvdW5kOiAicmdiYSgyNTUsMjU1LDI1NSwwLjEpIiB9fT4KICAgICAgICAgIDxtb3Rpb24uZGl2IHN0eWxlPXt7CiAgICAgICAgICAgIHBvc2l0aW9uOiAiYWJzb2x1dGUiLCB0b3A6IDAsIGJvdHRvbTogMCwgbGVmdDogMCwgd2lkdGg6ICIxMDAlIiwgb3JpZ2luWDogMCwKICAgICAgICAgICAgc2NhbGVYOiBwcm9nKGx0LCBkICsgMC41LCBiYXJEdXIpLAogICAgICAgICAgICBiYWNrZ3JvdW5kOiBvayA/ICJyZ2JhKDUyLDIxMSwxNTMsMC43KSIgOiAicmdiYSgyNTUsMjU1LDI1NSwwLjQpIiwKICAgICAgICAgIH19IC8+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPG1vdGlvbi5kaXYgc3R5bGU9e3sKICAgICAgICAgIC4uLnBvcChsdCwgY2hpcEQpLCAuLi50b25lLCBkaXNwbGF5OiAiZmxleCIsIGFsaWduSXRlbXM6ICJjZW50ZXIiLCBnYXA6IDEyLAogICAgICAgICAgd2lkdGg6IDE3MCwgcGFkZGluZzogIjE2cHggMjRweCIsIGJvcmRlclJhZGl1czogMTIsIGZvbnRGYW1pbHk6IE1PTk8sIGZvbnRTaXplOiAyMiwKICAgICAgICB9fT4KICAgICAgICAgIDxJY29uIGQ9e29rID8gUC5ib2x0IDogUC5kYn0gc2l6ZT17MjR9IC8+CiAgICAgICAgICB7bXModG8sIGx0LCBjaGlwRCArIDAuMSl9CiAgICAgICAgPC9tb3Rpb24uZGl2PgogICAgICA8L2Rpdj4KICAgIDwvbW90aW9uLmRpdj4KICApOwp9CgpmdW5jdGlvbiBTMyh7IGx0IH0pIHsKICByZXR1cm4gKAogICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAiZmxleCIsIGZsZXhEaXJlY3Rpb246ICJjb2x1bW4iLCBnYXA6IDU2LCB3aWR0aDogOTAwIH19PgogICAgICA8TGFuZSBsYWJlbD0iQ2FjaGUgbWlzczogYXNrIHRoZSBkYXRhYmFzZSIgdG89ezQ4MH0gbHQ9e2x0fSBkPXswLjJ9IC8+CiAgICAgIDxMYW5lIGxhYmVsPSJDYWNoZSBoaXQ6IGFuc3dlciBmcm9tIG1lbW9yeSIgdG89ezJ9IG9rIGx0PXtsdH0gZD17My4wfSAvPgogICAgPC9kaXY+CiAgKTsKfQoKY29uc3QgY29kZSA9IFsKICBbWyJhc3luYyBmdW5jdGlvbiAiLCAiayJdLCBbImdldFVzZXIiLCAiZiJdLCBbIihpZCkgeyIsICJwIl1dLAogIFtbIiAgY29uc3QgIiwgImsiXSwgWyJrZXkiLCAidCJdLCBbIiA9ICIsICJwIl0sIFsiYHVzZXI6JHtpZH1gIiwgInMiXSwgWyI7IiwgInAiXV0sCiAgW1siICBjb25zdCAiLCAiayJdLCBbImhpdCIsICJ0Il0sIFsiID0gIiwgInAiXSwgWyJhd2FpdCAiLCAiayJdLCBbImNhY2hlLmdldCIsICJmIl0sIFsiKGtleSk7IiwgInAiXV0sCiAgW1siICBpZiAiLCAiayJdLCBbIihoaXQpICIsICJwIl0sIFsicmV0dXJuICIsICJrIl0sIFsiaGl0OyIsICJwIl1dLAogIFtbIiAiLCAicCJdXSwKICBbWyIgIGNvbnN0ICIsICJrIl0sIFsidXNlciIsICJ0Il0sIFsiID0gIiwgInAiXSwgWyJhd2FpdCAiLCAiayJdLCBbImRiLnVzZXJzLmZpbmQiLCAiZiJdLCBbIihpZCk7IiwgInAiXV0sCiAgW1siICBhd2FpdCAiLCAiayJdLCBbImNhY2hlLnNldCIsICJmIl0sIFsiKGtleSwgdXNlciwgeyB0dGw6ICIsICJwIl0sIFsiNjAiLCAicyJdLCBbIiB9KTsiLCAicCJdXSwKICBbWyIgIHJldHVybiAiLCAiayJdLCBbInVzZXI7IiwgInAiXV0sCiAgW1sifSIsICJwIl1dLApdOwpjb25zdCBjYyA9IHsgazogIiNhNWI0ZmMiLCB0OiAiI2ZmZmZmZiIsIHM6ICJyZ2JhKDI1NSwyNTUsMjU1LDAuNykiLCBmOiAiI2UwZTdmZiIsIHA6ICJyZ2JhKDI1NSwyNTUsMjU1LDAuNTUpIiB9Owpjb25zdCBwaWxsID0gewogIGZvbnRGYW1pbHk6IE1PTk8sIGZvbnRTaXplOiAxOCwgY29sb3I6ICJyZ2JhKDI1NSwyNTUsMjU1LDAuNykiLAogIHBhZGRpbmc6ICI4cHggMjBweCIsIGJvcmRlclJhZGl1czogOTk5LCBib3JkZXI6ICIxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIsCn07CgpmdW5jdGlvbiBTNCh7IGx0IH0pIHsKICBjb25zdCBobCA9IHsgMzogMy4yLCA2OiA0LjYgfTsKICByZXR1cm4gKAogICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAiZmxleCIsIGZsZXhEaXJlY3Rpb246ICJjb2x1bW4iLCBhbGlnbkl0ZW1zOiAiY2VudGVyIiwgZ2FwOiAyNCB9fT4KICAgICAgPGRpdiBzdHlsZT17eyB3aWR0aDogODYwLCBvdmVyZmxvdzogImhpZGRlbiIsIGJvcmRlclJhZGl1czogMTYsIGJvcmRlcjogIjFweCBzb2xpZCAiICsgQy5ib3JkZXIsIGJhY2tncm91bmQ6ICIjMGMwZDBmIiB9fT4KICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICJmbGV4IiwgYWxpZ25JdGVtczogImNlbnRlciIsIGdhcDogOCwgcGFkZGluZzogIjE2cHggMjBweCIsIGJvcmRlckJvdHRvbTogIjFweCBzb2xpZCAiICsgQy5ib3JkZXIgfX0+CiAgICAgICAgICB7WzAsIDEsIDJdLm1hcCgoaSkgPT4gKAogICAgICAgICAgICA8c3BhbiBrZXk9e2l9IHN0eWxlPXt7IHdpZHRoOiAxMiwgaGVpZ2h0OiAxMiwgYm9yZGVyUmFkaXVzOiAiNTAlIiwgYmFja2dyb3VuZDogInJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiIH19IC8+CiAgICAgICAgICApKX0KICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IG1hcmdpbkxlZnQ6IDE2LCBmb250RmFtaWx5OiBNT05PLCBmb250U2l6ZTogMTYsIGNvbG9yOiAicmdiYSgyNTUsMjU1LDI1NSwwLjQpIiB9fT4KICAgICAgICAgICAgc2VydmljZXMvdXNlci5qcwogICAgICAgICAgPC9zcGFuPgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgc3R5bGU9e3sgcGFkZGluZzogIjE2cHggMCIsIGZvbnRGYW1pbHk6IE1PTk8sIGZvbnRTaXplOiAyMywgbGluZUhlaWdodDogIjM4cHgiIH19PgogICAgICAgICAge2NvZGUubWFwKChsaW5lLCBpKSA9PiB7CiAgICAgICAgICAgIGNvbnN0IHAgPSBwcm9nKGx0LCAwLjMgKyBpICogMC4yOCwgMC41KTsKICAgICAgICAgICAgcmV0dXJuICgKICAgICAgICAgICAgICA8bW90aW9uLmRpdiBrZXk9e2l9IHN0eWxlPXt7CiAgICAgICAgICAgICAgICBwb3NpdGlvbjogInJlbGF0aXZlIiwgZGlzcGxheTogImZsZXgiLCB3aGl0ZVNwYWNlOiAicHJlIiwgcGFkZGluZzogIjAgMjRweCIsCiAgICAgICAgICAgICAgICBvcGFjaXR5OiBwLCB4OiAoMSAtIHApICogLTEyLAogICAgICAgICAgICAgIH19PgogICAgICAgICAgICAgICAge2hsW2ldICE9PSB1bmRlZmluZWQgJiYgKAogICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17ewogICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAiYWJzb2x1dGUiLCBpbnNldDogMCwgYm9yZGVyTGVmdDogIjJweCBzb2xpZCAiICsgQy5hY2NlbnQsCiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogInJnYmEoMTI5LDE0MCwyNDgsMC4xKSIsIG9wYWNpdHk6IHByb2cobHQsIGhsW2ldLCAwLjYpLAogICAgICAgICAgICAgICAgICB9fSAvPgogICAgICAgICAgICAgICAgKX0KICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IHBvc2l0aW9uOiAicmVsYXRpdmUiLCB3aWR0aDogMjAsIG1hcmdpblJpZ2h0OiAyNCwgdGV4dEFsaWduOiAicmlnaHQiLCBjb2xvcjogInJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgfX0+CiAgICAgICAgICAgICAgICAgIHtpICsgMX0KICAgICAgICAgICAgICAgIDwvc3Bhbj4KICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IHBvc2l0aW9uOiAicmVsYXRpdmUiIH19PgogICAgICAgICAgICAgICAgICB7bGluZS5tYXAoKFt0ZXh0LCBjXSwgaikgPT4gPHNwYW4ga2V5PXtqfSBzdHlsZT17eyBjb2xvcjogY2NbY10gfX0+e3RleHR9PC9zcGFuPil9CiAgICAgICAgICAgICAgICA8L3NwYW4+CiAgICAgICAgICAgICAgPC9tb3Rpb24uZGl2PgogICAgICAgICAgICApOwogICAgICAgICAgfSl9CiAgICAgICAgPC9kaXY+CiAgICAgIDwvZGl2PgogICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICJmbGV4IiwgZ2FwOiAxNiB9fT4KICAgICAgICA8bW90aW9uLmRpdiBzdHlsZT17eyAuLi5ydihsdCwgMy4yKSwgLi4ucGlsbCB9fT5oaXQ6IHJldHVybiBpbnN0YW50bHk8L21vdGlvbi5kaXY+CiAgICAgICAgPG1vdGlvbi5kaXYgc3R5bGU9e3sgLi4ucnYobHQsIDQuNiksIC4uLnBpbGwgfX0+bWlzczogZmV0Y2gsIHRoZW4gc3RvcmUgd2l0aCBhIFRUTDwvbW90aW9uLmRpdj4KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KICApOwp9CgpmdW5jdGlvbiBTNSh7IGx0IH0pIHsKICBjb25zdCBzdGVwcyA9IFtbInNlYXJjaCIsICJDaGVjayB0aGUgY2FjaGUiXSwgWyJkYiIsICJGZXRjaCBvbiBhIG1pc3MiXSwgWyJjbG9jayIsICJTdG9yZSB3aXRoIGEgVFRMIl1dOwogIHJldHVybiAoCiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICJmbGV4IiwgZmxleERpcmVjdGlvbjogImNvbHVtbiIsIGFsaWduSXRlbXM6ICJjZW50ZXIiLCBnYXA6IDU2IH19PgogICAgICA8bW90aW9uLmgyIHN0eWxlPXt7IC4uLnJ2KGx0LCAwLjEpLCAuLi5ncmFkVGV4dCwgbWFyZ2luOiAwLCBmb250U2l6ZTogNzYsIGZvbnRXZWlnaHQ6IDYwMCwgbGV0dGVyU3BhY2luZzogIi0wLjAzZW0iIH19PgogICAgICAgIENhY2hpbmcgaW4gMyBzdGVwcwogICAgICA8L21vdGlvbi5oMj4KICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAiZmxleCIsIGFsaWduSXRlbXM6ICJjZW50ZXIiLCBnYXA6IDE2IH19PgogICAgICAgIHtzdGVwcy5tYXAoKFtpY29uLCBsYWJlbF0sIGkpID0+ICgKICAgICAgICAgIDxkaXYga2V5PXtsYWJlbH0gc3R5bGU9e3sgZGlzcGxheTogImZsZXgiLCBhbGlnbkl0ZW1zOiAiY2VudGVyIiwgZ2FwOiAxNiB9fT4KICAgICAgICAgICAgPG1vdGlvbi5kaXYgc3R5bGU9e3sKICAgICAgICAgICAgICAuLi5ydihsdCwgMC41ICsgaSAqIDAuNSksIC4uLmNhcmQsIHdpZHRoOiAyODAsIHBhZGRpbmc6ICIzMnB4IDAiLAogICAgICAgICAgICAgIGRpc3BsYXk6ICJmbGV4IiwgZmxleERpcmVjdGlvbjogImNvbHVtbiIsIGFsaWduSXRlbXM6ICJjZW50ZXIiLCBnYXA6IDIwLAogICAgICAgICAgICB9fT4KICAgICAgICAgICAgICA8SWNvbkJveCBpY29uPXtpY29ufSBzaXplPXs2MH0gLz4KICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogMjQsIGZvbnRXZWlnaHQ6IDUwMCB9fT57bGFiZWx9PC9zcGFuPgogICAgICAgICAgICA8L21vdGlvbi5kaXY+CiAgICAgICAgICAgIHtpIDwgc3RlcHMubGVuZ3RoIC0gMSAmJiAoCiAgICAgICAgICAgICAgPG1vdGlvbi5zcGFuIHN0eWxlPXt7IC4uLnJ2KGx0LCAwLjcgKyBpICogMC41KSwgZm9udFNpemU6IDI4LCBjb2xvcjogInJnYmEoMjU1LDI1NSwyNTUsMC4yNSkiIH19PuKGkjwvbW90aW9uLnNwYW4+CiAgICAgICAgICAgICl9CiAgICAgICAgICA8L2Rpdj4KICAgICAgICApKX0KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KICApOwp9Cgpjb25zdCBzY2VuZXMgPSBbCiAgeyBkOiA1LCBWaWV3OiBTMSB9LAogIHsgZDogNi41LCBWaWV3OiBTMiB9LAogIHsgZDogNy41LCBWaWV3OiBTMyB9LAogIHsgZDogOCwgVmlldzogUzQgfSwKICB7IGQ6IDUuNSwgVmlldzogUzUgfSwKXTsKY29uc3Qgc3RhcnRzID0gc2NlbmVzLm1hcCgoXywgaSkgPT4gc2NlbmVzLnNsaWNlKDAsIGkpLnJlZHVjZSgoYSwgcykgPT4gYSArIHMuZCwgMCkpOwpjb25zdCBGQURFID0gMC42OwoKZnVuY3Rpb24gc2NlbmVTdHlsZShsdCwgZCwgbGFzdCkgewogIGNvbnN0IGEgPSBlYXNlKGNsYW1wKGx0IC8gRkFERSkpOwogIGNvbnN0IGIgPSBsYXN0ID8gMCA6IGVhc2UoY2xhbXAoKGx0IC0gKGQgLSBGQURFKSkgLyBGQURFKSk7CiAgcmV0dXJuIHsgb3BhY2l0eTogYSAqICgxIC0gYiksIHk6ICgxIC0gYSkgKiAyNCAtIGIgKiAyNCwgZmlsdGVyOiAiYmx1cigiICsgKCgxIC0gYSArIGIpICogOCkgKyAicHgpIiB9Owp9CgpleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBbmltYXRpb24oKSB7CiAgY29uc3QgdCA9IHVzZVRpbWUoKTsKCiAgY29uc3QgaSA9IE1hdGgubWF4KDAsIHN0YXJ0cy5maWx0ZXIoKHMpID0+IHQgPj0gcykubGVuZ3RoIC0gMSk7CiAgY29uc3QgeyBWaWV3LCBkIH0gPSBzY2VuZXNbaV07CiAgY29uc3QgbHQgPSB0IC0gc3RhcnRzW2ldOwoKICBjb25zdCBzYyA9IHR5cGVvZiB3aW5kb3cgPT09ICJ1bmRlZmluZWQiID8gMSA6IE1hdGgubWluKHdpbmRvdy5pbm5lcldpZHRoIC8gMTI4MCwgd2luZG93LmlubmVySGVpZ2h0IC8gNzIwKTsKCiAgcmV0dXJuICgKICAgIDxtYWluIHN0eWxlPXt7IC4uLmNlbnRlciwgd2lkdGg6ICIxMDAlIiwgaGVpZ2h0OiAiMTAwJSIsIGJhY2tncm91bmQ6ICIjMDAwIiwgb3ZlcmZsb3c6ICJoaWRkZW4iIH19PgogICAgICA8c3R5bGU+eydAaW1wb3J0IHVybCgiaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1JbnRlcjp3Z2h0QDQwMDs1MDA7NjAwJmZhbWlseT1KZXRCcmFpbnMrTW9ubzp3Z2h0QDQwMDs1MDAmZGlzcGxheT1zd2FwIik7J308L3N0eWxlPgogICAgICA8ZGl2IHN0eWxlPXt7IHBvc2l0aW9uOiAicmVsYXRpdmUiLCB3aWR0aDogMTI4MCAqIHNjLCBoZWlnaHQ6IDcyMCAqIHNjLCBvdmVyZmxvdzogImhpZGRlbiIgfX0+CiAgICAgICAgPGRpdiBzdHlsZT17ewogICAgICAgICAgcG9zaXRpb246ICJhYnNvbHV0ZSIsIGxlZnQ6IDAsIHRvcDogMCwgd2lkdGg6IDEyODAsIGhlaWdodDogNzIwLCBiYWNrZ3JvdW5kOiBDLmJnLAogICAgICAgICAgY29sb3I6ICIjZmZmIiwgZm9udEZhbWlseTogU0FOUywgdHJhbnNmb3JtOiAic2NhbGUoIiArIHNjICsgIikiLCB0cmFuc2Zvcm1PcmlnaW46ICJ0b3AgbGVmdCIsCiAgICAgICAgfX0+CiAgICAgICAgICA8ZGl2IHN0eWxlPXt7CiAgICAgICAgICAgIHBvc2l0aW9uOiAiYWJzb2x1dGUiLCBpbnNldDogMCwKICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlOgogICAgICAgICAgICAgICJsaW5lYXItZ3JhZGllbnQocmdiYSgyNTUsMjU1LDI1NSwuMDM1KSAxcHgsIHRyYW5zcGFyZW50IDFweCksIGxpbmVhci1ncmFkaWVudCg5MGRlZywgcmdiYSgyNTUsMjU1LDI1NSwuMDM1KSAxcHgsIHRyYW5zcGFyZW50IDFweCkiLAogICAgICAgICAgICBiYWNrZ3JvdW5kU2l6ZTogIjY0cHggNjRweCIsCiAgICAgICAgICAgIFdlYmtpdE1hc2tJbWFnZTogInJhZGlhbC1ncmFkaWVudChlbGxpcHNlIGF0IDUwJSA0MCUsICMwMDAgMjAlLCB0cmFuc3BhcmVudCA3MCUpIiwKICAgICAgICAgICAgbWFza0ltYWdlOiAicmFkaWFsLWdyYWRpZW50KGVsbGlwc2UgYXQgNTAlIDQwJSwgIzAwMCAyMCUsIHRyYW5zcGFyZW50IDcwJSkiLAogICAgICAgICAgfX0gLz4KICAgICAgICAgIDxkaXYgc3R5bGU9e3sKICAgICAgICAgICAgcG9zaXRpb246ICJhYnNvbHV0ZSIsIGxlZnQ6ICI1MCUiLCB0b3A6IC0yNjAsIHdpZHRoOiA5MDAsIGhlaWdodDogNTIwLAogICAgICAgICAgICB0cmFuc2Zvcm06ICJ0cmFuc2xhdGVYKC01MCUpIiwgYm9yZGVyUmFkaXVzOiAiNTAlIiwKICAgICAgICAgICAgYmFja2dyb3VuZDogInJnYmEoOTksMTAyLDI0MSwwLjE1KSIsIGZpbHRlcjogImJsdXIoMTIwcHgpIiwKICAgICAgICAgIH19IC8+CiAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBvc2l0aW9uOiAiYWJzb2x1dGUiLCBpbnNldDogMCwgLi4uY2VudGVyIH19PgogICAgICAgICAgICA8bW90aW9uLmRpdiBrZXk9e2l9IHN0eWxlPXtzY2VuZVN0eWxlKGx0LCBkLCBpID09PSBzY2VuZXMubGVuZ3RoIC0gMSl9PgogICAgICAgICAgICAgIDxWaWV3IGx0PXtsdH0gLz4KICAgICAgICAgICAgPC9tb3Rpb24uZGl2PgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgIDwvZGl2PgogICAgPC9tYWluPgogICk7Cn0K";

function decode(b64: string): string {
  if (typeof atob === "function") return atob(b64);
  return Buffer.from(b64, "base64").toString("utf8");
}

const CACHING_CODE = decode(CACHING_CODE_B64);

const HELLO_CODE = `import { motion } from "framer-motion";
import { useTime } from "@reosion/runtime";

export default function Animation() {
  const t = useTime();
  return (
    <main style={{ width: "100%", height: "100%", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.h1
        style={{ fontSize: 96, fontWeight: 700, color: "#fafafa", letterSpacing: "-0.03em" }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0, scale: 1 + 0.05 * Math.sin(t * 2) }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Hello, Motion
      </motion.h1>
    </main>
  );
}`;

const BALL_CODE = `import { motion } from "framer-motion";
import { useTime } from "@reosion/runtime";

export default function Animation() {
  const t = useTime();
  const y = Math.abs(Math.sin(t * 2)) * 260;
  return (
    <main style={{ width: "100%", height: "100%", background: "#09090b", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", bottom: 40, transform: "translateX(-50%)" }}>
        <motion.div style={{ width: 60, height: 60, borderRadius: 999, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", transform: "translateY(" + (-y) + "px)" }} />
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: 28, width: 80, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.1)", transform: "translateX(-50%) scaleX(" + (1 - y / 400) + ")" }} />
    </main>
  );
}`;

const CARDS_CODE = `import { motion } from "framer-motion";
import { useTime } from "@reosion/runtime";

export default function Animation() {
  const t = useTime();
  const items = [0, 1, 2];
  return (
    <main style={{ width: "100%", height: "100%", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
      {items.map((i) => {
        const p = Math.min(1, Math.max(0, (t - i * 0.2) * 2));
        return (
          <div key={i} style={{ width: 220, height: 140, borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", opacity: p, transform: "translateY(" + (1 - p) * 24 + "px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a1a1aa", fontFamily: "monospace", fontSize: 14 }}>
            Card {i + 1}
          </div>
        );
      })}
    </main>
  );
}`;

const PROGRESS_CODE = `import { motion } from "framer-motion";
import { useTime } from "@reosion/runtime";

export default function Animation() {
  const t = useTime();
  const p = (Math.sin(t * 0.8) + 1) / 2;
  return (
    <main style={{ width: "100%", height: "100%", background: "#09090b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div style={{ width: 480, height: 12, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: (p * 100) + "%", background: "linear-gradient(90deg,#60a5fa,#a78bfa)", transition: "width 0.1s linear" }} />
      </div>
      <span style={{ color: "#a1a1aa", fontFamily: "monospace", fontSize: 18 }}>{Math.round(p * 100)}%</span>
    </main>
  );
}`;

const WAVE_CODE = `import { motion } from "framer-motion";
import { useTime } from "@reosion/runtime";

export default function Animation() {
  const t = useTime();
  const bars = Array.from({ length: 24 }, (_, i) => i);
  return (
    <main style={{ width: "100%", height: "100%", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {bars.map((i) => {
        const h = 20 + 60 * Math.abs(Math.sin(t * 2 + i * 0.35));
        return <div key={i} style={{ width: 8, height: h, borderRadius: 4, background: "linear-gradient(180deg,#a78bfa,#60a5fa)" }} />;
      })}
    </main>
  );
}`;

export const EXAMPLES: Example[] = [
  {
    slug: "caching",
    title: "Caching",
    description: "Why the second request is faster than the first.",
    code: CACHING_CODE,
    duration: 32.5,
    fps: 30,
    width: 1280,
    height: 720,
  },
  {
    slug: "hello-motion",
    title: "Hello Motion",
    description: "A title that fades, rises and breathes.",
    code: HELLO_CODE,
    duration: 6,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  {
    slug: "bouncing-ball",
    title: "Bouncing Ball",
    description: "A ball that bounces with a squash on landing.",
    code: BALL_CODE,
    duration: 4,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  {
    slug: "fade-in-cards",
    title: "Fade-in Cards",
    description: "Three cards that slide up and fade in.",
    code: CARDS_CODE,
    duration: 4,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  {
    slug: "progress-bar",
    title: "Progress Bar",
    description: "A progress bar that fills and drains.",
    code: PROGRESS_CODE,
    duration: 6,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  {
    slug: "wave",
    title: "Wave",
    description: "A row of bars dancing in a wave.",
    code: WAVE_CODE,
    duration: 6,
    fps: 30,
    width: 1920,
    height: 1080,
  },
];

export function findExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}

export function exampleToProject(example: Example): Project {
  return {
    id: "example-" + example.slug,
    name: example.title,
    aspectRatio: "16:9",
    width: example.width,
    height: example.height,
    fps: example.fps,
    duration: example.duration,
    code: example.code,
    createdAt: 0,
    updatedAt: 0,
  };
}