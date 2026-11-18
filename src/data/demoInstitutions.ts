import type { AdmissionCategoryId, DemoInstitution } from '../types/domain';

export interface AdmissionCategoryMeta {
  id: AdmissionCategoryId;
  titleKey: 'catPublic' | 'catPrivate' | 'catMedical' | 'catGst' | 'catEngineering' | 'catNational';
  descKey:
    | 'catPublicDesc'
    | 'catPrivateDesc'
    | 'catMedicalDesc'
    | 'catGstDesc'
    | 'catEngineeringDesc'
    | 'catNationalDesc';
}

export const ADMISSION_CATEGORIES: AdmissionCategoryMeta[] = [
  { id: 'public', titleKey: 'catPublic', descKey: 'catPublicDesc' },
  { id: 'private', titleKey: 'catPrivate', descKey: 'catPrivateDesc' },
  { id: 'medical', titleKey: 'catMedical', descKey: 'catMedicalDesc' },
  { id: 'gst', titleKey: 'catGst', descKey: 'catGstDesc' },
  { id: 'engineering', titleKey: 'catEngineering', descKey: 'catEngineeringDesc' },
  { id: 'national', titleKey: 'catNational', descKey: 'catNationalDesc' },
];

export const DEMO_INSTITUTIONS: DemoInstitution[] = [
  {
    id: 'diu',
    code: 'DIU',
    nameEn: 'Daffodil International University',
    nameBn: 'ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি',
    shortNoteEn: 'UGC-approved private university offering engineering, business, and computing programs.',
    shortNoteBn: 'প্রকৌশল, ব্যবসায় শিক্ষা ও কম্পিউটিং প্রোগ্রামসমৃদ্ধ ইউজিসি অনুমোদিত প্রাইভেট বিশ্ববিদ্যালয়।',
    locationEn: 'Savar, Dhaka',
    locationBn: 'সাভার, ঢাকা',
    category: 'private',
    institutionType: 'Private University',
    institutionTypeBn: 'প্রাইভেট বিশ্ববিদ্যালয়',
    sampleProgramsEn: ['B.Sc. in CSE', 'BBA', 'B.Sc. in Software Engineering'],
    sampleProgramsBn: ['বিএসসি ইন সিএসই', 'বিবিএ', 'বিএসসি ইন সফটওয়্যার ইঞ্জিনিয়ারিং'],
    deadlineLabelEn: 'Sample / Not Verified — Pending Official Circular',
    deadlineLabelBn: 'নমুনা / অযাচাইকৃত — অফিশিয়াল সার্কুলার অপেক্ষমাণ',
    officialWebsite: 'https://daffodilvarsity.edu.bd',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Central_Field_of_Daffodil_University.jpg/250px-Central_Field_of_Daffodil_University.jpg',
    imageAltEn: 'Daffodil International University permanent campus in Savar, Dhaka',
    imageAltBn: 'সাভার, ঢাকায় ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটির স্থায়ী ক্যাম্পাস',
    isDemo: true,
    verificationStatus: 'sample_not_verified',
  },
  {
    id: 'buet',
    code: 'BUET',
    nameEn: 'Bangladesh University of Engineering and Technology',
    nameBn: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)',
    shortNoteEn: 'Premier public engineering university in Bangladesh with specialized pre-selection & written tests.',
    shortNoteBn: 'প্রাথমিক বাছাই ও লিখিত ভর্তি পরীক্ষাসহ বাংলাদেশের শীর্ষস্থানীয় সরকারি প্রকৌশল বিশ্ববিদ্যালয়।',
    locationEn: 'Polashi, Dhaka',
    locationBn: 'পলাশী, ঢাকা',
    category: 'engineering',
    institutionType: 'Engineering University',
    institutionTypeBn: 'প্রকৌশল বিশ্ববিদ্যালয়',
    sampleProgramsEn: ['B.Sc. in CSE', 'B.Sc. in EEE', 'B.Sc. in Civil Engineering'],
    sampleProgramsBn: ['সিএসই', 'ইইই', 'সিভিল ইঞ্জিনিয়ারিং'],
    deadlineLabelEn: 'Sample / Not Verified — Pending Official Circular',
    deadlineLabelBn: 'নমুনা / অযাচাইকৃত — অফিশিয়াল সার্কুলার অপেক্ষমাণ',
    officialWebsite: 'https://www.buet.ac.bd',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/BUET_main_gate_3.jpg/500px-BUET_main_gate_3.jpg',
    imageAltEn: 'Bangladesh University of Engineering and Technology (BUET) main gate, Dhaka',
    imageAltBn: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়ের (বুয়েট) প্রধান ফটক, ঢাকা',
    isDemo: true,
    verificationStatus: 'sample_not_verified',
  },
  {
    id: 'dmc',
    code: 'DMC',
    nameEn: 'Dhaka Medical College',
    nameBn: 'ঢাকা মেডিকেল কলেজ',
    shortNoteEn: 'Leading government medical college in Bangladesh. Categorized strictly as a Medical College, not a university.',
    shortNoteBn: 'বাংলাদেশের শীর্ষ সরকারি মেডিকেল কলেজ। এটি একটি মেডিকেল কলেজ, বিশ্ববিদ্যালয় নয়।',
    locationEn: 'Bakshibazar, Dhaka',
    locationBn: 'বকশীবাজার, ঢাকা',
    category: 'medical',
    institutionType: 'Medical College',
    institutionTypeBn: 'মেডিকেল কলেজ',
    sampleProgramsEn: ['MBBS (Under DGME Admission)'],
    sampleProgramsBn: ['এমবিবিএস (ডিজিএমই ভর্তি প্রক্রিয়া)'],
    deadlineLabelEn: 'Sample / Not Verified — Pending Official DGME Circular',
    deadlineLabelBn: 'নমুনা / অযাচাইকৃত — ডিজিএমই সার্কুলার অপেক্ষমাণ',
    officialWebsite: 'https://dmc.gov.bd',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Dhakamedicalcollege.jpg/500px-Dhakamedicalcollege.jpg',
    imageAltEn: 'Dhaka Medical College main academic and hospital building, Dhaka',
    imageAltBn: 'ঢাকা মেডিকেল কলেজের মূল ভবন, ঢাকা',
    isDemo: true,
    verificationStatus: 'sample_not_verified',
  },
  {
    id: 'du',
    code: 'DU',
    nameEn: 'University of Dhaka',
    nameBn: 'ঢাকা বিশ্ববিদ্যালয়',
    shortNoteEn: 'Autonomous public research university conducting unit-wise undergraduate admission examinations.',
    shortNoteBn: 'ইউনিটভিত্তিক স্নাতক ভর্তি পরীক্ষাসহ বাংলাদেশের স্বায়ত্তশাসিত সরকারি গবেষণা বিশ্ববিদ্যালয়।',
    locationEn: 'Nilkhet, Dhaka',
    locationBn: 'নীলক্ষেত, ঢাকা',
    category: 'public',
    institutionType: 'Public University',
    institutionTypeBn: 'পাবলিক বিশ্ববিদ্যালয়',
    sampleProgramsEn: ['Unit A (Science)', 'Unit B (Arts, Law & Social Sciences)', 'Unit C (Business Studies)'],
    sampleProgramsBn: ['ক ইউনিট (বিজ্ঞান)', 'খ ইউনিট (কলা, আইন ও সামাজিক বিজ্ঞান)', 'গ ইউনিট (ব্যবসায় শিক্ষা)'],
    deadlineLabelEn: 'Sample / Not Verified — Pending Official Circular',
    deadlineLabelBn: 'নমুনা / অযাচাইকৃত — অফিশিয়াল সার্কুলার অপেক্ষমাণ',
    officialWebsite: 'https://admission.eis.du.ac.bd',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Dhaka_University_Central_Library.jpg/500px-Dhaka_University_Central_Library.jpg',
    imageAltEn: 'Dhaka University Central Library at the University of Dhaka, Bangladesh',
    imageAltBn: 'ঢাকা বিশ্ববিদ্যালয়ের কেন্দ্রীয় গ্রন্থাগার ভবন',
    isDemo: true,
    verificationStatus: 'sample_not_verified',
  },
];

export function filterDemoInstitutions(
  institutions: DemoInstitution[],
  query: string,
  category: AdmissionCategoryId | 'all'
): DemoInstitution[] {
  const normalizedQuery = query.trim().toLowerCase();

  return institutions.filter((inst) => {
    const matchesCategory = category === 'all' || inst.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const searchable = [
      inst.code,
      inst.nameEn,
      inst.nameBn,
      inst.locationEn,
      inst.locationBn,
      inst.institutionType,
      inst.institutionTypeBn,
      ...inst.sampleProgramsEn,
      ...inst.sampleProgramsBn,
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalizedQuery);
  });
}

export function countSeededUniversitiesExcludingMedicalCollege(institutions: DemoInstitution[]): number {
  return institutions.filter((inst) => inst.institutionType !== 'Medical College').length;
}
