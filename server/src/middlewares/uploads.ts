// import multer from "multer";
// import path from "path";
// import fs from "fs";

/**
 * Create a Multer disk storage configuration.
 */
// const createImageStorage = (uploadDir: string, filePrefix: string) => {
//   if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
//   }

//   return multer.diskStorage({
//     destination: (_req, _file, cb) => {
//       cb(null, uploadDir);
//     },

//     filename: (_req, file, cb) => {
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

//       const ext = path.extname(file.originalname);

//       cb(null, `${filePrefix}-${uniqueSuffix}${ext}`);
//     },
//   });
// };

/**
 * Only allow image files.
 */
// const imageFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed."));
//   }
// };

/**
 * 5 MB maximum file size.
 */
// const imageUploadLimits: multer.Options["limits"] = {
//   fileSize: 5 * 1024 * 1024,
// };

/**
 * Profile/avatar upload.
 *
 * FormData field:
 * avatar
 *
 * Storage:
 * uploads/avatars/
 */
// export const uploadAvatar = multer({
//   storage: createImageStorage("uploads/avatars", "avatar"),
//   limits: imageUploadLimits,
//   fileFilter: imageFileFilter,
// });

/**
 * Group image upload.
 *
 * FormData field:
 * groupImage
 *
 * Storage:
 * uploads/group-images/
 */
// export const uploadGroupImage = multer({
//   storage: createImageStorage("uploads/group-images", "group"),
//   limits: imageUploadLimits,
//   fileFilter: imageFileFilter,
// });

// --------------------------------------------------------------------------------------------------------------------------
import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Reusable Multer Disk Storage Generator
 */
const createStorage = (uploadDir: string, filePrefix: string) => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${filePrefix}-${uniqueSuffix}${ext}`);
    },
  });
};

/**
 * Filter to restrict uploads to image mime types only.
 */
const imageFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."));
  }
};

/**
 * Limit for profile/group images (5 MB)
 */
const imageUploadLimits: multer.Options["limits"] = {
  fileSize: 5 * 1024 * 1024,
};

/**
 * 1. User Profile Avatar Upload
 * Field Name: "avatar" | Destination: uploads/avatars/
 */
export const uploadAvatar = multer({
  storage: createStorage("uploads/avatars", "avatar"),
  limits: imageUploadLimits,
  fileFilter: imageFileFilter,
});

/**
 * 2. Group Profile Image Upload
 * Field Name: "groupImage" | Destination: uploads/group-images/
 */
export const uploadGroupImage = multer({
  storage: createStorage("uploads/group-images", "group"),
  limits: imageUploadLimits,
  fileFilter: imageFileFilter,
});

/**
 * 3. Chat Message Attachment Upload (Images, Videos, Files up to 50 MB)
 * Field Name: "file" | Destination: uploads/chat-attachments/
 */
export const uploadChatAttachment = multer({
  storage: createStorage("uploads/chat-attachments", "chat"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
