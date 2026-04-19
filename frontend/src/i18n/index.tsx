import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'ar' | 'fr' | 'en';

export interface LanguageMeta {
  code: AppLanguage;
  label: string;
  locale: string;
  dir: 'rtl' | 'ltr';
}

export const LANGUAGE_META: Record<AppLanguage, LanguageMeta> = {
  ar: {
    code: 'ar',
    label: 'العربية',
    locale: 'ar-DZ',
    dir: 'rtl',
  },
  fr: {
    code: 'fr',
    label: 'Français',
    locale: 'fr-FR',
    dir: 'ltr',
  },
  en: {
    code: 'en',
    label: 'English',
    locale: 'en-GB',
    dir: 'ltr',
  },
};

LANGUAGE_META.ar.label = 'العربية';
LANGUAGE_META.fr.label = 'Français';

const STORAGE_KEY = 'psp_language';
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;
const originalTextNodeValues = new WeakMap<Text, string>();
const originalAttributeValues = new WeakMap<Element, Map<string, string>>();

const TRANSLATIONS: Record<'ar' | 'fr', Record<string, string>> = {
  ar: {
    Language: 'اللغة',
    Overview: 'نظرة عامة',
    Explore: 'استكشاف',
    Messages: 'الرسائل',
    Requests: 'الطلبات',
    Favorites: 'المفضلة',
    Notifications: 'الإشعارات',
    Reviews: 'التقييمات',
    Subscription: 'الاشتراك',
    Profile: 'الملف الشخصي',
    Services: 'الخدمات',
    Portfolio: 'معرض الأعمال',
    Plans: 'الباقات',
    Settings: 'الإعدادات',
    Users: 'المستخدمون',
    Providers: 'المزودون',
    Categories: 'التصنيفات',
    Regions: 'الجهات',
    Reports: 'التقارير',
    Content: 'المحتوى',
    Reviewers: 'المراجعون',
    History: 'السجل',
    Inbox: 'صندوق الوارد',
    Dashboard: 'لوحة التحكم',
    Alerts: 'التنبيهات',
    Review: 'مراجعة',
    Approved: 'مقبول',
    Pending: 'معلق',
    Rejected: 'مرفوض',
    Suspended: 'معلّق',
    Active: 'نشط',
    Inactive: 'غير نشط',
    Customer: 'زبون',
    Reviewer: 'مراجع',
    Admin: 'إدارة',
    'Service provider': 'مزود خدمة',
    'Customer Workspace': 'مساحة الزبون',
    'Provider Workspace': 'مساحة المزود',
    'Reviewer Workspace': 'مساحة المراجع',
    'Admin Workspace': 'مساحة الإدارة',
    'Signed In': 'تم تسجيل الدخول',
    'Go To Overview': 'اذهب إلى النظرة العامة',
    'Open Marketplace': 'افتح السوق',
    'Sign Out': 'تسجيل الخروج',
    'Trusted local professionals': 'محترفون محليون موثوقون',
    'Become a Provider': 'كن مزودًا',
    'My Dashboard': 'لوحتي',
    'Discovery mode': 'وضع الاستكشاف',
    'Growth operations': 'تشغيل النمو',
    'Moderation queue': 'طابور المراجعة',
    'Operations desk': 'مكتب التشغيل',
    'Customer priorities': 'أولويات الزبون',
    'Provider priorities': 'أولويات المزود',
    'Reviewer priorities': 'أولويات المراجع',
    'Admin priorities': 'أولويات الإدارة',
    'Explore faster': 'استكشف بسرعة',
    'Keep trusted providers close': 'احتفظ بالمزودين الموثوقين قريبًا',
    'Convert chats into requests': 'حوّل المحادثات إلى طلبات',
    'Answer fast': 'أجب بسرعة',
    'Publish stronger proof of work': 'اعرض نماذج عمل أقوى',
    'Convert leads into booked work': 'حوّل العملاء المحتملين إلى أعمال مؤكدة',
    'Clear decisions': 'قرارات واضحة',
    'Low queue time': 'زمن انتظار منخفض',
    'Reliable moderation notes': 'ملاحظات مراجعة موثوقة',
    'Clear pending queue': 'تصفية الطابور المعلق',
    'Watch trust signals': 'مراقبة إشارات الثقة',
    'Keep discovery clean': 'الحفاظ على الاستكشاف نظيفًا',
    'Pending Reviews': 'المراجعات المعلقة',
    'Review Inbox': 'صندوق المراجعة',
    'Pending reviews': 'المراجعات المعلقة',
    'Public home': 'الصفحة العامة',
    'Your conversations': 'محادثاتك',
    'Shared inbox': 'صندوق الوارد المشترك',
    'No conversations yet. Start a message from a provider profile.':
      'لا توجد محادثات بعد. ابدأ رسالة من صفحة المزود.',
    'No customer conversations have arrived yet.': 'لم تصل أي محادثات من الزبائن بعد.',
    'No messages in this conversation yet.': 'لا توجد رسائل في هذه المحادثة بعد.',
    'No messages in this thread yet.': 'لا توجد رسائل في هذا الخيط بعد.',
    'Write your message here...': 'اكتب رسالتك هنا...',
    'Write your reply to the customer...': 'اكتب ردك على الزبون...',
    'Loading conversations...': 'جار تحميل المحادثات...',
    'Loading inbox...': 'جار تحميل صندوق الوارد...',
    'Loading messages...': 'جار تحميل الرسائل...',
    'Select a conversation from the list to open the thread.':
      'اختر محادثة من القائمة لفتح الخيط.',
    'Select a conversation to review the context and reply.':
      'اختر محادثة لمراجعة السياق والرد.',
    Messaging: 'الرسائل',
    Workspace: 'مساحة العمل',
    'Select a conversation': 'اختر محادثة',
    'Service conversation': 'محادثة خدمة',
    'No messages yet.': 'لا توجد رسائل بعد.',
    'General conversation': 'محادثة عامة',
    Verified: 'موثّق',
    unread: 'غير مقروء',
    thread: 'خيط',
    threads: 'خيوط',
    'Press Enter to send. Use Shift + Enter for a new line.':
      'اضغط Enter للإرسال واستخدم Shift + Enter لسطر جديد.',
    Send: 'إرسال',
    'Sending...': 'جار الإرسال...',
    'Generate AI draft': 'إنشاء مسودة بالذكاء الاصطناعي',
    'Preparing reply...': 'جار تجهيز الرد...',
    'AI Assistant': 'المساعد الذكي',
    'Reply helper': 'مساعد الرد',
    'Select a conversation first to generate a reply grounded in your services.':
      'اختر محادثة أولًا لإنشاء رد مبني على خدماتك.',
    'Generate an AI draft to create a first reply you can edit before sending.':
      'أنشئ مسودة بالذكاء الاصطناعي لتوليد رد أولي يمكنك تعديله قبل الإرسال.',
    'Closest services': 'أقرب الخدمات',
    'No direct service match was found, but the suggested reply is still available.':
      'لم يتم العثور على خدمة مطابقة مباشرة، لكن الرد المقترح ما زال متاحًا.',
    'Price on request': 'السعر عند الطلب',
    'Suggested reply': 'الرد المقترح',
    'Send suggested reply': 'إرسال الرد المقترح',
    'Opening the conversation with this provider...': 'جار فتح المحادثة مع هذا المزود...',
    'Review Threads': 'خيوط المراجعة',
    'Admin review inbox': 'صندوق مراجعة الإدارة',
    'Reviewer inbox': 'صندوق المراجع',
    'Discovery taxonomy': 'هيكل التصنيفات',
    'Shape how customers browse the marketplace': 'شكّل طريقة تصفح الزبائن للسوق',
    'Categories are not static labels. They control the search structure, provider onboarding, and how clean the marketplace feels when users browse services.':
      'التصنيفات ليست مجرد أسماء ثابتة، بل تتحكم في هيكل البحث وتسجيل المزودين ومدى نظافة تجربة التصفح.',
    'Category set': 'مجموعة التصنيفات',
    'Primary groups': 'الفئات الرئيسية',
    'Nested branches': 'الفروع المتداخلة',
    Documented: 'الموثقة',
    'Total categories shaping the public marketplace taxonomy.':
      'إجمالي التصنيفات التي تشكل هيكل السوق العام.',
    'Top-level categories used as the discovery backbone.':
      'التصنيفات العليا المستخدمة كأساس الاستكشاف.',
    'Child categories adding precision inside each service family.':
      'التصنيفات الفرعية التي تضيف دقة داخل كل عائلة خدمات.',
    'Categories that already include descriptive guidance.':
      'التصنيفات التي تحتوي بالفعل على وصف إرشادي.',
    'Create main category': 'إنشاء تصنيف رئيسي',
    'Create subcategory': 'إنشاء تصنيف فرعي',
    'Edit category': 'تعديل التصنيف',
    'Manage roots and branches from one workspace': 'أدر الفئات الرئيسية والفروع من مساحة واحدة',
    'Use the main-category action for high-level discovery sections, then add child categories directly inside each card.':
      'استخدم إجراء الفئة الرئيسية لإنشاء أقسام الاستكشاف العليا، ثم أضف الفروع داخل كل بطاقة.',
    'Category name': 'اسم التصنيف',
    Slug: 'المعرّف',
    Description: 'الوصف',
    'Create root': 'إنشاء رئيسي',
    'Save changes': 'حفظ التغييرات',
    'Reset form': 'إعادة تعيين',
    'Main category': 'تصنيف رئيسي',
    'Subcategory under': 'تصنيف فرعي تحت',
    'Add subcategory': 'إضافة تصنيف فرعي',
    'Add nested category': 'إضافة تصنيف متداخل',
    Edit: 'تعديل',
    Delete: 'حذف',
    'No description has been added yet.': 'لم تتم إضافة وصف بعد.',
    'Generate slug': 'توليد المعرّف',
    Refresh: 'تحديث',
    'No categories exist yet. Create the first main category.':
      'لا توجد تصنيفات بعد. أنشئ أول تصنيف رئيسي.',
    Cancel: 'إلغاء',
    'Customer Overview': 'نظرة عامة للزبون',
    'Explore Providers': 'استكشاف المزودين',
    'Provider Overview': 'نظرة عامة للمزود',
    'Reviewer Overview': 'نظرة عامة للمراجع',
    'Admin Overview': 'نظرة عامة للإدارة',
    'Review History': 'سجل المراجعة',
    'Provider Review': 'مراجعة المزود',
    'Plan and Visibility': 'الباقة والظهور',
    'Content Moderation': 'مراجعة المحتوى',
    'Track requests, favorites, messages, and next actions in one place.':
      'تابع الطلبات والمفضلة والرسائل والخطوات التالية في مكان واحد.',
    'Search providers by category, location, and quality signals.':
      'ابحث عن المزودين حسب التصنيف والموقع وإشارات الجودة.',
    'Continue conversations and move directly from chat to request.':
      'واصل المحادثات وانتقل مباشرة من الدردشة إلى الطلب.',
    'Monitor business health, moderation status, and growth signals.':
      'راقب صحة النشاط وحالة المراجعة ومؤشرات النمو.',
    'Review provider submissions with clarity, consistency, and defensible decisions.':
      'راجع ملفات المزودين بوضوح واتساق وقرارات يمكن الدفاع عنها.',
    'Monitor marketplace health, moderation volume, and growth signals.':
      'راقب صحة السوق وحجم المراجعة ومؤشرات النمو.',
    'Handle review assignments, context exchange, and decisions in one thread view.':
      'أدر تكليفات المراجعة وتبادل السياق والقرارات من عرض خيط واحد.',
    'Send cases to reviewers, discuss profiles, and receive decisions in-thread.':
      'أرسل الحالات إلى المراجعين وناقش الملفات واستقبل القرارات داخل الخيط.',
    'Maintain marketplace taxonomy and discovery structure.':
      'حافظ على هيكل التصنيفات وبنية الاستكشاف في السوق.',
    'Control provider status, verification, and featured visibility.':
      'تحكم في حالة المزود والتوثيق والظهور المميز.',
    'Search users, update activation state, and manage role assignments.':
      'ابحث عن المستخدمين وحدّث حالة التفعيل وأدر الصلاحيات.',
  },
  fr: {
    Language: 'Langue',
    Overview: 'Vue générale',
    Explore: 'Explorer',
    Messages: 'Messages',
    Requests: 'Demandes',
    Favorites: 'Favoris',
    Notifications: 'Notifications',
    Reviews: 'Avis',
    Subscription: 'Abonnement',
    Profile: 'Profil',
    Services: 'Services',
    Portfolio: 'Portfolio',
    Plans: 'Plans',
    Settings: 'Paramètres',
    Users: 'Utilisateurs',
    Providers: 'Prestataires',
    Categories: 'Catégories',
    Regions: 'Régions',
    Reports: 'Rapports',
    Content: 'Contenu',
    Reviewers: 'Relecteurs',
    History: 'Historique',
    Inbox: 'Boîte de réception',
    Dashboard: 'Tableau de bord',
    Alerts: 'Alertes',
    Review: 'Revoir',
    Approved: 'Approuvé',
    Pending: 'En attente',
    Rejected: 'Rejeté',
    Suspended: 'Suspendu',
    Active: 'Actif',
    Inactive: 'Inactif',
    Customer: 'Client',
    Reviewer: 'Relecteur',
    Admin: 'Admin',
    'Service provider': 'Prestataire de service',
    'Customer Workspace': 'Espace client',
    'Provider Workspace': 'Espace prestataire',
    'Reviewer Workspace': 'Espace relecteur',
    'Admin Workspace': 'Espace admin',
    'Signed In': 'Connecté',
    'Go To Overview': "Aller à la vue d'ensemble",
    'Open Marketplace': 'Ouvrir la marketplace',
    'Sign Out': 'Se déconnecter',
    'Trusted local professionals': 'Professionnels locaux de confiance',
    'Become a Provider': 'Devenir prestataire',
    'My Dashboard': 'Mon tableau de bord',
    'Review Inbox': 'Boîte de revue',
    'Pending reviews': 'Revues en attente',
    'Public home': 'Accueil public',
    'Your conversations': 'Vos conversations',
    'Shared inbox': 'Boîte partagée',
    Messaging: 'Messagerie',
    Workspace: 'Espace de travail',
    'Select a conversation': 'Sélectionnez une conversation',
    'Service conversation': 'Conversation de service',
    'No messages yet.': 'Aucun message pour le moment.',
    'General conversation': 'Conversation générale',
    Verified: 'Vérifié',
    unread: 'non lu',
    thread: 'fil',
    threads: 'fils',
    Send: 'Envoyer',
    'Sending...': 'Envoi...',
    'Generate AI draft': 'Générer un brouillon IA',
    'Preparing reply...': 'Préparation de la réponse...',
    'AI Assistant': 'Assistant IA',
    'Reply helper': 'Assistant de réponse',
    'Closest services': 'Services les plus proches',
    'Price on request': 'Prix sur demande',
    'Suggested reply': 'Réponse suggérée',
    'Send suggested reply': 'Envoyer la réponse suggérée',
    'Admin review inbox': "Boîte de revue de l'administration",
    'Reviewer inbox': 'Boîte du relecteur',
    'Create main category': 'Créer une catégorie principale',
    'Create subcategory': 'Créer une sous-catégorie',
    'Edit category': 'Modifier la catégorie',
    'Category name': 'Nom de la catégorie',
    Slug: 'Slug',
    Description: 'Description',
    'Create root': 'Créer la racine',
    'Save changes': 'Enregistrer',
    'Reset form': 'Réinitialiser',
    'Main category': 'Catégorie principale',
    'Add subcategory': 'Ajouter une sous-catégorie',
    'Add nested category': 'Ajouter une catégorie imbriquée',
    Edit: 'Modifier',
    Delete: 'Supprimer',
    'Generate slug': 'Générer le slug',
    Refresh: 'Actualiser',
    Cancel: 'Annuler',
  },
};

