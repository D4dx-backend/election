// Type declarations for Express with Multer
import { Request } from 'express';

declare global {
  namespace Express {
    interface File {
        /** Field name specified in the form */
        fieldname: string;
        /** Name of the file on the user's computer */
        originalname: string;
        /** Encoding type of the file */
        encoding: string;
        /** Mime type of the file */
        mimetype: string;
        /** Size of the file in bytes */
        size: number;
        /** The folder to which the file has been saved (DiskStorage) */
        destination?: string;
        /** The name of the file within the destination (DiskStorage) */
        filename?: string;
        /** Location of the uploaded file - in cloudinary this is the URL */
        path?: string;
        /** A Buffer of the entire file (MemoryStorage) */
        buffer?: Buffer;
      }
    }
    // Add file property to the Request interface
    interface Request {
      file?: Multer.File;
      files?: { [fieldname: string]: Multer.File[] } | Multer.File[];
    }
  }
}