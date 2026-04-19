import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

const ensureDirectory = (directoryPath: string) => {
  fs.mkdirSync(directoryPath, { recursive: true });
};

const sanitizeSegment = (value: string) =>
  value.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');

const getExtension = (filename: string) => {
  const extension = path.extname(filename || '').toLowerCase();
  return extension || '';
};

export const toPublicUploadPath = (absolutePath: string) => {
  const relativePath = path.relative(UPLOADS_ROOT, absolutePath).replace(/\\/g, '/');
  return `/uploads/${relativePath}`;
};

export const removeLocalUploadByUrl = (fileUrl?: string | null) => {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
    return;
  }

  const relativePath = fileUrl.replace('/uploads/', '');
  const absolutePath = path.resolve(UPLOADS_ROOT, relativePath);

  if (!absolutePath.startsWith(UPLOADS_ROOT)) {
    return;
  }

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

export const createDiskUpload = (
  resolveSegments: (req: Request) => string[],
  fileFilter?: multer.Options['fileFilter']
) =>
  multer({
    storage: multer.diskStorage({
      destination: (req, _file, callback) => {
        const segments = resolveSegments(req).map(sanitizeSegment);
        const destination = path.join(UPLOADS_ROOT, ...segments);
        ensureDirectory(destination);
        callback(null, destination);
      },
      filename: (_req, file, callback) => {
        callback(null, `${Date.now()}-${uuidv4()}${getExtension(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: 1024 * 1024 * 150,
    },
    fileFilter,
  });

export const imageOnlyFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
    return;
  }

  callback(new Error('Only image files are allowed'));
};

export const imageAndVideoFilter: multer.Options['fileFilter'] = (
  _req,
  file,
  callback
) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    callback(null, true);
    return;
  }

  callback(new Error('Only image and video files are allowed'));
};
