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
  console.log(response.data);
  return response.data;
};

export const fetchSpeciesVessels = async (speciesId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/vessels/species/${speciesId}`,
  );
  console.log(response.data);
  return response.data;
};
