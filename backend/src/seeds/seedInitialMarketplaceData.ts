import { initializeDatabase, AppDataSource } from '../config/database';
import { HashService } from '../services/auth/hashService';
import { Category } from '../models/Category';
import Region from '../models/Region';
import Wilaya from '../models/Wilaya';
import User, { UserRole } from '../models/User';

type CategoryNode = {
  key: string;
  name: string;
  description?: string;
  children?: CategoryNode[];
};

type WilayaSeed = {
  code: string;
  name: string;
  slug: string;
};

type RegionSeed = {
  code: string;
  name: string;
  slug: string;
  wilayas: WilayaSeed[];
};

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'AdminDz@2026!';

const MARKET_REGIONS: RegionSeed[] = [
  {
    code: 'NNE',
    name: 'الشرقية الشمالية',
    slug: 'north-east',
    wilayas: [
      { code: '18', name: 'Jijel', slug: 'jijel' },
      { code: '21', name: 'Skikda', slug: 'skikda' },
      { code: '23', name: 'Annaba', slug: 'annaba' },
      { code: '24', name: 'Guelma', slug: 'guelma' },
      { code: '36', name: 'El Tarf', slug: 'el-tarf' },
      { code: '41', name: 'Souk Ahras', slug: 'souk-ahras' },
    ],
  },
  {
    code: 'NCN',
    name: 'الوسط الشمالي',
    slug: 'north-center',
    wilayas: [
      { code: '02', name: 'Chlef', slug: 'chlef' },
      { code: '06', name: 'Bejaia', slug: 'bejaia' },
      { code: '09', name: 'Blida', slug: 'blida' },
      { code: '15', name: 'Tizi Ouzou', slug: 'tizi-ouzou' },
      { code: '16', name: 'Algiers', slug: 'algiers' },
      { code: '35', name: 'Boumerdes', slug: 'boumerdes' },
      { code: '42', name: 'Tipaza', slug: 'tipaza' },
      { code: '44', name: 'Ain Defla', slug: 'ain-defla' },
    ],
  },
  {
    code: 'NWN',
    name: 'الغرب الشمالي',
    slug: 'north-west',
    wilayas: [
      { code: '13', name: 'Tlemcen', slug: 'tlemcen' },
      { code: '22', name: 'Sidi Bel Abbes', slug: 'sidi-bel-abbes' },
      { code: '27', name: 'Mostaganem', slug: 'mostaganem' },
      { code: '29', name: 'Mascara', slug: 'mascara' },
      { code: '31', name: 'Oran', slug: 'oran' },
      { code: '46', name: 'Ain Temouchent', slug: 'ain-temouchent' },
      { code: '48', name: 'Relizane', slug: 'relizane' },
    ],
  },
  {
    code: 'MDE',
    name: 'شرق الوسط',
    slug: 'east-center',
    wilayas: [
      { code: '04', name: 'Oum El Bouaghi', slug: 'oum-el-bouaghi' },
      { code: '05', name: 'Batna', slug: 'batna' },
      { code: '12', name: 'Tebessa', slug: 'tebessa' },
      { code: '19', name: 'Setif', slug: 'setif' },
      { code: '25', name: 'Constantine', slug: 'constantine' },
      { code: '34', name: 'Bordj Bou Arreridj', slug: 'bordj-bou-arreridj' },
      { code: '40', name: 'Khenchela', slug: 'khenchela' },
      { code: '43', name: 'Mila', slug: 'mila' },
      { code: '60', name: 'Barika', slug: 'barika' },
      { code: '66', name: 'El Kantara', slug: 'el-kantara' },
      { code: '67', name: 'Bir El Ater', slug: 'bir-el-ater' },
    ],
  },
  {
    code: 'MDC',
    name: 'وسط الوسط',
    slug: 'center-center',
    wilayas: [
      { code: '10', name: 'Bouira', slug: 'bouira' },
      { code: '17', name: 'Djelfa', slug: 'djelfa' },
      { code: '26', name: 'Medea', slug: 'medea' },
      { code: '28', name: "M'Sila", slug: 'msila' },
      { code: '62', name: 'Messaad', slug: 'messaad' },
      { code: '63', name: 'Ain Oussera', slug: 'ain-oussera' },
      { code: '64', name: 'Boussaada', slug: 'boussaada' },
      { code: '68', name: 'Ksar El Boukhari', slug: 'ksar-el-boukhari' },
    ],
  },
  {
    code: 'MDW',
    name: 'غرب الوسط',
    slug: 'west-center',
    wilayas: [
      { code: '14', name: 'Tiaret', slug: 'tiaret' },
      { code: '20', name: 'Saida', slug: 'saida' },
      { code: '32', name: 'El Bayadh', slug: 'el-bayadh' },
      { code: '38', name: 'Tissemsilt', slug: 'tissemsilt' },
      { code: '45', name: 'Naama', slug: 'naama' },
      { code: '59', name: 'Aflou', slug: 'aflou' },
      { code: '61', name: 'Ksar Chellala', slug: 'ksar-chellala' },
      { code: '65', name: 'El Abiodh Sidi Cheikh', slug: 'el-abiodh-sidi-cheikh' },
      { code: '69', name: 'El Aricha', slug: 'el-aricha' },
    ],
  },
  {
    code: 'SSE',
    name: 'الجنوب الشرقي',
    slug: 'south-east',
    wilayas: [
      { code: '07', name: 'Biskra', slug: 'biskra' },
      { code: '30', name: 'Ouargla', slug: 'ouargla' },
      { code: '33', name: 'Illizi', slug: 'illizi' },
      { code: '39', name: 'El Oued', slug: 'el-oued' },
      { code: '55', name: 'Touggourt', slug: 'touggourt' },
      { code: '56', name: 'Djanet', slug: 'djanet' },
      { code: '57', name: "El M'Ghair", slug: 'el-mghair' },
    ],
  },
  {
    code: 'SSC',
    name: 'وسط الجنوب',
    slug: 'south-center',
    wilayas: [
      { code: '03', name: 'Laghouat', slug: 'laghouat' },
      { code: '11', name: 'Tamanrasset', slug: 'tamanrasset' },
      { code: '47', name: 'Ghardaia', slug: 'ghardaia' },
      { code: '51', name: 'Ouled Djellal', slug: 'ouled-djellal' },
      { code: '53', name: 'Ain Salah', slug: 'ain-salah' },
      { code: '54', name: 'Ain Guezzam', slug: 'ain-guezzam' },
      { code: '58', name: 'El Meniaa', slug: 'el-meniaa' },
    ],
  },
  {
    code: 'SSW',
    name: 'الجنوب الغربي',
    slug: 'south-west',
    wilayas: [
      { code: '01', name: 'Adrar', slug: 'adrar' },
      { code: '08', name: 'Bechar', slug: 'bechar' },
      { code: '37', name: 'Tindouf', slug: 'tindouf' },
      { code: '49', name: 'Timimoun', slug: 'timimoun' },
      { code: '50', name: 'Bordj Badji Mokhtar', slug: 'bordj-badji-mokhtar' },
      { code: '52', name: 'Beni Abbes', slug: 'beni-abbes' },
    ],
  },
];

