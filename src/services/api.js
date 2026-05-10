const API_BASE_URL = "http://127.0.0.1:8000/api";

export const getHomeMessage = async () => {
  const response = await fetch(`${API_BASE_URL}/home`);

  if (!response.ok) {
    throw new Error("Failed to fetch home data");
  }

  return response.json();
};