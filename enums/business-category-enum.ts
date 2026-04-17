export enum BusinessCategoryEnum {
  Barber = "Berber",
  Hairdresser = "Kuaför",
  BeautySalon = "Güzellik Salonu",
  NailSalon = "Tırnak Salonu",
  SpaMassage = "Spa & Masaj",
  TattooPiercing = "Dövme & Piercing",
}

export const BUSINESS_CATEGORIES = Object.values(BusinessCategoryEnum);

const DEPRECATED_RAW = new Set(["Diğer", "Diger"]);

const LEGACY_CATEGORY_MAP: Record<string, BusinessCategoryEnum> = {
  Kuafor: BusinessCategoryEnum.Hairdresser,
  "Guzellik Salonu": BusinessCategoryEnum.BeautySalon,
  "Tirnak Salonu": BusinessCategoryEnum.NailSalon,
  "Dovme & Piercing": BusinessCategoryEnum.TattooPiercing,
};

export const normalizeBusinessCategory = (rawCategory: string) => {
  if (!rawCategory) return "";
  if (DEPRECATED_RAW.has(rawCategory)) return "";
  if (BUSINESS_CATEGORIES.includes(rawCategory as BusinessCategoryEnum)) return rawCategory;
  return LEGACY_CATEGORY_MAP[rawCategory] ?? rawCategory;
};
