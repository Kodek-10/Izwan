import { api } from "@/lib/api-client";

export const generateTagsAndDescription = async (code: string, language: string) => {
  return api.post<{ tags: string[], description: string }>('/ai/enrich', { code, language });
};