Object.assign(TRANSLATIONS.ar, {
  'Customer home is unavailable.': 'الصفحة الرئيسية للزبون غير متاحة.',
  'No customer feed data is available yet.': 'لا توجد بيانات متاحة لواجهة الزبون بعد.',
  'Live marketplace view': 'عرض حي للسوق',
  'Browse real businesses, recent works, and public trust signals before you engage':
    'تصفح الأعمال الحقيقية وأحدث النماذج وإشارات الثقة العامة قبل أن تبدأ.',
  'This workspace behaves like a living marketplace. Provider imagery, portfolio media, and recent customer reviews are visible first so every next step feels grounded.':
    'هذه المساحة تعمل كسوق حي. صور المزودين ووسائط المعرض وآخر تقييمات الزبائن تظهر أولًا حتى تكون الخطوة التالية مبنية على سياق واضح.',
  'Explore providers': 'استكشف المزودين',
  'Open messages': 'افتح الرسائل',
  'My requests': 'طلباتي',
  'Featured business': 'نشاط مميز',
  'Professional services': 'خدمات مهنية',
  'Live works': 'أعمال حية',
  'Media posts make the marketplace feel current and trustworthy.':
    'المنشورات المرئية تجعل السوق حيًا وأكثر موثوقية.',
  'Verified providers': 'مزودون موثقون',
  'Moderation and reviews push stronger businesses higher in the flow.':
    'المراجعة والتقييمات ترفع الأعمال الأقوى في الظهور.',
  'Fast conversion': 'تحويل سريع',
  'Move from profile to chat or request without losing context.':
    'انتقل من الملف إلى المحادثة أو الطلب دون فقدان السياق.',
  'Visible providers': 'مزودون ظاهرون',
  'Businesses with identity, location, and trust signals ready for action.':
    'أعمال لها هوية وموقع وإشارات ثقة جاهزة للتعامل.',
  'Recent images and videos showing what providers are actively publishing.':
    'صور وفيديوهات حديثة تُظهر ما ينشره المزودون الآن.',
  'Recent review signals': 'إشارات تقييم حديثة',
  'Public customer feedback that keeps the marketplace feeling alive.':
    'ملاحظات عامة من الزبائن تبقي السوق حيًا.',
  'Marketplace is active now': 'السوق نشط الآن',
  'Works, businesses, and public interaction are visible together.':
    'الأعمال والأنشطة والتفاعل العام تظهر معًا.',
  'Provider dashboard unavailable.': 'لوحة المزود غير متاحة.',
  'Provider dashboard data is not available.': 'بيانات لوحة المزود غير متاحة.',
  'Location not completed': 'الموقع غير مكتمل',
  'Provider cockpit': 'مقصورة المزود',
  'Under review': 'قيد المراجعة',
  'Provider account': 'حساب المزود',
  'Update profile': 'تحديث الملف',
  'Manage services': 'إدارة الخدمات',
  'Open inbox': 'فتح الصندوق',
  'Profile completion': 'اكتمال الملف',
  Plan: 'الباقة',
  'Response time': 'زمن الرد',
  'Avg. rating': 'متوسط التقييم',
  'Total services': 'إجمالي الخدمات',
  'Overall service inventory in your workspace.': 'إجمالي مخزون الخدمات داخل مساحة عملك.',
  Published: 'منشور',
  'Services currently visible to customers.': 'الخدمات الظاهرة حاليًا للزبائن.',
  Featured: 'مميز',
  'Services with boosted visibility or premium positioning.':
    'الخدمات ذات الظهور المعزز أو التموضع المميز.',
  'Public reviews that affect trust and discovery ranking.':
    'التقييمات العامة التي تؤثر على الثقة وترتيب الاستكشاف.',
  'Operational priorities': 'أولويات التشغيل',
  'Complete public profile': 'أكمل الملف العام',
  'Grow live services': 'نمّ الخدمات الحية',
  'Stay responsive': 'حافظ على سرعة الرد',
  'Admin dashboard unavailable.': 'لوحة الإدارة غير متاحة.',
  'Admin dashboard data is not available.': 'بيانات لوحة الإدارة غير متاحة.',
  'Marketplace control overview': 'نظرة عامة على التحكم في السوق',
  'Operations dashboard': 'لوحة التشغيل',
  'This view is for queue control, trust supervision, and supply-demand balance. It is not a marketing dashboard. It should tell you what needs action now and where the marketplace may start drifting.':
    'هذه الواجهة مخصصة للتحكم في الطوابير ومراقبة الثقة وتوازن العرض والطلب. ليست لوحة تسويق، بل يجب أن تخبرك بما يحتاج إلى إجراء الآن وأين قد يبدأ السوق في الانحراف.',
  Customers: 'الزبائن',
  'Provider users': 'حسابات المزودين',
  Admins: 'الإداريون',
  'Pending moderation': 'مراجعة معلقة',
  'Providers waiting for a moderation decision.': 'مزودون ينتظرون قرار مراجعة.',
  'Approved providers': 'مزودون مقبولون',
  'Supply currently visible in the marketplace.': 'العرض الظاهر حاليًا في السوق.',
  'Open demand': 'طلب مفتوح',
  'Customer requests currently flowing through the platform.':
    'طلبات الزبائن الجارية حاليًا عبر المنصة.',
  'Total accounts': 'إجمالي الحسابات',
  'All user accounts across customer, provider, reviewer, and admin roles.':
    'كل الحسابات عبر أدوار الزبون والمزود والمراجع والإدارة.',
  'Provider review queue': 'طابور مراجعة المزودين',
  'Clear backlog before it affects supply freshness.':
    'صفّ التراكم قبل أن يؤثر في حداثة العرض.',
  'Content watch': 'مراقبة المحتوى',
  'Public comments currently visible in the marketplace.':
    'التعليقات العامة الظاهرة حاليًا في السوق.',
  'Reviewer capacity': 'سعة المراجعين',
  'Reviewers available to absorb incoming moderation load.':
    'المراجعون المتاحون لاستيعاب حمل المراجعة القادم.',
  'Action queue': 'طابور الإجراء',
  'Latest provider intake': 'أحدث دخول المزودين',
  'Newly created provider accounts entering the moderation workflow.':
    'حسابات مزودين أُنشئت حديثًا ودخلت مسار المراجعة.',
  'Open provider desk': 'افتح مكتب المزودين',
  'No provider intake items are available right now.': 'لا توجد عناصر دخول مزودين متاحة الآن.',
  'Verification pending': 'التوثيق معلق',
});

Object.assign(TRANSLATIONS.fr, {
  'Customer home is unavailable.': 'La page d’accueil client est indisponible.',
  'No customer feed data is available yet.': 'Aucune donnée client n’est encore disponible.',
  'Live marketplace view': 'Vue vivante de la marketplace',
  'Explore providers': 'Explorer les prestataires',
  'Open messages': 'Ouvrir les messages',
  'My requests': 'Mes demandes',
  'Featured business': 'Entreprise mise en avant',
  'Professional services': 'Services professionnels',
  'Live works': 'Travaux en direct',
  'Verified providers': 'Prestataires vérifiés',
  'Fast conversion': 'Conversion rapide',
  'Visible providers': 'Prestataires visibles',
  'Recent review signals': 'Signaux d’avis récents',
  'Marketplace is active now': 'La marketplace est active maintenant',
  'Provider dashboard unavailable.': 'Le tableau prestataire est indisponible.',
  'Provider dashboard data is not available.':
    'Les données du tableau prestataire ne sont pas disponibles.',
  'Location not completed': 'Localisation incomplète',
  'Provider cockpit': 'Cockpit prestataire',
  'Under review': 'En cours de revue',
  'Provider account': 'Compte prestataire',
  'Update profile': 'Mettre à jour le profil',
  'Manage services': 'Gérer les services',
  'Open inbox': 'Ouvrir la boîte',
  'Profile completion': 'Profil complété',
  Plan: 'Plan',
  'Response time': 'Temps de réponse',
  'Avg. rating': 'Note moyenne',
  'Total services': 'Total des services',
  Published: 'Publié',
  Featured: 'Mis en avant',
  'Operational priorities': 'Priorités opérationnelles',
  'Admin dashboard unavailable.': 'Le tableau admin est indisponible.',
  'Admin dashboard data is not available.': 'Les données du tableau admin ne sont pas disponibles.',
  'Marketplace control overview': 'Vue de contrôle de la marketplace',
  'Operations dashboard': 'Tableau des opérations',
  Customers: 'Clients',
  'Provider users': 'Utilisateurs prestataires',
  Admins: 'Admins',
  'Pending moderation': 'Modération en attente',
  'Approved providers': 'Prestataires approuvés',
  'Open demand': 'Demande ouverte',
  'Total accounts': 'Comptes totaux',
  'Provider review queue': 'File de revue prestataires',
  'Content watch': 'Surveillance du contenu',
  'Reviewer capacity': 'Capacité des relecteurs',
  'Action queue': 'File d’action',
  'Latest provider intake': 'Derniers prestataires entrants',
  'Open provider desk': 'Ouvrir le bureau prestataires',
  'Verification pending': 'Vérification en attente',
});

Object.assign(TRANSLATIONS.ar, {
  Language: 'اللغة',
  Explore: 'استكشاف',
  Messages: 'الرسائل',
  Requests: 'الطلبات',
  Favorites: 'المفضلة',
  Notifications: 'الإشعارات',
  Reviews: 'التقييمات',
  Subscription: 'الاشتراك',
  Profile: 'الملف الشخصي',
  Portfolio: 'معرض الأعمال',
  Dashboard: 'لوحة التحكم',
  Inbox: 'صندوق الوارد',
  History: 'السجل',
  Providers: 'المزودون',
  Categories: 'التصنيفات',
  Regions: 'الجهات',
  Reports: 'التقارير',
  Content: 'المحتوى',
  Settings: 'الإعدادات',
  Reviewers: 'المراجعون',
  Alerts: 'التنبيهات',
  All: 'الكل',
  Unread: 'غير مقروء',
  Read: 'مقروء',
  New: 'جديد',
  Approved: 'مقبول',
  Pending: 'معلّق',
  Rejected: 'مرفوض',
  Suspended: 'معلّق',
  Published: 'منشور',
  Featured: 'مميز',
  Active: 'نشط',
  Closed: 'مغلق',
  Accepted: 'مقبول',
  Cancelled: 'ملغى',
  Completed: 'مكتمل',
  Reviewed: 'تمت المراجعة',
  'Quote sent': 'تم إرسال العرض',
  'In progress': 'قيد التنفيذ',
  Unknown: 'غير معروف',
  Available: 'متاح',
  Enabled: 'مفعّل',
  Discovery: 'الاكتشاف',
  Core: 'أساسي',
  Included: 'مضمن',
  Enhanced: 'محسّن',
  Standard: 'قياسي',
  FREE: 'مجاني',
  PREMIUM: 'مميز',
  BASIC: 'أساسي',
  PRO: 'احترافي',
  BUSINESS: 'أعمال',
  Algeria: 'الجزائر',
});

Object.assign(TRANSLATIONS.ar, {
  'Customer notification center': 'مركز إشعارات الزبون',
  'Provider activity center': 'مركز نشاط المزود',
  'Needs attention now': 'يحتاج إلى انتباه الآن',
  'Mark all as read': 'تعيين الكل كمقروء',
  'Open related item': 'افتح العنصر المرتبط',
  'Open related workflow': 'افتح المسار المرتبط',
  'Informational notification': 'إشعار معلوماتي',
  'Operational notification': 'إشعار تشغيلي',
  'Total notifications': 'إجمالي الإشعارات',
  'Unread items': 'العناصر غير المقروءة',
  'Request updates': 'تحديثات الطلبات',
  'Message updates': 'تحديثات الرسائل',
  'Loading notifications...': 'جار تحميل الإشعارات...',
  'Failed to load notifications.': 'تعذر تحميل الإشعارات.',
  'Failed to open the notification.': 'تعذر فتح الإشعار.',
  'Failed to update notifications.': 'تعذر تحديث الإشعارات.',
  'There are no notifications in this filter right now.':
    'لا توجد إشعارات ضمن هذا الفلتر حاليًا.',
  'There are no provider notifications in this filter right now.':
    'لا توجد إشعارات للمزود ضمن هذا الفلتر حاليًا.',
  'Local-first Algerian discovery': 'اكتشاف جزائري محلي أولاً',
  'Search providers with local precision': 'ابحث عن المزودين بدقة محلية',
  'Search by service, skill, or category': 'ابحث حسب الخدمة أو المهارة أو التصنيف',
  'City / Commune / Locality': 'المدينة / البلدية / الحي',
  'All Algeria': 'كل الجزائر',
  'All categories': 'كل التصنيفات',
  'Any service need': 'أي حاجة خدمية',
  'Available now': 'متاح الآن',
  'Featured first': 'المميزون أولاً',
  'Verified first': 'الموثقون أولاً',
  'Highest rated': 'الأعلى تقييمًا',
  'Keep only the main category': 'احتفظ بالفئة الرئيسية فقط',
  'No subcategories under this main category': 'لا توجد فئات فرعية تحت هذه الفئة الرئيسية',
  'Move quickly from search to trust, then from conversation to request.':
    'انتقل سريعًا من البحث إلى الثقة ثم من المحادثة إلى الطلب.',
  'Service cards ready for conversion': 'بطاقات خدمات جاهزة للتحويل',
  'These offers already have price, category, and provider context to reduce hesitation.':
    'هذه العروض تتضمن السعر والتصنيف وسياق المزود لتقليل التردد.',
  'Failed to load the customer home feed.': 'تعذر تحميل الواجهة الرئيسية للزبون.',
  'Price based on scope': 'السعر حسب نطاق العمل',
  'Open provider profile': 'افتح ملف المزود',
  'Public customer review': 'تقييم زبون عام',
  'A rating was submitted without written feedback.': 'تم إرسال تقييم دون تعليق مكتوب.',
  'No recent review highlights are visible right now.':
    'لا توجد أبرز تقييمات حديثة ظاهرة حاليًا.',
  'No portfolio media is visible right now.': 'لا توجد وسائط معرض ظاهرة حاليًا.',
  'No featured services are available right now.': 'لا توجد خدمات مميزة متاحة حاليًا.',
  'Image work': 'عمل بصري',
  'Video work': 'عمل فيديو',
  'General services': 'خدمات عامة',
});

Object.assign(TRANSLATIONS.ar, {
  'All requests': 'كل الطلبات',
  'Every service request and quote connected to your account.':
    'كل طلب خدمة وعرض سعر مرتبط بحسابك.',
  'Quotes received': 'العروض المستلمة',
  'Requests currently waiting for your approval or rejection.':
    'طلبات تنتظر موافقتك أو رفضك حاليًا.',
  'Active requests': 'الطلبات النشطة',
  'Requests currently open or already moving into execution.':
    'طلبات ما زالت مفتوحة أو دخلت التنفيذ بالفعل.',
  'Closed requests': 'الطلبات المغلقة',
  'Completed, cancelled, or rejected requests.': 'طلبات مكتملة أو ملغاة أو مرفوضة.',
  'Completed, rejected, or cancelled requests.': 'طلبات مكتملة أو مرفوضة أو ملغاة.',
  'Your requests': 'طلباتك',
  'Loading requests...': 'جار تحميل الطلبات...',
  'No requests match this filter right now.': 'لا توجد طلبات تطابق هذا الفلتر حاليًا.',
  'Service request': 'طلب خدمة',
  'No specific service': 'لا توجد خدمة محددة',
  'Request summary': 'ملخص الطلب',
  'Expected budget': 'الميزانية المتوقعة',
  'Preferred date': 'التاريخ المفضل',
  Service: 'الخدمة',
  'Current quote': 'العرض الحالي',
  'No quote received yet': 'لم يتم استلام عرض بعد',
  Description: 'الوصف',
  'Next step': 'الخطوة التالية',
  'Provider response': 'رد المزود',
  'Your notes and decisions': 'ملاحظاتك وقراراتك',
  'Open conversation': 'افتح المحادثة',
  'Accept quote': 'اقبل العرض',
  'Reject quote': 'ارفض العرض',
  'Cancel request': 'ألغ الطلب',
  'Failed to load your requests.': 'تعذر تحميل طلباتك.',
  'Request updated.': 'تم تحديث الطلب.',
  'Failed to update the request.': 'تعذر تحديث الطلب.',
  'Needs first review from the provider.': 'يحتاج إلى مراجعة أولى من المزود.',
  'Provider reviewed the brief and may send a quote next.':
    'راجع المزود الطلب وقد يرسل عرضًا بعد ذلك.',
  'Waiting for the customer to accept, reject, or continue the discussion.':
    'بانتظار قبول الزبون أو رفضه أو مواصلة النقاش.',
  'The quote was accepted and work can move into execution.':
    'تم قبول العرض ويمكن أن ينتقل العمل إلى التنفيذ.',
  'The provider marked the request as underway.':
    'قام المزود بتحديد الطلب على أنه قيد التنفيذ.',
  'The request lifecycle is complete.': 'اكتملت دورة حياة الطلب.',
  'The request or quote was rejected and is no longer active.':
    'تم رفض الطلب أو العرض ولم يعد نشطًا.',
  'The customer cancelled the request before completion.':
    'ألغى الزبون الطلب قبل اكتماله.',
  'Open the request to inspect the latest details.': 'افتح الطلب لمراجعة أحدث التفاصيل.',
});

Object.assign(TRANSLATIONS.ar, {
  'Shortlist workspace': 'مساحة القائمة المختصرة',
  'Keep the providers worth returning to': 'احتفظ بالمزودين الذين يستحقون العودة إليهم',
  'Saved now': 'محفوظ الآن',
  'Verified inside shortlist': 'موثق داخل القائمة',
  'Ready to message': 'جاهز للمراسلة',
  'Ready to request': 'جاهز للطلب',
  'Saved providers': 'المزودون المحفوظون',
  'Average shortlist rating': 'متوسط تقييم القائمة',
  'A quick quality signal across the providers you saved.':
    'إشارة جودة سريعة عبر المزودين الذين حفظتهم.',
  'Explore more providers': 'استكشف مزودين أكثر',
  'Best shortlist signal': 'أفضل إشارة في القائمة',
  'All shortlist': 'كل القائمة',
  'Verified only': 'الموثقون فقط',
  'Top rated': 'الأعلى تقييمًا',
  'No providers saved yet.': 'لم يتم حفظ أي مزود بعد.',
  'Open Explore': 'افتح الاستكشاف',
  'No providers match this shortlist filter.': 'لا يوجد مزودون يطابقون هذا الفلتر.',
  'Remove favorite': 'إزالة من المفضلة',
  'Removing...': 'جار الإزالة...',
  'Provider removed from favorites.': 'تمت إزالة المزود من المفضلة.',
  'Failed to remove provider from favorites.': 'تعذر إزالة المزود من المفضلة.',
  'Customer plan layer': 'طبقة باقة الزبون',
  'Treat subscription as part of customer intelligence':
    'اعتبر الاشتراك جزءًا من ذكاء تجربة الزبون',
  'Current plan': 'الباقة الحالية',
  'Plan state': 'حالة الباقة',
  'Search experience': 'تجربة البحث',
  'Messaging access': 'إمكانية المراسلة',
  Free: 'مجاني',
  Premium: 'مميز',
  'Default access': 'وصول افتراضي',
  'Preference upgrade': 'ترقية التفضيل',
  'Current selection': 'الاختيار الحالي',
  'Plan decision': 'قرار الباقة',
  'What this changes today': 'ما الذي يتغير اليوم',
  'Best next actions': 'أفضل الخطوات التالية',
  'Open favorites': 'افتح المفضلة',
  'Review unread alerts': 'راجع التنبيهات غير المقروءة',
  'Saving plan...': 'جار حفظ الباقة...',
  'Save plan preference': 'احفظ تفضيل الباقة',
  'Failed to load customer plan.': 'تعذر تحميل باقة الزبون.',
  'Customer plan updated.': 'تم تحديث باقة الزبون.',
  'Failed to update customer plan.': 'تعذر تحديث باقة الزبون.',
});

