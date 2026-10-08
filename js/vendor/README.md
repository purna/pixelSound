# OGG audio decoders

Pinned browser bundles from https://github.com/eshaz/wasm-audio-decoders:

- `@wasm-audio-decoders/ogg-vorbis` 0.1.20 (npm dist bundle)
- `ogg-opus-decoder` 1.7.5 (npm dist bundle, without optional ML enhancement)

Both contain inline WebAssembly; no remote decoding service or CDN is used.
Original project code and its codec-parser dependency are MIT licensed.
Copyright 2021–2025 Ethan Halsall. See `MIT-LICENSE.txt`.
The compiled Vorbis, Opus, and puff code has its own notices, preserved in
`VORBIS-LICENSE.txt`, `OPUS-LICENSE.txt`, and `PUFF-LICENSE.txt`.

Test fixtures in `scripts/fixtures` are upstream decoder regression data:
- `vorbis.ogg`: `test/data/ogg.vorbis.packets.ogg`
- `opus.ogg`: `test/data/ogg.opus.flush.1.opus`
