import axios from "axios";
import FormData from "form-data";

export interface UploadedFileResult {
  cid: string;
  size: number;
}

export async function uploadBufferToIPFS(input: {
  filename: string;
  content: Buffer;
  contentType: string;
  metadata?: Record<string, unknown>;
}): Promise<UploadedFileResult> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("PINATA_JWT is not configured.");
  }

  const formData = new FormData();
  formData.append("file", input.content, {
    filename: input.filename,
    contentType: input.contentType
  });

  if (input.metadata) {
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: input.filename,
        keyvalues: input.metadata
      })
    );
  }

  const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${jwt}`
    },
    maxBodyLength: Infinity
  });

  return {
    cid: response.data.IpfsHash,
    size: Number(response.data.PinSize ?? input.content.length)
  };
}

export function buildIpfsGatewayUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}
