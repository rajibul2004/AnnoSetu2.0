import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Save file locally into public/uploads/<folder> as a dependable fallback.
 */
async function saveLocalUpload(
  buffer: Buffer,
  originalName: string,
  folderName: string,
  mimeType: string
): Promise<string> {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", folderName);
    await fs.mkdir(uploadDir, { recursive: true });

    const rawExt = path.extname(originalName);
    const fallbackExt = mimeType.includes("png")
      ? ".png"
      : mimeType.includes("webp")
      ? ".webp"
      : mimeType.includes("pdf")
      ? ".pdf"
      : ".jpg";

    const ext = rawExt || fallbackExt;
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    await fs.writeFile(filePath, buffer);
    return `/uploads/${folderName}/${uniqueName}`;
  } catch (fsErr) {
    console.warn("Failed to write upload to public directory, falling back to base64 Data URI:", fsErr);
    return `data:${mimeType || "image/jpeg"};base64,${buffer.toString("base64")}`;
  }
}

export async function uploadFoodImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!isCloudinaryConfigured) {
    return saveLocalUpload(buffer, file.name, "food", file.type);
  }

  try {
    const uploadPromise = new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "annosetu/food", resource_type: "image" },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(buffer);
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Cloudinary upload timeout")), 4000)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Cloudinary upload failed/timed out, saving locally:", error);
    return saveLocalUpload(buffer, file.name, "food", file.type);
  }
}

export async function uploadProfileImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!isCloudinaryConfigured) {
    return saveLocalUpload(buffer, file.name, "profiles", file.type);
  }

  try {
    const uploadPromise = new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "annosetu/profiles", resource_type: "image" },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(buffer);
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Cloudinary profile upload timeout")), 4000)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Cloudinary profile upload failed/timed out, saving locally:", error);
    return saveLocalUpload(buffer, file.name, "profiles", file.type);
  }
}

export async function uploadVerificationDocument(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!isCloudinaryConfigured) {
    return saveLocalUpload(buffer, file.name, "verifications", file.type);
  }

  try {
    const uploadPromise = new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "annosetu/verifications", resource_type: "auto" },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Document upload to Cloudinary failed"));
            return;
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(buffer);
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Cloudinary document upload timeout")), 4000)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Cloudinary document upload failed/timed out, saving locally:", error);
    return saveLocalUpload(buffer, file.name, "verifications", file.type);
  }
}