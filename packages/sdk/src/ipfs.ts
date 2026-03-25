import axios from "axios";
import FormData from "form-data";

/**
 * Uploads a file buffer directly to Pinata IPFS from the client side.
 * This completely bypasses the backend Relayer.
 */
export async function uploadToIPFSClientSide(
  fileBuffer: Buffer | Blob,
  filename: string,
  pinataJWT: string
): Promise<string> {
  const formData = new FormData();
  
  // Handling both Node.js Buffer and Browser Blob for isomorphic SDK
  if (typeof Blob !== "undefined" && fileBuffer instanceof Blob) {
    formData.append("file", fileBuffer, filename);
  } else {
    formData.append("file", fileBuffer, { filename });
  }

  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
    maxBodyLength: Infinity,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${(formData as any)._boundary || "---boundary"}`,
      Authorization: `Bearer ${pinataJWT}`,
    },
  });

  if (!res.data || !res.data.IpfsHash) {
    throw new Error("Failed to pin to IPFS via Pinata.");
  }

  return res.data.IpfsHash;
}