Object.assign(TRANSLATIONS.ar, {
  'Customer profile unavailable.': 'ملف الزبون غير متاح.',
  'Personal workspace': 'المساحة الشخصية',
  'Keep your account ready for faster discovery and follow-up':
    'أبقِ حسابك جاهزًا لاكتشاف أسرع ومتابعة أفضل',
  'Profile readiness': 'جاهزية الملف',
  'Interest tags': 'وسوم الاهتمام',
  'Preferred area': 'المنطقة المفضلة',
  'Not set': 'غير مضبوط',
  'Discovery focus': 'تركيز الاكتشاف',
  Unset: 'غير محدد',
  'Preferred location': 'الموقع المفضل',
  'Trust readiness': 'جاهزية الثقة',
  'Needs phone': 'الهاتف مطلوب',
  'Personal identity': 'الهوية الشخصية',
  'First name': 'الاسم الأول',
  'Last name': 'اسم العائلة',
  Email: 'البريد الإلكتروني',
  'Phone number': 'رقم الهاتف',
  'Save personal details': 'احفظ البيانات الشخصية',
  'Discovery preferences': 'تفضيلات الاكتشاف',
  'Write interests separated by commas, for example: electrician, interior design, cleaning':
    'اكتب الاهتمامات مفصولة بفواصل، مثل: كهربائي، تصميم داخلي، تنظيف',
  'No interests added yet.': 'لم تتم إضافة أي اهتمامات بعد.',
  'Customer preferences updated.': 'تم تحديث تفضيلات الزبون.',
  'Failed to update customer preferences.': 'تعذر تحديث تفضيلات الزبون.',
  'Customer profile updated.': 'تم تحديث ملف الزبون.',
  'Failed to update customer profile.': 'تعذر تحديث ملف الزبون.',
  'All password fields are required.': 'جميع حقول كلمة المرور مطلوبة.',
  'New password and confirmation do not match.': 'كلمة المرور الجديدة وتأكيدها غير متطابقين.',
  'Password changed successfully.': 'تم تغيير كلمة المرور بنجاح.',
  'Failed to change password.': 'تعذر تغيير كلمة المرور.',
  'Change password': 'تغيير كلمة المرور',
  'Updating password...': 'جار تحديث كلمة المرور...',
  'Review history': 'سجل التقييمات',
  'Manage the feedback you have already published': 'أدر الملاحظات التي نشرتها بالفعل',
  'Total reviews': 'إجمالي التقييمات',
  'Providers reviewed': 'المزودون الذين تم تقييمهم',
  'Ratings given': 'التقييمات الممنوحة',
  'None yet': 'لا شيء بعد',
  'Delete control': 'التحكم في الحذف',
  'Your published reviews': 'تقييماتك المنشورة',
  'Rating distribution': 'توزيع التقييم',
  'All reviews': 'كل التقييمات',
  'With comments': 'مع تعليقات',
  '4 stars and above': '4 نجوم فأكثر',
  'You have not published any reviews yet.': 'لم تنشر أي تقييمات بعد.',
  'No reviews match this filter.': 'لا توجد تقييمات تطابق هذا الفلتر.',
  Provider: 'مزود',
  'Open provider': 'افتح المزود',
  'No written comment was included with this review.': 'لم يتم تضمين تعليق مكتوب مع هذا التقييم.',
  'Review deleted.': 'تم حذف التقييم.',
  'Failed to delete review.': 'تعذر حذف التقييم.',
  'Failed to load your reviews.': 'تعذر تحميل تقييماتك.',
});

Object.assign(TRANSLATIONS.ar, {
  'Provider dashboard unavailable.': 'لوحة المزود غير متاحة.',
  'Failed to load the provider dashboard.': 'تعذر تحميل لوحة المزود.',
  'Provider profile unavailable.': 'ملف المزود غير متاح.',
  'Failed to load the provider profile.': 'تعذر تحميل ملف المزود.',
  'Business name': 'اسم النشاط',
  'Business name is required.': 'اسم النشاط مطلوب.',
  'Describe what you do, who you serve, and what makes your service reliable.':
    'صف ما الذي تقدمه ولمن تخدم وما الذي يجعل خدمتك موثوقة.',
  'Provider avatar': 'صورة المزود',
  'Provider cover': 'غلاف المزود',
  'Choose image from computer': 'اختر صورة من الكمبيوتر',
  'Avatar uploaded.': 'تم رفع الصورة الشخصية.',
  'Cover uploaded.': 'تم رفع الغلاف.',
  'Failed to upload the image.': 'تعذر رفع الصورة.',
  'Uploading avatar...': 'جار رفع الصورة الشخصية...',
  'Uploading cover...': 'جار رفع الغلاف...',
  'Provider profile saved successfully.': 'تم حفظ ملف المزود بنجاح.',
  'Failed to save the provider profile.': 'تعذر حفظ ملف المزود.',
  'Coverage not declared': 'التغطية غير مصرح بها',
  'Declared on profile': 'مصرح بها في الملف',
  'Operate the pipeline, keep response time low, and strengthen trust signals.':
    'أدر سير العمل وخفّض زمن الرد وعزّز إشارات الثقة.',
  'See business health, account status, services, and the next operational priorities.':
    'اطلع على صحة النشاط وحالة الحساب والخدمات وأولويات التشغيل التالية.',
  'Manage business identity, category, response speed, and public profile content.':
    'أدر هوية النشاط والتصنيف وسرعة الرد ومحتوى الملف العام.',
  'Create, update, publish, and position the services customers can request.':
    'أنشئ الخدمات التي يمكن للزبائن طلبها وحدّثها وانشرها وحدد موضعها.',
  'Publish proof of work, moderate comments, and organize media visibility.':
    'انشر نماذج الأعمال وراجع التعليقات ونظم ظهور الوسائط.',
  'Process leads, send quotes, and convert inbound demand into active work.':
    'عالج العملاء المحتملين وأرسل العروض وحوّل الطلبات الواردة إلى عمل نشط.',
  'Run the shared inbox and generate faster replies with AI support.':
    'أدر صندوق الوارد المشترك وأنشئ ردودًا أسرع بدعم الذكاء الاصطناعي.',
  'Monitor request, message, comment, and favorite-provider activity.':
    'راقب نشاط الطلبات والرسائل والتعليقات والمزودين المفضلين.',
  'Control plan capabilities, homepage featuring, and profile badge visibility.':
    'تحكم في إمكانات الباقة وإبراز الصفحة الرئيسية وظهور شارة الملف.',
  'Update personal info, privacy rules, and account security.':
    'حدّث المعلومات الشخصية وقواعد الخصوصية وأمان الحساب.',
  'Current response time is': 'زمن الرد الحالي هو',
  'Current completion is': 'نسبة الاكتمال الحالية هي',
  'Push this above 90% to improve trust and conversion.':
    'ارفعها فوق 90% لتحسين الثقة والتحويل.',
  'Keep draft inventory low.': 'حافظ على انخفاض المسودات.',
  'Messages and AI reply settings affect conversion.':
    'الرسائل وإعدادات الرد بالذكاء الاصطناعي تؤثر على التحويل.',
});

Object.assign(TRANSLATIONS.ar, {
  'Provider accounts currently waiting for moderation.':
    'حسابات مزودين تنتظر المراجعة حاليًا.',
  'Decisions completed since the start of the day.':
    'القرارات المكتملة منذ بداية اليوم.',
  'All moderation decisions stored in history.':
    'كل قرارات المراجعة المخزنة في السجل.',
  'Ratio of approved accounts across recorded decisions.':
    'نسبة الحسابات المقبولة ضمن القرارات المسجلة.',
  'Marketplace moderation status': 'حالة إشراف السوق',
  'Open pending queue': 'افتح قائمة المعلّق',
  'Total providers': 'إجمالي المزودين',
  'Approved decisions': 'القرارات المقبولة',
  'Latest pending providers': 'أحدث المزودين المعلّقين',
  'There are no pending providers right now.': 'لا يوجد مزودون معلقون حاليًا.',
  'Review account': 'راجع الحساب',
  'Public page': 'الصفحة العامة',
  'Reviewer dashboard unavailable.': 'لوحة المراجع غير متاحة.',
  'Failed to load the reviewer dashboard.': 'تعذر تحميل لوحة المراجع.',
  'No reviewer data is available yet.': 'لا توجد بيانات متاحة للمراجع بعد.',
  'Reviewed today': 'تمت مراجعته اليوم',
  'Total reviewed': 'إجمالي ما تمت مراجعته',
  'Approval rate': 'معدل القبول',
  'Track pending providers, review throughput, and decision quality signals.':
    'تابع المزودين المعلّقين وسرعة المراجعة وإشارات جودة القرار.',
  'Open pending provider submissions and move them to a decision.':
    'افتح طلبات المزودين المعلّقة وانقلها إلى قرار.',
  'Audit past moderation decisions and reviewer actions.':
    'راجع قرارات الإشراف السابقة وإجراءات المراجعين.',
  'View reviewer identity and moderation workload stats.':
    'اعرض هوية المراجع وإحصاءات عبء المراجعة.',
  'Review provider content, moderation history, and public proof before deciding.':
    'راجع محتوى المزود وسجل الإشراف والدلائل العامة قبل اتخاذ القرار.',
  'Monitor platform-wide health, moderation volume, and marketplace growth.':
    'راقب صحة المنصة وحجم الإشراف ونمو السوق.',
  'Search users, update activation state, and manage role assignments.':
    'ابحث عن المستخدمين وحدّث حالة التفعيل وأدر الأدوار.',
  'Control provider status, verification, and featured visibility.':
    'تحكم في حالة المزود والتوثيق والظهور المميز.',
  'Maintain taxonomy and service discovery structure.':
    'حافظ على بنية التصنيفات وهيكل اكتشاف الخدمات.',
  'Send cases to reviewers, discuss profiles, and receive decisions in-thread.':
    'أرسل الحالات إلى المراجعين وناقش الملفات واستقبل القرارات داخل الخيط.',
  'Manage geographic coverage used by search and provider profiles.':
    'أدر التغطية الجغرافية المستخدمة في البحث وملفات المزودين.',
  'Inspect marketplace reporting and exportable operational metrics.':
    'افحص تقارير السوق والمؤشرات التشغيلية القابلة للتصدير.',
  'Moderate public content and remove problematic comments.':
    'راجع المحتوى العام وأزل التعليقات الإشكالية.',
  'Manage reviewer access and staffing coverage.':
    'أدر وصول المراجعين وتغطية الفريق.',
  'Control platform-level settings and operational toggles.':
    'تحكم في إعدادات المنصة العامة ومفاتيح التشغيل.',
  'Run moderation, discovery controls, reviewer throughput, and marketplace hygiene like an internal working system.':
    'أدر الإشراف وضوابط الاكتشاف وسرعة عمل المراجعين ونظافة السوق كنظام تشغيل داخلي.',
  'Reviewer history unavailable.': 'سجل المراجع غير متاح.',
  'Moderation history': 'سجل الإشراف',
  'Filter by decision type and jump back to the provider record when needed.':
    'فلتر حسب نوع القرار ثم ارجع إلى سجل المزود عند الحاجة.',
  'All decisions': 'كل القرارات',
  'Request info': 'طلب معلومات',
  'No review history matches the selected filter.':
    'لا يوجد سجل مراجعة يطابق الفلتر المحدد.',
  'Provider record': 'سجل المزود',
  'No moderation note was added.': 'لم تتم إضافة ملاحظة مراجعة.',
  'Open review': 'افتح المراجعة',
});

Object.assign(TRANSLATIONS.fr, {
  Language: 'Langue',
  Explore: 'Explorer',
  Messages: 'Messages',
  Requests: 'Demandes',
  Favorites: 'Favoris',
  Notifications: 'Notifications',
  Reviews: 'Avis',
  Subscription: 'Abonnement',
  Profile: 'Profil',
  Portfolio: 'Portfolio',
  Dashboard: 'Tableau de bord',
  Inbox: 'Boîte de réception',
  History: 'Historique',
  Providers: 'Prestataires',
  Categories: 'Catégories',
  Regions: 'Régions',
  Reports: 'Rapports',
  Content: 'Contenu',
  Settings: 'Paramètres',
  Reviewers: 'Relecteurs',
  Alerts: 'Alertes',
  All: 'Tout',
  Unread: 'Non lus',
  Read: 'Lu',
  New: 'Nouveau',
  Approved: 'Approuvé',
  Pending: 'En attente',
  Rejected: 'Rejeté',
  Suspended: 'Suspendu',
  Published: 'Publié',
  Featured: 'Mis en avant',
  Active: 'Actif',
  Closed: 'Clos',
  Accepted: 'Accepté',
  Cancelled: 'Annulé',
  Completed: 'Terminé',
  Reviewed: 'Revu',
  'Quote sent': 'Devis envoyé',
  'In progress': 'En cours',
  Unknown: 'Inconnu',
  Available: 'Disponible',
  Enabled: 'Activé',
  Discovery: 'Découverte',
  Core: 'Essentiel',
  Included: 'Inclus',
  Enhanced: 'Amélioré',
  Standard: 'Standard',
  FREE: 'GRATUIT',
  PREMIUM: 'PREMIUM',
  BASIC: 'BASIQUE',
  PRO: 'PRO',
  BUSINESS: 'BUSINESS',
  Algeria: 'Algérie',
});

Object.assign(TRANSLATIONS.fr, {
  'Customer notification center': 'Centre de notifications client',
  'Provider activity center': 'Centre d’activité prestataire',
  'Needs attention now': 'À traiter maintenant',
  'Mark all as read': 'Tout marquer comme lu',
  'Open related item': 'Ouvrir l’élément lié',
  'Open related workflow': 'Ouvrir le flux lié',
  'Informational notification': 'Notification informative',
  'Operational notification': 'Notification opérationnelle',
  'Total notifications': 'Total des notifications',
  'Unread items': 'Éléments non lus',
  'Request updates': 'Mises à jour des demandes',
  'Message updates': 'Mises à jour des messages',
  'Loading notifications...': 'Chargement des notifications...',
  'Failed to load notifications.': 'Échec du chargement des notifications.',
  'Failed to open the notification.': 'Échec de l’ouverture de la notification.',
  'Failed to update notifications.': 'Échec de la mise à jour des notifications.',
  'There are no notifications in this filter right now.':
    'Aucune notification ne correspond à ce filtre pour le moment.',
  'There are no provider notifications in this filter right now.':
    'Aucune notification prestataire ne correspond à ce filtre pour le moment.',
  'Local-first Algerian discovery': 'Découverte algérienne pensée localement',
  'Search providers with local precision': 'Recherchez des prestataires avec une précision locale',
  'Search by service, skill, or category': 'Rechercher par service, compétence ou catégorie',
  'City / Commune / Locality': 'Ville / Commune / Localité',
  'All Algeria': 'Toute l’Algérie',
  'All categories': 'Toutes les catégories',
  'Any service need': 'Tout besoin de service',
  'Available now': 'Disponible maintenant',
  'Featured first': 'Mis en avant d’abord',
  'Verified first': 'Vérifiés d’abord',
  'Highest rated': 'Mieux notés',
  'Keep only the main category': 'Garder uniquement la catégorie principale',
  'No subcategories under this main category':
    'Aucune sous-catégorie sous cette catégorie principale',
  'Move quickly from search to trust, then from conversation to request.':
    'Passez rapidement de la recherche à la confiance, puis de la conversation à la demande.',
  'Service cards ready for conversion': 'Cartes de service prêtes à convertir',
  'These offers already have price, category, and provider context to reduce hesitation.':
    'Ces offres ont déjà le prix, la catégorie et le contexte du prestataire pour réduire l’hésitation.',
  'Failed to load the customer home feed.': 'Échec du chargement du flux client.',
  'Price based on scope': 'Prix selon le périmètre',
  'Open provider profile': 'Ouvrir le profil du prestataire',
  'Public customer review': 'Avis client public',
  'A rating was submitted without written feedback.':
    'Une note a été envoyée sans commentaire écrit.',
  'No recent review highlights are visible right now.':
    'Aucun extrait d’avis récent n’est visible pour le moment.',
  'No portfolio media is visible right now.':
    'Aucun média de portfolio n’est visible pour le moment.',
  'No featured services are available right now.':
    'Aucun service mis en avant n’est disponible pour le moment.',
  'Image work': 'Travail en image',
  'Video work': 'Travail en vidéo',
  'General services': 'Services généraux',
});

Object.assign(TRANSLATIONS.fr, {
  'All requests': 'Toutes les demandes',
  'Every service request and quote connected to your account.':
    'Chaque demande de service et chaque devis liés à votre compte.',
  'Quotes received': 'Devis reçus',
  'Requests currently waiting for your approval or rejection.':
    'Demandes actuellement en attente de votre approbation ou de votre refus.',
  'Active requests': 'Demandes actives',
  'Requests currently open or already moving into execution.':
    'Demandes encore ouvertes ou déjà en cours d’exécution.',
  'Closed requests': 'Demandes closes',
  'Completed, cancelled, or rejected requests.':
    'Demandes terminées, annulées ou rejetées.',
  'Completed, rejected, or cancelled requests.':
    'Demandes terminées, rejetées ou annulées.',
  'Your requests': 'Vos demandes',
  'Loading requests...': 'Chargement des demandes...',
  'No requests match this filter right now.':
    'Aucune demande ne correspond à ce filtre pour le moment.',
  'Service request': 'Demande de service',
  'No specific service': 'Aucun service précis',
  'Request summary': 'Résumé de la demande',
  'Expected budget': 'Budget prévu',
  'Preferred date': 'Date souhaitée',
  Service: 'Service',
  'Current quote': 'Devis actuel',
  'No quote received yet': 'Aucun devis reçu pour le moment',
  Description: 'Description',
  'Next step': 'Étape suivante',
  'Provider response': 'Réponse du prestataire',
  'Your notes and decisions': 'Vos notes et décisions',
  'Open conversation': 'Ouvrir la conversation',
  'Accept quote': 'Accepter le devis',
  'Reject quote': 'Refuser le devis',
  'Cancel request': 'Annuler la demande',
  'Failed to load your requests.': 'Échec du chargement de vos demandes.',
  'Request updated.': 'Demande mise à jour.',
  'Failed to update the request.': 'Échec de la mise à jour de la demande.',
  'Needs first review from the provider.':
    'Nécessite une première revue de la part du prestataire.',
  'Provider reviewed the brief and may send a quote next.':
    'Le prestataire a relu le besoin et peut envoyer un devis ensuite.',
  'Waiting for the customer to accept, reject, or continue the discussion.':
    'En attente que le client accepte, refuse ou poursuive la discussion.',
  'The quote was accepted and work can move into execution.':
    'Le devis a été accepté et le travail peut passer en exécution.',
  'The provider marked the request as underway.':
    'Le prestataire a indiqué que la demande était en cours.',
  'The request lifecycle is complete.': 'Le cycle de la demande est terminé.',
  'The request or quote was rejected and is no longer active.':
    'La demande ou le devis a été rejeté et n’est plus actif.',
  'The customer cancelled the request before completion.':
    'Le client a annulé la demande avant son achèvement.',
  'Open the request to inspect the latest details.':
    'Ouvrez la demande pour consulter les derniers détails.',
});

