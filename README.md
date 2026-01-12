# WebGL CRT Shader

Tweakable CRT shader for web canvas, three.js, etc.

If you use this in your game/app/website I'd love to hear about it.

Let's call this _Serenity Shader_ if we need a name to refer to it as.

## About

This is a WebGL shader, written in GLSL, intended for use in web browsers.

- Runs on the device’s **hardware GPU**
- Browser provides the WebGL interface and safety checks
- Renders to a `<canvas>` (or OffscreenCanvas)
- Not limited to games — usable for effects, demos, and creative coding

## Try it

[LIVE DEMO](https://gingerbeardman.github.io/webgl-crt-shader/)

😎

## Notes

- in this example the source image is scaled with interpolation (smoothing) to add to the vibe
- you want to try to match the number of lines to the output resolution (here, 256)
- optimised to run well on as far back as _iPhone XS_ (2018, A12 Bionic CPU w/ 4-core GPU)

## Announcement blog post

- [blog.gingerbeardman.com/2026/01/04/webgl-crt-shader/](https://blog.gingerbeardman.com/2026/01/04/webgl-crt-shader/)

## Screenshot

[![Default parameters](/screenshot.png)](https://gingerbeardman.github.io/webgl-crt-shader/)

## Licence

[MIT](/LICENSE)
