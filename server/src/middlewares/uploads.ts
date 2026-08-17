// import multer from "multer";
// import path from "path";
// import fs from "fs";

// const uploadDir = "uploads/avatars";
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (_req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const ext = path.extname(file.originalname);
//     cb(null, `avatar-${uniqueSuffix}${ext}`);
//   },
// });

// export const uploadAvatar = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
//   fileFilter: (_req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed."));
//     }
//   },
// });

// import multer from "multer";
// import path from "path";
// import fs from "fs";

/**
 * Create a Multer disk storage configuration.
 */
// const createImageStorage = (uploadDir: string, filePrefix: string) => {
//   // Create directory if it doesn't exist
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
 * Maximum image size: 5 MB
 */
// const imageUploadLimits: multer.Options["limits"] = {
//   fileSize: 5 * 1024 * 1024,
// };

/**
 * Profile/avatar image upload
 *
 * Saved to:
 * uploads/avatars/
 *
 * Expected FormData field:
 * "avatar"
 */
// export const uploadAvatar = multer({
//   storage: createImageStorage("uploads/avatars", "avatar"),
//   limits: imageUploadLimits,
//   fileFilter: imageFileFilter,
// });

/**
 * Group image upload
 *
 * Saved to:
 * uploads/group-images/
 *
 * Expected FormData field:
 * "groupImage"
 */
// export const uploadGroupImage = multer({
//   storage: createImageStorage("uploads/group-images", "group"),
//   limits: imageUploadLimits,
//   fileFilter: imageFileFilter,
// });

import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Create a Multer disk storage configuration.
 */
const createImageStorage = (uploadDir: string, filePrefix: string) => {
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
 * Only allow image files.
 */
const imageFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."));
  }
};

/**
 * 5 MB maximum file size.
 */
const imageUploadLimits: multer.Options["limits"] = {
  fileSize: 5 * 1024 * 1024,
};

/**
 * Profile/avatar upload.
 *
 * FormData field:
 * avatar
 *
 * Storage:
 * uploads/avatars/
 */
export const uploadAvatar = multer({
  storage: createImageStorage("uploads/avatars", "avatar"),
  limits: imageUploadLimits,
  fileFilter: imageFileFilter,
});

/**
 * Group image upload.
 *
 * FormData field:
 * groupImage
 *
 * Storage:
 * uploads/group-images/
 */
export const uploadGroupImage = multer({
  storage: createImageStorage("uploads/group-images", "group"),
  limits: imageUploadLimits,
  fileFilter: imageFileFilter,
});