Object.assign(TRANSLATIONS.fr, {
  'Shortlist workspace': 'Espace de shortlist',
  'Keep the providers worth returning to':
    'Gardez les prestataires vers lesquels il vaut la peine de revenir',
  'Saved now': 'Enregistrés maintenant',
  'Verified inside shortlist': 'Vérifiés dans la shortlist',
  'Ready to message': 'Prêts à être contactés',
  'Ready to request': 'Prêts à être demandés',
  'Saved providers': 'Prestataires enregistrés',
  'Average shortlist rating': 'Note moyenne de la shortlist',
  'A quick quality signal across the providers you saved.':
    'Un signal rapide de qualité sur les prestataires que vous avez enregistrés.',
  'Explore more providers': 'Explorer plus de prestataires',
  'Best shortlist signal': 'Meilleur signal de shortlist',
  'All shortlist': 'Toute la shortlist',
  'Verified only': 'Vérifiés uniquement',
  'Top rated': 'Mieux notés',
  'No providers saved yet.': 'Aucun prestataire enregistré pour le moment.',
  'Open Explore': 'Ouvrir Explorer',
  'No providers match this shortlist filter.':
    'Aucun prestataire ne correspond à ce filtre de shortlist.',
  'Remove favorite': 'Retirer des favoris',
  'Removing...': 'Suppression...',
  'Provider removed from favorites.': 'Prestataire retiré des favoris.',
  'Failed to remove provider from favorites.':
    'Échec de la suppression du prestataire des favoris.',
  'Customer plan layer': 'Couche de formule client',
  'Treat subscription as part of customer intelligence':
    'Traitez l’abonnement comme une partie de l’intelligence client',
  'Current plan': 'Plan actuel',
  'Plan state': 'État du plan',
  'Search experience': 'Expérience de recherche',
  'Messaging access': 'Accès aux messages',
  Free: 'Gratuit',
  Premium: 'Premium',
  'Default access': 'Accès par défaut',
  'Preference upgrade': 'Montée en gamme de préférence',
  'Current selection': 'Sélection actuelle',
  'Plan decision': 'Décision de plan',
  'What this changes today': 'Ce que cela change aujourd’hui',
  'Best next actions': 'Meilleures prochaines actions',
  'Open favorites': 'Ouvrir les favoris',
  'Review unread alerts': 'Voir les alertes non lues',
  'Saving plan...': 'Enregistrement du plan...',
  'Save plan preference': 'Enregistrer la préférence du plan',
  'Failed to load customer plan.': 'Échec du chargement du plan client.',
  'Customer plan updated.': 'Plan client mis à jour.',
  'Failed to update customer plan.': 'Échec de la mise à jour du plan client.',
});

Object.assign(TRANSLATIONS.fr, {
  'Customer profile unavailable.': 'Profil client indisponible.',
  'Personal workspace': 'Espace personnel',
  'Keep your account ready for faster discovery and follow-up':
    'Gardez votre compte prêt pour une découverte et un suivi plus rapides',
  'Profile readiness': 'État de préparation du profil',
  'Interest tags': 'Tags d’intérêt',
  'Preferred area': 'Zone préférée',
  'Not set': 'Non défini',
  'Discovery focus': 'Focus de découverte',
  Unset: 'Non défini',
  'Preferred location': 'Lieu préféré',
  'Trust readiness': 'Niveau de confiance prêt',
  'Needs phone': 'Téléphone requis',
  'Personal identity': 'Identité personnelle',
  'First name': 'Prénom',
  'Last name': 'Nom',
  Email: 'E-mail',
  'Phone number': 'Numéro de téléphone',
  'Save personal details': 'Enregistrer les informations personnelles',
  'Discovery preferences': 'Préférences de découverte',
  'Write interests separated by commas, for example: electrician, interior design, cleaning':
    'Écrivez les centres d’intérêt séparés par des virgules, par exemple : électricien, design intérieur, nettoyage',
  'No interests added yet.': 'Aucun centre d’intérêt ajouté pour le moment.',
  'Customer preferences updated.': 'Préférences client mises à jour.',
  'Failed to update customer preferences.':
    'Échec de la mise à jour des préférences client.',
  'Customer profile updated.': 'Profil client mis à jour.',
  'Failed to update customer profile.': 'Échec de la mise à jour du profil client.',
  'All password fields are required.': 'Tous les champs du mot de passe sont requis.',
  'New password and confirmation do not match.':
    'Le nouveau mot de passe et sa confirmation ne correspondent pas.',
  'Password changed successfully.': 'Mot de passe modifié avec succès.',
  'Failed to change password.': 'Échec du changement de mot de passe.',
  'Change password': 'Changer le mot de passe',
  'Updating password...': 'Mise à jour du mot de passe...',
  'Review history': 'Historique des avis',
  'Manage the feedback you have already published':
    'Gérez les retours que vous avez déjà publiés',
  'Total reviews': 'Total des avis',
  'Providers reviewed': 'Prestataires évalués',
  'Ratings given': 'Notes données',
  'None yet': 'Aucun pour le moment',
  'Delete control': 'Contrôle de suppression',
  'Your published reviews': 'Vos avis publiés',
  'Rating distribution': 'Répartition des notes',
  'All reviews': 'Tous les avis',
  'With comments': 'Avec commentaires',
  '4 stars and above': '4 étoiles et plus',
  'You have not published any reviews yet.':
    'Vous n’avez encore publié aucun avis.',
  'No reviews match this filter.': 'Aucun avis ne correspond à ce filtre.',
  Provider: 'Prestataire',
  'Open provider': 'Ouvrir le prestataire',
  'No written comment was included with this review.':
    'Aucun commentaire écrit n’a été inclus avec cet avis.',
  'Review deleted.': 'Avis supprimé.',
  'Failed to delete review.': 'Échec de la suppression de l’avis.',
  'Failed to load your reviews.': 'Échec du chargement de vos avis.',
});

Object.assign(TRANSLATIONS.fr, {
  'Provider dashboard unavailable.': 'Tableau prestataire indisponible.',
  'Failed to load the provider dashboard.': 'Échec du chargement du tableau prestataire.',
  'Provider profile unavailable.': 'Profil prestataire indisponible.',
  'Failed to load the provider profile.': 'Échec du chargement du profil prestataire.',
  'Business name': 'Nom de l’activité',
  'Business name is required.': 'Le nom de l’activité est requis.',
  'Describe what you do, who you serve, and what makes your service reliable.':
    'Décrivez ce que vous faites, pour qui vous travaillez et ce qui rend votre service fiable.',
  'Provider avatar': 'Avatar du prestataire',
  'Provider cover': 'Couverture du prestataire',
  'Choose image from computer': 'Choisir une image depuis l’ordinateur',
  'Avatar uploaded.': 'Avatar téléversé.',
  'Cover uploaded.': 'Couverture téléversée.',
  'Failed to upload the image.': 'Échec du téléversement de l’image.',
  'Uploading avatar...': 'Téléversement de l’avatar...',
  'Uploading cover...': 'Téléversement de la couverture...',
  'Provider profile saved successfully.': 'Profil prestataire enregistré avec succès.',
  'Failed to save the provider profile.': 'Échec de l’enregistrement du profil prestataire.',
  'Coverage not declared': 'Couverture non déclarée',
  'Declared on profile': 'Déclarée sur le profil',
  'Operate the pipeline, keep response time low, and strengthen trust signals.':
    'Pilotez le pipeline, gardez un temps de réponse bas et renforcez les signaux de confiance.',
  'See business health, account status, services, and the next operational priorities.':
    'Visualisez la santé de l’activité, le statut du compte, les services et les prochaines priorités opérationnelles.',
  'Manage business identity, category, response speed, and public profile content.':
    'Gérez l’identité de l’activité, la catégorie, la rapidité de réponse et le contenu du profil public.',
  'Create, update, publish, and position the services customers can request.':
    'Créez, mettez à jour, publiez et positionnez les services que les clients peuvent demander.',
  'Publish proof of work, moderate comments, and organize media visibility.':
    'Publiez des preuves de travail, modérez les commentaires et organisez la visibilité des médias.',
  'Process leads, send quotes, and convert inbound demand into active work.':
    'Traitez les prospects, envoyez des devis et transformez la demande entrante en travail actif.',
  'Run the shared inbox and generate faster replies with AI support.':
    'Gérez la boîte partagée et générez des réponses plus rapides avec l’aide de l’IA.',
  'Monitor request, message, comment, and favorite-provider activity.':
    'Surveillez l’activité des demandes, messages, commentaires et prestataires favoris.',
  'Control plan capabilities, homepage featuring, and profile badge visibility.':
    'Contrôlez les capacités du plan, la mise en avant sur la page d’accueil et la visibilité du badge du profil.',
  'Update personal info, privacy rules, and account security.':
    'Mettez à jour les informations personnelles, les règles de confidentialité et la sécurité du compte.',
  'Current response time is': 'Le temps de réponse actuel est de',
  'Current completion is': 'Le niveau de complétion actuel est de',
  'Push this above 90% to improve trust and conversion.':
    'Faites-le passer au-dessus de 90 % pour améliorer la confiance et la conversion.',
  'Keep draft inventory low.': 'Gardez peu de brouillons.',
  'Messages and AI reply settings affect conversion.':
    'Les messages et les réglages de réponse IA influencent la conversion.',
});

Object.assign(TRANSLATIONS.fr, {
  'Provider accounts currently waiting for moderation.':
    'Comptes prestataires actuellement en attente de modération.',
  'Decisions completed since the start of the day.':
    'Décisions finalisées depuis le début de la journée.',
  'All moderation decisions stored in history.':
    'Toutes les décisions de modération enregistrées dans l’historique.',
  'Ratio of approved accounts across recorded decisions.':
    'Ratio de comptes approuvés parmi les décisions enregistrées.',
  'Marketplace moderation status': 'État de la modération de la marketplace',
  'Open pending queue': 'Ouvrir la file en attente',
  'Total providers': 'Total des prestataires',
  'Approved decisions': 'Décisions approuvées',
  'Latest pending providers': 'Derniers prestataires en attente',
  'There are no pending providers right now.':
    'Il n’y a aucun prestataire en attente pour le moment.',
  'Review account': 'Revoir le compte',
  'Public page': 'Page publique',
  'Reviewer dashboard unavailable.': 'Tableau relecteur indisponible.',
  'Failed to load the reviewer dashboard.': 'Échec du chargement du tableau relecteur.',
  'No reviewer data is available yet.':
    'Aucune donnée relecteur n’est encore disponible.',
  'Reviewed today': 'Revu aujourd’hui',
  'Total reviewed': 'Total revu',
  'Approval rate': 'Taux d’approbation',
  'Track pending providers, review throughput, and decision quality signals.':
    'Suivez les prestataires en attente, le débit de revue et les signaux de qualité des décisions.',
  'Open pending provider submissions and move them to a decision.':
    'Ouvrez les soumissions de prestataires en attente et faites-les avancer vers une décision.',
  'Audit past moderation decisions and reviewer actions.':
    'Auditez les décisions de modération passées et les actions des relecteurs.',
  'View reviewer identity and moderation workload stats.':
    'Affichez l’identité du relecteur et les statistiques de charge de modération.',
  'Review provider content, moderation history, and public proof before deciding.':
    'Examinez le contenu prestataire, l’historique de modération et les preuves publiques avant de décider.',
  'Monitor platform-wide health, moderation volume, and marketplace growth.':
    'Surveillez la santé globale de la plateforme, le volume de modération et la croissance de la marketplace.',
  'Search users, update activation state, and manage role assignments.':
    'Recherchez des utilisateurs, mettez à jour l’état d’activation et gérez les rôles.',
  'Control provider status, verification, and featured visibility.':
    'Contrôlez le statut prestataire, la vérification et la visibilité mise en avant.',
  'Maintain taxonomy and service discovery structure.':
    'Maintenez la taxonomie et la structure de découverte des services.',
  'Send cases to reviewers, discuss profiles, and receive decisions in-thread.':
    'Envoyez des dossiers aux relecteurs, discutez des profils et recevez les décisions dans le fil.',
  'Manage geographic coverage used by search and provider profiles.':
    'Gérez la couverture géographique utilisée par la recherche et les profils prestataires.',
  'Inspect marketplace reporting and exportable operational metrics.':
    'Inspectez les rapports marketplace et les indicateurs opérationnels exportables.',
  'Moderate public content and remove problematic comments.':
    'Modérez le contenu public et supprimez les commentaires problématiques.',
  'Manage reviewer access and staffing coverage.':
    'Gérez l’accès des relecteurs et la couverture de l’équipe.',
  'Control platform-level settings and operational toggles.':
    'Contrôlez les paramètres de la plateforme et les interrupteurs opérationnels.',
  'Run moderation, discovery controls, reviewer throughput, and marketplace hygiene like an internal working system.':
    'Pilotez la modération, les contrôles de découverte, le débit des relecteurs et l’hygiène de la marketplace comme un système de travail interne.',
  'Reviewer history unavailable.': 'Historique relecteur indisponible.',
  'Moderation history': 'Historique de modération',
  'Filter by decision type and jump back to the provider record when needed.':
    'Filtrez par type de décision puis revenez à la fiche prestataire si nécessaire.',
  'All decisions': 'Toutes les décisions',
  'Request info': 'Demander des infos',
  'No review history matches the selected filter.':
    'Aucun historique de revue ne correspond au filtre sélectionné.',
  'Provider record': 'Fiche prestataire',
  'No moderation note was added.': 'Aucune note de modération n’a été ajoutée.',
  'Open review': 'Ouvrir la revue',
});

Object.assign(TRANSLATIONS.ar, {
  'Track replies, request updates, comment activity, and provider changes from one feed.':
    'تابع الردود وتحديثات الطلبات ونشاط التعليقات وتغييرات المزودين من مكان واحد.',
  'Monitor incoming demand, message replies, comments on your media, and visibility changes.':
    'راقب الطلبات الواردة وردود الرسائل والتعليقات على وسائطك وتغييرات الظهور.',
  'Recent account activity tied to requests, messages, and providers you follow.':
    'نشاط الحساب الأخير المرتبط بالطلبات والرسائل والمزودين الذين تتابعهم.',
  'New items that still need attention or action from you.':
    'عناصر جديدة ما زالت تحتاج إلى انتباه أو إجراء منك.',
  'Status changes, quotes, and new provider replies on your requests.':
    'تغييرات الحالة والعروض السعرية والردود الجديدة من المزودين على طلباتك.',
  'New conversation activity from providers you contacted.':
    'نشاط محادثات جديد من المزودين الذين تواصلت معهم.',
  'Recent provider activity across requests, messages, comments, and trust signals.':
    'نشاط المزود الأخير عبر الطلبات والرسائل والتعليقات وإشارات الثقة.',
  'New operational items that still need an answer, update, or review.':
    'عناصر تشغيلية جديدة ما زالت تحتاج إلى رد أو تحديث أو مراجعة.',
  'New leads and customer request changes that affect pipeline activity.':
    'عملاء محتملون جدد وتغييرات في طلبات الزبائن تؤثر على سير العمل.',
  'Conversation activity that may require a fast commercial reply.':
    'نشاط محادثات قد يتطلب ردًا تجاريًا سريعًا.',
  'Favorites should reduce decision friction. From here you can reopen the profile, start a conversation, create a request, or clean the shortlist when a provider is no longer relevant.':
    'يجب أن تقلل المفضلة من تردد القرار. من هنا يمكنك إعادة فتح الملف وبدء محادثة وإنشاء طلب أو تنظيف القائمة عندما لا يعود المزود مناسبًا.',
  'This is a working shortlist, not a passive list. Every card can move directly into action.':
    'هذه قائمة عمل وليست قائمة ساكنة. كل بطاقة يمكن أن تتحول مباشرة إلى إجراء.',
  'This plan preference is already stored in the account model. It can shape future recommendations, notification priority, and loyalty logic without breaking the current customer flow.':
    'يتم حفظ تفضيل الباقة داخل نموذج الحساب بالفعل. ويمكنه تشكيل التوصيات المستقبلية وأولوية الإشعارات ومنطق الولاء دون كسر التدفق الحالي للزبون.',
  'Best for discovery, first requests, saving favorites, and validating the marketplace fit.':
    'مناسب للاستكشاف والطلبات الأولى وحفظ المفضلة والتحقق من ملاءمة السوق.',
  'Explore remains available regardless of plan.':
    'يبقى الاستكشاف متاحًا بغض النظر عن الباقة.',
  'Shortlisting providers stays part of the default customer flow.':
    'يبقى حفظ المزودين ضمن التدفق الافتراضي للزبون.',
  'Plan preference can evolve into richer marketplace alerts later.':
    'يمكن أن يتطور تفضيل الباقة لاحقًا إلى تنبيهات سوق أكثر غنى.',
  'Stored today as a stronger customer preference so the product can grow into richer alerts and personalization.':
    'يتم حفظه اليوم كتفضيل أقوى للزبون حتى ينمو المنتج نحو تنبيهات وتخصيصات أغنى.',
  'Higher-priority recommendation intent': 'نية توصية بأولوية أعلى',
  'Richer provider update awareness': 'وعي أغنى بتحديثات المزود',
  'Future-facing premium alert behavior': 'سلوك تنبيهات مميز قابل للتوسع',
  'Cleaner path for advanced loyalty features': 'مسار أنظف لميزات الولاء المتقدمة',
  'Customer profile data powers saved providers, discovery preferences, and smoother follow-up after requests or conversations.':
    'تدعم بيانات ملف الزبون المزودين المحفوظين وتفضيلات الاكتشاف ومتابعة أكثر سلاسة بعد الطلبات أو المحادثات.',
  'Topics used to make the account feel more relevant in future recommendations.':
    'مواضيع تُستخدم لجعل الحساب أكثر صلة في التوصيات المستقبلية.',
  'Useful when exploring local providers and reviewing location-based suggestions.':
    'مفيد عند استكشاف المزودين المحليين ومراجعة الاقتراحات المبنية على الموقع.',
  'Phone number helps when providers need a stronger follow-up channel.':
    'يساعد رقم الهاتف عندما يحتاج المزودون إلى قناة متابعة أقوى.',
  'Reviews shape public trust and discovery ranking. From here you can reopen the provider profile or delete feedback that is no longer accurate.':
    'تشكّل التقييمات الثقة العامة وترتيب الاكتشاف. ومن هنا يمكنك إعادة فتح ملف المزود أو حذف الملاحظات التي لم تعد دقيقة.',
  'Open the provider profile to add new feedback in context, or remove an outdated review directly from here.':
    'افتح ملف المزود لإضافة تقييم جديد ضمن السياق، أو أزل تقييمًا قديمًا مباشرة من هنا.',
});

