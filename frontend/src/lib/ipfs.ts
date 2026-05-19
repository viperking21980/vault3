/**
 * IPFS module. Uses Pinata as a pinning service.
 *
 * Upload: POST file to Pinata, get back a CID.
 * Download: GET from Pinata gateway by CID.
 */

import axios from 'axios';

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_API = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

if (!PINATA_JWT) {
  console.log(' VITE_PINATA_JWT is not set');
}

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Uploads a blob to IPFS via Pinata.
 * @returns IPFS CID of the uploaded content.
 */
export async function uploadToIPFS(
  data: Blob,
  fileName: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', data, fileName);

  // Metadata sent to Pinata (NOT stored in IPFS itself)
  formData.append(
    'pinataMetadata',
    JSON.stringify({
      name: fileName,
      keyvalues: {
        app: 'vault3',
        encrypted: 'true',
      },
    })
  );

  // Pinning options
  formData.append(
    'pinataOptions',
    JSON.stringify({
      cidVersion: 1,
    })
  );

  const response = await axios.post<PinataUploadResponse>(
    `${PINATA_API}/pinning/pinFileToIPFS`,
    formData,
    {
      maxContentLength: Infinity,
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    }
  );

  return response.data.IpfsHash;
}

/**
 * Downloads encrypted data from IPFS by CID.
 */
export async function downloadFromIPFS(cid: string): Promise<ArrayBuffer> {
  const url = `${PINATA_GATEWAY}/${cid}`;
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
  });
  return response.data;
}

/**
 * Returns the public gateway URL for a CID.
 * Used for showing the "external link" in UI.
 */
export function getIPFSUrl(cid: string): string {
  return `${PINATA_GATEWAY}/${cid}`;
}