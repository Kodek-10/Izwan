export const generateTagsAndDescription = async (code: string, language: string) => {
  const response = await fetch('http://localhost:8000/api/v1/ai/enrich', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, language }),
  });
  return response.json();
};
