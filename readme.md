# Sprite Vtt Generator

## Easily generate thumbnail sprites along with vtt file.

### Important Note: FFmpeg needs to be installed.

Javascript Example

```ts
const { SpriteGenerator } = require("sprite-vtt-generator");

const spriteGenerator = new SpriteGenerator({
  inputPath: './test/test.mp4',
  outputDir: './test/output',
  width: 120, // default 160,
  height: 60, // default 90,
  rowCount: 2, // default 5,
  colCount: 5, // default 5,
  multiple: true, // default false, if true rowCount will be ignored,
  interval: 5, // if not provided optimal interval will be chosen based on video duration,
  thumbnailPrefix: 'img', // default 'thumb',
  webVTT: {
    required: true,
    path: './test/output/test.vtt',
  },
});

spriteGenerator
  .generate()
  .then(() => {
    //do stuff here
  })
  .catch((err) => {
    console.log(err);
  });

```

Typescript Example

```ts
import { SpriteGenerator } from "sprite-vtt-generator";

const spriteGenerator = new SpriteGenerator({
  inputPath: './test/test.mp4',
  outputDir: './test/output',
  width: 120, // default 160,
  height: 60, // default 90,
  rowCount: 2, // default 5,
  colCount: 5, // default 5,
  multiple: true, // default false, if true rowCount will be ignored,
  interval: 5, // if not provided optimal interval will be chosen based on video duration,
  thumbnailPrefix: 'img', // default 'thumb',
  webVTT: {
    required: true,
    path: './test/output/test.vtt',
  },
});

spriteGenerator
  .generate()
  .then(() => {
    //do stuff here
  })
  .catch((err) => {
    console.log(err);
  });

```