const CATEGORY_TREE: CategoryNode[] = [
  {
    key: 'construction-finishing',
    name: 'البناء والتشطيب',
    description: 'خدمات البناء والهيكلة والتشطيب للأفراد والمؤسسات.',
    children: [
      {
        key: 'general-construction',
        name: 'أشغال البناء',
        children: [
          { key: 'general-contractor', name: 'مقاول بناء عام' },
          { key: 'excavation-backfill', name: 'حفر وردم' },
          { key: 'rebar-formwork', name: 'حدادة خرسانة وقوالب' },
        ],
      },
      {
        key: 'interior-finishing',
        name: 'التشطيب الداخلي',
        children: [
          { key: 'painting', name: 'صباغة ودهان' },
          { key: 'gypsum-decor', name: 'جبس وديكور' },
          { key: 'tiling-flooring', name: 'بلاط وأرضيات' },
        ],
      },
      {
        key: 'facades-carpentry',
        name: 'الواجهات والنجارة',
        children: [
          { key: 'aluminum-glass', name: 'ألمنيوم وزجاج' },
          { key: 'wood-carpentry', name: 'نجارة خشبية' },
          { key: 'metal-doors-shutters', name: 'أبواب وستائر معدنية' },
        ],
      },
    ],
  },
  {
    key: 'maintenance-repairs',
    name: 'الصيانة والإصلاح',
    description: 'خدمات الإصلاح السريع والصيانة الدورية للمنازل والمحلات.',
    children: [
      {
        key: 'plumbing',
        name: 'السباكة',
        children: [
          { key: 'sanitary-installation', name: 'تركيب صحي' },
          { key: 'leaks-drain-cleaning', name: 'تسربات وانسدادات' },
          { key: 'pumps-heaters', name: 'مضخات وسخانات' },
        ],
      },
      {
        key: 'electrical',
        name: 'الكهرباء',
        children: [
          { key: 'wiring-installation', name: 'تمديدات كهربائية' },
          { key: 'fault-repair', name: 'صيانة الأعطال' },
          { key: 'lighting-cctv', name: 'إنارة وكاميرات' },
        ],
      },
      {
        key: 'cooling-appliances',
        name: 'التبريد والأجهزة',
        children: [
          { key: 'ac-installation', name: 'تركيب مكيفات' },
          { key: 'ac-repair', name: 'صيانة التبريد' },
          { key: 'home-appliance-repair', name: 'إصلاح الأجهزة المنزلية' },
        ],
      },
    ],
  },
  {
    key: 'home-services',
    name: 'التنظيف والرعاية المنزلية',
    description: 'خدمات النظافة والرعاية اليومية داخل المنزل أو المكتب.',
    children: [
      {
        key: 'cleaning',
        name: 'التنظيف',
        children: [
          { key: 'home-cleaning', name: 'تنظيف منازل' },
          { key: 'office-cleaning', name: 'تنظيف مكاتب' },
          { key: 'post-construction-cleaning', name: 'تنظيف بعد الأشغال' },
        ],
      },
      {
        key: 'household-care',
        name: 'العناية المنزلية',
        children: [
          { key: 'carpet-cleaning', name: 'غسل زرابي' },
          { key: 'sofa-cleaning', name: 'تنظيف كنب' },
          { key: 'laundry-ironing', name: 'غسيل وكي الملابس' },
        ],
      },
      {
        key: 'in-home-care',
        name: 'الرعاية الشخصية المنزلية',
        children: [
          { key: 'babysitting', name: 'جليسة أطفال' },
          { key: 'elderly-care', name: 'رعاية كبار السن' },
          { key: 'home-cook', name: 'طباخة منزلية' },
        ],
      },
    ],
  },
  {
    key: 'transport-logistics',
    name: 'النقل والتوصيل',
    description: 'خدمات التوصيل والنقل المحلي واللوجستيك التجاري.',
    children: [
      {
        key: 'express-delivery',
        name: 'التوصيل السريع',
        children: [
          { key: 'parcel-delivery', name: 'توصيل طرود' },
          { key: 'food-delivery', name: 'توصيل طعام' },
          { key: 'document-delivery', name: 'توصيل وثائق' },
        ],
      },
      {
        key: 'moving',
        name: 'نقل الأثاث',
        children: [
          { key: 'home-moving', name: 'نقل سكني' },
          { key: 'office-moving', name: 'نقل مكتبي' },
          { key: 'packing', name: 'تغليف وتوضيب' },
        ],
      },
      {
        key: 'logistics',
        name: 'اللوجستيك',
        children: [
          { key: 'storage-shipping', name: 'تخزين وشحن' },
          { key: 'cold-transport', name: 'نقل مبرد' },
          { key: 'private-driver', name: 'سائق خاص' },
        ],
      },
    ],
  },
  {
    key: 'automotive',
    name: 'السيارات والدراجات',
    description: 'خدمات الميكانيك والكهرباء والمظهر والنجدة.',
    children: [
      {
        key: 'mechanics',
        name: 'الميكانيك',
        children: [
          { key: 'engine-service', name: 'صيانة محرك' },
          { key: 'brakes-suspension', name: 'فرامل وتعليق' },
          { key: 'oil-change', name: 'تغيير زيوت' },
        ],
      },
      {
        key: 'auto-electric',
        name: 'كهرباء سيارات',
        children: [
          { key: 'battery-charging', name: 'بطاريات وشحن' },
          { key: 'diagnostics', name: 'تشخيص وسكانار' },
          { key: 'alarms-tracking', name: 'إنذار وتتبع' },
        ],
      },
      {
        key: 'body-mobile-service',
        name: 'الهيكل والخدمة المتنقلة',
        children: [
          { key: 'body-paint', name: 'سمكرة ودهان' },
          { key: 'tire-service', name: 'تبديل إطارات' },
          { key: 'roadside-assistance', name: 'نجدة متنقلة' },
        ],
      },
    ],
  },
  {
    key: 'health-care',
    name: 'الصحة والرعاية',
    description: 'خدمات طبية ومساندة صحية منزلية أو داخل العيادات.',
    children: [
      {
        key: 'clinics',
        name: 'العيادات',
        children: [
          { key: 'general-medicine', name: 'طب عام' },
          { key: 'dentistry', name: 'طب أسنان' },
          { key: 'gynecology', name: 'طب نساء وتوليد' },
        ],
      },
      {
        key: 'home-healthcare',
        name: 'الرعاية المنزلية',
        children: [
          { key: 'home-nursing', name: 'تمريض منزلي' },
          { key: 'home-lab-sampling', name: 'سحب تحاليل منزلية' },
          { key: 'post-op-care', name: 'رعاية بعد العمليات' },
        ],
      },
      {
        key: 'rehab-consulting',
        name: 'التأهيل والاستشارات',
        children: [
          { key: 'physiotherapy', name: 'علاج طبيعي' },
          { key: 'nutritionist', name: 'أخصائي تغذية' },
          { key: 'psychological-support', name: 'دعم نفسي' },
        ],
      },
    ],
  },
  {
    key: 'beauty-fashion-tailoring',
    name: 'الجمال والأزياء والخياطة',
    description: 'خدمات الجمال والحلاقة والخياطة والتطريز.',
    children: [
      {
        key: 'beauty',
        name: 'الجمال',
        children: [
          { key: 'women-hair', name: 'حلاقة نسائية' },
          { key: 'makeup', name: 'مكياج' },
          { key: 'nails-beauty-care', name: 'أظافر وعناية' },
        ],
      },
      {
        key: 'barbering',
        name: 'الحلاقة الرجالية',
        children: [
          { key: 'mens-haircut', name: 'قص شعر رجالي' },
          { key: 'shave-beard', name: 'حلاقة ولحية' },
          { key: 'kids-barber', name: 'حلاقة أطفال' },
        ],
      },
      {
        key: 'tailoring-fashion',
        name: 'الخياطة والأزياء',
        children: [
          { key: 'tailoring', name: 'خياطة وتفصيل' },
          { key: 'alterations', name: 'تعديل وإصلاح ملابس' },
          { key: 'embroidery-printing', name: 'تطريز وطباعة' },
        ],
      },
    ],
  },
  {
    key: 'education-training',
    name: 'التعليم والتدريب',
    description: 'الدروس الخصوصية والتكوين المهني واللغات.',
    children: [
      {
        key: 'school-support',
        name: 'الدعم المدرسي',
        children: [
          { key: 'primary-tutoring', name: 'دروس ابتدائي' },
          { key: 'middle-school-tutoring', name: 'دروس متوسط' },
          { key: 'high-school-bac-tutoring', name: 'ثانوي وبكالوريا' },
        ],
      },
      {
        key: 'languages',
        name: 'اللغات',
        children: [
          { key: 'english-training', name: 'تعليم الإنجليزية' },
          { key: 'french-training', name: 'تعليم الفرنسية' },
          { key: 'arabic-training', name: 'تعليم العربية' },
        ],
      },
      {
        key: 'vocational-training',
        name: 'التكوين المهني',
        children: [
          { key: 'computer-skills', name: 'إعلام آلي' },
          { key: 'vocational-tailoring', name: 'خياطة وتفصيل' },
          { key: 'culinary-training', name: 'طبخ وحلويات' },
        ],
      },
    ],
  },
  {
    key: 'technology-digital',
    name: 'التقنية والرقمنة',
    description: 'الخدمات التقنية للأفراد والشركات والمنصات الرقمية.',
    children: [
      {
        key: 'device-repair',
        name: 'صيانة الأجهزة',
        children: [
          { key: 'computer-repair', name: 'صيانة حاسوب' },
          { key: 'phone-repair', name: 'صيانة هاتف' },
          { key: 'printer-repair', name: 'صيانة طابعات' },
        ],
      },
      {
        key: 'networks-systems',
        name: 'الشبكات والأنظمة',
        children: [
          { key: 'network-installation', name: 'تركيب شبكات' },
          { key: 'cctv-access-control', name: 'كاميرات وأنظمة دخول' },
          { key: 'pos-systems', name: 'نقاط بيع وأنظمة محلات' },
        ],
      },
      {
        key: 'software-development',
        name: 'تطوير البرمجيات',
        children: [
          { key: 'website-development', name: 'تطوير مواقع ويب' },
          { key: 'mobile-apps', name: 'تطوير تطبيقات موبايل' },
          { key: 'business-software', name: 'أنظمة أعمال مخصصة' },
        ],
      },
    ],
  },
  {
    key: 'marketing-creative',
    name: 'التسويق والإبداع',
    description: 'خدمات التصميم والمحتوى والترويج والإنتاج المرئي.',
    children: [
      {
        key: 'design-services',
        name: 'التصميم',
        children: [
          { key: 'branding', name: 'هوية بصرية' },
          { key: 'print-design', name: 'تصميم مطبوعات' },
          { key: 'social-design', name: 'تصاميم سوشيال ميديا' },
        ],
      },
      {
        key: 'content-media',
        name: 'المحتوى والإعلام',
        children: [
          { key: 'content-writing', name: 'كتابة محتوى' },
          { key: 'translation', name: 'ترجمة' },
          { key: 'data-entry', name: 'إدخال بيانات' },
        ],
      },
      {
        key: 'photo-promo',
        name: 'التصوير والترويج',
        children: [
          { key: 'photography', name: 'تصوير فوتوغرافي' },
          { key: 'video-editing', name: 'فيديو ومونتاج' },
          { key: 'paid-ads', name: 'إعلانات ممولة' },
        ],
      },
    ],
  },
  {
    key: 'business-professional',
    name: 'الأعمال والخدمات المهنية',
    description: 'خدمات الشركات الناشئة والمؤسسات والمهنيين.',
    children: [
      {
        key: 'accounting',
        name: 'المحاسبة',
        children: [
          { key: 'bookkeeping', name: 'مسك حسابات' },
          { key: 'tax-filing', name: 'تصريحات ضريبية' },
          { key: 'payroll', name: 'أجور ورواتب' },
        ],
      },
      {
        key: 'legal-admin',
        name: 'القانونية والإدارية',
        children: [
          { key: 'legal-consulting', name: 'استشارات قانونية' },
          { key: 'contracts-documents', name: 'عقود ووثائق' },
          { key: 'company-formation', name: 'إنشاء شركات' },
        ],
      },
      {
        key: 'consulting-hr',
        name: 'الاستشارات والتوظيف',
        children: [
          { key: 'feasibility-studies', name: 'دراسات جدوى' },
          { key: 'recruitment', name: 'توظيف' },
          { key: 'sales-consulting', name: 'تطوير مبيعات' },
        ],
      },
    ],
  },
  {
    key: 'events-hospitality',
    name: 'المناسبات والضيافة',
    description: 'تنظيم الفعاليات والتموين والتجهيز والتغطية الإعلامية.',
    children: [
      {
        key: 'event-planning',
        name: 'التنظيم',
        children: [
          { key: 'wedding-planning', name: 'تنظيم أعراس' },
          { key: 'corporate-events', name: 'فعاليات شركات' },
          { key: 'private-events', name: 'أعياد ومناسبات خاصة' },
        ],
      },
      {
        key: 'catering',
        name: 'التموين',
        children: [
          { key: 'event-catering', name: 'تموين حفلات' },
          { key: 'pastry-desserts', name: 'حلويات ومخبوزات' },
          { key: 'ready-meals', name: 'وجبات جاهزة' },
        ],
      },
      {
        key: 'event-setup-media',
        name: 'التجهيز والتغطية',
        children: [
          { key: 'event-decor', name: 'ديكور حفلات' },
          { key: 'sound-lighting', name: 'صوت وإضاءة' },
          { key: 'event-photography', name: 'تصوير مناسبات' },
        ],
      },
    ],
  },
  {
    key: 'agriculture-environment',
    name: 'الزراعة والبيئة',
    description: 'خدمات فلاحية وبيئية وصناعية خفيفة.',
    children: [
      {
        key: 'agriculture-services',
        name: 'الخدمات الفلاحية',
        children: [
          { key: 'plowing-planting', name: 'حرث وزراعة' },
          { key: 'drip-irrigation', name: 'سقي بالتنقيط' },
          { key: 'greenhouses', name: 'بيوت بلاستيكية' },
        ],
      },
      {
        key: 'landscaping',
        name: 'الحدائق والمساحات',
        children: [
          { key: 'garden-design', name: 'تنسيق حدائق' },
          { key: 'pruning-mowing', name: 'قص وتشذيب' },
          { key: 'green-space-maintenance', name: 'صيانة المساحات' },
        ],
      },
      {
        key: 'environment-industrial',
        name: 'البيئة والخدمات الصناعية',
        children: [
          { key: 'waste-removal', name: 'رفع نفايات' },
          { key: 'welding-maintenance', name: 'لحام وصيانة' },
          { key: 'equipment-rental', name: 'تأجير معدات' },
        ],
      },
    ],
  },
];