Object.assign(TRANSLATIONS.fr, {
  'Track replies, request updates, comment activity, and provider changes from one feed.':
    'Suivez les réponses, les mises à jour de demandes, l’activité des commentaires et les changements des prestataires depuis un seul flux.',
  'Monitor incoming demand, message replies, comments on your media, and visibility changes.':
    'Surveillez les demandes entrantes, les réponses aux messages, les commentaires sur vos médias et les changements de visibilité.',
  'Recent account activity tied to requests, messages, and providers you follow.':
    'Activité récente liée aux demandes, aux messages et aux prestataires que vous suivez.',
  'New items that still need attention or action from you.':
    'Nouveaux éléments qui demandent encore votre attention ou une action.',
  'Status changes, quotes, and new provider replies on your requests.':
    'Changements d’état, devis et nouvelles réponses des prestataires sur vos demandes.',
  'New conversation activity from providers you contacted.':
    'Nouvelle activité de conversation provenant des prestataires que vous avez contactés.',
  'Recent provider activity across requests, messages, comments, and trust signals.':
    'Activité récente du prestataire sur les demandes, les messages, les commentaires et les signaux de confiance.',
  'New operational items that still need an answer, update, or review.':
    'Nouveaux éléments opérationnels qui nécessitent encore une réponse, une mise à jour ou une revue.',
  'New leads and customer request changes that affect pipeline activity.':
    'Nouveaux prospects et changements sur les demandes clients qui affectent le pipeline.',
  'Conversation activity that may require a fast commercial reply.':
    'Activité de conversation pouvant nécessiter une réponse commerciale rapide.',
  'Favorites should reduce decision friction. From here you can reopen the profile, start a conversation, create a request, or clean the shortlist when a provider is no longer relevant.':
    'Les favoris doivent réduire la friction de décision. Depuis ici, vous pouvez rouvrir le profil, lancer une conversation, créer une demande ou nettoyer la shortlist lorsqu’un prestataire n’est plus pertinent.',
  'This is a working shortlist, not a passive list. Every card can move directly into action.':
    'Ceci est une shortlist de travail, pas une liste passive. Chaque carte peut mener directement à une action.',
  'This plan preference is already stored in the account model. It can shape future recommendations, notification priority, and loyalty logic without breaking the current customer flow.':
    'Cette préférence de plan est déjà stockée dans le modèle de compte. Elle peut façonner les futures recommandations, la priorité des notifications et la logique de fidélité sans casser le flux client actuel.',
  'Best for discovery, first requests, saving favorites, and validating the marketplace fit.':
    'Idéal pour la découverte, les premières demandes, la sauvegarde des favoris et la validation de l’adéquation avec la marketplace.',
  'Explore remains available regardless of plan.':
    'L’exploration reste disponible quel que soit le plan.',
  'Shortlisting providers stays part of the default customer flow.':
    'La mise en shortlist reste une partie du flux client par défaut.',
  'Plan preference can evolve into richer marketplace alerts later.':
    'La préférence de plan peut évoluer plus tard vers des alertes marketplace plus riches.',
  'Stored today as a stronger customer preference so the product can grow into richer alerts and personalization.':
    'Enregistré aujourd’hui comme une préférence client plus forte afin que le produit puisse évoluer vers des alertes et une personnalisation plus riches.',
  'Higher-priority recommendation intent': 'Intention de recommandation prioritaire',
  'Richer provider update awareness': 'Meilleure visibilité sur les mises à jour prestataires',
  'Future-facing premium alert behavior': 'Comportement d’alertes premium prêt pour l’avenir',
  'Cleaner path for advanced loyalty features': 'Chemin plus propre vers des fonctionnalités de fidélité avancées',
  'Customer profile data powers saved providers, discovery preferences, and smoother follow-up after requests or conversations.':
    'Les données du profil client alimentent les prestataires enregistrés, les préférences de découverte et un suivi plus fluide après les demandes ou les conversations.',
  'Topics used to make the account feel more relevant in future recommendations.':
    'Sujets utilisés pour rendre le compte plus pertinent dans les futures recommandations.',
  'Useful when exploring local providers and reviewing location-based suggestions.':
    'Utile lorsque vous explorez des prestataires locaux et des suggestions liées à la localisation.',
  'Phone number helps when providers need a stronger follow-up channel.':
    'Le numéro de téléphone aide lorsque les prestataires ont besoin d’un canal de suivi plus direct.',
  'Reviews shape public trust and discovery ranking. From here you can reopen the provider profile or delete feedback that is no longer accurate.':
    'Les avis façonnent la confiance publique et le classement de découverte. Depuis ici, vous pouvez rouvrir le profil prestataire ou supprimer un retour qui n’est plus exact.',
  'Open the provider profile to add new feedback in context, or remove an outdated review directly from here.':
    'Ouvrez le profil prestataire pour ajouter un nouvel avis dans le contexte, ou retirez directement un avis obsolète depuis ici.',
});

Object.assign(TRANSLATIONS.ar, {
  'Track activity, saved providers, requests, and the next actions in one place.':
    'تابع النشاط والمزودين المحفوظين والطلبات والخطوات التالية في مكان واحد.',
  'Search providers by category, location, quality signals, and featured ranking.':
    'ابحث عن المزودين حسب التصنيف والموقع وإشارات الجودة والترتيب المميز.',
  'Continue conversations, review unread threads, and move from chat to request.':
    'واصل المحادثات وراجع الخيوط غير المقروءة وانتقل من الدردشة إلى الطلب.',
  'Follow every request from first contact to quote, acceptance, and closure.':
    'تابع كل طلب من أول تواصل حتى العرض والقبول والإغلاق.',
  'Quick access to the providers you follow most closely.':
    'وصول سريع إلى المزودين الذين تتابعهم أكثر.',
  'Review messages, request updates, comments, and provider activity.':
    'راجع الرسائل وتحديثات الطلبات والتعليقات ونشاط المزودين.',
  'Manage ratings and feedback you published on provider profiles.':
    'أدر التقييمات والملاحظات التي نشرتها على ملفات المزودين.',
  'Control your plan and preference-based account options.':
    'تحكم في باقتك وخيارات الحساب المبنية على التفضيلات.',
  'Update account details, interests, location preferences, and password.':
    'حدّث بيانات الحساب والاهتمامات وتفضيلات الموقع وكلمة المرور.',
  'A simple view of how demanding your public feedback has been.':
    'نظرة بسيطة على مدى صرامة تقييماتك العامة.',
  'Reviews that include context beyond the star rating.':
    'تقييمات تحتوي على سياق يتجاوز عدد النجوم.',
  'Reviews you have written across provider profiles.':
    'التقييمات التي كتبتها عبر ملفات المزودين.',
  'Saved providers that already carry marketplace trust signals.':
    'مزودون محفوظون يملكون بالفعل إشارات ثقة في السوق.',
  'Average rating given': 'متوسط التقييم الممنوح',
  'With written comments': 'مع تعليقات مكتوبة',
  'Save discovery preferences': 'احفظ تفضيلات الاكتشاف',
  'Save profile': 'احفظ الملف',
  'Save update': 'احفظ التحديث',
  'Saving preferences...': 'جار حفظ التفضيلات...',
  'Saving profile...': 'جار حفظ الملف...',
  'Saving...': 'جار الحفظ...',
  'Deleting...': 'جار الحذف...',
  'Failed to load customer profile.': 'تعذر تحميل ملف الزبون.',
  'Failed to load discovery results.': 'تعذر تحميل نتائج الاستكشاف.',
  'Failed to load favorite providers.': 'تعذر تحميل المزودين المفضلين.',
  'Failed to load provider requests.': 'تعذر تحميل طلبات المزود.',
  'Failed to load reviewer history.': 'تعذر تحميل سجل المراجع.',
  'First name, last name, and email are required.': 'الاسم الأول واسم العائلة والبريد الإلكتروني مطلوبة.',
  'Add your location': 'أضف موقعك',
  'Explore providers and public profiles': 'استكشف المزودين والملفات العامة',
  'Open messages and create requests': 'افتح الرسائل وأنشئ الطلبات',
  'Save favorites and compare later': 'احفظ المفضلة وقارن لاحقًا',
  'Publish customer reviews': 'انشر تقييمات الزبائن',
  'Every incoming lead and request sent to this provider profile.':
    'كل عميل محتمل وطلب وارد إلى ملف هذا المزود.',
  'Need first review and a fast provider response.':
    'يحتاج إلى مراجعة أولى ورد سريع من المزود.',
  'Quotes awaiting decision': 'عروض بانتظار القرار',
  'AI reply support': 'دعم الرد بالذكاء الاصطناعي',
  'AI-assisted replies are active in the provider inbox.':
    'الردود المدعومة بالذكاء الاصطناعي مفعلة في صندوق وارد المزود.',
  'AI-assisted replies are available but not yet enabled.':
    'الردود المدعومة بالذكاء الاصطناعي متاحة لكنها غير مفعلة بعد.',
  'Messaging readiness': 'جاهزية المراسلة',
  'Homepage featuring': 'إبراز الصفحة الرئيسية',
  'Homepage featuring is currently enabled.': 'إبراز الصفحة الرئيسية مفعل حاليًا.',
  'Homepage featuring is currently off.': 'إبراز الصفحة الرئيسية متوقف حاليًا.',
  'Featured logic, badges, and premium capability controls.':
    'منطق الإبراز والشارات والتحكم في القدرات المميزة.',
  'Proof of work, comments, likes, and media-level visibility.':
    'نماذج الأعمال والتعليقات والإعجابات وظهور الوسائط.',
  'Plan and visibility': 'الباقة والظهور',
  'Write your professional reply, quote details, or next execution steps...':
    'اكتب ردك المهني أو تفاصيل العرض أو خطوات التنفيذ التالية...',
});

Object.assign(TRANSLATIONS.fr, {
  'Track activity, saved providers, requests, and the next actions in one place.':
    'Suivez l’activité, les prestataires enregistrés, les demandes et les prochaines actions au même endroit.',
  'Search providers by category, location, quality signals, and featured ranking.':
    'Recherchez des prestataires par catégorie, localisation, signaux de qualité et classement mis en avant.',
  'Continue conversations, review unread threads, and move from chat to request.':
    'Poursuivez les conversations, relisez les fils non lus et passez du chat à la demande.',
  'Follow every request from first contact to quote, acceptance, and closure.':
    'Suivez chaque demande du premier contact au devis, à l’acceptation et à la clôture.',
  'Quick access to the providers you follow most closely.':
    'Accès rapide aux prestataires que vous suivez le plus.',
  'Review messages, request updates, comments, and provider activity.':
    'Consultez les messages, les mises à jour de demandes, les commentaires et l’activité des prestataires.',
  'Manage ratings and feedback you published on provider profiles.':
    'Gérez les notes et avis que vous avez publiés sur les profils prestataires.',
  'Control your plan and preference-based account options.':
    'Contrôlez votre formule et les options de compte basées sur vos préférences.',
  'Update account details, interests, location preferences, and password.':
    'Mettez à jour les informations du compte, les centres d’intérêt, les préférences de localisation et le mot de passe.',
  'A simple view of how demanding your public feedback has been.':
    'Une vue simple du niveau d’exigence de vos retours publics.',
  'Reviews that include context beyond the star rating.':
    'Avis qui ajoutent du contexte au-delà de la note en étoiles.',
  'Reviews you have written across provider profiles.':
    'Avis que vous avez rédigés sur les profils prestataires.',
  'Saved providers that already carry marketplace trust signals.':
    'Prestataires enregistrés qui portent déjà des signaux de confiance marketplace.',
  'Average rating given': 'Note moyenne donnée',
  'With written comments': 'Avec commentaires écrits',
  'Save discovery preferences': 'Enregistrer les préférences de découverte',
  'Save profile': 'Enregistrer le profil',
  'Save update': 'Enregistrer la mise à jour',
  'Saving preferences...': 'Enregistrement des préférences...',
  'Saving profile...': 'Enregistrement du profil...',
  'Saving...': 'Enregistrement...',
  'Deleting...': 'Suppression...',
  'Failed to load customer profile.': 'Échec du chargement du profil client.',
  'Failed to load discovery results.': 'Échec du chargement des résultats de découverte.',
  'Failed to load favorite providers.': 'Échec du chargement des prestataires favoris.',
  'Failed to load provider requests.': 'Échec du chargement des demandes prestataire.',
  'Failed to load reviewer history.': 'Échec du chargement de l’historique relecteur.',
  'First name, last name, and email are required.':
    'Le prénom, le nom et l’e-mail sont requis.',
  'Add your location': 'Ajoutez votre localisation',
  'Explore providers and public profiles': 'Explorer les prestataires et les profils publics',
  'Open messages and create requests': 'Ouvrir les messages et créer des demandes',
  'Save favorites and compare later': 'Sauvegarder les favoris et comparer plus tard',
  'Publish customer reviews': 'Publier des avis clients',
  'Every incoming lead and request sent to this provider profile.':
    'Chaque prospect et demande entrante envoyés à ce profil prestataire.',
  'Need first review and a fast provider response.':
    'Nécessite une première revue et une réponse rapide du prestataire.',
  'Quotes awaiting decision': 'Devis en attente de décision',
  'AI reply support': 'Assistance de réponse IA',
  'AI-assisted replies are active in the provider inbox.':
    'Les réponses assistées par IA sont actives dans la boîte prestataire.',
  'AI-assisted replies are available but not yet enabled.':
    'Les réponses assistées par IA sont disponibles mais pas encore activées.',
  'Messaging readiness': 'État de préparation de la messagerie',
  'Homepage featuring': 'Mise en avant sur la page d’accueil',
  'Homepage featuring is currently enabled.': 'La mise en avant sur la page d’accueil est activée.',
  'Homepage featuring is currently off.': 'La mise en avant sur la page d’accueil est désactivée.',
  'Featured logic, badges, and premium capability controls.':
    'Logique de mise en avant, badges et contrôles des capacités premium.',
  'Proof of work, comments, likes, and media-level visibility.':
    'Preuves de travail, commentaires, mentions j’aime et visibilité au niveau des médias.',
  'Plan and visibility': 'Plan et visibilité',
  'Write your professional reply, quote details, or next execution steps...':
    'Rédigez votre réponse professionnelle, les détails du devis ou les prochaines étapes d’exécution...',
});

Object.assign(TRANSLATIONS.ar, {
  'Add a note before accepting, rejecting, or cancelling this request...':
    'أضف ملاحظة قبل قبول هذا الطلب أو رفضه أو إلغائه...',
  'A quote has been sent and the customer has not responded yet.':
    'تم إرسال عرض سعر ولم يرد الزبون بعد.',
  'Business identity, category, cover, avatar, and public positioning.':
    'هوية النشاط والتصنيف والغلاف والصورة والتموضع العام.',
  'Open provider profile for services': 'افتح ملف المزود للخدمات',
  'New requests': 'طلبات جديدة',
  'Published reviews': 'التقييمات المنشورة',
  'No category': 'لا يوجد تصنيف',
  'Requires higher plan': 'يتطلب باقة أعلى',
  'Priority ready': 'جاهز للأولوية',
  'Not available': 'غير متاح',
  'Not set yet': 'غير مضبوط بعد',
  Updating: 'جار التحديث',
  Delete: 'حذف',
  Account: 'الحساب',
});

Object.assign(TRANSLATIONS.fr, {
  'Add a note before accepting, rejecting, or cancelling this request...':
    'Ajoutez une note avant d’accepter, de rejeter ou d’annuler cette demande...',
  'A quote has been sent and the customer has not responded yet.':
    'Un devis a été envoyé et le client n’a pas encore répondu.',
  'Business identity, category, cover, avatar, and public positioning.':
    'Identité de l’activité, catégorie, couverture, avatar et positionnement public.',
  'Open provider profile for services': 'Ouvrir le profil prestataire pour les services',
  'New requests': 'Nouvelles demandes',
  'Published reviews': 'Avis publiés',
  'No category': 'Aucune catégorie',
  'Requires higher plan': 'Nécessite un plan supérieur',
  'Priority ready': 'Prêt pour la priorité',
  'Not available': 'Indisponible',
  'Not set yet': 'Pas encore défini',
  Updating: 'Mise à jour',
  Delete: 'Supprimer',
  Account: 'Compte',
});

Object.assign(TRANSLATIONS.ar, {
  Plan: 'الخطة',
  Provider: 'مزود',
  Reviewer: 'مراجع',
  Request: 'طلب',
  Favorite: 'مفضلة',
  Comment: 'تعليق',
  Comments: 'التعليقات',
  System: 'النظام',
  'Plan and visibility': 'الباقة والظهور',
  Discovery: 'الاكتشاف',
  Content: 'المحتوى',
  Providers: 'المزودون',
  Reports: 'التقارير',
  Inbox: 'صندوق الوارد',
});

Object.assign(TRANSLATIONS.fr, {
  Plan: 'Plan',
  Provider: 'Prestataire',
  Reviewer: 'Relecteur',
  Request: 'Demande',
  Favorite: 'Favori',
  Comment: 'Commentaire',
  Comments: 'Commentaires',
  System: 'Système',
  'Plan and visibility': 'Plan et visibilité',
  Discovery: 'Découverte',
  Content: 'Contenu',
  Providers: 'Prestataires',
  Reports: 'Rapports',
  Inbox: 'Boîte de réception',
});

