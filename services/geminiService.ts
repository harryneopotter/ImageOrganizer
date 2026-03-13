
export const analyzeImage = async (
  base64Data: string,
  mimeType: string,
  categories: string[] = []
): Promise<any> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      base64: base64Data,
      mimeType,
      categories
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze image');
  }

  return await response.json();
};
