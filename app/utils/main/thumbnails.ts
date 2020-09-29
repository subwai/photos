import { ipcMain } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import sha1 from 'sha1';
import FileEntry from '../FileEntry';
import { getCachePath } from './file-system';

ipcMain.handle('generate-thumbnail', async (_e, fileEntry: FileEntry) => {
  return new Promise((resolve, reject) => {
    ffmpeg(fileEntry.fullPath)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        count: 1,
        folder: path.join(getCachePath(), 'thumbs'),
        filename: sha1(fileEntry.fullPath),
        size: '?x256',
      });
  });
});