Object.assign(TRANSLATIONS.ar, {
  'Activity center': "مركز النشاط",
  'Operational feed': "التدفق التشغيلي",
  'Notifications feed': "تدفق الإشعارات",
  'Priority queue': "قائمة الأولوية",
  'Needs attention': "يحتاج إلى انتباه",
  'Operational mix': "التوزيع التشغيلي",
  'Unread by type': "غير المقروء حسب النوع",
  'Visibility and trust': "الظهور والثقة",
  'Favorite-provider updates': "تحديثات المزوّدين المفضلين",
  'Unread visibility items': "عناصر الظهور غير المقروءة",
  'System notices': "إشعارات النظام",
  'Messaging workspace': "مساحة المراسلة",
  'Provider conversations': "محادثات المزوّدين",
  'Commercial inbox': "صندوق الوارد التجاري",
  'Switch threads without losing context.': "بدّل بين الخيوط من دون فقدان السياق.",
  'Customer account': "حساب العميل",
  'Loading thread...': "جارٍ تحميل الخيط...",
  'Reply target': "جهة الرد",
  'Current context': "السياق الحالي",
  Status: "الحالة",
  'Last activity': "آخر نشاط",
  'Unread activity': "نشاط غير مقروء",
  'Up to date': "محدّث",
  'Next likely action': "الإجراء المرجّح التالي",
  'Verified provider': "مزوّد موثّق",
  'AI assistant': "مساعد الذكاء الاصطناعي",
  'Service-aware draft generation and response support.': "إنشاء مسودات واعية بالخدمة ودعم للردود.",
  'Provider copilot': "مساعد المزوّد",
  'Generate a stronger first reply': "أنشئ رداً أولياً أقوى",
  'Draft mode': "وضع المسودة",
  'Conversation note': "ملاحظة المحادثة",
  'One clean thread, no visual noise': "خيط واحد واضح من دون ضجيج بصري",
  'Lead execution workspace': "مساحة تنفيذ العملاء المحتملين",
  'Provider requests, quotes, and delivery flow': "طلبات المزوّد والعروض ومسار التنفيذ",
  'Needs provider action': "يتطلب إجراء من المزوّد",
  'Loading provider requests...': "جارٍ تحميل طلبات المزوّد...",
  'No provider requests match this filter right now.': "لا توجد طلبات مزوّد تطابق هذا الفلتر الآن.",
  'Conversation linked': "المحادثة مرتبطة",
  'Requested budget': "الميزانية المطلوبة",
  'Desired date': "التاريخ المطلوب",
  'Next operational action': "الإجراء التشغيلي التالي",
  'Customer description': "وصف العميل",
  'Latest customer note': "آخر ملاحظة من العميل",
  'Conversation path': "مسار المحادثة",
  'Next best action': "أفضل إجراء تالٍ",
  'Quote amount': "قيمة العرض",
  'Save update': "حفظ التحديث",
  'Request workspace': "مساحة الطلب",
  'Requests, quotes, and next decisions': "الطلبات والعروض والقرارات التالية",
  'Waiting for you': "بانتظارك",
  'Loading requests...': "جارٍ تحميل الطلبات...",
  'No requests match this filter right now.': "لا توجد طلبات تطابق هذا الفلتر الآن.",
  'Open conversation': "فتح المحادثة",
  'Expected budget': "الميزانية المتوقعة",
  'Preferred date': "التاريخ المفضل",
  'What should happen now': "ما الذي يجب أن يحدث الآن",
  'Accept quote': "قبول العرض",
  'Reject quote': "رفض العرض",
  'Cancel request': "إلغاء الطلب",
  'Reviewer dashboard unavailable.': "لوحة المراجع غير متاحة.",
  'Reviewer operations desk': "مكتب عمليات المراجع",
  'Immediate focus': "التركيز الفوري",
  'Full queue': "الطابور الكامل",
  'There are no pending providers right now.': "لا يوجد مزوّدون معلّقون الآن.",
  'Pending queue unavailable.': "طابور المعلّقين غير متاح.",
  'Reviewer pending queue': "طابور المراجعة المعلّق",
  'Open review inbox': "فتح صندوق مراجعة الوارد",
  'Decision history': "سجل القرارات",
  'Search pending accounts': "ابحث في الحسابات المعلّقة",
  'No pending providers match the current search.': "لا يوجد مزوّدون معلّقون يطابقون البحث الحالي.",
  'Reviewer history unavailable.': "سجل المراجع غير متاح.",
  'Reviewer decision archive': "أرشيف قرارات المراجع",
  'No review history matches the selected filter.': "لا يوجد سجل مراجعة يطابق الفلتر المحدد.",
  'Provider record': "سجل المزوّد",
  'Provider status': "حالة المزوّد",
  unknown: "غير معروف",
  'Open review': "فتح المراجعة",
  'Provider moderation unavailable.': "مراجعة المزوّدين غير متاحة.",
  'Provider moderation desk': "مكتب مراجعة المزوّدين",
  'Approval, trust, and visibility controls': "عناصر التحكم بالموافقة والثقة والظهور",
  providers: "مزوّدين",
  'All statuses': "كل الحالات",
  'Refresh queue': "تحديث الطابور",
  'No providers match the current filters.': "لا يوجد مزوّدون يطابقون الفلاتر الحالية.",
  Location: "الموقع",
  'Commercial state': "الحالة التجارية",
  'Badge control': "التحكم في الشارة",
  Actions: "الإجراءات",
  'Category pending': "التصنيف معلّق",
  'Verification not assigned': "لم يتم إسناد التوثيق",
  'Location pending': "الموقع معلّق",
  'Optional profile badge': "شارة ملف اختيارية",
  Moderation: "المراجعة",
  'Send to reviewer': "إرسال إلى المراجع",
  Approve: "موافقة",
  Suspend: "تعليق",
  Unverify: "إلغاء التوثيق",
  Feature: "إبراز",
  Unfeature: "إلغاء الإبراز",
  'Save badge': "حفظ الشارة",
  'Content moderation unavailable.': "مراجعة المحتوى غير متاحة.",
  'Admin content moderation': "مراجعة المحتوى للإدارة",
  'Search queue': "البحث في الطابور",
  'No public comments match the current search.': "لا توجد تعليقات عامة تطابق البحث الحالي.",
  'Anonymous author': "كاتب مجهول",
  'Public comment': "تعليق عام",
  'Missing media context': "سياق الوسائط مفقود",
  'No media context': "لا يوجد سياق وسائط",
  'Open provider page': "فتح صفحة المزوّد",
  'Delete comment': "حذف التعليق",
  Visible: "مرئي",
  visible: "مرئي",
  verified: "موثّق",
  'Public page': "الصفحة العامة",
  'Review account': "مراجعة الحساب",
  Created: "أُنشئ",
  'Next step': "الخطوة التالية",
  Next: "التالي",
  service: "خدمة",
  services: "خدمات",
  Conversation: "المحادثة",
  Email: "البريد الإلكتروني",
  Phone: "الهاتف",
  'Last updated': "آخر تحديث",
});

Object.assign(TRANSLATIONS.fr, {
  'Activity center': "Centre d'activite",
  'Operational feed': "Flux operationnel",
  'Notifications feed': "Flux de notifications",
  'Priority queue': "File prioritaire",
  'Needs attention': "A traiter",
  'Operational mix': "Repartition operationnelle",
  'Unread by type': "Non lus par type",
  'Visibility and trust': "Visibilite et confiance",
  'Favorite-provider updates': "Mises a jour des prestataires favoris",
  'Unread visibility items': "Elements de visibilite non lus",
  'System notices': "Notices systeme",
  'Messaging workspace': "Espace de messagerie",
  'Provider conversations': "Conversations prestataires",
  'Commercial inbox': "Boite commerciale",
  'Switch threads without losing context.': "Passez d'un fil a l'autre sans perdre le contexte.",
  'Customer account': "Compte client",
  'Loading thread...': "Chargement du fil...",
  'Reply target': "Cible de reponse",
  'Current context': "Contexte actuel",
  Status: "Statut",
  'Last activity': "Derniere activite",
  'Unread activity': "Activite non lue",
  'Up to date': "A jour",
  'Next likely action': "Action probable suivante",
  'Verified provider': "Prestataire verifie",
  'AI assistant': "Assistant IA",
  'Service-aware draft generation and response support.': "Generation de brouillons et aide a la reponse avec contexte service.",
  'Provider copilot': "Copilote prestataire",
  'Generate a stronger first reply': "Generer une premiere reponse plus solide",
  'Draft mode': "Mode brouillon",
  'Conversation note': "Note de conversation",
  'One clean thread, no visual noise': "Un fil clair, sans bruit visuel",
  'Lead execution workspace': "Espace d'execution des leads",
  'Provider requests, quotes, and delivery flow': "Demandes prestataire, devis et flux d'execution",
  'Needs provider action': "Action prestataire requise",
  'Loading provider requests...': "Chargement des demandes prestataire...",
  'No provider requests match this filter right now.': "Aucune demande prestataire ne correspond a ce filtre pour le moment.",
  'Conversation linked': "Conversation liee",
  'Requested budget': "Budget demande",
  'Desired date': "Date souhaitee",
  'Next operational action': "Prochaine action operationnelle",
  'Customer description': "Description du client",
  'Latest customer note': "Derniere note client",
  'Conversation path': "Chemin de conversation",
  'Next best action': "Meilleure action suivante",
  'Quote amount': "Montant du devis",
  'Save update': "Enregistrer la mise a jour",
  'Request workspace': "Espace des demandes",
  'Requests, quotes, and next decisions': "Demandes, devis et prochaines decisions",
  'Waiting for you': "En attente de vous",
  'Loading requests...': "Chargement des demandes...",
  'No requests match this filter right now.': "Aucune demande ne correspond a ce filtre pour le moment.",
  'Open conversation': "Ouvrir la conversation",
  'Expected budget': "Budget attendu",
  'Preferred date': "Date preferee",
  'What should happen now': "Ce qui doit se passer maintenant",
  'Accept quote': "Accepter le devis",
  'Reject quote': "Refuser le devis",
  'Cancel request': "Annuler la demande",
  'Reviewer dashboard unavailable.': "Tableau de bord relecteur indisponible.",
  'Reviewer operations desk': "Poste operationnel relecteur",
  'Immediate focus': "Priorite immediate",
  'Full queue': "File complete",
  'There are no pending providers right now.': "Aucun prestataire en attente pour le moment.",
  'Pending queue unavailable.': "File en attente indisponible.",
  'Reviewer pending queue': "File relecteur en attente",
  'Open review inbox': "Ouvrir la boite de revue",
  'Decision history': "Historique des decisions",
  'Search pending accounts': "Rechercher des comptes en attente",
  'No pending providers match the current search.': "Aucun prestataire en attente ne correspond a la recherche actuelle.",
  'Reviewer history unavailable.': "Historique relecteur indisponible.",
  'Reviewer decision archive': "Archive des decisions relecteur",
  'No review history matches the selected filter.': "Aucun historique de revue ne correspond au filtre selectionne.",
  'Provider record': "Fiche prestataire",
  'Provider status': "Statut prestataire",
  unknown: "inconnu",
  'Open review': "Ouvrir la revue",
  'Provider moderation unavailable.': "Moderation prestataire indisponible.",
  'Provider moderation desk': "Poste de moderation prestataire",
  'Approval, trust, and visibility controls': "Controle d'approbation, confiance et visibilite",
  providers: "prestataires",
  'All statuses': "Tous les statuts",
  'Refresh queue': "Actualiser la file",
  'No providers match the current filters.': "Aucun prestataire ne correspond aux filtres actuels.",
  Location: "Localisation",
  'Commercial state': "Etat commercial",
  'Badge control': "Controle du badge",
  Actions: "Actions",
  'Category pending': "Categorie en attente",
  'Verification not assigned': "Verification non attribuee",
  'Location pending': "Localisation en attente",
  'Optional profile badge': "Badge de profil optionnel",
  Moderation: "Moderation",
  'Send to reviewer': "Envoyer au relecteur",
  Approve: "Approuver",
  Suspend: "Suspendre",
  Unverify: "Retirer la verification",
  Feature: "Mettre en avant",
  Unfeature: "Retirer la mise en avant",
  'Save badge': "Enregistrer le badge",
  'Content moderation unavailable.': "Moderation de contenu indisponible.",
  'Admin content moderation': "Moderation de contenu admin",
  'Search queue': "Rechercher dans la file",
  'No public comments match the current search.': "Aucun commentaire public ne correspond a la recherche actuelle.",
  'Anonymous author': "Auteur anonyme",
  'Public comment': "Commentaire public",
  'Missing media context': "Contexte media manquant",
  'No media context': "Aucun contexte media",
  'Open provider page': "Ouvrir la page prestataire",
  'Delete comment': "Supprimer le commentaire",
  Visible: "Visible",
  visible: "visibles",
  verified: "verifie",
  'Public page': "Page publique",
  'Review account': "Revoir le compte",
  Created: "Cree",
  'Next step': "Prochaine etape",
  Next: "Suivant",
  service: "service",
  services: "services",
  Conversation: "Conversation",
  Email: "E-mail",
  Phone: "Telephone",
  'Last updated': "Derniere mise a jour",
});

