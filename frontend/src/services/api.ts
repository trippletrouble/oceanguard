import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const fetchAllSpecies = async () => {
  const response = await axios.get(`${API_BASE_URL}/species/`);
  return response.data;
};

export const fetchMigrationZone = async (speciesId: string, month: number) => {
  const response = await axios.get(
    `${API_BASE_URL}/species/${speciesId}/migration`,
    {
      params: { month },
    },
  );
  return response.data;
};

export const fetchVesselOverlaps = async (speciesId: string, month: number) => {
  const response = await axios.get(
    `${API_BASE_URL}/overlap?species_id=${speciesId}&month=${month}`,
  );
  return response.data;
};

export const syncUser = async (token: string, name: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/sync`,
    { name },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
};
