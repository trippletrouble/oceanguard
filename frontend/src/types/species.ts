export interface HateoasLink {
  href: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

export interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
  description?: string;
  region: string;
  temp_min?: number;
  temp_max?: number;
  active: boolean;
  links?: {
    self?: HateoasLink;
    migration?: HateoasLink;
    vessels?: HateoasLink;
    overlap?: HateoasLink;
    alerts?: HateoasLink;
  };
}
