import axios from "axios";
import type { HateoasLink } from "@/types/species";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const fetchApiRoot = async () => {
  return {
    links: {
      species_catalog: { href: "/species/", method: "GET" } as HateoasLink,
    },
  };
};

export const fetchAllSpecies = async () => {
  const root = await fetchApiRoot();
  return await followHypermediaLink(root.links.species_catalog);
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

export const followHypermediaLink = async (
  link: HateoasLink,
  customParams?: Record<string, any>,
) => {
  const response = await axios({
    method: link.method || "GET",
    baseURL: API_BASE_URL,
    url: link.href,
    params: customParams,
  });

  return response.data;
};
