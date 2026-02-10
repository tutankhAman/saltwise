export interface Drug {
  id: string;
  brandName: string;
  salt: string;
  strength: string;
  form: string;
  manufacturer: string;
}

export interface DrugSearchResponse {
  drugs: Drug[];
}
