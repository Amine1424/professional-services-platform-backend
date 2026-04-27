import { Request } from 'express';
import multer from 'multer';
import {
  getCloudinaryClient,
  isCloudinaryConfigurationError,
  shouldUseCloudinaryUploads,
} from '../config/cloudinary';
import {
  createDiskUpload,
  removeLocalUploadByUrl,
  toPublicUploadPath,
} from '../utils/uploads';

const MAX_UPLOAD_SIZE_BYTES = 1024 * 1024 * 150;

type CloudinaryResourceType = 'auto' | 'image' | 'video' | 'raw';

type UploadFolderResolver = (req: Request) => string[];

type UploadResult = {
  secureUrl: string;
  publicId: string | null;
};

export const UPLOAD_FOLDERS = {
  providers: 'professional-services/providers',
  portfolio: 'professional-services/portfolio',
  stories: 'professional-services/stories',
} as const;

export const createUploadMiddleware = (
  resolveSegments: UploadFolderResolver,
  fileFilter?: multer.Options['fileFilter']
) => {
  if (!shouldUseCloudinaryUploads()) {
    return createDiskUpload(resolveSegments, fileFilter);
  }

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_UPLOAD_SIZE_BYTES,
    },
    fileFilter,
  });
};

const uploadBufferToCloudinary = (
  file: Express.Multer.File,
  folder: string,
  resourceType: CloudinaryResourceType
): Promise<UploadResult> => {
  if (!file.buffer) {
    return Promise.reject(
      new Error('Cloudinary uploads require multer memory storage.')
    );
  }

  const cloudinary = getCloudinaryClient();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url || !result.public_id) {
          reject(new Error('Cloudinary upload did not return a secure URL.'));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const resolveUploadedFileUrl = async (
  file: Express.Multer.File,
  options: {
    folder: string;
    resourceType?: CloudinaryResourceType;
  }
): Promise<UploadResult> => {
  if (shouldUseCloudinaryUploads()) {
    return uploadBufferToCloudinary(
      file,
      options.folder,
      options.resourceType || 'auto'
    );
  }

  if (!file.path) {
    throw new Error('Local upload did not provide a file path.');
  }

  return {
    secureUrl: toPublicUploadPath(file.path),
    publicId: null,
  };
};

export const cleanupLocalUploadedFile = (file?: Express.Multer.File) => {
  if (!file?.path) {
    return;
  }

  removeLocalUploadByUrl(toPublicUploadPath(file.path));
};

export const getUploadErrorMessage = (
  error: unknown,
  fallbackMessage: string
) => {
  if (isCloudinaryConfigurationError(error)) {
    return error.message;
  }

  return fallbackMessage;
};
