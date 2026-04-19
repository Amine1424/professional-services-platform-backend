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

export const ALGERIA_WILAYAS = [
  'Adrar',
  'Chlef',
  'Laghouat',
  'Oum El Bouaghi',
  'Batna',
  'Bejaia',
  'Biskra',
  'Bechar',
  'Blida',
  'Bouira',
  'Tamanrasset',
  'Tebessa',
  'Tlemcen',
  'Tiaret',
  'Tizi Ouzou',
  'Algiers',
  'Djelfa',
  'Jijel',
  'Setif',
  'Saida',
  'Skikda',
  'Sidi Bel Abbes',
  'Annaba',
  'Guelma',
  'Constantine',
  'Medea',
  'Mostaganem',
  "M'Sila",
  'Mascara',
  'Ouargla',
  'Oran',
  'El Bayadh',
  'Illizi',
  'Bordj Bou Arreridj',
  'Boumerdes',
  'El Tarf',
  'Tindouf',
  'Tissemsilt',
  'El Oued',
  'Khenchela',
  'Souk Ahras',
  'Tipaza',
  'Mila',
  'Ain Defla',
  'Naama',
  'Ain Temouchent',
  'Ghardaia',
  'Relizane',
  'Timimoun',
  'Bordj Badji Mokhtar',
  'Ouled Djellal',
  'Beni Abbes',
  'Ain Salah',
  'Ain Guezzam',
  'Touggourt',
  'Djanet',
  "El M'Ghair",
  'El Meniaa',
  'Aflou',
  'Barika',
  'Ksar Chellala',
  'Messaad',
  'Ain Oussera',
  'Boussaada',
  'El Abiodh Sidi Cheikh',
  'El Kantara',
  'Bir El Ater',
  'Ksar El Boukhari',
  'El Aricha',
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

export type ProviderCoverageMode = 'wilaya_only' | 'regional' | 'nationwide';

export interface ProviderCoverageSummary {
  mode: ProviderCoverageMode;
  label: string;
  regions: string[];
}

export const resolveRegionFromWilaya = (wilaya?: string | null) =>
  wilaya ? WILAYA_TO_REGION[String(wilaya).trim()] || null : null;

export const buildProviderCoverageLabel = (
  mode: ProviderCoverageMode,
  options: {
    wilaya?: string | null;
    region?: string | null;
    regions?: string[] | null;
  }
) => {
  if (mode === 'nationwide') {
    return 'يغطي كامل الجزائر';
  }

  if (mode === 'regional') {
    const selectedRegions = (options.regions || []).filter(Boolean);
    return selectedRegions.length
      ? `يغطي ${selectedRegions.join(' • ')}`
      : `يغطي ${options.region || 'جهات متعددة'}`;
  }

  return `يغطي ${options.wilaya || options.region || 'الولاية فقط'}`;
};

export const estimateTravelLabel = (input: {
  providerCoverageMode: ProviderCoverageMode;
  providerWilaya?: string | null;
  providerRegion?: string | null;
  customerWilaya?: string | null;
  customerRegion?: string | null;
}) => {
  if (input.providerCoverageMode === 'nationwide') {
    return 'مدة الوصول المتوقعة: من يوم إلى ثلاثة أيام حسب المسافة والجدولة.';
  }

  if (
    input.customerWilaya &&
    input.providerWilaya &&
    input.customerWilaya.trim().toLowerCase() === input.providerWilaya.trim().toLowerCase()
  ) {
    return 'مدة الوصول المتوقعة: غالبًا في نفس اليوم داخل نفس الولاية.';
  }

  if (
    input.customerRegion &&
    input.providerRegion &&
    input.customerRegion.trim().toLowerCase() === input.providerRegion.trim().toLowerCase()
  ) {
    return 'مدة الوصول المتوقعة: غالبًا في نفس اليوم أو اليوم التالي داخل نفس الجهة.';
  }

  if (input.providerCoverageMode === 'regional') {
    return 'مدة الوصول المتوقعة: عادة في نفس اليوم إذا كان الطلب داخل الجهة المغطاة.';
  }

  return 'مدة الوصول المتوقعة: المزود يعمل أساسًا داخل ولايته. يفضّل تأكيد التنقل قبل الحجز.';
};

export const buildGoogleMapsSearchUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const buildGoogleMapsEmbedUrl = (query: string) =>
  `https://www.google.com/maps?hl=en&q=${encodeURIComponent(query)}&z=12&output=embed`;
