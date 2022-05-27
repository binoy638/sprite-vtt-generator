import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import moment from 'moment';
import path from 'path';

export interface webVTTOptions {
  required: boolean;
  path: string;
}

export interface Options {
  inputPath: string;

  rowCount?: number;

  colCount?: number;

  interval?: number;

  multiple?: boolean;

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

class SpriteGenerator {
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
    if (options?.webVTT?.required === true && options?.webVTT?.path === undefined) {
      throw new Error('webVTT path not found');
    }
    if (options?.webVTT?.required) {
      this.webVTTRequired = true;
      this.webVTTPath = options.webVTT.path;
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

  private getFPS(): Promise<number> {
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

  private getDuration(): Promise<number> {
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
          if (this.webVTTRequired) {
            this.generateWebVTT().then(() => {
              resolve();
            });
          } else {
            resolve();
          }
        })
        .on('error', err => {
          console.log(err);
          reject();
        })
        .run();
    });
  }

  private async generateWebVTT(): Promise<void> {
    if (!this.webVTTPath || !this.webVTTRequired) {
      return;
    }
    if (this.webVTTPath.split('.').pop() !== 'vtt') {
      throw new Error('webVTT path must be a vtt file');
    }
    const duration = await this.getDuration();
    const col = this.colCount;
    let row = this.rowCount;

    let thumbOutput = 'WEBVTT\n\n';
    const startTime = moment('00:00:00', 'HH:mm:ss.SSS');
    const endTime = moment('00:00:00', 'HH:mm:ss.SSS').add(this.interval, 'seconds');
    const totalImages = Math.floor(duration / this.interval);
    if (!this.multiple) {
      row = Math.floor(totalImages / this.colCount);
      for (let i = 0; i < row; i++) {
        for (let j = 0; j < col; j++) {
          const currentImageCount = i * col + j;
          if (currentImageCount > totalImages) {
            break;
          }
          thumbOutput += `${startTime.format('HH:mm:ss.SSS')} --> ${endTime.format('HH:mm:ss.SSS')}\n`;

          thumbOutput += `${this.thumbnailPrefix}-01.jpg\\#xywh=${j * this.width},${i * this.height},${this.width},${
            this.height
          }\n\n`;

          startTime.add(this.interval, 'seconds');
          endTime.add(this.interval, 'seconds');
        }
      }
    } else {
      const totalSpirits = Math.ceil(duration / this.interval / (row * col));
      for (let k = 0; k < totalSpirits; k++) {
        for (let i = 0; i < row; i++) {
          for (let j = 0; j < col; j++) {
            const currentImageCount = k * row * col + i * col + j;
            if (currentImageCount > totalImages) {
              break;
            }
            thumbOutput += `${startTime.format('HH:mm:ss.SSS')} --> ${endTime.format('HH:mm:ss.SSS')}\n`;

            thumbOutput += `${this.thumbnailPrefix}-${k + 1 < 10 ? '0' : ''}${k + 1}.jpg\\#xywh=${j * this.width},${
              i * this.height
            },${this.width},${this.height}\n\n`;

            startTime.add(this.interval, 'seconds');
            endTime.add(this.interval, 'seconds');
          }
        }
      }
    }
    fs.writeFileSync(this.webVTTPath, thumbOutput);
  }
}

export default SpriteGenerator;
