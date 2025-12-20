export type ReposterActionResult = {
  ok: boolean;
  message: string;
};

type DownloadMediaInput = {
  url?: string;
  filename?: string;
};

export const downloadMedia = async ({
  url,
  filename,
}: DownloadMediaInput): Promise<ReposterActionResult> => {
  if (!url) {
    return { ok: false, message: "Media tidak tersedia." };
  }

  const anchor = document.createElement("a");
  anchor.download = filename || "media";
  anchor.rel = "noreferrer";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Download failed");
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    anchor.href = objectUrl;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    return { ok: true, message: "Media diunduh." };
  } catch (error) {
    try {
      anchor.href = url;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      return { ok: true, message: "Unduhan dimulai." };
    } catch (fallbackError) {
      return { ok: false, message: "Gagal mengunduh media." };
    }
  }
};

export const copyCaption = async (
  text: string,
): Promise<ReposterActionResult> => {
  if (!text) {
    return { ok: false, message: "Caption kosong." };
  }

  try {
    await navigator.clipboard.writeText(text);
    return { ok: true, message: "Caption disalin." };
  } catch (error) {
    return { ok: false, message: "Gagal menyalin caption." };
  }
};
