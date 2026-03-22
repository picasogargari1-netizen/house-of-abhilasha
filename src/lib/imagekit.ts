import { supabase } from "@/integrations/supabase/client";

const IMAGEKIT_PUBLIC_KEY = "public_353IdeDSUHm7ZUV602MtK7/xFEg=";
const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/kinbly6ir";
const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

export { IMAGEKIT_URL_ENDPOINT };

export async function uploadToImageKit(file: File, folder: string = "/"): Promise<string> {
  const { data, error } = await supabase.functions.invoke("imagekit-auth");
  if (error) throw new Error(`ImageKit auth failed: ${error.message}`);
  if (data?.error) throw new Error(`ImageKit auth failed: ${data.error}`);

  const { token, expire, signature } = data;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
  formData.append("publicKey", IMAGEKIT_PUBLIC_KEY);
  formData.append("signature", signature);
  formData.append("expire", String(expire));
  formData.append("token", token);
  formData.append("folder", folder);

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ImageKit upload failed: ${err}`);
  }

  const result = await response.json();
  return result.url;
}
