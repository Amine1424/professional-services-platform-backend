import { ProviderCoverageMode, ServiceProvider } from '../models/ServiceProvider';

export const MARKET_REGIONS = [
  'الشرقية الشمالية',
  'الوسط الشمالي',
  'الغرب الشمالي',
  'شرق الوسط',
  'وسط الوسط',
  'غرب الوسط',
  'الجنوب الشرقي',
  'وسط الجنوب',
  'الجنوب الغربي',
] as const;

export const WILAYA_TO_REGION: Record<string, string> = {
  Adrar: 'الجنوب الغربي',
  Chlef: 'الوسط الشمالي',
  Laghouat: 'وسط الجنوب',
  'Oum El Bouaghi': 'شرق الوسط',
  Batna: 'شرق الوسط',
  Bejaia: 'الوسط الشمالي',
  Biskra: 'الجنوب الشرقي',
  Bechar: 'الجنوب الغربي',
  Blida: 'الوسط الشمالي',
  Bouira: 'وسط الوسط',
  Tamanrasset: 'وسط الجنوب',
  Tebessa: 'شرق الوسط',
  Tlemcen: 'الغرب الشمالي',
  Tiaret: 'غرب الوسط',
  'Tizi Ouzou': 'الوسط الشمالي',
  Algiers: 'الوسط الشمالي',
  Djelfa: 'وسط الوسط',
  Jijel: 'الشرقية الشمالية',
  Setif: 'شرق الوسط',
  Saida: 'غرب الوسط',
  Skikda: 'الشرقية الشمالية',
  'Sidi Bel Abbes': 'الغرب الشمالي',
  Annaba: 'الشرقية الشمالية',
  Guelma: 'الشرقية الشمالية',
  Constantine: 'شرق الوسط',
  Medea: 'وسط الوسط',
  Mostaganem: 'الغرب الشمالي',
  "M'Sila": 'وسط الوسط',
  Mascara: 'الغرب الشمالي',
  Ouargla: 'الجنوب الشرقي',
  Oran: 'الغرب الشمالي',
  'El Bayadh': 'غرب الوسط',
  Illizi: 'الجنوب الشرقي',
  'Bordj Bou Arreridj': 'شرق الوسط',
  Boumerdes: 'الوسط الشمالي',
  'El Tarf': 'الشرقية الشمالية',
  Tindouf: 'الجنوب الغربي',
  Tissemsilt: 'غرب الوسط',
  'El Oued': 'الجنوب الشرقي',
  Khenchela: 'شرق الوسط',
  'Souk Ahras': 'الشرقية الشمالية',
  Tipaza: 'الوسط الشمالي',
  Mila: 'شرق الوسط',
  'Ain Defla': 'الوسط الشمالي',
  Naama: 'غرب الوسط',
  'Ain Temouchent': 'الغرب الشمالي',
  Ghardaia: 'وسط الجنوب',
  Relizane: 'الغرب الشمالي',
  Timimoun: 'الجنوب الغربي',
  'Bordj Badji Mokhtar': 'الجنوب الغربي',
  'Ouled Djellal': 'وسط الجنوب',
  'Beni Abbes': 'الجنوب الغربي',
  'Ain Salah': 'وسط الجنوب',
  'Ain Guezzam': 'وسط الجنوب',
  Touggourt: 'الجنوب الشرقي',
  Djanet: 'الجنوب الشرقي',
  "El M'Ghair": 'الجنوب الشرقي',
  'El Meniaa': 'وسط الجنوب',
  Aflou: 'غرب الوسط',
  Barika: 'شرق الوسط',
  'Ksar Chellala': 'غرب الوسط',
  Messaad: 'وسط الوسط',
  'Ain Oussera': 'وسط الوسط',
  Boussaada: 'وسط الوسط',
  'El Abiodh Sidi Cheikh': 'غرب الوسط',
  'El Kantara': 'شرق الوسط',
  'Bir El Ater': 'شرق الوسط',
  'Ksar El Boukhari': 'وسط الوسط',
  'El Aricha': 'غرب الوسط',
};