Object.assign(TRANSLATIONS.ar, {
  'Please enter your email and password.': 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
  'Logged in successfully.': 'تم تسجيل الدخول بنجاح.',
  'Login failed.': 'فشل تسجيل الدخول.',
  'Access your workspace': 'ادخل إلى مساحة عملك',
  'Sign in and continue from the exact point you stopped':
    'سجل الدخول وتابع من النقطة نفسها التي توقفت عندها.',
  'Messages, requests, provider actions, and public intent are preserved when a redirect target exists.':
    'تظل الرسائل والطلبات وإجراءات المزوّد ونية المستخدم محفوظة عندما يوجد مسار إعادة توجيه.',
  'A production marketplace needs zero-friction authentication':
    'السوق الحي يحتاج إلى تسجيل دخول بلا احتكاك.',
  'Authentication should not break discovery or conversion. This flow keeps the user inside the same journey instead of forcing a fresh start.':
    'يجب ألا يكسر تسجيل الدخول مسار الاستكشاف أو التحويل. هذا التدفق يبقي المستخدم داخل الرحلة نفسها بدل فرض بداية جديدة.',
  'Discovery-safe': 'آمن على مسار الاستكشاف',
  'Public-first': 'عام أولاً',
  'Guests can browse first, then authenticate only when an action needs it.':
    'يمكن للزوار التصفح أولاً ثم تسجيل الدخول فقط عندما يتطلب الإجراء ذلك.',
  'Intent preserved': 'النية محفوظة',
  Yes: 'نعم',
  Default: 'الافتراضي',
  'Protected actions send the user back to the correct page after sign in.':
    'تعيد الإجراءات المحمية المستخدم إلى الصفحة الصحيحة بعد تسجيل الدخول.',
  'Role aware': 'مدرك للدور',
  'Customer / Provider': 'زبون / مزود',
  'Successful sign in lands the user in the correct workspace automatically.':
    'ينقل تسجيل الدخول الناجح المستخدم تلقائيًا إلى مساحة العمل الصحيحة.',
  'Need a customer account?': 'هل تحتاج إلى حساب زبون؟',
  'Email': 'البريد الإلكتروني',
  'Authentication note': 'ملاحظة المصادقة',
  'Provider and customer accounts use the same secure entry point, then split into role-specific workspaces after authentication.':
    'تستخدم حسابات المزوّد والزبون نقطة دخول آمنة واحدة ثم تنتقل إلى مساحات العمل الخاصة بكل دور بعد المصادقة.',
  'Signing in...': 'جارٍ تسجيل الدخول...',
  'Sign In': 'تسجيل الدخول',
  'Search, shortlist, message providers, and create requests.':
    'ابحث، واختصر القائمة، وراسل المزوّدين، وأنشئ الطلبات.',
  'Publish services, manage requests, and use AI-assisted communication.':
    'انشر الخدمات وأدر الطلبات واستخدم التواصل المدعوم بالذكاء الاصطناعي.',
  'Customer onboarding': 'إعداد حساب الزبون',
  'Create a customer account that is ready to act':
    'أنشئ حساب زبون جاهزًا لاتخاذ الإجراء.',
  'The goal is not just account creation. It is getting the user into discovery, messaging, and requests with minimal friction.':
    'الهدف ليس مجرد إنشاء حساب، بل إدخال المستخدم إلى الاستكشاف والرسائل والطلبات بأقل احتكاك.',
  'Customers should convert from search to request without setup fatigue':
    'يجب أن ينتقل الزبون من البحث إلى الطلب دون إرهاق الإعداد.',
  'This signup stays short but still captures the essentials needed for smoother provider follow-up and account continuity.':
    'يبقى هذا التسجيل قصيرًا لكنه يلتقط الأساسيات اللازمة لمتابعة أفضل من المزوّد واستمرارية الحساب.',
  Discovery: 'الاستكشاف',
  'Message directly': 'راسل مباشرة',
  'Chat ready': 'جاهز للمحادثة',
  'Open provider conversations immediately after signup.':
    'افتح محادثات المزوّدين مباشرة بعد التسجيل.',
  'Already have an account?': 'لديك حساب بالفعل؟',
  'Join as provider': 'انضم كمزوّد',
  'First name': 'الاسم الأول',
  'Last name': 'اسم العائلة',
  'Email address': 'عنوان البريد الإلكتروني',
  'Phone number': 'رقم الهاتف',
  'Optional now, but useful when providers need a faster follow-up channel.':
    'اختياري الآن، لكنه مفيد عندما يحتاج المزوّدون إلى قناة متابعة أسرع.',
  'Confirm password': 'تأكيد كلمة المرور',
  'What happens next': 'ماذا يحدث بعد ذلك',
  'After signup, the customer account goes directly into the dashboard or returns to the saved action if this signup started from a provider page.':
    'بعد التسجيل ينتقل حساب الزبون مباشرة إلى لوحة التحكم أو يعود إلى الإجراء المحفوظ إذا بدأ التسجيل من صفحة مزوّد.',
  'Terms and privacy': 'الشروط والخصوصية',
  'I agree to the marketplace terms, privacy rules, and communication policies.':
    'أوافق على شروط السوق وقواعد الخصوصية وسياسات التواصل.',
  'Creating account...': 'جارٍ إنشاء الحساب...',
  'Search and compare': 'ابحث وقارن',
  'Browse public providers first, then take action only when needed.':
    'تصفح المزوّدين العامين أولاً ثم اتخذ الإجراء عند الحاجة فقط.',
  'Protected continuity': 'استمرارية محمية',
  'Redirect-aware authentication avoids losing the request or message the customer started.':
    'تسجيل الدخول الواعي بإعادة التوجيه يمنع فقدان الطلب أو الرسالة التي بدأها الزبون.',
  'Failed to create customer account.': 'تعذر إنشاء حساب الزبون.',
  'Customer account created successfully.': 'تم إنشاء حساب الزبون بنجاح.',
  'First name is required.': 'الاسم الأول مطلوب.',
  'Last name is required.': 'اسم العائلة مطلوب.',
  'Email is required.': 'البريد الإلكتروني مطلوب.',
  'Password is required.': 'كلمة المرور مطلوبة.',
  'Use at least 8 characters with uppercase, lowercase, number, and special character.':
    'استخدم 8 أحرف على الأقل مع حرف كبير وحرف صغير ورقم ورمز خاص.',
  'Please confirm your password.': 'يرجى تأكيد كلمة المرور.',
  'Passwords do not match.': 'كلمتا المرور غير متطابقتين.',
  'You must accept the terms.': 'يجب عليك قبول الشروط.',
  'Provider onboarding': 'إعداد حساب المزوّد',
  'Failed to load categories for provider onboarding.':
    'تعذر تحميل التصنيفات لإعداد المزوّد.',
  'Business name is required.': 'اسم النشاط التجاري مطلوب.',
  'Primary category is required.': 'التصنيف الرئيسي مطلوب.',
  'Region is required.': 'الجهة مطلوبة.',
  'Wilaya is required.': 'الولاية مطلوبة.',
  'City is required.': 'المدينة مطلوبة.',
  'Select at least one served region.': 'اختر جهة مخدومة واحدة على الأقل.',
  'Years of experience is required.': 'سنوات الخبرة مطلوبة.',
  'Years of experience must be zero or more.': 'يجب أن تكون سنوات الخبرة صفرًا أو أكثر.',
  'Provider account created successfully.': 'تم إنشاء حساب المزوّد بنجاح.',
  'Failed to create provider account.': 'تعذر إنشاء حساب المزوّد.',
  'Join as a service provider with enough context to look real on day one':
    'انضم كمزوّد خدمة مع قدر كافٍ من السياق ليبدو الحساب حقيقيًا من اليوم الأول.',
  'Provider signup should not create empty profiles. This flow captures the minimum viable business identity required for a credible marketplace launch.':
    'يجب ألا ينتج عن تسجيل المزوّد ملفات فارغة. يلتقط هذا التدفق الحد الأدنى من هوية النشاط اللازمة لإطلاق سوق موثوق.',
  'A provider account should start with real business context, not blank placeholders':
    'يجب أن يبدأ حساب المزوّد بسياق عمل حقيقي لا بعناصر فارغة.',
  'The platform becomes more unique when providers are locally grounded from the first minute: category, wilaya, city, experience, and business summary.':
    'تصبح المنصة أقوى عندما يكون المزوّد مرتبطًا محليًا منذ الدقيقة الأولى: التصنيف والولاية والمدينة والخبرة وملخص النشاط.',
  'Moderation ready': 'جاهز للمراجعة',
  'Higher onboarding completeness makes review and approval more meaningful immediately.':
    'كلما زادت اكتمالية الإعداد أصبحت المراجعة والموافقة أكثر معنى مباشرة.',
  'Discovery placement': 'موضع الظهور في الاستكشاف',
  Categorized: 'مصنف',
  'Inbox growth path': 'مسار نمو البريد الوارد',
  'AI assisted': 'مدعوم بالذكاء الاصطناعي',
  'Looking for services instead?': 'هل تبحث عن خدمات بدلًا من ذلك؟',
  'Business name': 'اسم النشاط التجاري',
  'Amine Services': 'خدمات أمين',
  'Professional email': 'البريد المهني',
  'Primary category': 'التصنيف الرئيسي',
  'Select category': 'اختر التصنيف',
  'Years of experience': 'سنوات الخبرة',
  'Marketplace region': 'جهة السوق',
  'Select region': 'اختر الجهة',
  'Select wilaya': 'اختر الولاية',
  City: 'المدينة',
  'Bab Ezzouar, Oran Centre, Constantine...': 'باب الزوار، وسط وهران، قسنطينة...',
  'Service coverage': 'نطاق الخدمة',
  'Serve only my wilaya': 'أخدم ولايتي فقط',
  'Serve selected Algerian regions': 'أخدم جهات جزائرية محددة',
  'Serve all Algeria': 'أخدم كامل الجزائر',
  'This controls where the provider can appear in discovery and what travel expectation the customer sees.':
    'هذا يحدد أين يمكن أن يظهر المزوّد في الاستكشاف وما توقعات التنقل التي يراها الزبون.',
  'Served regions': 'الجهات المخدومة',
  'Business summary': 'ملخص النشاط',
  'Describe what you do, who you serve, and what makes your work reliable.':
    'اشرح ما الذي تقدمه، ولمن تقدمه، وما الذي يجعل عملك موثوقًا.',
  'This is optional but strongly recommended. It helps the provider profile avoid looking empty immediately after signup.':
    'هذا اختياري لكنه موصى به بشدة، لأنه يمنع ظهور ملف المزوّد فارغًا مباشرة بعد التسجيل.',
  'Why this onboarding is different': 'لماذا يختلف هذا الإعداد',
  'New provider accounts will already know their category, location, and experience level. That means moderation, discovery, and profile completion start with real signal instead of blank state cleanup.':
    'ستعرف حسابات المزوّد الجديدة تصنيفها وموقعها ومستوى خبرتها منذ البداية، ما يعني أن المراجعة والاستكشاف وإكمال الملف تبدأ بإشارات حقيقية بدل تنظيف حالة فارغة.',
  'Terms and moderation rules': 'شروط وقواعد المراجعة',
  'I agree to the marketplace terms, provider moderation process, and communication policies.':
    'أوافق على شروط السوق وآلية مراجعة المزوّدين وسياسات التواصل.',
  'Creating provider account...': 'جارٍ إنشاء حساب المزوّد...',
  'Local-first positioning': 'تموضع محلي أولاً',
  'Wilaya and city are captured from the start to improve local matching inside the Algerian marketplace.':
    'يتم التقاط الولاية والمدينة من البداية لتحسين المطابقة المحلية داخل السوق الجزائري.',
  'Review readiness': 'جاهزية للمراجعة',
  'Better initial context means the reviewer and admin workflows start with more useful provider data.':
    'السياق الأولي الأفضل يعني أن سير عمل المراجع والإدارة يبدأ ببيانات مزود أكثر فائدة.',
  'Delivery reach is explicit': 'نطاق الخدمة واضح',
  'Providers can declare whether they only serve their wilaya, selected regions, or all Algeria. This becomes a real ranking and visibility signal in search.':
    'يمكن للمزوّدين تحديد ما إذا كانوا يخدمون ولايتهم فقط أو جهات محددة أو كامل الجزائر. يصبح ذلك إشارة حقيقية للترتيب والظهور في البحث.',
  'Live marketplace data is temporarily unavailable. Showing curated examples.':
    'بيانات السوق الحية غير متاحة مؤقتًا. يتم عرض أمثلة منسقة.',
  Story: 'قصة',
  'Verified local professionals, trusted by customers':
    'محترفون محليون موثوقون ومعتمدون من الزبائن.',
  'Find the Right Professional': 'اعثر على المحترف المناسب',
  'for Your Needs': 'لاحتياجاتك',
  'Connect with trusted service providers in Algeria, compare quality signals, and move from search to request without friction.':
    'تواصل مع مزودي خدمات موثوقين في الجزائر، وقارن إشارات الجودة، وانتقل من البحث إلى الطلب دون احتكاك.',
  'What service do you need?': 'ما الخدمة التي تحتاجها؟',
  'Location / Wilaya': 'الموقع / الولاية',
  'All Categories': 'كل التصنيفات',
  Search: 'بحث',
  'Top Rated Professional': 'محترف الأعلى تقييمًا',
  'Top Rated': 'الأعلى تقييمًا',
  'Top Rated Professionals Near You': 'أفضل المحترفين تقييمًا بالقرب منك',
  'Professional Services': 'الخدمات المهنية',
  'Post Your Request': 'أرسل طلبك',
  'Start with a service request and collect quotes from verified professionals.':
    'ابدأ بطلب خدمة واجمع عروض أسعار من محترفين موثقين.',
  'Chat with Experts': 'تحدث مع الخبراء',
  'Instant messaging with providers and AI-assisted response handling.':
    'مراسلة فورية مع المزوّدين وإدارة ردود مدعومة بالذكاء الاصطناعي.',
  'Browse Verified Pros': 'تصفح المحترفين الموثقين',
  'Use location and quality filters to shortlist providers faster.':
    'استخدم فلاتر الموقع والجودة لاختصار قائمة المزوّدين بسرعة.',
  'Featured Service Providers': 'مزودو الخدمة المميزون',
  'Top visibility providers, ranked by featured status, trust signals, and quality.':
    'مزودون ذوو ظهور مرتفع، مرتّبون حسب التمييز وإشارات الثقة والجودة.',
  'Browse by Category': 'تصفح حسب التصنيف',
  'Discover trusted providers in this category.': 'اكتشف مزودين موثوقين في هذا التصنيف.',
  'Real trust signals from customers.': 'إشارات ثقة حقيقية من الزبائن.',
  'Excellent service. Found the right provider in minutes and the chat flow made the next step obvious.':
    'خدمة ممتازة. وجدت المزوّد المناسب خلال دقائق وجعل تدفق المحادثة الخطوة التالية واضحة.',
  'Public stories for everyone, private stories from providers you already trust':
    'قصص عامة للجميع وقصص خاصة من مزودين تثق بهم بالفعل.',
  'The top story rail now mixes public stories with favorite-only stories from providers you already saved.':
    'يجمع شريط القصص العلوي الآن بين القصص العامة والقصص المخصصة للمفضلة فقط من المزوّدين الذين حفظتهم مسبقًا.',
  'Click a story to view it, then reply directly into the conversation.':
    'اضغط على القصة لعرضها ثم رد مباشرة داخل المحادثة.',
  'No active stories are available right now.': 'لا توجد قصص نشطة متاحة الآن.',
  Fav: 'مفضلة',
  Pub: 'عام',
  'No recent review highlights are visible right now.': 'لا توجد أبرز مراجعات حديثة ظاهرة الآن.',
  'Public customer review': 'مراجعة عامة من زبون',
  'A rating was submitted without written feedback.': 'تم إرسال تقييم من دون تعليق مكتوب.',
  'General services': 'خدمات عامة',
  'Price based on scope': 'السعر حسب النطاق',
  'Open provider profile': 'افتح ملف المزوّد',
  'Current completion is': 'نسبة الاكتمال الحالية هي',
  'Push this above 90% to improve trust and conversion.':
    'ارفع هذا فوق 90٪ لتحسين الثقة والتحويل.',
  'Grow live services': 'نمِّ الخدمات المنشورة',
  'published out of': 'منشورة من أصل',
  'Keep draft inventory low.': 'أبقِ المخزون المسود منخفضًا.',
  'Stay responsive': 'ابقَ سريع الاستجابة',
  'Current response time is': 'زمن الرد الحالي هو',
  minutes: 'دقيقة',
  'Messages and AI reply settings affect conversion.':
    'تؤثر الرسائل وإعدادات الرد بالذكاء الاصطناعي على التحويل.',
  'Location not completed': 'الموقع غير مكتمل',
  'Provider cockpit': 'مقصورة المزوّد',
  'Update profile': 'حدّث الملف',
  'Manage services': 'أدر الخدمات',
  'Open inbox': 'افتح صندوق الوارد',
  'Profile completion': 'اكتمال الملف',
  'Response time': 'زمن الرد',
  min: 'د',
  'Avg. rating': 'متوسط التقييم',
  'Overall service inventory in your workspace.': 'إجمالي مخزون الخدمات في مساحة عملك.',
  'Services currently visible to customers.': 'الخدمات الظاهرة حاليًا للزبائن.',
  'Services with boosted visibility or premium positioning.':
    'خدمات بظهور معزز أو تموضع مميز.',
  'Public reviews that affect trust and discovery ranking.':
    'مراجعات عامة تؤثر في الثقة وترتيب الظهور.',
  'These areas influence how complete, responsive, and convertible the provider account feels.':
    'تؤثر هذه الجوانب في مدى اكتمال حساب المزوّد وسرعة استجابته وقابليته للتحويل.',
  'Premium capabilities that change how your account is seen in discovery.':
    'قدرات مميزة تغيّر كيفية ظهور حسابك في الاستكشاف.',
  'Homepage featuring is currently enabled.': 'إبراز الصفحة الرئيسية مفعّل حاليًا.',
  'Homepage featuring is currently off.': 'إبراز الصفحة الرئيسية غير مفعّل حاليًا.',
  'AI-assisted replies are active in the provider inbox.':
    'الردود المدعومة بالذكاء الاصطناعي مفعلة في صندوق وارد المزوّد.',
  'AI-assisted replies are available but not yet enabled.':
    'الردود المدعومة بالذكاء الاصطناعي متاحة لكنها غير مفعلة بعد.',
  'Response speed is': 'سرعة الرد هي',
  'minutes on average. Lower is better.': 'دقيقة في المتوسط. كلما كان أقل كان أفضل.',
  'Available now': 'متاح الآن',
  'Requires higher plan': 'يتطلب باقة أعلى',
  'Keep draft inventory low and make public offers easier to trust.':
    'أبقِ الخدمات المسودة قليلة واجعل العروض العامة أسهل في الثقة.',
  'Open services': 'افتح الخدمات',
  'No services exist yet. Create the first service to unlock the public conversion flow.':
    'لا توجد خدمات بعد. أنشئ أول خدمة لتفعيل مسار التحويل العام.',
  'Quick workspace links': 'روابط سريعة لمساحة العمل',
  'Each area has a different operational role. Jump directly to the right tool.':
    'لكل مساحة دور تشغيلي مختلف. انتقل مباشرة إلى الأداة المناسبة.',
  'Business identity, category, cover, avatar, and public positioning.':
    'هوية النشاط والتصنيف والغلاف والصورة والتموضع العام.',
  'Proof of work, comments, likes, and media-level visibility.':
    'نماذج العمل والتعليقات والإعجابات وظهور الوسائط.',
  'Featured logic, badges, and premium capability controls.':
    'منطق الإبراز والشارات وعناصر التحكم في القدرات المميزة.',
  'Failed to load the admin dashboard.': 'تعذر تحميل لوحة الإدارة.',
  'Admin dashboard data is not available.': 'بيانات لوحة الإدارة غير متاحة.',
  'Failed to load reviewer profile.': 'تعذر تحميل ملف المراجع.',
  'Reviewer profile unavailable.': 'ملف المراجع غير متاح.',
  'Reviewer profile data is not available.': 'بيانات ملف المراجع غير متاحة.',
  'Active account': 'حساب نشط',
  'Inactive account': 'حساب غير نشط',
  'Total reviewed': 'إجمالي ما تمت مراجعته',
  'All moderation decisions stored for this reviewer.': 'كل قرارات المراجعة المخزنة لهذا المراجع.',
  'Reviewed today': 'تمت مراجعته اليوم',
  'Decisions created since the start of today.': 'قرارات أُنشئت منذ بداية اليوم.',
  'Accounts approved by this reviewer so far.': 'الحسابات التي وافق عليها هذا المراجع حتى الآن.',
  reviewer: 'مراجع',
  'Failed to load provider review details.': 'تعذر تحميل تفاصيل مراجعة المزوّد.',
  'Decision posted to review thread.': 'تم نشر القرار في خيط المراجعة.',
  'Moderation decision saved.': 'تم حفظ قرار المراجعة.',
  'Failed to save the moderation decision.': 'تعذر حفظ قرار المراجعة.',
  'Provider review unavailable.': 'مراجعة المزوّد غير متاحة.',
  'No provider review data is available.': 'لا توجد بيانات مراجعة مزوّد متاحة.',
});

