export interface FileMetadata {
  cid: string;
  name: string;
  size: bigint | number;
  fileType: string;
  uploadedAt: bigint | number;
}

export interface UploadProgress {
  stage: 'idle' | 'encrypting' | 'uploading' | 'recording' | 'done';
  percent: number;
}