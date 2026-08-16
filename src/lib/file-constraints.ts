export const FILE_CONSTRAINTS = {
  image: {
    maxSize: 5 * 1024 * 1024,
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"],
  },
  file: {
    maxSize: 10 * 1024 * 1024,
    extensions: [".pdf", ".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv", ".toml", ".ini"],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
} as const;

export type UploadItemType = keyof typeof FILE_CONSTRAINTS;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
