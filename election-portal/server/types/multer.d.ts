// Type declarations for multer package
declare module 'multer' {
  import { Request, Response, NextFunction } from 'express';
  
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
    /** Location of the uploaded file (DiskStorage) */
    path?: string;
    /** A Buffer of the entire file (MemoryStorage) */
    buffer?: Buffer;
  }
  
  interface StorageEngine {
    _handleFile(req: Request, file: Express.Multer.File, cb: (error?: Error | null, info?: Partial<File>) => void): void;
    _removeFile(req: Request, file: Express.Multer.File, cb: (error: Error | null) => void): void;
  }
  
  interface DiskStorageOptions {
    /** A function that determines within which folder the uploaded files should be stored. */
    destination?: string | ((req: Request, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => void);
    /** A function that determines what the file should be named inside the folder. */
    filename?: (req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => void;
  }
  
  interface Options {
    /** The destination directory for the uploaded files. */
    dest?: string;
    /** The storage engine to use for uploaded files. */
    storage?: StorageEngine;
    /** An object specifying the size limits of the following optional properties. This object is passed to busboy directly, and the details of properties can be found on https://github.com/mscdex/busboy#busboy-methods */
    limits?: {
      /** Max field name size (Default: 100 bytes) */
      fieldNameSize?: number;
      /** Max field value size (Default: 1MB) */
      fieldSize?: number;
      /** Max number of non-file fields (Default: Infinity) */
      fields?: number;
      /** For multipart forms, the max file size (in bytes)(Default: Infinity) */
      fileSize?: number;
      /** For multipart forms, the max number of file fields (Default: Infinity) */
      files?: number;
      /** For multipart forms, the max number of parts (fields + files)(Default: Infinity) */
      parts?: number;
      /** For multipart forms, the max number of header key=>value pairs to parse Default: 2000(same as node's http). */
      headerPairs?: number;
    };
    /** A function to control which files to upload and which to skip. */
    fileFilter?: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
  }
  
  interface Instance {
    /** In case you need to handle a text-only multipart form, you can use any of the multer methods (.single(), .array(), fields()), req.body contains the text fields */
    single(fieldname: string): (req: Request, res: Response, next: NextFunction) => void;
    /** Accept an array of files, all with the same name. */
    array(fieldname: string, maxCount?: number): (req: Request, res: Response, next: NextFunction) => void;
    /** Accept a mix of files, specified by fields. */
    fields(fields: Array<{ name: string; maxCount?: number }>): (req: Request, res: Response, next: NextFunction) => void;
    /** Accepts all files. */
    any(): (req: Request, res: Response, next: NextFunction) => void;
    /** Accept only text fields. */
    none(): (req: Request, res: Response, next: NextFunction) => void;
  }
  
  function diskStorage(options: DiskStorageOptions): StorageEngine;
  function memoryStorage(): StorageEngine;
  
  function multer(options?: Options): Instance;
  
  namespace multer {}
  
  export = multer;
}