Object.assign(TRANSLATIONS.fr, {
  'Please enter your email and password.': 'Veuillez saisir votre e-mail et votre mot de passe.',
  'Logged in successfully.': 'Connexion reussie.',
  'Login failed.': 'Echec de connexion.',
  'Access your workspace': 'Acceder a votre espace',
  'Sign in and continue from the exact point you stopped':
    'Connectez-vous et reprenez exactement ou vous vous etiez arrete.',
  'Messages, requests, provider actions, and public intent are preserved when a redirect target exists.':
    'Les messages, demandes, actions prestataire et intentions publiques sont preserves lorsqu une redirection existe.',
  'A production marketplace needs zero-friction authentication':
    'Une marketplace en production a besoin d une authentification sans friction.',
  'Authentication should not break discovery or conversion. This flow keeps the user inside the same journey instead of forcing a fresh start.':
    'L authentification ne doit pas casser la decouverte ni la conversion. Ce flux garde l utilisateur dans le meme parcours.',
  'Discovery-safe': 'Compatible decouverte',
  'Public-first': 'Public d abord',
  'Guests can browse first, then authenticate only when an action needs it.':
    'Les visiteurs peuvent d abord parcourir puis se connecter seulement lorsqu une action le demande.',
  'Intent preserved': 'Intention preservee',
  Yes: 'Oui',
  Default: 'Defaut',
  'Protected actions send the user back to the correct page after sign in.':
    'Les actions protegees renvoient l utilisateur vers la bonne page apres connexion.',
  'Role aware': 'Sensible au role',
  'Customer / Provider': 'Client / Prestataire',
  'Successful sign in lands the user in the correct workspace automatically.':
    'Une connexion reussie place automatiquement l utilisateur dans le bon espace.',
  'Need a customer account?': 'Besoin d un compte client ?',
  'Authentication note': 'Note d authentification',
  'Provider and customer accounts use the same secure entry point, then split into role-specific workspaces after authentication.':
    'Les comptes client et prestataire utilisent la meme entree securisee puis se separent vers des espaces dedies.',
  'Signing in...': 'Connexion...',
  'Sign In': 'Se connecter',
  'Search, shortlist, message providers, and create requests.':
    'Recherchez, shortlistez, contactez les prestataires et creez des demandes.',
  'Publish services, manage requests, and use AI-assisted communication.':
    'Publiez des services, gerez les demandes et utilisez une communication assistee par IA.',
  'Customer onboarding': 'Onboarding client',
  'Create a customer account that is ready to act':
    'Creer un compte client pret a agir',
  'The goal is not just account creation. It is getting the user into discovery, messaging, and requests with minimal friction.':
    'L objectif n est pas seulement de creer un compte mais d amener l utilisateur vers decouverte, messagerie et demandes avec un minimum de friction.',
  'Customers should convert from search to request without setup fatigue':
    'Les clients doivent passer de la recherche a la demande sans fatigue de configuration.',
  Discovery: 'Decouverte',
  'Message directly': 'Ecrire directement',
  'Chat ready': 'Pret a discuter',
  'Open provider conversations immediately after signup.':
    'Ouvrir les conversations prestataire immediatement apres inscription.',
  'Already have an account?': 'Vous avez deja un compte ?',
  'Join as provider': 'Rejoindre comme prestataire',
  'First name': 'Prenom',
  'Last name': 'Nom',
  'Email address': 'Adresse e-mail',
  'Phone number': 'Numero de telephone',
  'Optional now, but useful when providers need a faster follow-up channel.':
    'Optionnel pour l instant, mais utile lorsque les prestataires ont besoin d un canal de suivi plus rapide.',
  'Confirm password': 'Confirmer le mot de passe',
  'What happens next': 'Ce qui se passe ensuite',
  'After signup, the customer account goes directly into the dashboard or returns to the saved action if this signup started from a provider page.':
    'Apres inscription, le compte client va directement au tableau de bord ou revient a l action sauvegardee.',
  'Terms and privacy': 'Conditions et confidentialite',
  'I agree to the marketplace terms, privacy rules, and communication policies.':
    'J accepte les conditions de la marketplace, les regles de confidentialite et les politiques de communication.',
  'Creating account...': 'Creation du compte...',
  'Search and compare': 'Rechercher et comparer',
  'Browse public providers first, then take action only when needed.':
    'Parcourez d abord les prestataires publics, puis agissez seulement quand necessaire.',
  'Protected continuity': 'Continuite protegee',
  'Redirect-aware authentication avoids losing the request or message the customer started.':
    'Une authentification consciente de la redirection evite de perdre la demande ou le message commence.',
  'Failed to create customer account.': 'Echec de creation du compte client.',
  'Customer account created successfully.': 'Compte client cree avec succes.',
  'First name is required.': 'Le prenom est requis.',
  'Last name is required.': 'Le nom est requis.',
  'Email is required.': 'L e-mail est requis.',
  'Password is required.': 'Le mot de passe est requis.',
  'Use at least 8 characters with uppercase, lowercase, number, and special character.':
    'Utilisez au moins 8 caracteres avec majuscule, minuscule, chiffre et caractere special.',
  'Please confirm your password.': 'Veuillez confirmer votre mot de passe.',
  'Passwords do not match.': 'Les mots de passe ne correspondent pas.',
  'You must accept the terms.': 'Vous devez accepter les conditions.',
  'Provider onboarding': 'Onboarding prestataire',
  'Failed to load categories for provider onboarding.':
    'Echec du chargement des categories pour l onboarding prestataire.',
  'Business name is required.': 'Le nom commercial est requis.',
  'Primary category is required.': 'La categorie principale est requise.',
  'Region is required.': 'La region est requise.',
  'Wilaya is required.': 'La wilaya est requise.',
  'City is required.': 'La ville est requise.',
  'Select at least one served region.': 'Selectionnez au moins une region servie.',
  'Years of experience is required.': 'Les annees d experience sont requises.',
  'Years of experience must be zero or more.': 'Les annees d experience doivent etre egales ou superieures a zero.',
  'Provider account created successfully.': 'Compte prestataire cree avec succes.',
  'Failed to create provider account.': 'Echec de creation du compte prestataire.',
  'Join as a service provider with enough context to look real on day one':
    'Rejoindre comme prestataire avec assez de contexte pour sembler reel des le premier jour.',
  'Provider signup should not create empty profiles. This flow captures the minimum viable business identity required for a credible marketplace launch.':
    'L inscription prestataire ne doit pas creer de profils vides. Ce flux capture l identite minimale necessaire pour un lancement credible.',
  'A provider account should start with real business context, not blank placeholders':
    'Un compte prestataire doit commencer avec un vrai contexte metier, pas des champs vides.',
  'The platform becomes more unique when providers are locally grounded from the first minute: category, wilaya, city, experience, and business summary.':
    'La plateforme gagne en valeur lorsque les prestataires sont ancrés localement des la premiere minute.',
  'Moderation ready': 'Pret pour moderation',
  'Higher onboarding completeness makes review and approval more meaningful immediately.':
    'Un onboarding plus complet rend la revue et l approbation plus pertinentes immediatement.',
  'Discovery placement': 'Placement en decouverte',
  Categorized: 'Categorise',
  'Inbox growth path': 'Parcours de croissance de la boite',
  'AI assisted': 'Assiste par IA',
  'Looking for services instead?': 'Vous cherchez plutot des services ?',
  'Business name': 'Nom commercial',
  'Professional email': 'E-mail professionnel',
  'Primary category': 'Categorie principale',
  'Select category': 'Selectionner une categorie',
  'Years of experience': 'Annees d experience',
  'Marketplace region': 'Region marketplace',
  'Select region': 'Selectionner une region',
  'Select wilaya': 'Selectionner une wilaya',
  City: 'Ville',
  'Service coverage': 'Zone de service',
  'Serve only my wilaya': 'Servir seulement ma wilaya',
  'Serve selected Algerian regions': 'Servir des regions algeriennes selectionnees',
  'Serve all Algeria': 'Servir toute l Algerie',
  'This controls where the provider can appear in discovery and what travel expectation the customer sees.':
    'Cela controle ou le prestataire apparait en decouverte et quelle attente de deplacement voit le client.',
  'Served regions': 'Regions servies',
  'Business summary': 'Resume d activite',
  'Describe what you do, who you serve, and what makes your work reliable.':
    'Decrivez ce que vous faites, pour qui, et ce qui rend votre travail fiable.',
  'This is optional but strongly recommended. It helps the provider profile avoid looking empty immediately after signup.':
    'C est optionnel mais fortement recommande. Cela evite qu un profil prestataire paraisse vide apres inscription.',
  'Why this onboarding is different': 'Pourquoi cet onboarding est different',
  'New provider accounts will already know their category, location, and experience level. That means moderation, discovery, and profile completion start with real signal instead of blank state cleanup.':
    'Les nouveaux comptes prestataire auront deja categorie, localisation et niveau d experience.',
  'Terms and moderation rules': 'Conditions et regles de moderation',
  'I agree to the marketplace terms, provider moderation process, and communication policies.':
    'J accepte les conditions de la marketplace, le processus de moderation prestataire et les politiques de communication.',
  'Creating provider account...': 'Creation du compte prestataire...',
  'Local-first positioning': 'Positionnement local d abord',
  'Wilaya and city are captured from the start to improve local matching inside the Algerian marketplace.':
    'La wilaya et la ville sont capturees des le debut pour ameliorer la mise en relation locale.',
  'Review readiness': 'Pret pour revue',
  'Better initial context means the reviewer and admin workflows start with more useful provider data.':
    'Un meilleur contexte initial rend les workflows relecteur/admin plus utiles.',
  'Delivery reach is explicit': 'Portee de service explicite',
  'Providers can declare whether they only serve their wilaya, selected regions, or all Algeria. This becomes a real ranking and visibility signal in search.':
    'Les prestataires peuvent declarer s ils servent seulement leur wilaya, des regions selectionnees ou toute l Algerie.',
  'Live marketplace data is temporarily unavailable. Showing curated examples.':
    'Les donnees live de la marketplace sont temporairement indisponibles. Exemples organises affiches.',
  Story: 'Story',
  'Verified local professionals, trusted by customers':
    'Professionnels locaux verifies et approuves par les clients.',
  'Find the Right Professional': 'Trouvez le bon professionnel',
  'for Your Needs': 'pour vos besoins',
  'Connect with trusted service providers in Algeria, compare quality signals, and move from search to request without friction.':
    'Connectez-vous a des prestataires fiables en Algerie, comparez les signaux de qualite et passez de la recherche a la demande sans friction.',
  'What service do you need?': 'De quel service avez-vous besoin ?',
  'Location / Wilaya': 'Localisation / Wilaya',
  'All Categories': 'Toutes les categories',
  'Top Rated Professional': 'Professionnel tres bien note',
  'Top Rated': 'Tres bien note',
  'Top Rated Professionals Near You': 'Professionnels tres bien notes pres de chez vous',
  'Professional Services': 'Services professionnels',
  'Post Your Request': 'Publier votre demande',
  'Start with a service request and collect quotes from verified professionals.':
    'Commencez par une demande de service et recevez des devis de professionnels verifies.',
  'Chat with Experts': 'Discuter avec des experts',
  'Instant messaging with providers and AI-assisted response handling.':
    'Messagerie instantanee avec les prestataires et gestion de reponses assistees par IA.',
  'Browse Verified Pros': 'Parcourir les pros verifies',
  'Use location and quality filters to shortlist providers faster.':
    'Utilisez les filtres de localisation et de qualite pour shortlister plus vite.',
  'Featured Service Providers': 'Prestataires mis en avant',
  'Top visibility providers, ranked by featured status, trust signals, and quality.':
    'Prestataires a forte visibilite, classes selon mise en avant, confiance et qualite.',
  'Browse by Category': 'Parcourir par categorie',
  'Discover trusted providers in this category.': 'Decouvrez des prestataires fiables dans cette categorie.',
  'Real trust signals from customers.': 'Vrais signaux de confiance venant des clients.',
  'Excellent service. Found the right provider in minutes and the chat flow made the next step obvious.':
    'Excellent service. Le bon prestataire a ete trouve en quelques minutes et le chat a rendu la suite evidente.',
  'Public stories for everyone, private stories from providers you already trust':
    'Stories publiques pour tous, stories privees venant de prestataires deja dignes de confiance.',
  'The top story rail now mixes public stories with favorite-only stories from providers you already saved.':
    'Le rail principal melange maintenant stories publiques et stories reservees aux favoris.',
  'Click a story to view it, then reply directly into the conversation.':
    'Cliquez sur une story pour la voir puis repondez directement dans la conversation.',
  'No active stories are available right now.': 'Aucune story active n est disponible pour le moment.',
  Fav: 'Fav',
  Pub: 'Pub',
  'No recent review highlights are visible right now.':
    'Aucun extrait recent d avis n est visible pour le moment.',
  'Public customer review': 'Avis public de client',
  'A rating was submitted without written feedback.': 'Une note a ete envoyee sans commentaire ecrit.',
  'General services': 'Services generaux',
  'Price based on scope': 'Prix selon le perimetre',
  'Open provider profile': 'Ouvrir le profil prestataire',
  'Current completion is': 'Le taux actuel est',
  'Push this above 90% to improve trust and conversion.':
    'Faites monter cela au-dessus de 90% pour ameliorer confiance et conversion.',
  'Grow live services': 'Developper les services actifs',
  'published out of': 'publies sur',
  'Keep draft inventory low.': 'Gardez peu de brouillons.',
  'Stay responsive': 'Rester reactif',
  'Current response time is': 'Le temps de reponse actuel est de',
  minutes: 'minutes',
  'Messages and AI reply settings affect conversion.':
    'Les messages et les reglages de reponse IA influencent la conversion.',
  'Location not completed': 'Localisation non completee',
  'Provider cockpit': 'Cockpit prestataire',
  'Update profile': 'Mettre a jour le profil',
  'Manage services': 'Gerer les services',
  'Open inbox': 'Ouvrir la boite',
  'Profile completion': 'Completion du profil',
  'Response time': 'Temps de reponse',
  min: 'min',
  'Avg. rating': 'Note moyenne',
  'Overall service inventory in your workspace.': 'Inventaire global des services dans votre espace.',
  'Services currently visible to customers.': 'Services actuellement visibles pour les clients.',
  'Services with boosted visibility or premium positioning.':
    'Services avec visibilite renforcee ou positionnement premium.',
  'Public reviews that affect trust and discovery ranking.':
    'Avis publics qui influencent la confiance et le classement en decouverte.',
  'These areas influence how complete, responsive, and convertible the provider account feels.':
    'Ces zones influencent la perception de completude, reactivite et conversion du compte prestataire.',
  'Premium capabilities that change how your account is seen in discovery.':
    'Fonctionnalites premium qui changent la facon dont votre compte est vu en decouverte.',
  'Homepage featuring is currently enabled.': 'La mise en avant sur la page d accueil est active.',
  'Homepage featuring is currently off.': 'La mise en avant sur la page d accueil est inactive.',
  'AI-assisted replies are active in the provider inbox.':
    'Les reponses assistees par IA sont actives dans la boite prestataire.',
  'AI-assisted replies are available but not yet enabled.':
    'Les reponses assistees par IA sont disponibles mais pas encore activees.',
  'Response speed is': 'La vitesse de reponse est de',
  'minutes on average. Lower is better.': 'minutes en moyenne. Plus c est bas, mieux c est.',
  'Available now': 'Disponible maintenant',
  'Requires higher plan': 'Necessite un plan superieur',
  'Keep draft inventory low and make public offers easier to trust.':
    'Gardez peu de brouillons et rendez les offres publiques plus fiables.',
  'Open services': 'Ouvrir les services',
  'No services exist yet. Create the first service to unlock the public conversion flow.':
    'Aucun service n existe encore. Creez le premier service pour ouvrir le parcours public.',
  'Quick workspace links': 'Liens rapides de l espace',
  'Each area has a different operational role. Jump directly to the right tool.':
    'Chaque zone a un role operationnel different. Allez directement au bon outil.',
  'Business identity, category, cover, avatar, and public positioning.':
    'Identite metier, categorie, couverture, avatar et positionnement public.',
  'Proof of work, comments, likes, and media-level visibility.':
    'Preuves de travail, commentaires, likes et visibilite au niveau du media.',
  'Featured logic, badges, and premium capability controls.':
    'Logique de mise en avant, badges et controles premium.',
  'Failed to load the admin dashboard.': 'Echec du chargement du tableau admin.',
  'Admin dashboard data is not available.': 'Les donnees du tableau admin ne sont pas disponibles.',
  'Failed to load reviewer profile.': 'Echec du chargement du profil relecteur.',
  'Reviewer profile unavailable.': 'Profil relecteur indisponible.',
  'Reviewer profile data is not available.': 'Les donnees du profil relecteur ne sont pas disponibles.',
  'Active account': 'Compte actif',
  'Inactive account': 'Compte inactif',
  'Total reviewed': 'Total relu',
  'All moderation decisions stored for this reviewer.':
    'Toutes les decisions de moderation enregistrees pour ce relecteur.',
  'Reviewed today': 'Relu aujourd hui',
  'Decisions created since the start of today.':
    'Decisions creees depuis le debut de la journee.',
  'Accounts approved by this reviewer so far.':
    'Comptes approuves par ce relecteur jusqu a present.',
  reviewer: 'relecteur',
  'Failed to load provider review details.': 'Echec du chargement des details de revue prestataire.',
  'Decision posted to review thread.': 'Decision publiee dans le fil de revue.',
  'Moderation decision saved.': 'Decision de moderation enregistree.',
  'Failed to save the moderation decision.': 'Echec de l enregistrement de la decision de moderation.',
  'Provider review unavailable.': 'Revue prestataire indisponible.',
  'No provider review data is available.': 'Aucune donnee de revue prestataire n est disponible.',
});

const normalizeTranslationKey = (value: string) => value.replace(/\s+/g, ' ').trim();

const TRANSLATION_MAPS: Record<'ar' | 'fr', Map<string, string>> = {
  ar: new Map(
    Object.entries(TRANSLATIONS.ar).map(([key, value]) => [normalizeTranslationKey(key), value])
  ),
  fr: new Map(
    Object.entries(TRANSLATIONS.fr).map(([key, value]) => [normalizeTranslationKey(key), value])
  ),
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PHRASE_TRANSLATIONS: Record<'ar' | 'fr', Array<[string, string]>> = {
  ar: [
    [' published out of ', ' منشورة من أصل '],
    [' average rating', ' متوسط التقييم'],
    [' interests', ' اهتمامات'],
    [' reviews', ' تقييمات'],
    [' review', ' تقييم'],
    [' services', ' خدمات'],
    [' service', ' خدمة'],
    [' rating', ' تقييم'],
    [' min', ' د'],
  ],
  fr: [
    [' published out of ', ' publiés sur '],
    [' average rating', ' note moyenne'],
    [' interests', ' centres d’intérêt'],
    [' reviews', ' avis'],
    [' review', ' avis'],
    [' services', ' services'],
    [' service', ' service'],
    [' rating', ' note'],
    [' min', ' min'],
  ],
};

const translateCoreValue = (language: AppLanguage, value: string): string => {
  if (language === 'en') {
    return value;
  }

  const normalized = normalizeTranslationKey(value);
  if (!normalized) {
    return value;
  }

  const direct = TRANSLATION_MAPS[language].get(normalized);
  if (direct) {
    return direct;
  }

  const separators = [' | ', ' • ', ' â€¢ ', ' / '];
  for (const separator of separators) {
    if (value.includes(separator)) {
      return value
        .split(separator)
        .map((segment) => translateCoreValue(language, segment))
        .join(separator);
    }
  }

  if (value.endsWith(':')) {
    const withoutColon = value.slice(0, -1);
    const translated = translateCoreValue(language, withoutColon);
    if (translated !== withoutColon) {
      return `${translated}:`;
    }
  }

  let partialValue = value;
  for (const [source, target] of PHRASE_TRANSLATIONS[language]) {
    if (!partialValue.includes(source)) {
      continue;
    }

    partialValue = partialValue.replace(new RegExp(escapeRegExp(source), 'g'), target);
  }

  if (partialValue !== value) {
    return partialValue;
  }

  return value;
};

const translateValuePreservingWhitespace = (language: AppLanguage, value: string) => {
  const match = value.match(/^(\s*)(.*?)(\s*)$/s);

  if (!match) {
    return translateCoreValue(language, value);
  }

  const [, leadingWhitespace, coreValue, trailingWhitespace] = match;
  const translatedCore = translateCoreValue(language, coreValue);

  return `${leadingWhitespace}${translatedCore}${trailingWhitespace}`;
};

const shouldSkipTextNode = (node: Text) => {
  const parent = node.parentElement;

  if (!parent) {
    return true;
  }

  if (parent.closest('[data-i18n-ignore="true"]')) {
    return true;
  }

  if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parent.tagName)) {
    return true;
  }

  return parent.isContentEditable;
};

const applyLanguageToTextNode = (node: Text, language: AppLanguage) => {
  if (shouldSkipTextNode(node)) {
    return;
  }

  const currentValue = node.nodeValue || '';
  const originalValue = originalTextNodeValues.get(node) ?? currentValue;

  if (!originalTextNodeValues.has(node)) {
    originalTextNodeValues.set(node, currentValue);
  }

  const nextValue =
    language === 'en' ? originalValue : translateValuePreservingWhitespace(language, originalValue);

  if (currentValue !== nextValue) {
    node.nodeValue = nextValue;
  }
};

const applyLanguageToElementAttributes = (element: Element, language: AppLanguage) => {
  const attributeStore = originalAttributeValues.get(element) ?? new Map<string, string>();

  if (!originalAttributeValues.has(element)) {
    originalAttributeValues.set(element, attributeStore);
  }

  TRANSLATABLE_ATTRIBUTES.forEach((attributeName) => {
    const currentValue = element.getAttribute(attributeName);

    if (currentValue === null) {
      return;
    }

    const originalValue = attributeStore.get(attributeName) ?? currentValue;
    if (!attributeStore.has(attributeName)) {
      attributeStore.set(attributeName, currentValue);
    }

    const nextValue =
      language === 'en'
        ? originalValue
        : translateValuePreservingWhitespace(language, originalValue);

    if (currentValue !== nextValue) {
      element.setAttribute(attributeName, nextValue);
    }
  });
};

const applyLanguageToNode = (node: Node, language: AppLanguage) => {
  if (node.nodeType === Node.TEXT_NODE) {
    applyLanguageToTextNode(node as Text, language);
    return;
  }

  if (!(node instanceof Element)) {
    return;
  }

  applyLanguageToElementAttributes(node, language);

  const textWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let currentTextNode = textWalker.nextNode();

  while (currentTextNode) {
    applyLanguageToTextNode(currentTextNode as Text, language);
    currentTextNode = textWalker.nextNode();
  }

  node.querySelectorAll('*').forEach((element) => {
    applyLanguageToElementAttributes(element, language);
  });
};

const resolveInitialLanguage = (): AppLanguage => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ar' || stored === 'fr' || stored === 'en') {
    return stored;
  }

  const browserLanguage = (navigator.language || '').toLowerCase();
  if (browserLanguage.startsWith('ar')) {
    return 'ar';
  }

  if (browserLanguage.startsWith('fr')) {
    return 'fr';
  }

  return 'en';
};

interface I18nContextValue {
  language: AppLanguage;
  locale: string;
  dir: 'rtl' | 'ltr';
  setLanguage: (language: AppLanguage) => void;
  t: (value?: string | null) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const translateText = (language: AppLanguage, value: string) => {
  return translateCoreValue(language, value);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(resolveInitialLanguage);

  useEffect(() => {
    const meta = LANGUAGE_META[language];
    document.documentElement.lang = meta.locale;
    document.documentElement.dir = meta.dir;
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    const body = document.body;
    if (!body) {
      return;
    }

    const applyToDocument = (target?: Node) => {
      if (target) {
        applyLanguageToNode(target, language);
        return;
      }

      applyLanguageToNode(body, language);
    };

    applyToDocument();

    const observer = new MutationObserver((mutations) => {
      observer.disconnect();

      mutations.forEach((mutation) => {
        applyToDocument(mutation.target);
        mutation.addedNodes.forEach((addedNode) => {
          applyToDocument(addedNode);
        });
      });

      observer.observe(body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
      });
    });

    observer.observe(body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      locale: LANGUAGE_META[language].locale,
      dir: LANGUAGE_META[language].dir,
      setLanguage: setLanguageState,
      t: (rawValue?: string | null) => {
        if (!rawValue) {
          return '';
        }

        return translateText(language, rawValue);
      },
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used inside LanguageProvider');
  }

  return context;
};