const seedAdmin = async () => {
  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { email: ADMIN_EMAIL } });
  const passwordHash = await HashService.hashPassword(ADMIN_PASSWORD);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.firstName = 'Platform';
    existing.lastName = 'Admin';
    existing.role = UserRole.ADMIN;
    existing.isActive = true;
    existing.emailVerified = true;
    existing.phoneVerified = false;
    existing.phoneNumber = null;
    await userRepo.save(existing);
    return existing;
  }

  const admin = userRepo.create({
    email: ADMIN_EMAIL,
    passwordHash,
    firstName: 'Platform',
    lastName: 'Admin',
    role: UserRole.ADMIN,
    isActive: true,
    emailVerified: true,
    phoneVerified: false,
    phoneNumber: null,
  });

  await userRepo.save(admin);
  return admin;
};

const upsertRegion = async (seed: RegionSeed, displayOrder: number) => {
  const regionRepo = AppDataSource.getRepository(Region);
  let region = await regionRepo.findOne({ where: { slug: seed.slug } });

  if (!region) {
    region = regionRepo.create({
      name: seed.name,
      slug: seed.slug,
      code: seed.code,
      displayOrder,
      isActive: true,
    });
  } else {
    region.name = seed.name;
    region.code = seed.code;
    region.displayOrder = displayOrder;
    region.isActive = true;
  }

  return regionRepo.save(region);
};

