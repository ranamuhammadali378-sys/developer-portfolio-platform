import { cloudinary } from '../config/firebase';
import { AppError } from './AppError';

export interface UploadedAsset {
  url: string;
  publicId: string;
  bytes: number;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<UploadedAsset> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `developer-portfolio/${folder}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new AppError('Failed to upload media asset to cloud storage', 502, 'MEDIA_UPLOAD_FAILED')
          );
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string | null | undefined,
  resourceType: 'image' | 'raw' = 'image'
): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch {
    // Non-blocking cleanup failure
  }
}