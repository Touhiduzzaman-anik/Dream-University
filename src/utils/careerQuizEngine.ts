import { BANGLADESH_INSTITUTIONS_CATALOG } from '../data/bangladeshInstitutions';
import type { AdmissionCategoryId } from '../types/domain';

export const WHATSAPP_PHONE_DISPLAY = '01753653351';
export const WHATSAPP_CONTACT_URL =
  'https://wa.me/8801753653351?text=Hello%20Dream%20University%20Team%2C%20I%20need%20admission%20guidance.';

export const CAREER_QUIZ_STORAGE_KEY = 'du_saved_career_quiz_result_v1';

export type SubjectTrackId =
  | 'cse'
  | 'eee'
  | 'medical'
  | 'pharmacy'
  | 'bba'
  | 'economics'
  | 'law'
  | 'english_media'
  | 'architecture';

export type QuizSectionId = 'interests' | 'work_style' | 'future_jobs';

export interface QuizOption {
  id: string;
  labelEn: string;
  labelBn: string;
  traitTagEn: string;
  traitTagBn: string;
  weights: Partial<Record<SubjectTrackId, number>>;
}

export interface QuizQuestion {
  id: number;
  section: QuizSectionId;
  sectionLabelEn: string;
  sectionLabelBn: string;
  promptEn: string;
  promptBn: string;
  options: [QuizOption, QuizOption, QuizOption, QuizOption];
}

export interface RecommendedUniversityItem {
  code: string;
  nameEn: string;
  nameBn: string;
  category: AdmissionCategoryId;
  officialWebsite: string;
}

export interface SubjectTrackProfile {
  id: SubjectTrackId;
  titleEn: string;
  titleBn: string;
  degreeBadgeEn: string;
  degreeBadgeBn: string;
  coreInterestEn: string;
  coreInterestBn: string;
  jobOutlookEn: string;
  jobOutlookBn: string;
  demandHighlightsEn: string[];
  demandHighlightsBn: string[];
  universityCodes: string[];
}

export interface SubjectMatchResult {
  id: SubjectTrackId;
  titleEn: string;
  titleBn: string;
  degreeBadgeEn: string;
  degreeBadgeBn: string;
  matchPercentage: number;
  whyItFitsEn: string;
  whyItFitsBn: string;
  jobOutlookEn: string;
  jobOutlookBn: string;
  demandHighlightsEn: string[];
  demandHighlightsBn: string[];
  topUniversities: RecommendedUniversityItem[];
}

export interface CareerQuizEvaluation {
  answeredCount: number;
  totalQuestions: number;
  completedAtIso: string;
  topSubjects: SubjectMatchResult[];
  dominantTraitsEn: string[];
  dominantTraitsBn: string[];
}

export const SUBJECT_TRACK_CATALOG: Record<SubjectTrackId, SubjectTrackProfile> = {
  cse: {
    id: 'cse',
    titleEn: 'Computer Science & Engineering (CSE / AI)',
    titleBn: 'কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং (সিএসই / এআই)',
    degreeBadgeEn: 'B.Sc. Engineering · Science & Logic',
    degreeBadgeBn: 'বিএসসি ইঞ্জিনিয়ারিং · বিজ্ঞান ও লজিক',
    coreInterestEn: 'software systems, algorithmic problem solving, AI automation, and digital product engineering',
    coreInterestBn: 'সফটওয়্যার সিস্টেম, অ্যালগরিদমিক সমস্যা সমাধান, এআই অটোমেশন এবং ডিজিটাল পণ্য তৈরি',
    jobOutlookEn:
      '2026–2035 Outlook: Highest global remote and local demand across AI engineering, cloud systems, fintech, and cybersecurity with strong USD earning potential.',
    jobOutlookBn:
      '২০২৬–২০৩৫ ক্যারিয়ার সম্ভাবনা: এআই ইঞ্জিনিয়ারিং, ক্লাউড সিস্টেম, ফিনটেক এবং সাইবার নিরাপত্তায় দেশ-বিদেশে রিমোট ও উচ্চ আয়ের সর্বোচ্চ চাহিদা।',
    demandHighlightsEn: ['AI & Data Engineering', 'Global Remote Roles', 'High Starting Compensation'],
    demandHighlightsBn: ['এআই ও ডেটা ইঞ্জিনিয়ারিং', 'গ্লোবাল রিমোট জব', 'উচ্চ প্রারম্ভিক বেতন'],
    universityCodes: ['BUET', 'DU', 'SUST', 'NSU', 'BracU', 'DIU'],
  },
  eee: {
    id: 'eee',
    titleEn: 'Electrical, Electronic & Robotics Engineering (EEE)',
    titleBn: 'ইলেকট্রিক্যাল, ইলেকট্রনিক অ্যান্ড রোবোটিক্স ইঞ্জিনিয়ারিং (ইইই)',
    degreeBadgeEn: 'B.Sc. Engineering · Hardware & Energy',
    degreeBadgeBn: 'বিএসসি ইঞ্জিনিয়ারিং · হার্ডওয়্যার ও এনার্জি',
    coreInterestEn: 'hardware circuits, embedded robotics, renewable power grids, and semiconductor design',
    coreInterestBn: 'হার্ডওয়্যার সার্কিট, এমবেডেড রোবোটিক্স, নবায়নযোগ্য বিদ্যুৎ এবং সেমিকন্ডাক্টর ডিজাইন',
    jobOutlookEn:
      '2026–2035 Outlook: Rapid expansion in semiconductor chip design (VLSI), EV battery infrastructure, telecom networks, and smart energy automation.',
    jobOutlookBn:
      '২০২৬–২০৩৫ ক্যারিয়ার সম্ভাবনা: সেমিকন্ডাক্টর চিপ ডিজাইন (VLSI), ইলেকট্রিক ভেহিক্যাল, টেলিকম এবং স্মার্ট পাওয়ার গ্রিড খাতে দ্রুত বর্ধনশীল চাহিদা।',
    demandHighlightsEn: ['VLSI & Chip Design', 'Power & Telecom Grids', 'Robotics & IoT'],
    demandHighlightsBn: ['VLSI ও চিপ ডিজাইন', 'পাওয়ার ও টেলিকম খাত', 'রোবোটিক্স ও IoT'],
    universityCodes: ['BUET', 'CKRUET'.length > 0 ? 'CUET' : 'CUET', 'KUET', 'RUET', 'AUST', 'UIU'],
  },
  medical: {
    id: 'medical',
    titleEn: 'Medicine & Surgery (MBBS / BDS)',
    titleBn: 'চিকিৎসা বিজ্ঞান ও সার্জারি (এমবিবিএস / বিডিএস)',
    degreeBadgeEn: 'Clinical Medical · Healthcare Service',
    degreeBadgeBn: 'ক্লিনিক্যাল মেডিকেল · স্বাস্থ্যসেবা',
    coreInterestEn: 'human anatomy, clinical diagnosis, empathetic patient care, and high-stakes healthcare service',
    coreInterestBn: 'মানবদেহ বিজ্ঞান, রোগ নির্ণয়, মানবিক রোগী সেবা এবং চিকিৎসাসেবায় সরাসরি অবদান',
    jobOutlookEn:
      '2026–2035 Outlook: Evergreen clinical security in Bangladesh public/private hospitals, specialized surgery, telemedicine, and international residency pathways.',
    jobOutlookBn:
      '২০২৬–২০৩৫ ক্যারিয়ার সম্ভাবনা: সরকারি-বেসরকারি হাসপাতাল, বিশেষজ্ঞ চিকিৎসা, টেলিমেডিসিন এবং আন্তর্জাতিক মেডিকেল রেসিডেন্সিতে স্থায়ী ও সম্মানজনক ভবিষ্যৎ।',
    demandHighlightsEn: ['Lifelong Job Security', 'Clinical Specialization', 'High Social Impact'],
    demandHighlightsBn: ['আজীবন পেশাগত নিরাপত্তা', 'বিশেষজ্ঞ চিকিৎসক হওয়ার সুযোগ', 'সর্বোচ্চ সামাজিক সম্মান'],
    universityCodes: ['DMC', 'SSMC', 'CMC', 'MMC'],
  },
  pharmacy: {
    id: 'pharmacy',
    titleEn: 'Pharmacy & Biotechnology (B.Pharm / Genetic Eng.)',
    titleBn: 'ফার্মেসি ও বায়োটেকনোলজি (বি.ফার্ম / জেনেটিক ইঞ্জিনিয়ারিং)',
    degreeBadgeEn: 'Life Sciences · Pharma & Lab R&D',
    degreeBadgeBn: 'লাইফ সায়েন্সেস · ফার্মা ও ল্যাব গবেষণা',
    coreInterestEn: 'pharmaceutical chemistry, molecular research, laboratory diagnostics, and drug formulation',
    coreInterestBn: 'ওষুধ রসায়ন, মলিকুলার গবেষণা, ল্যাবরেটরি বিশ্লেষণ এবং ফার্মাসিউটিক্যাল উন্নয়ন',
    jobOutlookEn:
      '2026–2035 Outlook: Bangladesh’s export-driven pharmaceutical sector and global biotech R&D labs offer strong domestic leadership and funded Master’s/PhD routes abroad.',
    jobOutlookBn:
      '২০২৬–২০৩৫ ক্যারিয়ার সম্ভাবনা: বাংলাদেশের রপ্তানিমুখী ওষুধ শিল্প এবং বিদেশের বায়োটেক গবেষণায় স্কলারশিপ ও উচ্চতর ক্যারিয়ারের চমৎকার সুযোগ।',
    demandHighlightsEn: ['Export Pharma R&D', 'Abroad PhD Scholarships', 'Clinical Quality Control'],
    demandHighlightsBn: ['রপ্তানিমুখী ফার্মা R&D', 'বিদেশে স্কলারশিপ সুযোগ', 'ক্লিনিক্যাল কোয়ালিটি কন্ট্রোল'],
    universityCodes: ['DU', 'JU', 'NSU', 'BracU', 'EWU', 'DIU'],
  },
  bba: {
    id: 'bba',
    titleEn: 'Business Administration, Finance & Marketing (BBA)',
    titleBn: 'ব্যবসায় প্রশাসন, ফিন্যান্স ও মার্কেটিং (বিবিএ)',
    degreeBadgeEn: 'Business & Leadership · Corporate Strategy',
    degreeBadgeBn: 'ব্যবসায় ও নেতৃত্ব · কর্পোরেট কৌশল',
    coreInterestEn: 'strategic leadership, brand growth, financial markets, entrepreneurship, and team management',
    coreInterestBn: 'কৌশলগত নেতৃত্ব, ব্র্যান্ড গ্রোথ, ফাইন্যান্স মার্কেট, উদ্যোক্তা উন্নয়ন এবং টিম ম্যানেজমেন্ট',
    jobOutlookEn:
      '2026–2035 Outlook: Versatile pathways into multinational FMCGs, investment banking, tech product management, supply chain, and startup founding.',
    jobOutlookBn:
      '২০২৬–২০৩৫ ক্যারিয়ার সম্ভাবনা: বহুজাতিক কোম্পানি, ইনভেস্টমেন্ট ব্যাংকিং, প্রোডাক্ট ম্যানেজমেন্ট, সাপ্লাই চেইন এবং নিজস্ব স্টার্টআপ গড়ার বহুমুখী সুযোগ।',
    demandHighlightsEn: ['Multinational & Banking', 'Product & Brand Leadership', 'Startup Readiness'],
    demandHighlightsBn: ['বহুজাতিক ও ব্যাংকিং খাত', 'প্রোডাক্ট ও ব্র্যান্ড লিডারশিপ', 'উদ্যোক্তা ও স্টার্টআপ'],
    universityCodes: ['DU', 'NSU', 'BracU', 'IUB', 'EWU', 'DIU'],
  },
  economics: {
    id: 'economics',
    titleEn: 'Economics, Data Analytics & Development Studies',
    titleBn: 'অর্থনীতি, ডেটা অ্যানালিটিক্স ও উন্নয়ন অধ্যয়ন',
    degreeBadgeEn: 'Analytical Social Science · Policy & Markets',
    degreeBadgeBn: 'বিশ্লেষণধর্মী অর্থনীতি · নীতি ও বাজার',
    coreInterestEn: 'quantitative market forecasting, macroeconomic policy, econometrics, and data-backed decision making',
    coreInterestBn: 'অর্থনৈতিক পূর্বাভাস, সামষ্টিক অর্থনীতি, ইকোনোমেট্রিক্স এবং ডেটাভিত্তিক নীতিনির্ধারণ',
    jobOutlookEn:
      '2026–2035 Outlook: Strong global appetite for quantitative analysts, central bank/UN policy economists, ESG consultants, and fintech risk strategists.',
    jobOutlookBn:
      '২০২৬–২০৩৫ ক্যারিয়ার সম্ভাবনা: কেন্দ্রীয় ব্যাংক, জাতিসংঘ ও আন্তর্জাতিক উন্নয়ন সংস্থা, ফিনটেক রিস্ক বিশ্লেষণ এবং নীতি গবেষণায় উচ্চ মর্যাদার পেশা।',
    demandHighlightsEn: ['UN / World Bank Policy', 'Quant & Risk Analytics', 'BCS & Research'],
    demandHighlightsBn: ['জাতিসংঘ ও উন্নয়ন সংস্থা', 'কোয়ান্ট ও রিস্ক অ্যানালিটিক্স', 'বিসিএস ও গবেষণা'],
    universityCodes: ['DU', 'JU', 'NSU', 'BracU', 'EWU', 'JnU'],
  },
  law: {
    id: 'law',
    titleEn: 'Law, Governance & Public Policy (LL.B Hons)',
    titleBn: 'আইন, সুশাসন ও পাবলিক পলিসি (এলএল.বি অনার্স)',
    degreeBadgeEn: 'Legal & Civic · Advocacy & Governance',
    degreeBadgeBn: 'আইন ও সুশাসন · অ্যাডভোকেসি ও নীতি',
    coreInterestEn: 'constitutional reasoning, persuasive debate, corporate compliance, human rights, and civil leadership',
    coreInterestBn: 'যুক্তিনির্ভর আইন বিশ্লেষণ, কর্পোরেট কমপ্লায়েন্স, মানবাধিকার এবং প্রশাসনিক নেতৃত্ব',
    jobOutlookEn:
      '2026–2035 Outlook: Growing demand for tech/IP corporate counsel, international arbitration specialists, judicial service (BJS), and civil service leaders.',
    jobOutlookBn:
      '২০২৬–২০৩৫ ক্যারিয়ার সম্ভাবনা: কর্পোরেট ও আইপি আইনজীবী, বাংলাদেশ জুডিশিয়াল সার্ভিস (BJS), আন্তর্জাতিক সালিশি এবং সিভিল সার্ভিসে সম্মানজনক ক্যারিয়ার।',
    demandHighlightsEn: ['Corporate & Tech Law', 'Judicial & Civil Service', 'International Arbitration'],
    demandHighlightsBn: ['কর্পোরেট ও টেক আইন', 'বিচারিক ও সিভিল সার্ভিস', 'আন্তর্জাতিক আরবিট্রেশন'],
    universityCodes: ['DU', 'RU', 'CU', 'JnU', 'BracU', 'BUP'],
  },
  english_media: {
    id: 'english_media',
    titleEn: 'English, Media Studies & Communication',
    titleBn: 'ইংরেজি, মিডিয়া স্টাডিজ ও কমিউনিকেশন',
    degreeBadgeEn: 'Humanities & Communication · Global Storytelling',
    degreeBadgeBn: 'মানবিক ও যোগাযোগ · গ্লোবাল কমিউনিকেশন',
    coreInterestEn: 'editorial writing, cross-cultural communication, digital journalism, UX content, and education',
    coreInterestBn: 'সৃজনশীল ও প্রফেশনাল লেখালেখি, ডিজিটাল জার্নালিজম, মিডিয়া প্রোডাকশন এবং উচ্চশিক্ষা',
    jobOutlookEn:
      '2026–2035 Outlook: Rising demand in global content strategy, corporate communications, diplomatic services, digital media production, and academia.',
    jobOutlookBn:
      '২০২৬–২০৩৫ ক্যারিয়ার সম্ভাবনা: গ্লোবাল কন্টেন্ট স্ট্র্যাটেজি, কর্পোরেট কমিউনিকেশন, কূটনৈতিক খাত, ডিজিটাল মিডিয়া এবং শিক্ষকতায় সমৃদ্ধ ভবিষ্যৎ।',
    demandHighlightsEn: ['Global Content & PR', 'Diplomacy & BCS', 'Digital Media & Academia'],
    demandHighlightsBn: ['গ্লোবাল কন্টেন্ট ও পিআর', 'কূটনীতি ও বিসিএস', 'ডিজিটাল মিডিয়া ও একাডেমিয়া'],
    universityCodes: ['DU', 'JU', 'NSU', 'BracU', 'IUB', 'BUP'],
  },
  architecture: {
    id: 'architecture',
    titleEn: 'Architecture, Urban Design & Creative Tech (B.Arch)',
    titleBn: 'স্থাপত্য, নগর পরিকল্পনা ও ক্রিয়েটিভ ডিজাইন (বি.আর্ক)',
    degreeBadgeEn: 'Spatial Design · Sustainability & Aesthetics',
    degreeBadgeBn: 'স্পেশাল ডিজাইন · টেকসই স্থাপত্য',
    coreInterestEn: 'visual spatial planning, sustainable green cities, 3D architectural modeling, and human-centered design',
    coreInterestBn: 'ত্রিমাত্রিক নকশা, সবুজ টেকসই নগর পরিকল্পনা, ইন্টেরিয়র এবং মানবিক স্থাপত্য শিল্প',
    jobOutlookEn:
      '2026–2035 Outlook: Expanding opportunities across climate-resilient urban planning, green real estate, BIM 3D visualization, and international design studios.',
    jobOutlookBn:
      '২০২৬–২০৩৫ ক্যারিয়ার সম্ভাবনা: পরিবেশবান্ধব স্মার্ট সিটি পরিকল্পনা, বিআইএম (BIM) থ্রিডি ডিজাইন এবং আন্তর্জাতিক আর্কিটেকচার ফার্মে উজ্জ্বল ভবিষ্যৎ।',
    demandHighlightsEn: ['Sustainable Green Design', 'BIM & 3D Visualization', 'Global Design Studios'],
    demandHighlightsBn: ['টেকসই সবুজ স্থাপত্য', 'BIM ও থ্রিডি ভিজ্যুয়ালাইজেশন', 'আন্তর্জাতিক ডিজাইন স্টুডিও'],
    universityCodes: ['BUET', 'CUET', 'KUET', 'RUET', 'BracU', 'AUST'],
  },
};