const upsertWilaya = async (seed: WilayaSeed, regionId: string, displayOrder: number) => {
  const wilayaRepo = AppDataSource.getRepository(Wilaya);
  let wilaya = await wilayaRepo.findOne({ where: { slug: seed.slug } });

  if (!wilaya) {
    wilaya = wilayaRepo.create({
      regionId,
      name: seed.name,
      slug: seed.slug,
      code: seed.code,
      displayOrder,
      isActive: true,
    });
  } else {
    wilaya.regionId = regionId;
    wilaya.name = seed.name;
    wilaya.code = seed.code;
    wilaya.displayOrder = displayOrder;
    wilaya.isActive = true;
  }

  return wilayaRepo.save(wilaya);
};

const seedGeography = async () => {
  for (const [regionIndex, regionSeed] of MARKET_REGIONS.entries()) {
    const region = await upsertRegion(regionSeed, regionIndex + 1);

    for (const [wilayaIndex, wilayaSeed] of regionSeed.wilayas.entries()) {
      await upsertWilaya(wilayaSeed, region.id, wilayaIndex + 1);
    }
  }
};

const upsertCategoryNode = async (
  node: CategoryNode,
  pathKeys: string[] = [],
  parentId: string | null = null
) => {
  const categoryRepo = AppDataSource.getRepository(Category);
  const slug = [...pathKeys, node.key].join('-');
  let category = await categoryRepo.findOne({ where: { slug } });

  if (!category) {
    category = categoryRepo.create({
      name: node.name,
      slug,
      description: node.description || null,
      iconUrl: null,
      parentId,
    });
  } else {
    category.name = node.name;
    category.description = node.description || null;
    category.parentId = parentId;
  }

  const savedCategory = await categoryRepo.save(category);

  for (const child of node.children || []) {
    await upsertCategoryNode(child, [...pathKeys, node.key], savedCategory.id);
  }
};

const seedCategories = async () => {
  for (const rootNode of CATEGORY_TREE) {
    await upsertCategoryNode(rootNode);
  }
};

const summarize = async () => {
  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const regionRepo = AppDataSource.getRepository(Region);
  const wilayaRepo = AppDataSource.getRepository(Wilaya);

  const [users, categories, regions, wilayas] = await Promise.all([
    userRepo.count(),
    categoryRepo.count(),
    regionRepo.count(),
    wilayaRepo.count(),
  ]);

  return { users, categories, regions, wilayas };
};

const main = async () => {
  await initializeDatabase();

  try {
    const admin = await seedAdmin();
    await seedGeography();
    await seedCategories();
    const summary = await summarize();

    console.log(
      JSON.stringify(
        {
          admin: {
            email: admin.email,
            role: admin.role,
            temporaryPassword: ADMIN_PASSWORD,
          },
          summary,
        },
        null,
        2
      )
    );
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

void main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
