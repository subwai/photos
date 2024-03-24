import Bluebird from 'bluebird';
import { ipcMain } from 'electron';
import log from 'electron-log';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import ffmpeg, { FfprobeStream } from 'fluent-ffmpeg';
import path from 'path';
import sha1 from 'sha1';
import sharp from 'sharp';

import { getCachePath } from 'main/file-system';

import type FileEntryObject from 'renderer/models/FileEntry';
import type { CoverEntryObject } from 'renderer/models/FileEntry';

const ffmpegUnpackedPath = ffmpegPath?.replace('app.asar', 'app.asar.unpacked');
if (ffmpegUnpackedPath) {
  ffmpeg.setFfmpegPath(ffmpegUnpackedPath);
  log.info('ffmpeg at', ffmpegUnpackedPath);
}

const ffprobeUnpackedPath = ffprobePath?.replace('app.asar', 'app.asar.unpacked');
if (ffprobeUnpackedPath) {
  ffmpeg.setFfprobePath(ffprobeUnpackedPath);
  log.info('ffprobe at', ffprobeUnpackedPath);
}

ipcMain.handle('generate-video-thumbnail', async (_e, fileEntry: FileEntryObject | CoverEntryObject) => {
  console.log('Generating video thumbnail', fileEntry.fullPath);

  const command = ffmpeg(fileEntry.fullPath);
  const duration = await getVideoDuration(command);

  return new Promise((resolve, reject) => {
    command
      .on('end', resolve)
      .on('error', reject)
      .inputOptions('-ss', `${Math.round(duration / 2)}`)
      .outputOptions('-qscale', '10')
      .outputOptions('-frames:v', '1')
      .outputOptions('-vf', 'scale=-1:384')
      .save(path.join(getCachePath(), 'thumbs', `${sha1(fileEntry.fullPath)}.jpg`));
  });
});

ipcMain.handle('generate-image-thumbnail', (_e, fileEntry: FileEntryObject | CoverEntryObject) => {
  console.log('Generating image thumbnail', fileEntry.fullPath);

  return sharp(fileEntry.fullPath)
    .resize({ height: 384 })
    .webp({ quality: 90 })
    .toFile(path.join(getCachePath(), 'thumbs', `${sha1(fileEntry.fullPath)}.webp`));
});

async function getVideoDuration(command: ffmpeg.FfmpegCommand) {
  const probe = Bluebird.promisify<ffmpeg.FfprobeData>(command.ffprobe, { context: command });

  const data = await probe();
  const vStream = data.streams.reduce<FfprobeStream | null>((biggest, stream) => {
    if (
      !(biggest && biggest.width && biggest.height) ||
      (stream.codec_type === 'video' &&
        stream.width &&
        stream.height &&
        stream.width * stream.height > biggest.width * biggest.height)
    ) {
      return stream;
    }
    return biggest;
  }, null);

  let duration = Number(vStream ? vStream.duration : 0);
  if (Number.isNaN(duration)) {
    duration = Number(data.format.duration);
  }

  return duration;
}