function makeQuestion(
  id: number,
  section: QuizSectionId,
  promptEn: string,
  promptBn: string,
  options: [QuizOption, QuizOption, QuizOption, QuizOption]
): QuizQuestion {
  const sectionLabels: Record<QuizSectionId, { en: string; bn: string }> = {
    interests: {
      en: 'Part 1 · Personal Interests & Strengths',
      bn: 'অংশ ১ · ব্যক্তিগত আগ্রহ ও দক্ষতা',
    },
    work_style: {
      en: 'Part 2 · Work Style & Environment',
      bn: 'অংশ ২ · কাজের ধরন ও পরিবেশ',
    },
    future_jobs: {
      en: 'Part 3 · Future Job Perspective & Demand',
      bn: 'অংশ ৩ · ভবিষ্যৎ কর্মক্ষেত্র ও বৈশ্বিক চাহিদা',
    },
  };
  return {
    id,
    section,
    sectionLabelEn: sectionLabels[section].en,
    sectionLabelBn: sectionLabels[section].bn,
    promptEn,
    promptBn,
    options,
  };
}

export const CAREER_QUIZ_QUESTIONS: QuizQuestion[] = [
  // =========================================================================
  // PART 1: PERSONAL INTERESTS & STRENGTHS (Questions 1 - 10)
  // =========================================================================
  makeQuestion(
    1,
    'interests',
    'Which kind of challenge naturally excites you during free time?',
    'অবসর সময়ে কোন ধরনের সমস্যা সমাধান করতে আপনার সবচেয়ে ভালো লাগে?',
    [
      {
        id: 'q1_a',
        labelEn: 'Writing logic, coding apps, or automating digital puzzles',
        labelBn: 'লজিক লেখা, অ্যাপ তৈরি বা ডিজিটাল অটোমেশন করা',
        traitTagEn: 'algorithmic logic and software creation',
        traitTagBn: 'অ্যালগরিদমিক লজিক ও সফটওয়্যার নির্মাণ',
        weights: { cse: 4, eee: 2, economics: 1 },
      },
      {
        id: 'q1_b',
        labelEn: 'Exploring human biology, medicine, or health breakthroughs',
        labelBn: 'মানবদেহ, চিকিৎসাবিজ্ঞান বা স্বাস্থ্য গবেষণা নিয়ে জানা',
        traitTagEn: 'biomedical curiosity and life sciences',
        traitTagBn: 'চিকিৎসা ও প্রাণবিজ্ঞানের প্রতি গভীর আগ্রহ',
        weights: { medical: 4, pharmacy: 3 },
      },
      {
        id: 'q1_c',
        labelEn: 'Analyzing business models, brands, or stock/market trends',
        labelBn: 'ব্যবসায়িক মডেল, ব্র্যান্ডিং বা অর্থনৈতিক বাজার বিশ্লেষণ করা',
        traitTagEn: 'commercial strategy and market analysis',
        traitTagBn: 'ব্যবসায়িক কৌশল ও বাজার বিশ্লেষণ',
        weights: { bba: 4, economics: 3 },
      },
      {
        id: 'q1_d',
        labelEn: 'Debating social issues, writing stories, or sketching spaces',
        labelBn: 'সামাজিক যুক্তিতর্ক, লেখালেখি বা স্থাপত্য নকশা আঁকা',
        traitTagEn: 'expressive reasoning and creative design',
        traitTagBn: 'যুক্তিবাদী উপস্থাপনা ও সৃজনশীল নকশা',
        weights: { law: 3, english_media: 3, architecture: 3 },
      },
    ]
  ),
  makeQuestion(
    2,
    'interests',
    'Which school subject gave you the deepest sense of flow?',
    'কলেজ বা স্কুলের কোন বিষয়টি পড়তে আপনার সবচেয়ে সাবলীল লাগত?',
    [
      {
        id: 'q2_a',
        labelEn: 'Higher Mathematics, ICT & algorithmic reasoning',
        labelBn: 'উচ্চতর গণিত, আইসিটি ও লজিক্যাল প্রোগ্রামিং',
        traitTagEn: 'strong quantitative and computational aptitude',
        traitTagBn: 'গাণিতিক ও কম্পিউটেশনাল দক্ষতা',
        weights: { cse: 4, eee: 3, economics: 2 },
      },
      {
        id: 'q2_b',
        labelEn: 'Biology & Organic Chemistry',
        labelBn: 'জীববিজ্ঞান ও জৈব রসায়ন',
        traitTagEn: 'life-science and molecular affinity',
        traitTagBn: 'জীববিজ্ঞান ও ল্যাবরেটরি বিজ্ঞানে দক্ষতা',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q2_c',
        labelEn: 'Physics mechanics, circuits & geometric drawing',
        labelBn: 'পদার্থবিজ্ঞান, সার্কিট ও জ্যামিতিক নকশা',
        traitTagEn: 'physical systems and spatial engineering',
        traitTagBn: 'ভৌতবিজ্ঞান ও স্পেশাল ইঞ্জিনিয়ারিং',
        weights: { eee: 4, architecture: 4, cse: 1 },
      },
      {
        id: 'q2_d',
        labelEn: 'Accounting, Economics, Civics or English Literature',
        labelBn: 'হিসাববিজ্ঞান, অর্থনীতি, পৌরনীতি বা ইংরেজি সাহিত্য',
        traitTagEn: 'socio-economic and communication mastery',
        traitTagBn: 'অর্থনীতি, আইন ও যোগাযোগ দক্ষতা',
        weights: { bba: 3, economics: 3, law: 3, english_media: 3 },
      },
    ]
  ),
  makeQuestion(
    3,
    'interests',
    'If you attend a university tech & innovation fair, which booth draws you first?',
    'বিশ্ববিদ্যালয়ের কোনো মেলায় গেলে কোন স্টলটি আপনাকে সবার আগে টানবে?',
    [
      {
        id: 'q3_a',
        labelEn: 'Live AI agents, cybersecurity hacking & app demos',
        labelBn: 'এআই সফটওয়্যার, সাইবার সিকিউরিটি ও অ্যাপ ডেমো',
        traitTagEn: 'applied software innovation',
        traitTagBn: 'আধুনিক সফটওয়্যার উদ্ভাবন',
        weights: { cse: 4, economics: 1 },
      },
      {
        id: 'q3_b',
        labelEn: 'Autonomous drones, smart grids & hardware robotics',
        labelBn: 'অটোনোমাস ড্রোন, স্মার্ট গ্রিড ও রোবোটিক্স',
        traitTagEn: 'hands-on electronics and robotics',
        traitTagBn: 'ইলেকট্রনিক্স ও রোবোটিক্স',
        weights: { eee: 4, architecture: 2 },
      },
      {
        id: 'q3_c',
        labelEn: 'Medical simulation labs & biotech pharma breakthroughs',
        labelBn: 'মেডিকেল সিমুলেশন ল্যাব ও বায়োটেক ওষুধ উদ্ভাবন',
        traitTagEn: 'healthcare and pharmaceutical discovery',
        traitTagBn: 'স্বাস্থ্যসেবা ও ওষুধ গবেষণা',
        weights: { medical: 3, pharmacy: 4 },
      },
      {
        id: 'q3_d',
        labelEn: 'Startup pitch arena, model UN debate, or architectural scale models',
        labelBn: 'স্টার্টআপ পিচ, মডেল ইউএন বিতর্ক বা স্থাপত্য মডেল প্রদর্শনী',
        traitTagEn: 'leadership, advocacy, and design craft',
        traitTagBn: 'নেতৃত্ব, বিতর্ক ও সৃজনশীল স্থাপত্য',
        weights: { bba: 3, law: 3, architecture: 3, english_media: 2 },
      },
    ]
  ),
  makeQuestion(
    4,
    'interests',
    'How do you prefer to solve a complex real-world problem?',
    'বাস্তব জীবনের কোনো জটিল সমস্যা আপনি কীভাবে সমাধান করতে পছন্দ করেন?',
    [
      {
        id: 'q4_a',
        labelEn: 'Break it into step-by-step data, algorithms, or structured code',
        labelBn: 'ধাপে ধাপে ডেটা, লজিক ও কোডের মাধ্যমে বিশ্লেষণ করে',
        traitTagEn: 'structured systems thinking',
        traitTagBn: 'কাঠামোবদ্ধ সিস্টেম বিশ্লেষণ',
        weights: { cse: 4, economics: 3 },
      },
      {
        id: 'q4_b',
        labelEn: 'Run physical lab experiments or diagnostic tests carefully',
        labelBn: 'ল্যাবরেটরিতে পরীক্ষা-নিরীক্ষা ও সূক্ষ্ম পর্যবেক্ষণের মাধ্যমে',
        traitTagEn: 'empirical laboratory rigor',
        traitTagBn: 'ল্যাবরেটরি ও প্রমাণভিত্তিক গবেষণা',
        weights: { pharmacy: 4, medical: 3, eee: 2 },
      },
      {
        id: 'q4_c',
        labelEn: 'Negotiate with people, align teams, and build a clear action plan',
        labelBn: 'মানুষের সাথে আলোচনা করে, টিম গুছিয়ে কর্মপরিকল্পনা করে',
        traitTagEn: 'collaborative leadership and persuasion',
        traitTagBn: 'সম্মিলিত নেতৃত্ব ও কৌশলগত সমন্বয়',
        weights: { bba: 4, law: 3, english_media: 2 },
      },
      {
        id: 'q4_d',
        labelEn: 'Sketch prototypes, models, and human-centered visual layouts',
        labelBn: 'নকশা, প্রোটোটাইপ ও দৃশ্যমান মডেলের মাধ্যমে',
        traitTagEn: 'visual and spatial creativity',
        traitTagBn: 'দৃশ্যমান ও স্পেশাল সৃজনশীলতা',
        weights: { architecture: 4, english_media: 2, eee: 1 },
      },
    ]
  ),
  makeQuestion(
    5,
    'interests',
    'Which YouTube documentary or podcast topic would you finish in one sitting?',
    'কোন বিষয়ের ওপর একটি ডকুমেন্টারি বা পডকাস্ট আপনি এক বসায় শেষ করবেন?',
    [
      {
        id: 'q5_a',
        labelEn: 'How AI models, supercomputers, or global apps scale to billions',
        labelBn: 'কীভাবে এআই মডেল ও গ্লোবাল সফটওয়্যার কোটি মানুষের কাছে পৌঁছায়',
        traitTagEn: 'digital systems curiosity',
        traitTagBn: 'ডিজিটাল ও এআই প্রযুক্তির প্রতি আগ্রহ',
        weights: { cse: 4, bba: 1 },
      },
      {
        id: 'q5_b',
        labelEn: 'Inside an operating theater or a race to discover a life-saving vaccine',
        labelBn: 'সার্জারি থিয়েটারের গল্প বা জীবনরক্ষাকারী ভ্যাকসিন আবিষ্কারের ইতিহাস',
        traitTagEn: 'medical and clinical passion',
        traitTagBn: 'চিকিৎসা ও জীবনরক্ষাকারী বিজ্ঞানে আগ্রহ',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q5_c',
        labelEn: 'How central banks, global trade, or billion-dollar startups work',
        labelBn: 'কেন্দ্রীয় ব্যাংক, বিশ্ব অর্থনীতি বা বড় স্টার্টআপ গড়ে ওঠার গল্প',
        traitTagEn: 'macroeconomic and business acumen',
        traitTagBn: 'অর্থনীতি ও কর্পোরেট কৌশলের প্রতি আগ্রহ',
        weights: { economics: 4, bba: 4 },
      },
      {
        id: 'q5_d',
        labelEn: 'Landmark Supreme Court trials, world journalism, or iconic sustainable cities',
        labelBn: 'ঐতিহাসিক আদালতের মামলা, বিশ্ব সাংবাদিকতা বা আধুনিক নগর স্থাপত্য',
        traitTagEn: 'civic justice, storytelling, and urban craft',
        traitTagBn: 'আইন, মিডিয়া ও নগর স্থাপত্যে আগ্রহ',
        weights: { law: 4, english_media: 3, architecture: 3 },
      },
    ]
  ),
  makeQuestion(
    6,
    'interests',
    'Which academic skill do friends already come to you for help with?',
    'বন্ধুরা পড়াশোনার কোন বিষয়ে আপনার সাহায্য সবচেয়ে বেশি চায়?',
    [
      {
        id: 'q6_a',
        labelEn: 'Fixing software bugs, math proofs, or Excel/data formulas',
        labelBn: 'গণিতের সমাধান, সফটওয়্যার সমস্যা বা ডেটা ফর্মুলা বোঝাতে',
        traitTagEn: 'logical troubleshooting',
        traitTagBn: 'গাণিতিক ও লজিক্যাল সমাধান',
        weights: { cse: 3, eee: 3, economics: 3 },
      },
      {
        id: 'q6_b',
        labelEn: 'Explaining biology diagrams, anatomy, or chemical reactions clearly',
        labelBn: 'জীববিজ্ঞানের চিত্র, অ্যানাটমি বা রাসায়নিক বিক্রিয়া সহজে বোঝাতে',
        traitTagEn: 'scientific clarity in life sciences',
        traitTagBn: 'জীববিজ্ঞান ও রসায়ন ব্যাখ্যার দক্ষতা',
        weights: { medical: 4, pharmacy: 3 },
      },
      {
        id: 'q6_c',
        labelEn: 'Organizing group projects, presentations, and team coordination',
        labelBn: 'গ্রুপ প্রজেক্ট গুছিয়ে দেওয়া, প্রেজেন্টেশন ও টিম সমন্বয় করা',
        traitTagEn: 'executive coordination',
        traitTagBn: 'প্রজেক্ট ও টিম ম্যানেজমেন্ট',
        weights: { bba: 4, english_media: 2, law: 2 },
      },
      {
        id: 'q6_d',
        labelEn: 'Polishing essays, persuasive speeches, or visual poster design',
        labelBn: 'ইংরেজি রচনা, যুক্তিপূর্ণ বক্তব্য বা ক্রিয়েটিভ ডিজাইন সুন্দর করা',
        traitTagEn: 'articulate writing and visual aesthetics',
        traitTagBn: 'সৃজনশীল লেখা ও দৃষ্টিনন্দন ডিজাইন',
        weights: { english_media: 4, law: 3, architecture: 3 },
      },
    ]
  ),
  makeQuestion(
    7,
    'interests',
    'When working with numbers, which format feels most meaningful to you?',
    'সংখ্যার সাথে কাজ করতে হলে কোন ধরনের বিশ্লেষণ আপনার বেশি ভালো লাগে?',
    [
      {
        id: 'q7_a',
        labelEn: 'Algorithms, binary logic, and performance optimization',
        labelBn: 'অ্যালগরিদম, লজিক এবং সিস্টেমের গতি বা পারফরম্যান্স বাড়ানো',
        traitTagEn: 'computational precision',
        traitTagBn: 'কম্পিউটেশনাল সূক্ষ্মতা',
        weights: { cse: 4, eee: 3 },
      },
      {
        id: 'q7_b',
        labelEn: 'Clinical dosages, lab measurements, and biochemical ratios',
        labelBn: 'ওষুধের মাত্রা, ল্যাব পরিমাপ ও বায়োকেমিক্যাল অনুপাত',
        traitTagEn: 'clinical and lab accuracy',
        traitTagBn: 'ল্যাব ও ক্লিনিক্যাল নিখুঁত পরিমাপ',
        weights: { medical: 3, pharmacy: 4 },
      },
      {
        id: 'q7_c',
        labelEn: 'Profit margins, inflation rates, GDP trends & investment ROI',
        labelBn: 'বিনিয়োগ রিটার্ন, মুদ্রাস্ফীতি, জিডিপি ও বাজারের পরিসংখ্যান',
        traitTagEn: 'financial and economic modeling',
        traitTagBn: 'ফাইন্যান্স ও অর্থনৈতিক মডেলিং',
        weights: { bba: 4, economics: 4 },
      },
      {
        id: 'q7_d',
        labelEn: 'Architectural dimensions, structural loads & aesthetic proportions',
        labelBn: 'স্থাপত্যের মাপজোখ, স্ট্রাকচারাল ভারসাম্য ও জ্যামিতিক অনুপাত',
        traitTagEn: 'geometric proportioning',
        traitTagBn: 'জ্যামিতিক ও স্থাপত্য পরিমাপ',
        weights: { architecture: 4, eee: 2 },
      },
    ]
  ),
  makeQuestion(
    8,
    'interests',
    'How comfortable are you memorizing detailed scientific terminology vs. arguing principles?',
    'বিস্তারিত বৈজ্ঞানিক তথ্য মনে রাখা নাকি মূলনীতির যুক্তি বিশ্লেষণ—কোনটিতে আপনি বেশি স্বাচ্ছন্দ্য?',
    [
      {
        id: 'q8_a',
        labelEn: 'Comfortable mastering anatomy, drugs & clinical protocols accurately',
        labelBn: 'মানবদেহ, ওষুধের নাম ও ক্লিনিক্যাল নিয়ম নিখুঁতভাবে আয়ত্ত করা',
        traitTagEn: 'high clinical memory retention',
        traitTagBn: 'চিকিৎসা ও বৈজ্ঞানিক তথ্য আয়ত্তের ক্ষমতা',
        weights: { medical: 4, pharmacy: 3 },
      },
      {
        id: 'q8_b',
        labelEn: 'Prefer deriving formulas and debugging logic from first principles',
        labelBn: 'সূত্রের মূল ভিত্তি বুঝে লজিক্যালভাবে সমাধান বের করা',
        traitTagEn: 'first-principles engineering logic',
        traitTagBn: 'মূলনীতির ভিত্তিতে ইঞ্জিনিয়ারিং লজিক',
        weights: { cse: 4, eee: 4, economics: 2 },
      },
      {
        id: 'q8_c',
        labelEn: 'Love interpreting legal statutes, case precedents & persuasive arguments',
        labelBn: 'আইনি ধারা, নজির ও যুক্তিনির্ভর তর্ক উপস্থাপন করা',
        traitTagEn: 'critical legal interpretation',
        traitTagBn: 'আইনি ও যুক্তিনির্ভর বিশ্লেষণ',
        weights: { law: 4, english_media: 2 },
      },
      {
        id: 'q8_d',
        labelEn: 'Enjoy synthesizing market behavior, psychology & creative communication',
        labelBn: 'মানুষের মনস্তত্ত্ব, বাজার আচরণ ও সৃজনশীল উপস্থাপনা বোঝা',
        traitTagEn: 'strategic communication and market insight',
        traitTagBn: 'বাজার আচরণ ও যোগাযোগ কৌশল',
        weights: { bba: 4, english_media: 3, architecture: 2 },
      },
    ]
  ),
  makeQuestion(
    9,
    'interests',
    'Which kind of university assignment sounds most rewarding to you?',
    'বিশ্ববিদ্যালয়ের কোন ধরনের অ্যাসাইনমেন্ট আপনার কাছে সবচেয়ে আনন্দদায়ক মনে হয়?',
    [
      {
        id: 'q9_a',
        labelEn: 'Building a working software tool or smart hardware prototype',
        labelBn: 'একটি কার্যকর সফটওয়্যার বা স্মার্ট হার্ডওয়্যার প্রোটোটাইপ তৈরি করা',
        traitTagEn: 'maker mindset for digital and physical tech',
        traitTagBn: 'প্রযুক্তিগত প্রোটোটাইপ নির্মাণের আগ্রহ',
        weights: { cse: 4, eee: 4 },
      },
      {
        id: 'q9_b',
        labelEn: 'Studying a patient case history or synthesizing a chemical compound',
        labelBn: 'রোগীর কেস স্টাডি বিশ্লেষণ বা ল্যাবে নতুন যৌগ তৈরি করা',
        traitTagEn: 'diagnostic and experimental inquiry',
        traitTagBn: 'রোগ নির্ণয় ও ল্যাবরেটরি অনুসন্ধান',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q9_c',
        labelEn: 'Drafting a market launch strategy or econometric policy brief',
        labelBn: 'একটি বাজারজাতকরণ কৌশল বা অর্থনৈতিক নীতিমালা প্রতিবেদন লেখা',
        traitTagEn: 'strategic business and policy drafting',
        traitTagBn: 'ব্যবসায়িক কৌশল ও নীতি প্রতিবেদন',
        weights: { bba: 4, economics: 4 },
      },
      {
        id: 'q9_d',
        labelEn: 'Delivering a moot court defense, editorial feature, or 3D building studio model',
        labelBn: 'মক কোর্ট শুনানি, মিডিয়া ফিচার বা থ্রিডি ভবন মডেল উপস্থাপন করা',
        traitTagEn: 'public advocacy and studio craftsmanship',
        traitTagBn: 'অ্যাডভোকেসি ও স্টুডিও ডিজাইন দক্ষতা',
        weights: { law: 4, english_media: 3, architecture: 4 },
      },
    ]
  ),
  makeQuestion(
    10,
    'interests',
    'What kind of impact gives you the greatest personal pride?',
    'আপনার কাজের কোন ধরনের প্রভাব আপনাকে সবচেয়ে বেশি গর্বিত করবে?',
    [
      {
        id: 'q10_a',
        labelEn: 'Creating scalable software or clean energy tech used by millions',
        labelBn: 'কোটি মানুষের কাজে লাগে এমন সফটওয়্যার বা টেকসই প্রযুক্তি তৈরি করা',
        traitTagEn: 'scalable technological innovation',
        traitTagBn: 'বৃহৎ পরিসরের প্রযুক্তি উদ্ভাবন',
        weights: { cse: 4, eee: 3 },
      },
      {
        id: 'q10_b',
        labelEn: 'Directly healing patients or advancing life-saving medicines',
        labelBn: 'মানুষের জীবন বাঁচানো বা আধুনিক ওষুধ গবেষণায় অবদান রাখা',
        traitTagEn: 'direct human health preservation',
        traitTagBn: 'মানবস্বাস্থ্য ও জীবনরক্ষায় অবদান',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q10_c',
        labelEn: 'Growing thriving companies, jobs, and stronger economic policies',
        labelBn: 'সফল প্রতিষ্ঠান গড়ে তোলা, কর্মসংস্থান ও অর্থনৈতিক উন্নয়ন করা',
        traitTagEn: 'economic growth and institutional leadership',
        traitTagBn: 'অর্থনৈতিক প্রবৃদ্ধি ও প্রাতিষ্ঠানিক নেতৃত্ব',
        weights: { bba: 4, economics: 4 },
      },
      {
        id: 'q10_d',
        labelEn: 'Defending justice, shaping public culture, or designing livable cities',
        labelBn: 'ন্যায়বিচার প্রতিষ্ঠা, সংস্কৃতি ও বাসযোগ্য সুন্দর শহর গড়ে তোলা',
        traitTagEn: 'justice, culture, and built-environment stewardship',
        traitTagBn: 'ন্যায়বিচার, সংস্কৃতি ও টেকসই নগর গঠন',
        weights: { law: 4, english_media: 3, architecture: 4 },
      },
    ]
  ),

  // =========================================================================
  // PART 2: WORK STYLE & ENVIRONMENT PREFERENCES (Questions 11 - 20)
  // =========================================================================
  makeQuestion(
    11,
    'work_style',
    'Where do you picture yourself doing your best everyday work?',
    'প্রতিদিন কোন পরিবেশে কাজ করলে আপনার সেরা আউটপুট আসবে বলে মনে করেন?',
    [
      {
        id: 'q11_a',
        labelEn: 'A modern tech office or flexible remote workstation with dual monitors',
        labelBn: 'আধুনিক টেক অফিস বা ফ্লেক্সিবল রিমোট ওয়ার্কস্টেশন',
        traitTagEn: 'focused digital and remote autonomy',
        traitTagBn: 'স্বাধীন ডিজিটাল ও রিমোট কাজের ধরন',
        weights: { cse: 4, economics: 2, english_media: 2 },
      },
      {
        id: 'q11_b',
        labelEn: 'Hospital clinical wards, diagnostic centers, or sterile R&D labs',
        labelBn: 'হাসপাতাল ওয়ার্ড, ক্লিনিক বা আধুনিক গবেষণা ল্যাবরেটরি',
        traitTagEn: 'clinical and laboratory immersion',
        traitTagBn: 'ক্লিনিক্যাল ও ল্যাবরেটরি পরিবেশ',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q11_c',
        labelEn: 'Dynamic corporate boardrooms, client meetings & fast-paced startups',
        labelBn: 'কর্পোরেট মিটিং, ক্লায়েন্ট নেগোসিয়েশন ও স্টার্টআপ পরিবেশ',
        traitTagEn: 'high-energy executive collaboration',
        traitTagBn: 'গতিশীল কর্পোরেট ও ব্যবসায়িক পরিবেশ',
        weights: { bba: 4, law: 2, economics: 2 },
      },
      {
        id: 'q11_d',
        labelEn: 'Engineering field sites, power plants, or creative architecture studios',
        labelBn: 'ইঞ্জিনিয়ারিং ফিল্ড, ইন্ডাস্ট্রিয়াল প্ল্যান্ট বা আর্কিটেকচার স্টুডিও',
        traitTagEn: 'hands-on studio and field execution',
        traitTagBn: 'মাঠপর্যায় ও স্টুডিও-ভিত্তিক কাজ',
        weights: { eee: 4, architecture: 4 },
      },
    ]
  ),
  makeQuestion(
    12,
    'work_style',
    'How do you feel about high-pressure clinical or deadline emergencies?',
    'জরুরি পরিস্থিতিতে বা চরম চাপের মধ্যে কাজ করার বিষয়ে আপনার মনোভাব কেমন?',
    [
      {
        id: 'q12_a',
        labelEn: 'I stay calm during life-or-health emergencies and follow strict protocols',
        labelBn: 'স্বাস্থ্য বা জরুরি পরিস্থিতিতে শান্ত থেকে সঠিক প্রোটোকল মানতে পারি',
        traitTagEn: 'crisis composure under clinical stakes',
        traitTagBn: 'জরুরি পরিস্থিতিতে মানসিক দৃঢ়তা',
        weights: { medical: 4, pharmacy: 2 },
      },
      {
        id: 'q12_b',
        labelEn: 'I enjoy fast product sprints, shipping launches, and fixing production bugs',
        labelBn: 'দ্রুত প্রোডাক্ট লঞ্চ ও টেকনিক্যাল সমস্যা দ্রুত সমাধান করতে ভালো লাগে',
        traitTagEn: 'agile engineering execution',
        traitTagBn: 'দ্রুতগতির প্রজেক্ট ডেলিভারি',
        weights: { cse: 4, bba: 3 },
      },
      {
        id: 'q12_c',
        labelEn: 'I thrive defending high-stakes cases, budgets, or policy negotiations',
        labelBn: 'গুরুত্বপূর্ণ কেস, বাজেট বা বড় চুক্তির আলোচনায় নেতৃত্ব দিতে ভালোবাসি',
        traitTagEn: 'persuasive composure in negotiations',
        traitTagBn: 'উচ্চচাপের আলোচনা ও যুক্তিতর্কে দক্ষতা',
        weights: { law: 4, economics: 3, bba: 2 },
      },
      {
        id: 'q12_d',
        labelEn: 'I prefer deep creative studio focus or structured research timelines',
        labelBn: 'স্থির সময়সীমার মধ্যে গভীর গবেষণা বা সৃজনশীল ডিজাইন করা পছন্দ করি',
        traitTagEn: 'deep-craft studio and lab focus',
        traitTagBn: 'গভীর গবেষণা ও সৃজনশীল মনোনিবেশ',
        weights: { architecture: 4, english_media: 3, eee: 2, pharmacy: 2 },
      },
    ]
  ),
  makeQuestion(
    13,
    'work_style',
    'How much direct people interaction do you want in your daily routine?',
    'আপনার প্রতিদিনের কাজে মানুষের সাথে সরাসরি যোগাযোগ কতটুকু থাকলে ভালো হয়?',
    [
      {
        id: 'q13_a',
        labelEn: 'Constant people interaction — leading teams, clients, or public audiences',
        labelBn: 'প্রচুর যোগাযোগ — টিম পরিচালনা, ক্লায়েন্ট বা সাধারণ মানুষের সাথে কাজ',
        traitTagEn: 'people-first communication energy',
        traitTagBn: 'মানুষকেন্দ্রিক নেতৃত্ব ও যোগাযোগ',
        weights: { bba: 4, law: 3, english_media: 4 },
      },
      {
        id: 'q13_b',
        labelEn: 'Empathetic 1-on-1 patient care alongside clinical teams',
        labelBn: 'রোগীদের সাথে সহমর্মী ১-অন-১ সেবা এবং মেডিকেল টিমের সমন্বয়',
        traitTagEn: 'compassionate bedside collaboration',
        traitTagBn: 'সহানুভূতিশীল রোগী সেবা ও টিমওয়ার্ক',
        weights: { medical: 4, pharmacy: 2 },
      },
      {
        id: 'q13_c',
        labelEn: 'Balanced small engineering or research squad collaboration',
        labelBn: 'ছোট ইঞ্জিনিয়ারিং বা গবেষণা টিমের সাথে ভারসাম্যপূর্ণ কাজ',
        traitTagEn: 'focused technical squad synergy',
        traitTagBn: 'দক্ষ টেকনিক্যাল টিমে ভারসাম্যপূর্ণ কাজ',
        weights: { cse: 3, eee: 3, architecture: 3, economics: 3 },
      },
      {
        id: 'q13_d',
        labelEn: 'Quiet independent deep-work analyzing data, molecules, or systems',
        labelBn: 'নিরিবিলি পরিবেশে গভীর মনোযোগে ডেটা, ল্যাব বা সিস্টেম বিশ্লেষণ',
        traitTagEn: 'independent analytical concentration',
        traitTagBn: 'স্বাধীন ও গভীর বিশ্লেষণধর্মী মনোযোগ',
        weights: { pharmacy: 3, cse: 2, economics: 3 },
      },
    ]
  ),
  makeQuestion(
    14,
    'work_style',
    'Which tools would you most enjoy mastering in university?',
    'বিশ্ববিদ্যালয়ে কোন ধরনের টুলস বা যন্ত্রপাতি ব্যবহার করে আপনি আনন্দ পাবেন?',
    [
      {
        id: 'q14_a',
        labelEn: 'Programming languages, cloud servers & machine learning frameworks',
        labelBn: 'প্রোগ্রামিং ভাষা, ক্লাউড সার্ভার ও মেশিন লার্নিং ফ্রেমওয়ার্ক',
        traitTagEn: 'modern software toolchain mastery',
        traitTagBn: 'আধুনিক সফটওয়্যার ও এআই টুলস',
        weights: { cse: 4, economics: 2 },
      },
      {
        id: 'q14_b',
        labelEn: 'Oscilloscopes, CAD/PCB simulators, microcontrollers & power rigs',
        labelBn: 'অসিলোস্কোপ, সার্কিট সিমুলেটর, মাইক্রোকন্ট্রোলার ও পাওয়ার সিস্টেম',
        traitTagEn: 'hardware instrumentation skill',
        traitTagBn: 'হার্ডওয়্যার ও ইলেকট্রনিক যন্ত্রপাতি',
        weights: { eee: 4, architecture: 2 },
      },
      {
        id: 'q14_c',
        labelEn: 'Stethoscopes, clinical diagnostics, spectrophotometers & HPLC lab tools',
        labelBn: 'স্টেথোস্কোপ, ক্লিনিক্যাল ডায়াগনস্টিকস ও আধুনিক কেমিক্যাল ল্যাব যন্ত্র',
        traitTagEn: 'clinical and analytical instrumentation',
        traitTagBn: 'ক্লিনিক্যাল ও ফার্মা ল্যাব যন্ত্রপাতি',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q14_d',
        labelEn: 'Financial dashboards, statistical R/Stata models, legal archives, or AutoCAD/Revit',
        labelBn: 'ফাইন্যান্স ড্যাশবোর্ড, পরিসংখ্যান মডেল, আইনি নথি বা AutoCAD/Revit',
        traitTagEn: 'executive, legal, and studio software',
        traitTagBn: 'বিজনেস, আইনি ও আর্কিটেকচার সফটওয়্যার',
        weights: { bba: 3, economics: 3, law: 3, architecture: 4, english_media: 2 },
      },
    ]
  ),
  makeQuestion(
    15,
    'work_style',
    'How important is flexible remote work or geographic freedom to your lifestyle?',
    'আপনার কাজের ক্ষেত্রে রিমোট ওয়ার্ক বা যেকোনো জায়গা থেকে কাজ করার স্বাধীনতা কতটা গুরুত্বপূর্ণ?',
    [
      {
        id: 'q15_a',
        labelEn: 'Essential — I want a skill I can work remotely on for global teams',
        labelBn: 'অত্যন্ত গুরুত্বপূর্ণ — আমি বিশ্বের যেকোনো দেশের টিমের সাথে রিমোট কাজ করতে চাই',
        traitTagEn: 'borderless digital work mobility',
        traitTagBn: 'বৈশ্বিক রিমোট কাজের স্বাধীনতা',
        weights: { cse: 4, english_media: 3, bba: 2 },
      },
      {
        id: 'q15_b',
        labelEn: 'Moderately helpful — hybrid consulting, analytics, or design studios suit me',
        labelBn: 'মাঝারি পর্যায়ের গুরুত্বপূর্ণ — হাইব্রিড কনসালটিং বা ডিজাইন স্টুডিও ভালো লাগে',
        traitTagEn: 'hybrid analytical and creative flexibility',
        traitTagBn: 'হাইব্রিড কনসালটিং ও ডিজাইন স্বাধীনতা',
        weights: { economics: 3, bba: 3, architecture: 3 },
      },
      {
        id: 'q15_c',
        labelEn: 'Not required — I love physical hospitals, laboratories, or industrial plants',
        labelBn: 'দরকার নেই — সরাসরি হাসপাতাল, ল্যাব বা ইন্ডাস্ট্রিয়াল ফিল্ডেই কাজ করতে চাই',
        traitTagEn: 'dedicated on-site hands-on presence',
        traitTagBn: 'সরাসরি ফিল্ড, ল্যাব বা হাসপাতালে কাজ',
        weights: { medical: 4, pharmacy: 3, eee: 4 },
      },
      {
        id: 'q15_d',
        labelEn: 'I prefer courtroom, policy ministry, or university campus presence',
        labelBn: 'আদালত, নীতিনির্ধারণী দপ্তর বা প্রাতিষ্ঠানিক ক্যাম্পাসে সরাসরি কাজ পছন্দ',
        traitTagEn: 'institutional civic engagement',
        traitTagBn: 'প্রাতিষ্ঠানিক ও আদালত/দপ্তরভিত্তিক কাজ',
        weights: { law: 4, economics: 2, english_media: 2 },
      },
    ]
  ),
  makeQuestion(
    16,
    'work_style',
    'Which study rhythm matches how you learn best?',
    'কোন ধরনের পড়াশোনার রুটিন আপনার শেখার ধরনের সাথে সবচেয়ে ভালো মেলে?',
    [
      {
        id: 'q16_a',
        labelEn: 'Iterative coding labs, hackathons, and continuous hands-on projects',
        labelBn: 'কোডিং ল্যাব, হ্যাকাথন এবং হাতে-কলমে প্রজেক্ট তৈরি করে শেখা',
        traitTagEn: 'project-driven technical iteration',
        traitTagBn: 'প্রজেক্ট-নির্ভর প্রযুক্তিগত শিক্ষা',
        weights: { cse: 4, eee: 3 },
      },
      {
        id: 'q16_b',
        labelEn: 'Structured multi-year clinical rotations and intense foundational science',
        labelBn: 'দীর্ঘমেয়াদি ক্লিনিক্যাল রোটেশন ও গভীর বিজ্ঞানভিত্তিক অনুশীলন',
        traitTagEn: 'disciplined clinical endurance',
        traitTagBn: 'শৃঙ্খলাবদ্ধ ক্লিনিক্যাল ও মেডিকেল অনুশীলন',
        weights: { medical: 4, pharmacy: 3 },
      },
      {
        id: 'q16_c',
        labelEn: 'Real-world case competitions, debates, and analytical essay writing',
        labelBn: 'কেস কম্পিটিশন, বিতর্ক ও বিশ্লেষণধর্মী রচনা ও গবেষণা',
        traitTagEn: 'case-method critical inquiry',
        traitTagBn: 'কেস-স্টাডি ও বিতর্কভিত্তিক শিক্ষা',
        weights: { bba: 4, law: 4, economics: 3, english_media: 3 },
      },
      {
        id: 'q16_d',
        labelEn: 'Long studio critiques, drafting physical models & iterative design portfolios',
        labelBn: 'স্টুডিও ক্রিটিক, মডেল তৈরি ও ডিজাইন পোর্টফোলিও গড়ে তোলা',
        traitTagEn: 'studio critique craftsmanship',
        traitTagBn: 'স্টুডিও ও পোর্টফোলিওভিত্তিক ডিজাইন চর্চা',
        weights: { architecture: 4, english_media: 1 },
      },
    ]
  ),
  makeQuestion(
    17,
    'work_style',
    'How do you react when an initial experiment or strategy fails?',
    'আপনার প্রথম প্রচেষ্টা বা পরিকল্পনা ব্যর্থ হলে আপনি সাধারণত কী করেন?',
    [
      {
        id: 'q17_a',
        labelEn: 'Inspect logs systematically, isolate the bug, and refactor cleanly',
        labelBn: 'ধাপে ধাপে এরর খুঁজে বের করে সিস্টেমটি নতুন করে ঠিক করি',
        traitTagEn: 'methodical debugging resilience',
        traitTagBn: 'পদ্ধতিগতভাবে ভুল শনাক্ত ও সংশোধন',
        weights: { cse: 4, eee: 4 },
      },
      {
        id: 'q17_b',
        labelEn: 'Re-check variables, consult peer literature, and retest safely',
        labelBn: 'ভেরিয়েবল ও গবেষণাপত্র যাচাই করে নিরাপদে পুনরায় পরীক্ষা করি',
        traitTagEn: 'scientific peer-verified rigor',
        traitTagBn: 'গবেষণানির্ভর সতর্ক পুনঃপরীক্ষা',
        weights: { pharmacy: 4, medical: 3, economics: 2 },
      },
      {
        id: 'q17_c',
        labelEn: 'Pivot the pitch, gather customer feedback, and realign stakeholders',
        labelBn: 'ফিডব্যাক নিয়ে কৌশল বদলাই এবং টিমকে নতুন লক্ষ্যে অনুপ্রাণিত করি',
        traitTagEn: 'entrepreneurial agility',
        traitTagBn: 'উদ্যোক্তাসুলভ দ্রুত কৌশল পরিবর্তন',
        weights: { bba: 4, english_media: 2, law: 2 },
      },
      {
        id: 'q17_d',
        labelEn: 'Re-examine precedent, re-sketch concepts, and strengthen the core thesis',
        labelBn: 'মূল যুক্তি বা নকশার ধারণা নতুন করে সাজিয়ে আরও শক্তিশালী করি',
        traitTagEn: 'reflective conceptual refinement',
        traitTagBn: 'যুক্তি ও নকশার মৌলিক পরিমার্জন',
        weights: { law: 3, architecture: 4, english_media: 3 },
      },
    ]
  ),
  makeQuestion(
    18,
    'work_style',
    'How long are you willing to train before reaching peak career autonomy?',
    'পেশাগত শীর্ষ পর্যায়ে পৌঁছাতে আপনি কতদিন পর্যন্ত নিবিড় প্রশিক্ষণ বা উচ্চশিক্ষা নিতে প্রস্তুত?',
    [
      {
        id: 'q18_a',
        labelEn: '6–8+ years including MBBS, internship & postgraduate specialization',
        labelBn: '৬–৮+ বছর (এমবিবিএস, ইন্টার্নশিপ ও বিশেষজ্ঞ ডিগ্রি সহ)',
        traitTagEn: 'long-horizon clinical dedication',
        traitTagBn: 'দীর্ঘমেয়াদি চিকিৎসা ও বিশেষজ্ঞ হওয়ার ধৈর্য',
        weights: { medical: 5, architecture: 2 },
      },
      {
        id: 'q18_b',
        labelEn: '4-year Honours + fast entry into industry or startup roles',
        labelBn: '৪ বছরের অনার্স শেষে দ্রুত ইন্ডাস্ট্রি বা টেক চাকরিতে প্রবেশ',
        traitTagEn: 'rapid industry readiness',
        traitTagBn: 'স্নাতক শেষে দ্রুত কর্মক্ষেত্রে প্রবেশ',
        weights: { cse: 4, bba: 4, eee: 3 },
      },
      {
        id: 'q18_c',
        labelEn: '4-year Honours + Master’s / PhD abroad via research scholarships',
        labelBn: '৪ বছরের অনার্স + বিদেশে স্কলারশিপ সহ মাস্টার্স বা পিএইচডি',
        traitTagEn: 'global academic and research trajectory',
        traitTagBn: 'বিদেশে উচ্চশিক্ষা ও গবেষণাভিত্তিক লক্ষ্য',
        weights: { pharmacy: 4, economics: 4, eee: 2, english_media: 2 },
      },
      {
        id: 'q18_d',
        labelEn: '4-year Honours + Bar/Judicial exams or competitive public service prep',
        labelBn: '৪ বছরের অনার্স + বার কাউন্সিল/বিজেএস বা বিসিএস প্রস্তুতি',
        traitTagEn: 'competitive professional credentialing',
        traitTagBn: 'প্রতিযোগিতামূলক আইন ও সিভিল সার্ভিস প্রস্তুতি',
        weights: { law: 5, economics: 2, english_media: 3 },
      },
    ]
  ),
  makeQuestion(
    19,
    'work_style',
    'What balance between strict rules and creative freedom feels right for you?',
    'কঠোর নিয়মকানুন ও সৃজনশীল স্বাধীনতার মধ্যে কোন ভারসাম্যটি আপনার পছন্দ?',
    [
      {
        id: 'q19_a',
        labelEn: 'Strict safety & ethical compliance where precision protects human lives',
        labelBn: 'কঠোর নিরাপত্তা ও নীতিমালা, যেখানে নিখুঁত কাজ মানুষের জীবন রক্ষা করে',
        traitTagEn: 'high-reliability ethical discipline',
        traitTagBn: 'নৈতিক ও জীবনরক্ষাকারী শৃঙ্খলা',
        weights: { medical: 4, pharmacy: 4, eee: 2 },
      },
      {
        id: 'q19_b',
        labelEn: 'Clear constitutional/legal frameworks paired with sharp persuasive argument',
        labelBn: 'স্পষ্ট আইনি কাঠামোর ভেতরে যুক্তি ও বুদ্ধিমত্তার প্রয়োগ',
        traitTagEn: 'structured legal advocacy',
        traitTagBn: 'কাঠামোবদ্ধ আইনি যুক্তি',
        weights: { law: 4, economics: 2 },
      },
      {
        id: 'q19_c',
        labelEn: 'Open experimentation building novel products, campaigns, or architectures',
        labelBn: 'নতুন পণ্য, ক্যাম্পেইন বা স্থাপত্য নকশায় সৃজনশীল পরীক্ষার স্বাধীনতা',
        traitTagEn: 'inventive creative autonomy',
        traitTagBn: 'সৃজনশীল উদ্ভাবনের স্বাধীনতা',
        weights: { architecture: 4, cse: 3, english_media: 3, bba: 2 },
      },
      {
        id: 'q19_d',
        labelEn: 'Data-guided business flexibility balancing growth targets and risk',
        labelBn: 'ডেটা-নির্ভর ব্যবসায়িক স্বাধীনতা ও ঝুঁকি ব্যবস্থাপনা',
        traitTagEn: 'data-informed strategic agility',
        traitTagBn: 'ডেটা-ভিত্তিক ব্যবসায়িক নমনীয়তা',
        weights: { bba: 4, economics: 4 },
      },
    ]
  ),
  makeQuestion(
    20,
    'work_style',
    'Which extracurricular club in university would you join in Week 1?',
    'বিশ্ববিদ্যালয়ের প্রথম সপ্তাহেই কোন ক্লাবে আপনি সবার আগে যোগ দেবেন?',
    [
      {
        id: 'q20_a',
        labelEn: 'Programming / Competitive Coding & AI Robotics Society',
        labelBn: 'প্রোগ্রামিং, কম্পিটিটিভ কোডিং ও এআই রোবোটিক্স ক্লাব',
        traitTagEn: 'competitive tech community spirit',
        traitTagBn: 'প্রোগ্রামিং ও রোবোটিক্স ক্লাব সংস্কৃতি',
        weights: { cse: 4, eee: 4 },
      },
      {
        id: 'q20_b',
        labelEn: 'Public Health Volunteers, Red Crescent, or Science Research Club',
        labelBn: 'পাবলিক হেলথ ভলান্টিয়ার্স বা সায়েন্স রিসার্চ সোসাইটি',
        traitTagEn: 'humanitarian health and lab outreach',
        traitTagBn: 'স্বাস্থ্যসেবা ও বিজ্ঞান গবেষণা স্বেচ্ছাসেবা',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q20_c',
        labelEn: 'Business Case Club, Entrepreneurship Cell, or Economics Forum',
        labelBn: 'বিজনেস কেস ক্লাব, এন্টারপ্রেনিউরশিপ সেল বা ইকোনমিক্স ফোরাম',
        traitTagEn: 'venture and leadership networking',
        traitTagBn: 'বিজনেস কেস ও উদ্যোক্তা নেটওয়ার্কিং',
        weights: { bba: 4, economics: 4 },
      },
      {
        id: 'q20_d',
        labelEn: 'Debating Society, Moot Court, Photography & Design Collective',
        labelBn: 'ডিবেটিং সোসাইটি, মুট কোর্ট বা ফটোগ্রাফি ও ডিজাইন কালেক্টিভ',
        traitTagEn: 'rhetoric and cultural expression',
        traitTagBn: 'বিতর্ক, মুট কোর্ট ও সৃজনশীল সংস্কৃতি',
        weights: { law: 4, english_media: 4, architecture: 3 },
      },
    ]
  ),

  // =========================================================================
  // PART 3: FUTURE JOB PERSPECTIVE & GLOBAL DEMAND (Questions 21 - 30)
  // =========================================================================
  makeQuestion(
    21,
    'future_jobs',
    'Which 2026–2035 global job market trend excites you most?',
    '২০২৬–২০৩৫ সালের বৈশ্বিক চাকরির বাজারের কোন ধারাটি আপনাকে সবচেয়ে বেশি আকর্ষণ করে?',
    [
      {
        id: 'q21_a',
        labelEn: 'AI engineering, cloud architecture, and global USD remote software roles',
        labelBn: 'এআই ইঞ্জিনিয়ারিং, ক্লাউড ও বৈদেশিক মুদ্রায় রিমোট সফটওয়্যার ক্যারিয়ার',
        traitTagEn: 'AI-era high-growth tech ambition',
        traitTagBn: 'এআই যুগের উচ্চ-প্রবৃদ্ধিশীল টেক লক্ষ্য',
        weights: { cse: 5, eee: 2 },
      },
      {
        id: 'q21_b',
        labelEn: 'Healthcare security, specialized medicine & export pharma biotechnology',
        labelBn: 'স্বাস্থ্যসেবা, বিশেষজ্ঞ চিকিৎসা ও রপ্তানিমুখী ফার্মাসিউটিক্যালস গবেষণা',
        traitTagEn: 'recession-proof healthcare ambition',
        traitTagBn: 'চাহিদাসম্পন্ন স্বাস্থ্য ও ফার্মা ক্যারিয়ার',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q21_c',
        labelEn: 'Multinational corporate leadership, fintech & global supply chains',
        labelBn: 'বহুজাতিক প্রতিষ্ঠানের নেতৃত্ব, ফিনটেক ও গ্লোবাল সাপ্লাই চেইন',
        traitTagEn: 'corporate executive trajectory',
        traitTagBn: 'কর্পোরেট ও ফিনটেক নেতৃত্বের লক্ষ্য',
        weights: { bba: 4, economics: 4 },
      },
      {
        id: 'q21_d',
        labelEn: 'Corporate IP law, judicial service, green urbanism & global media',
        labelBn: 'কর্পোরেট ও টেক আইন, বিচারিক সেবা, গ্রিন আর্কিটেকচার ও গ্লোবাল মিডিয়া',
        traitTagEn: 'specialized civic and design leadership',
        traitTagBn: 'আইন, টেকসই নগর ও গ্লোবাল মিডিয়া নেতৃত্ব',
        weights: { law: 4, architecture: 3, english_media: 3 },
      },
    ]
  ),
  makeQuestion(
    22,
    'future_jobs',
    'What is your primary goal within 3 years of graduating?',
    'স্নাতক শেষ করার প্রথম ৩ বছরের মধ্যে আপনার প্রধান লক্ষ্য কী?',
    [
      {
        id: 'q22_a',
        labelEn: 'Join a top software company or build a scalable digital SaaS startup',
        labelBn: 'শীর্ষ সফটওয়্যার কোম্পানিতে যোগ দেওয়া বা নিজস্ব ডিজিটাল স্টার্টআপ গড়া',
        traitTagEn: 'software industry velocity',
        traitTagBn: 'সফটওয়্যার ইন্ডাস্ট্রিতে দ্রুত প্রতিষ্ঠা',
        weights: { cse: 4, bba: 2 },
      },
      {
        id: 'q22_b',
        labelEn: 'Work in semiconductor VLSI, power utilities, or industrial automation',
        labelBn: 'সেমিকন্ডাক্টর VLSI, পাওয়ার সেক্টর বা ইন্ডাস্ট্রিয়াল অটোমেশনে কাজ করা',
        traitTagEn: 'core engineering infrastructure focus',
        traitTagBn: 'কোর ইঞ্জিনিয়ারিং ও পাওয়ার ইন্ডাস্ট্রি লক্ষ্য',
        weights: { eee: 5, architecture: 2 },
      },
      {
        id: 'q22_c',
        labelEn: 'Complete clinical residency or lead pharma quality & R&D formulation',
        labelBn: 'ক্লিনিক্যাল রেসিডেন্সি করা বা শীর্ষ ফার্মা কোম্পানিতে R&D পরিচালনা',
        traitTagEn: 'clinical and pharmaceutical specialization',
        traitTagBn: 'ক্লিনিক্যাল ও ফার্মাসিউটিক্যাল বিশেষজ্ঞতা',
        weights: { medical: 4, pharmacy: 5 },
      },
      {
        id: 'q22_d',
        labelEn: 'Crack BCS / Judiciary / Banking MT or join an international policy/design firm',
        labelBn: 'বিসিএস / বিজেএস / ব্যাংকিং এমটি অথবা আন্তর্জাতিক পলিসি/ডিজাইন ফার্মে যোগ দেওয়া',
        traitTagEn: 'prestigious public and corporate tracks',
        traitTagBn: 'বিসিএস, বিচারিক বা আন্তর্জাতিক কনসালটিং লক্ষ্য',
        weights: { law: 4, economics: 4, bba: 3, english_media: 3, architecture: 3 },
      },
    ]
  ),
  makeQuestion(
    23,
    'future_jobs',
    'How interested are you in pursuing funded Master’s or PhD degrees abroad?',
    'বিদেশে ফুল-ফান্ডেড স্কলারশিপে মাস্টার্স বা পিএইচডি করার প্রতি আপনার আগ্রহ কেমন?',
    [
      {
        id: 'q23_a',
        labelEn: 'Very high — I want research-heavy STEM/Economics fields with top scholarships',
        labelBn: 'খুব বেশি — গবেষণাভিত্তিক স্টেম বা অর্থনীতিতে উচ্চশিক্ষা নিতে চাই',
        traitTagEn: 'global research scholarship drive',
        traitTagBn: 'গবেষণা ও বিদেশি স্কলারশিপের লক্ষ্য',
        weights: { pharmacy: 4, economics: 4, eee: 3, cse: 3 },
      },
      {
        id: 'q23_b',
        labelEn: 'Interested in international medical licensing (PLAB/USMLE) or public health',
        labelBn: 'আন্তর্জাতিক মেডিকেল লাইসেন্সিং (PLAB/USMLE) বা পাবলিক হেলথে আগ্রহী',
        traitTagEn: 'global clinical credential ambition',
        traitTagBn: 'আন্তর্জাতিক মেডিকেল ক্যারিয়ার লক্ষ্য',
        weights: { medical: 5, pharmacy: 2 },
      },
      {
        id: 'q23_c',
        labelEn: 'Interested in global MBA, LL.M., Urban Design, or Media Fellowships',
        labelBn: 'বিদেশে এমবিএ, এলএল.এম., আরবান ডিজাইন বা মিডিয়া ফেলোশিপে আগ্রহী',
        traitTagEn: 'international executive and arts credentials',
        traitTagBn: 'গ্লোবাল এমবিএ, আইন ও ডিজাইন উচ্চশিক্ষা',
        weights: { bba: 3, law: 4, architecture: 4, english_media: 4 },
      },
      {
        id: 'q23_d',
        labelEn: 'Prefer entering the job market immediately in Bangladesh without long study delays',
        labelBn: 'দীর্ঘ পড়াশোনা না বাড়িয়ে দেশে সরাসরি ভালো চাকরিতে ঢুকতে চাই',
        traitTagEn: 'pragmatic early career entry',
        traitTagBn: 'স্নাতক শেষে দ্রুত দেশীয় কর্মজীবন শুরু',
        weights: { bba: 3, cse: 3, eee: 2 },
      },
    ]
  ),
  makeQuestion(
    24,
    'future_jobs',
    'Which sector in Bangladesh do you believe offers the strongest alignment for your strengths?',
    'বাংলাদেশের কোন খাতে আপনার দক্ষতা সবচেয়ে ভালোভাবে কাজে লাগবে বলে মনে করেন?',
    [
      {
        id: 'q24_a',
        labelEn: 'Software export, fintech startups, telecom & AI services',
        labelBn: 'সফটওয়্যার রপ্তানি, ফিনটেক স্টার্টআপ, টেলিকম ও এআই খাত',
        traitTagEn: 'digital economy alignment',
        traitTagBn: 'ডিজিটাল ও সফটওয়্যার অর্থনীতিতে আগ্রহ',
        weights: { cse: 4, bba: 2, eee: 2 },
      },
      {
        id: 'q24_b',
        labelEn: 'Healthcare hospitals, diagnostics & export pharmaceutical manufacturing',
        labelBn: 'স্বাস্থ্যসেবা হাসপাতাল, ডায়াগনস্টিক ও ওষুধ উৎপাদন শিল্প',
        traitTagEn: 'health and pharma sector focus',
        traitTagBn: 'স্বাস্থ্য ও ওষুধ শিল্পে কাজের আগ্রহ',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q24_c',
        labelEn: 'Banking, FMCG multinationals, apparel exports & development agencies',
        labelBn: 'ব্যাংকিং, বহুজাতিক এফএমসিজি, রপ্তানি বাণিজ্য ও উন্নয়ন সংস্থা',
        traitTagEn: 'corporate and development sector alignment',
        traitTagBn: 'ব্যাংকিং, কর্পোরেট ও উন্নয়ন খাতে আগ্রহ',
        weights: { bba: 4, economics: 4 },
      },
      {
        id: 'q24_d',
        labelEn: 'Judiciary, civil administration, smart infrastructure & digital publishing',
        labelBn: 'বিচার বিভাগ, প্রশাসন, স্মার্ট অবকাঠামো ও ডিজিটাল মিডিয়া',
        traitTagEn: 'public governance and infrastructure focus',
        traitTagBn: 'প্রশাসন, বিচার বিভাগ ও আধুনিক অবকাঠামো',
        weights: { law: 4, architecture: 3, english_media: 3, eee: 2 },
      },
    ]
  ),
  makeQuestion(
    25,
    'future_jobs',
    'How do you view freelancing, consulting, or owning an independent practice?',
    'ফ্রিল্যান্সিং, কনসালটিং বা নিজস্ব স্বাধীন প্র্যাকটিস গড়ে তোলার বিষয়ে আপনার আগ্রহ কেমন?',
    [
      {
        id: 'q25_a',
        labelEn: 'High — building software products or global AI/web consulting',
        labelBn: 'খুব বেশি — সফটওয়্যার প্রোডাক্ট বা গ্লোবাল আইটি কনসালটিং করা',
        traitTagEn: 'independent tech consulting ambition',
        traitTagBn: 'স্বাধীন টেক কনসালটিং ও ফ্রিল্যান্সিং',
        weights: { cse: 4, english_media: 2 },
      },
      {
        id: 'q25_b',
        labelEn: 'High — running an independent medical chamber, law practice, or design studio',
        labelBn: 'খুব বেশি — নিজস্ব মেডিকেল চেম্বার, ল’ ফার্ম বা আর্কিটেকচার স্টুডিও',
        traitTagEn: 'autonomous licensed professional practice',
        traitTagBn: 'স্বাধীন পেশাদার প্র্যাকটিস ও স্টুডিও',
        weights: { medical: 3, law: 4, architecture: 4 },
      },
      {
        id: 'q25_c',
        labelEn: 'High — launching a consumer brand, e-commerce venture, or advisory agency',
        labelBn: 'খুব বেশি — নিজস্ব ব্র্যান্ড, ই-কমার্স বা বিজনেস কনসালটিং প্রতিষ্ঠান',
        traitTagEn: 'entrepreneurial brand ownership',
        traitTagBn: 'নিজস্ব ব্র্যান্ড ও ব্যবসায়িক উদ্যোগ',
        weights: { bba: 4, english_media: 2, economics: 2 },
      },
      {
        id: 'q25_d',
        labelEn: 'Prefer institutional career stability in established labs, grids, or central policy roles',
        labelBn: 'প্রতিষ্ঠিত ল্যাব, পাওয়ার গ্রিড বা নীতি গবেষণা প্রতিষ্ঠানে স্থায়ী ক্যারিয়ার পছন্দ',
        traitTagEn: 'institutional research and engineering stability',
        traitTagBn: 'প্রতিষ্ঠিত ল্যাব ও নীতি সংস্থায় স্থায়ী ক্যারিয়ার',
        weights: { pharmacy: 3, eee: 4, economics: 3 },
      },
    ]
  ),
  makeQuestion(
    26,
    'future_jobs',
    'As AI reshapes white-collar jobs, which human advantage do you want to double down on?',
    'এআই-এর যুগে কোন মানবিক দক্ষতাটিকে আপনি আপনার সবচেয়ে বড় শক্তিতে রূপান্তর করতে চান?',
    [
      {
        id: 'q26_a',
        labelEn: 'Designing, training, and securing the AI & hardware infrastructure itself',
        labelBn: 'এআই ও হার্ডওয়্যার অবকাঠামো নিজেই ডিজাইন, পরিচালনা ও সুরক্ষিত রাখা',
        traitTagEn: 'builder of next-gen AI infrastructure',
        traitTagBn: 'আগামী প্রজন্মের এআই ও হার্ডওয়্যার নির্মাতা',
        weights: { cse: 5, eee: 4 },
      },
      {
        id: 'q26_b',
        labelEn: 'Hands-on clinical empathy, diagnostics & physical wet-lab verification',
        labelBn: 'সরাসরি মানবিক চিকিৎসাসেবা ও নির্ভুল ল্যাবরেটরি যাচাইকরণ',
        traitTagEn: 'irreplaceable human clinical and lab judgment',
        traitTagBn: 'অপরিবর্তনীয় মানবিক চিকিৎসা ও ল্যাব দক্ষতা',
        weights: { medical: 4, pharmacy: 4 },
      },
      {
        id: 'q26_c',
        labelEn: 'Strategic persuasion, ethical governance, negotiation & cultural insight',
        labelBn: 'কৌশলগত নেতৃত্ব, নৈতিক নীতিনির্ধারণ, নেগোসিয়েশন ও সাংস্কৃতিক বোঝাপড়া',
        traitTagEn: 'high-trust strategic leadership',
        traitTagBn: 'কৌশলগত নেতৃত্ব ও নীতিনির্ধারণ ক্ষমতা',
        weights: { bba: 4, law: 4, economics: 3, english_media: 3 },
      },
      {
        id: 'q26_d',
        labelEn: 'Tactile spatial architecture & human-centered community design',
        labelBn: 'মানবিক ও পরিবেশবান্ধব বাস্তব স্থাপত্য এবং নগর নকশা',
        traitTagEn: 'human-centered spatial imagination',
        traitTagBn: 'মানবকেন্দ্রিক স্পেশাল ও স্থাপত্য কল্পনাশক্তি',
        weights: { architecture: 5, english_media: 2 },
      },
    ]
  ),
  makeQuestion(
    27,
    'future_jobs',
    'Which career trade-off are you most willing to accept?',
    'ভবিষ্যৎ ক্যারিয়ারের কোন চ্যালেঞ্জটি আপনি হাসিমুখে গ্রহণ করতে প্রস্তুত?',
    [
      {
        id: 'q27_a',
        labelEn: 'Rapidly learning new tech stacks every 2 years to stay on top',
        labelBn: 'প্রতি ২ বছর পরপর নতুন প্রযুক্তি ও কোডিং স্ট্যাক শিখে নিজেকে আপডেট রাখা',
        traitTagEn: 'continuous technical reinvention',
        traitTagBn: 'নিরন্তর নতুন প্রযুক্তি শেখার মানসিকতা',
        weights: { cse: 4, eee: 3 },
      },
      {
        id: 'q27_b',
        labelEn: 'Long clinical shifts and lifelong accountability for human wellbeing',
        labelBn: 'দীর্ঘ ক্লিনিক্যাল ডিউটি এবং মানুষের স্বাস্থ্যের প্রতি আজীবন দায়বদ্ধতা',
        traitTagEn: 'tireless patient-first commitment',
        traitTagBn: 'মানবসেবায় দীর্ঘ সময় ও দায়িত্বশীলতা',
        weights: { medical: 5, pharmacy: 2 },
      },
      {
        id: 'q27_c',
        labelEn: 'Performance KPIs, revenue responsibility, and competitive corporate targets',
        labelBn: 'কর্পোরেট লক্ষ্যমাত্রা, বাজার প্রতিযোগিতা ও ফলাফলভিত্তিক দায়িত্ব',
        traitTagEn: 'results-driven commercial ownership',
        traitTagBn: 'ফলাফলভিত্তিক ব্যবসায়িক দায়িত্বশীলতা',
        weights: { bba: 4, economics: 3 },
      },
      {
        id: 'q27_d',
        labelEn: 'Dense legal/academic reading, meticulous citations, or multi-month design revisions',
        labelBn: 'গভীর আইনি ও একাডেমিক পাঠ, নিখুঁত বিশ্লেষণ বা দীর্ঘমেয়াদি ডিজাইন পরিমার্জন',
        traitTagEn: 'scholarly and design perseverance',
        traitTagBn: 'গভীর পাঠ, বিশ্লেষণ ও ডিজাইন ধৈর্য',
        weights: { law: 4, english_media: 4, architecture: 4, pharmacy: 2 },
      },
    ]
  ),
  makeQuestion(
    28,
    'future_jobs',
    'Are you strongly drawn to Government / BCS / Diplomatic / Judicial public service?',
    'সরকারি উচ্চপদে (বিসিএস, কূটনৈতিক ক্যাডার বা জুডিশিয়াল সার্ভিস) কাজ করার আগ্রহ আপনার কতটুকু?',
    [
      {
        id: 'q28_a',
        labelEn: 'Yes — Judicial Service (BJS), Foreign Affairs, or Admin Cadre is a top goal',
        labelBn: 'হ্যাঁ — জুডিশিয়াল সার্ভিস, পররাষ্ট্র বা প্রশাসন ক্যাডার আমার প্রধান লক্ষ্য',
        traitTagEn: 'public service and governance aspiration',
        traitTagBn: 'সিভিল ও জুডিশিয়াল সার্ভিসের উচ্চাকাঙ্ক্ষা',
        weights: { law: 5, economics: 3, english_media: 3 },
      },
      {
        id: 'q28_b',
        labelEn: 'Yes — BCS Health / Govt Medical Officer or Public Engineering Cadre',
        labelBn: 'হ্যাঁ — বিসিএস স্বাস্থ্য ক্যাডার বা সরকারি প্রকৌশল ক্যাডারে আগ্রহী',
        traitTagEn: 'public clinical or engineering service',
        traitTagBn: 'সরকারি স্বাস্থ্য বা প্রকৌশল ক্যাডার লক্ষ্য',
        weights: { medical: 4, eee: 3, architecture: 2 },
      },
      {
        id: 'q28_c',
        labelEn: 'Prefer global private sector, multinationals, or high-growth tech over govt jobs',
        labelBn: 'সরকারি চাকরির চেয়ে গ্লোবাল প্রাইভেট সেক্টর, বহুজাতিক বা টেক কোম্পানি বেশি পছন্দ',
        traitTagEn: 'private-sector global competitiveness',
        traitTagBn: 'বেসরকারি ও বৈশ্বিক কর্পোরেট প্রতিযোগিতায় আগ্রহ',
        weights: { cse: 4, bba: 4, pharmacy: 3 },
      },
      {
        id: 'q28_d',
        labelEn: 'Open to Central Bank, UN agencies, or think-tank policy research roles',
        labelBn: 'কেন্দ্রীয় ব্যাংক, জাতিসংঘ বা আন্তর্জাতিক গবেষণা সংস্থায় কাজের আগ্রহ বেশি',
        traitTagEn: 'policy and institutional economics',
        traitTagBn: 'আর্থিক ও নীতি গবেষণা সংস্থার লক্ষ্য',
        weights: { economics: 5, bba: 2, english_media: 2 },
      },
    ]
  ),
  makeQuestion(
    29,
    'future_jobs',
    'Ten years from now, what title on your profile would make you happiest?',
    'আজ থেকে ১০ বছর পর আপনার পরিচয়ের সাথে কোন পদবিটি দেখলে সবচেয়ে ভালো লাগবে?',
    [
      {
        id: 'q29_a',
        labelEn: 'Principal AI / Software Architect or Tech Startup CTO',
        labelBn: 'প্রিন্সিপাল এআই / সফটওয়্যার আর্কিটেক্ট বা টেক স্টার্টআপ সিটিও',
        traitTagEn: 'technical leadership vision',
        traitTagBn: 'সর্বোচ্চ টেকনিক্যাল নেতৃত্বের লক্ষ্য',
        weights: { cse: 5, eee: 2 },
      },
      {
        id: 'q29_b',
        labelEn: 'Consultant Surgeon / Physician or Director of Pharmaceutical R&D',
        labelBn: 'বিশেষজ্ঞ চিকিৎসক / সার্জন অথবা ফার্মা আরঅ্যান্ডডি ডিরেক্টর',
        traitTagEn: 'senior medical or scientific authority',
        traitTagBn: 'শীর্ষ চিকিৎসক বা বৈজ্ঞানিক গবেষক পরিচয়',
        weights: { medical: 5, pharmacy: 4 },
      },
      {
        id: 'q29_c',
        labelEn: 'Chief Marketing / Finance Officer, Investment Strategist, or Senior Economist',
        labelBn: 'কর্পোরেট ডিরেক্টর, ইনভেস্টমেন্ট স্ট্র্যাটেজিস্ট বা সিনিয়র ইকোনমিস্ট',
        traitTagEn: 'executive financial leadership',
        traitTagBn: 'শীর্ষ ব্যবসায়িক ও অর্থনৈতিক নেতৃত্ব',
        weights: { bba: 5, economics: 5 },
      },
      {
        id: 'q29_d',
        labelEn: 'Advocate / Judge, Lead Hardware/Power Engineer, Principal Architect, or Editor',
        labelBn: 'বিচারক/অ্যাডভোকেট, চিফ ইলেকট্রিক্যাল ইঞ্জিনিয়ার, প্রিন্সিপাল আর্কিটেক্ট বা এডিটর',
        traitTagEn: 'distinguished mastery in law, engineering, or design',
        traitTagBn: 'আইন, প্রকৌশল বা স্থাপত্যে শীর্ষ পেশাগত অবস্থান',
        weights: { law: 4, eee: 4, architecture: 4, english_media: 4 },
      },
    ]
  ),
  makeQuestion(
    30,
    'future_jobs',
    'Final reflection: Which promise matters most as you choose your Honours subject today?',
    'শেষ প্রশ্ন: আজ অনার্সের বিষয় নির্বাচনের সময় কোন বিষয়টি আপনার কাছে সবচেয়ে বেশি গুরুত্ব পাচ্ছে?',
    [
      {
        id: 'q30_a',
        labelEn: 'High global demand, strong coding/engineering skills & borderless income',
        labelBn: 'বৈশ্বিক চাহিদা, আধুনিক ইঞ্জিনিয়ারিং দক্ষতা ও সীমানাহীন আয়ের সুযোগ',
        traitTagEn: 'globally transferable STEM capability',
        traitTagBn: 'বৈশ্বিকভাবে প্রযোজ্য আধুনিক স্টেম দক্ষতা',
        weights: { cse: 4, eee: 4 },
      },
      {
        id: 'q30_b',
        labelEn: 'Healing humanity, scientific integrity & lifelong social respect',
        labelBn: 'মানবসেবা, বৈজ্ঞানিক সততা ও আজীবন সামাজিক সম্মান',
        traitTagEn: 'service-driven scientific integrity',
        traitTagBn: 'মানবসেবা ও বৈজ্ঞানিক মর্যাদা',
        weights: { medical: 5, pharmacy: 4 },
      },
      {
        id: 'q30_c',
        labelEn: 'Leadership versatility across business, finance, policy & global careers',
        labelBn: 'ব্যবসা, অর্থনীতি ও নীতিনির্ধারণে বহুমুখী নেতৃত্বের সুযোগ',
        traitTagEn: 'cross-industry leadership adaptability',
        traitTagBn: 'বহুমুখী কর্পোরেট ও নীতি নেতৃত্ব',
        weights: { bba: 4, economics: 4, law: 2 },
      },
      {
        id: 'q30_d',
        labelEn: 'Building a voice for justice, culture, and sustainable human spaces',
        labelBn: 'ন্যায়বিচার, সংস্কৃতি ও টেকসই মানবিক পরিবেশ গড়ে তোলা',
        traitTagEn: 'purpose-driven civic and creative impact',
        traitTagBn: 'ন্যায়বিচার ও সৃজনশীল সামাজিক অবদান',
        weights: { law: 4, english_media: 4, architecture: 4 },
      },
    ]
  ),
];

