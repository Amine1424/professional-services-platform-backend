import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryConfigurationError extends Error {
  constructor() {
    super(
      'Cloudinary upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
    this.name = 'CloudinaryConfigurationError';
  }
}

let configured = false;

export const shouldUseCloudinaryUploads = () => {
  const provider = String(process.env.UPLOAD_PROVIDER || '').trim().toLowerCase();

  return provider === 'cloudinary' || process.env.NODE_ENV === 'production';
};

export const getCloudinaryClient = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryConfigurationError();
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
};

export const isCloudinaryConfigurationError = (
  error: unknown
): error is CloudinaryConfigurationError =>
  error instanceof CloudinaryConfigurationError;