export const normalizeGeoValue = (value?: string | null) => String(value || '').trim().toLowerCase();

export const resolveRegionFromWilaya = (wilaya?: string | null) =>
  wilaya ? WILAYA_TO_REGION[String(wilaya).trim()] || null : null;

export const getProviderCoverageRegions = (
  provider: Pick<
    ServiceProvider,
    'serviceCoverageMode' | 'serviceCoverageRegions' | 'region' | 'wilaya'
  >
) => {
  if (provider.serviceCoverageMode === ProviderCoverageMode.NATIONWIDE) {
    return [...MARKET_REGIONS];
  }

  if (provider.serviceCoverageMode === ProviderCoverageMode.REGIONAL) {
    return (provider.serviceCoverageRegions || []).filter(Boolean);
  }

  const inferredRegion = provider.region || resolveRegionFromWilaya(provider.wilaya);
  return inferredRegion ? [inferredRegion] : [];
};

export const providerMatchesGeoFilters = (
  provider: Pick<
    ServiceProvider,
    'serviceCoverageMode' | 'serviceCoverageRegions' | 'region' | 'wilaya' | 'city'
  >,
  filters: { location?: string; region?: string; wilaya?: string }
) => {
  const normalizedRegion = normalizeGeoValue(filters.region);
  const normalizedWilaya = normalizeGeoValue(filters.wilaya);
  const normalizedLocation = normalizeGeoValue(filters.location);
  const providerRegions = getProviderCoverageRegions(provider).map(normalizeGeoValue);
  const providerRegion = normalizeGeoValue(
    provider.region || resolveRegionFromWilaya(provider.wilaya)
  );
  const providerWilaya = normalizeGeoValue(provider.wilaya);
  const providerCity = normalizeGeoValue(provider.city);
  const isNationwide = provider.serviceCoverageMode === ProviderCoverageMode.NATIONWIDE;

  const matchesRegion =
    !normalizedRegion ||
    isNationwide ||
    providerRegions.includes(normalizedRegion) ||
    providerRegion === normalizedRegion;

  const targetRegionFromWilaya = normalizedWilaya
    ? normalizeGeoValue(resolveRegionFromWilaya(filters.wilaya))
    : '';

  const matchesWilaya =
    !normalizedWilaya ||
    isNationwide ||
    providerWilaya === normalizedWilaya ||
    (provider.serviceCoverageMode === ProviderCoverageMode.REGIONAL &&
      Boolean(targetRegionFromWilaya) &&
      providerRegions.includes(targetRegionFromWilaya));

  const matchesLocation =
    !normalizedLocation ||
    [providerCity, providerWilaya, providerRegion].some((value) =>
      value.includes(normalizedLocation)
    ) ||
    (isNationwide && Boolean(normalizedLocation)) ||
    providerRegions.some((value) => value.includes(normalizedLocation));

  return matchesRegion && matchesWilaya && matchesLocation;
};

export const buildProviderCoverageSummary = (
  provider: Pick<
    ServiceProvider,
    'serviceCoverageMode' | 'serviceCoverageRegions' | 'region' | 'wilaya'
  >
) => {
  const coverageRegions = getProviderCoverageRegions(provider);

  if (provider.serviceCoverageMode === ProviderCoverageMode.NATIONWIDE) {
    return {
      mode: ProviderCoverageMode.NATIONWIDE,
      label: 'كل الجزائر',
      regions: coverageRegions,
    };
  }

  if (provider.serviceCoverageMode === ProviderCoverageMode.REGIONAL) {
    return {
      mode: ProviderCoverageMode.REGIONAL,
      label: coverageRegions.length
        ? coverageRegions.join(' • ')
        : provider.region || 'تغطية جهوية',
      regions: coverageRegions,
    };
  }

  return {
    mode: ProviderCoverageMode.WILAYA_ONLY,
    label: provider.wilaya || provider.region || 'داخل الولاية فقط',
    regions: coverageRegions,
  };
};