const catalogByCode = new Map(
  BANGLADESH_INSTITUTIONS_CATALOG.map((inst) => [inst.code.toLowerCase(), inst])
);

export function resolveUniversitiesForTrack(codes: string[]): RecommendedUniversityItem[] {
  const resolved: RecommendedUniversityItem[] = [];
  for (const code of codes) {
    const match = catalogByCode.get(code.toLowerCase());
    if (match) {
      resolved.push({
        code: match.code,
        nameEn: match.nameEn,
        nameBn: match.nameBn,
        category: match.category,
        officialWebsite: match.officialWebsite,
      });
    }
  }
  return resolved;
}

export function evaluateCareerQuiz(
  answers: Record<number, string>
): CareerQuizEvaluation {
  const rawScores: Record<SubjectTrackId, number> = {
    cse: 0,
    eee: 0,
    medical: 0,
    pharmacy: 0,
    bba: 0,
    economics: 0,
    law: 0,
    english_media: 0,
    architecture: 0,
  };

  // Maximum theoretical score per track for normalized calibration
  const maxPossible: Record<SubjectTrackId, number> = {
    cse: 0,
    eee: 0,
    medical: 0,
    pharmacy: 0,
    bba: 0,
    economics: 0,
    law: 0,
    english_media: 0,
    architecture: 0,
  };

  const trackTraitHits: Record<SubjectTrackId, Array<{ en: string; bn: string; weight: number }>> = {
    cse: [],
    eee: [],
    medical: [],
    pharmacy: [],
    bba: [],
    economics: [],
    law: [],
    english_media: [],
    architecture: [],
  };

  let answeredCount = 0;

  for (const question of CAREER_QUIZ_QUESTIONS) {
    // Track per-question max possible per subject
    for (const trackId of Object.keys(maxPossible) as SubjectTrackId[]) {
      let questionMax = 0;
      for (const opt of question.options) {
        const w = opt.weights[trackId] ?? 0;
        if (w > questionMax) questionMax = w;
      }
      maxPossible[trackId] += questionMax;
    }

    const chosenOptionId = answers[question.id];
    if (!chosenOptionId) continue;
    const chosenOption = question.options.find((opt) => opt.id === chosenOptionId);
    if (!chosenOption) continue;

    answeredCount += 1;
    for (const [trackKey, weight] of Object.entries(chosenOption.weights) as Array<
      [SubjectTrackId, number]
    >) {
      if (weight > 0) {
        rawScores[trackKey] += weight;
        trackTraitHits[trackKey].push({
          en: chosenOption.traitTagEn,
          bn: chosenOption.traitTagBn,
          weight,
        });
      }
    }
  }

  const ranked = (Object.keys(SUBJECT_TRACK_CATALOG) as SubjectTrackId[])
    .map((trackId) => {
      const denom = Math.max(1, maxPossible[trackId]);
      const ratio = rawScores[trackId] / denom;
      // Calibrate into an intuitive 58%..98% match scale when answered strongly, or proportional if low
      const matchPercentage =
        answeredCount === 0
          ? 0
          : Math.max(25, Math.min(98, Math.round(36 + ratio * 62)));
      return {
        trackId,
        rawScore: rawScores[trackId],
        ratio,
        matchPercentage,
      };
    })
    .sort((a, b) => {
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      return b.rawScore - a.rawScore;
    });

  const topFour = ranked.slice(0, 4).map(({ trackId, matchPercentage }) => {
    const profile = SUBJECT_TRACK_CATALOG[trackId];
    const topHits = [...trackTraitHits[trackId]]
      .sort((a, b) => b.weight - a.weight)
      .filter((item, idx, arr) => arr.findIndex((x) => x.en === item.en) === idx)
      .slice(0, 2);

    const traitPhraseEn =
      topHits.length > 0
        ? topHits.map((t) => t.en).join(' and ')
        : profile.coreInterestEn;
    const traitPhraseBn =
      topHits.length > 0
        ? topHits.map((t) => t.bn).join(' এবং ')
        : profile.coreInterestBn;

    return {
      id: profile.id,
      titleEn: profile.titleEn,
      titleBn: profile.titleBn,
      degreeBadgeEn: profile.degreeBadgeEn,
      degreeBadgeBn: profile.degreeBadgeBn,
      matchPercentage,
      whyItFitsEn: `Your responses highlight strong ${traitPhraseEn}, aligning closely with ${profile.coreInterestEn}.`,
      whyItFitsBn: `আপনার উত্তরগুলোতে ${traitPhraseBn}-এর স্পষ্ট প্রবণতা ফুটে উঠেছে, যা ${profile.coreInterestBn}-এর সাথে চমৎকারভাবে মিলে যায়।`,
      jobOutlookEn: profile.jobOutlookEn,
      jobOutlookBn: profile.jobOutlookBn,
      demandHighlightsEn: profile.demandHighlightsEn,
      demandHighlightsBn: profile.demandHighlightsBn,
      topUniversities: resolveUniversitiesForTrack(profile.universityCodes),
    };
  });

  const topTrack = topFour[0];
  const dominantTraitsEn = topTrack
    ? [...trackTraitHits[topTrack.id]]
        .sort((a, b) => b.weight - a.weight)
        .filter((item, idx, arr) => arr.findIndex((x) => x.en === item.en) === idx)
        .slice(0, 3)
        .map((t) => t.en)
    : [];
  const dominantTraitsBn = topTrack
    ? [...trackTraitHits[topTrack.id]]
        .sort((a, b) => b.weight - a.weight)
        .filter((item, idx, arr) => arr.findIndex((x) => x.bn === item.bn) === idx)
        .slice(0, 3)
        .map((t) => t.bn)
    : [];

  return {
    answeredCount,
    totalQuestions: CAREER_QUIZ_QUESTIONS.length,
    completedAtIso: new Date().toISOString(),
    topSubjects: topFour,
    dominantTraitsEn,
    dominantTraitsBn,
  };
}
