/* eslint-disable no-plusplus */
/* eslint-disable sonarjs/no-duplicate-string */
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import moment from 'moment';
import path from 'path';

interface webVTTOptions {
  required: boolean;
  output: string;
}

interface Options {
  inputPath: string;

  rowCount?: number;

  colCount?: number;

  interval?: number;

  multiple?: boolean;

  /** if not provided it will be auto detected during run time */
  fps?: number;

  /**
   * width of sprite
   * default is 160
   */
  width?: number;

  /**
   * height of sprite
   * default is 90
   */
  height?: number;

  /**
   * generate sprite webVTT file?
   * default is false
   */
  webVTT?: webVTTOptions;

  outputDir: string;

  thumbnailPrefix?: string;
}

export class SpriteGenerator {
  private outputDir: string;

  private inputPath: string;

  private rowCount = 5;

  private colCount = 5;

  private height = 90;

  private width = 160;

  private multiple = false;

  private interval = 10;

  private thumbnailPrefix = 'thumbs';

  private webVTTRequired = false;

  private webVTTPath: string | undefined;

  constructor(options: Options) {
    if (options?.webVTT?.required === true && options?.webVTT?.output === undefined) {
      throw new Error('webVttPath is required when webVTT is true');
    }
    if (options?.webVTT?.required) {
      this.webVTTRequired = true;
      this.webVTTPath = options.webVTT.output;
    }
    this.outputDir = options.outputDir;
    this.inputPath = options.inputPath;
    this.rowCount = options.rowCount || this.rowCount;
    this.colCount = options.colCount || this.colCount;
    this.multiple = options.multiple || this.multiple;
    this.height = options.height || this.height;
    this.width = options.width || this.width;
    this.interval = options.interval || this.interval;
    this.thumbnailPrefix = options.thumbnailPrefix || this.thumbnailPrefix;
  }

  public getFPS(): Promise<number> {
    const defaultFps = 24;
    return new Promise(resolve => {
      ffmpeg(this.inputPath).ffprobe((err, data) => {
        if (err) {
          resolve(defaultFps);
        }
        const videoStream = data.streams[0];
        const fpsString = videoStream?.r_frame_rate || videoStream?.avg_frame_rate;
        if (!fpsString) {
          resolve(defaultFps);
          return;
        }
        const [numerator, denominator] = fpsString.split('/');
        if (Number(numerator) && Number(denominator)) {
          const fps = Math.round(Number(numerator) / Number(denominator));
          resolve(fps);
        }
        resolve(defaultFps);
      });
    });
  }

  public getDuration(): Promise<number> {
    return new Promise(resolve => {
      ffmpeg(this.inputPath).ffprobe((err, data) => {
        if (err) {
          resolve(0);
        }
        const { duration } = data.format;
        if (Number(duration)) {
          resolve(Number(duration));
        }
        resolve(0);
      });
    });
  }

  public async generate(): Promise<void> {
    await fs.ensureDir(this.outputDir);

    //* calculate the number of rows if mutiple sprite is false
    if (!this.multiple) {
      const duration = await this.getDuration();
      if (duration === 0) {
        throw new Error('could not fetch duration from video');
      }
      const totalImages = Math.floor(duration / this.interval);
      this.rowCount = Math.floor(totalImages / this.colCount);
    }

    const fps = await this.getFPS();

    const outputDirPath = path.join(this.outputDir, `${this.thumbnailPrefix}-%02d.jpg`);

    const complexFilter = `select='not(mod(n,${fps * this.interval}))',scale=${this.width}:${this.height},tile=${
      this.colCount
    }x${this.rowCount}`;
    return new Promise((resolve, reject) => {
      ffmpeg(this.inputPath)
        .complexFilter(complexFilter)
        .outputOption(['-vsync', 'vfr', '-an'])
        .output(outputDirPath)
        .on('start', () => {
          console.log('Thumbnail generation started');
        })
        .on('end', () => {
          console.log('Thumbnail generation ended');
          resolve();
        })
        .on('error', err => {
          console.log(err);
          reject();
        })
        .run();
    });
  }

  public async generateWebVTT(): Promise<void> {
    // const duration = await this.getDuration();
    const col = this.colCount;

    const row = this.rowCount;
    let thumbOutput = 'WEBVTT\n\n';
    if (this.multiple) {
      const startTime = moment('00:00:00', 'HH:mm:ss.SSS');
      const endTime = moment('00:00:00', 'HH:mm:ss.SSS').add(this.interval, 'seconds');

      for (let i = 0; i <= col; i++) {
        for (let j = 0; j <= row; j++) {
          thumbOutput += `${startTime.format('HH:mm:ss.SSS')} --> ${endTime.format('HH:mm:ss.SSS')}\n`;

          thumbOutput += `${this.thumbnailPrefix}\\#xywh=${j * this.width},${i * this.height},${this.width},${
            this.height
          }\n\n`;

          startTime.add(this.interval, 'seconds');
          endTime.add(this.interval, 'seconds');
        }
      }
    }
    fs.writeFileSync('thumbnails.vtt', thumbOutput);
  }
}

const thumb = new SpriteGenerator({ inputPath: './asset/ss/output.m3u8', outputDir: './tmp' });
thumb.generateWebVTT();
// // thumb.detectFPS().then(fps => console.log(fps));
// // thumb.generate();
// thumb.getDuration().then(duration => console.log(duration));

// const fs = require('fs');
// const moment = require('moment');

// let video_length = 1483;
// let number_of_thumbnails = 25 * 15;
// let thumb_interval = Math.round(video_length / number_of_thumbnails); // so 6 seconds per thumbnail

// console.log(thumb_interval);

// let sprite_width = 160 * 5; // Values are assumed based each thumbnail having
// let sprite_height = 90 * 5; //a width of 120 and a height of 68 with a total of 10

// let start_time = moment('00:00:00', 'HH:mm:ss.SSS');
// let end_time = moment('00:00:00', 'HH:mm:ss.SSS').add(thumb_interval, 'seconds');

// let thumb_output = 'WEBVTT\n\n';

// for (let i = 0; i <= sprite_height / 90; i++) {
//   for (let j = 0; j <= sprite_width / 160; j++) {
//     thumb_output += start_time.format('HH:mm:ss.SSS') + ' --> ' + end_time.format('HH:mm:ss.SSS') + '\n';

//     thumb_output += 'thumbnails.jpg#xywh=' + j * 160 + ',' + i * 90 + ',160,90\n\n';

//     start_time.add(thumb_interval, 'seconds');
//     end_time.add(thumb_interval, 'seconds');
//   }
// }

// fs.writeFileSync('thumbnails.vtt', thumb_output);
