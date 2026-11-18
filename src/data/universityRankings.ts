import type { AdmissionCategoryId } from '../types/domain';
import { BANGLADESH_INSTITUTIONS_CATALOG } from './bangladeshInstitutions.ts';

export interface UniversityRankingEntry {
  code: string;
  nameEn: string;
  nameBn: string;
  category: AdmissionCategoryId;
  institutionTypeEn: string;
  institutionTypeBn: string;
  establishedYear?: number | null;
  qsGlobal2026: string;
  theGlobal2026: string;
  bangladeshStandingEn: string;
  bangladeshStandingBn: string;
  sourceCitation: string;
  citationYear: number;
  sourceUrl: string;
}

export interface RankingCitationSeed {
  institutionCode: string;
  qsGlobal2026: string;
  theGlobal2026: string;
  qsRankScore: number | null;
  theRankScore: number | null;
  qsAsiaRankScore: number | null;
  bangladeshStandingEn: string;
  bangladeshStandingBn: string;
  sourceCitation: string;
  citationYear: number;
  sourceUrl: string;
}

export interface RankableInstitutionInput {
  code: string;
  nameEn: string;
  nameBn: string;
  category: string;
  institutionType: string;
  institutionTypeBn: string;
  establishedYear?: number | null;
}

// Verified 2026 global & regional citations (QS World University Rankings 2026,
// Times Higher Education World University Rankings 2026, QS Asia 2026, DGME, UGC).
export const RANKING_CITATIONS_2026: RankingCitationSeed[] = [
  // --- QS World University Rankings 2026 (15 Bangladeshi Universities) ---
  {
    institutionCode: 'DU',
    qsGlobal2026: '#584',
    theGlobal2026: '801–1000',
    qsRankScore: 584,
    theRankScore: 801,
    qsAsiaRankScore: 112,
    bangladeshStandingEn: '#1 in QS WUR 2026 · Joint #1 Tier in THE WUR 2026',
    bangladeshStandingBn: 'QS WUR 2026-এ দেশে ১ম · THE WUR 2026-এ যৌথ শীর্ষ স্তর',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'BUET',
    qsGlobal2026: '761–770',
    theGlobal2026: '1001–1200',
    qsRankScore: 761,
    theRankScore: 1001,
    qsAsiaRankScore: 199,
    bangladeshStandingEn: '#2 in QS WUR 2026 · #1 Engineering University',
    bangladeshStandingBn: 'QS WUR 2026-এ দেশে ২য় · শীর্ষ প্রকৌশল বিশ্ববিদ্যালয়',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'NSU',
    qsGlobal2026: '951–1000',
    theGlobal2026: '801–1000',
    qsRankScore: 951,
    theRankScore: 801,
    qsAsiaRankScore: 149,
    bangladeshStandingEn: '#3 in QS WUR 2026 · #1 Private University in QS Asia (#149)',
    bangladeshStandingBn: 'QS WUR 2026-এ দেশে ৩য় · QS এশিয়ায় শীর্ষ প্রাইভেট (#১৪৯)',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'DIU',
    qsGlobal2026: '1001–1200',
    theGlobal2026: '801–1000',
    qsRankScore: 1001,
    theRankScore: 801,
    qsAsiaRankScore: 221,
    bangladeshStandingEn: 'Joint #1 Tier in THE WUR 2026 · Top Private Tier in QS WUR 2026',
    bangladeshStandingBn: 'THE WUR 2026-এ যৌথ শীর্ষ স্তর · QS-এ শীর্ষ প্রাইভেট স্তর',
    sourceCitation: 'Times Higher Education (THE) & QS World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'JU',
    qsGlobal2026: '1201–1400',
    theGlobal2026: '801–1000',
    qsRankScore: 1201,
    theRankScore: 801,
    qsAsiaRankScore: 301,
    bangladeshStandingEn: 'Joint #1 Tier in THE WUR 2026 · Top 1400 in QS WUR 2026',
    bangladeshStandingBn: 'THE WUR 2026-এ যৌথ শীর্ষ স্তর · QS WUR-এ ১২০০–১৪০০ স্তর',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'BracU',
    qsGlobal2026: '1201–1400',
    theGlobal2026: '1001–1200',
    qsRankScore: 1201,
    theRankScore: 1001,
    qsAsiaRankScore: 260,
    bangladeshStandingEn: 'Top Private Tier in QS WUR 2026 & THE WUR 2026 (QS Asia #260)',
    bangladeshStandingBn: 'QS ও THE WUR 2026-এ শীর্ষ প্রাইভেট স্তর (QS এশিয়া #২৬০)',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'RU',
    qsGlobal2026: '1201–1400',
    theGlobal2026: '1001–1200',
    qsRankScore: 1201,
    theRankScore: 1001,
    qsAsiaRankScore: 351,
    bangladeshStandingEn: 'Top Public University Tier in QS WUR 2026 & THE WUR 2026',
    bangladeshStandingBn: 'QS ও THE WUR 2026-এ শীর্ষ পাবলিক বিশ্ববিদ্যালয় স্তর',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'IUT',
    qsGlobal2026: '1201–1400',
    theGlobal2026: '—',
    qsRankScore: 1201,
    theRankScore: null,
    qsAsiaRankScore: 401,
    bangladeshStandingEn: 'OIC International Engineering University · QS WUR 1201–1400',
    bangladeshStandingBn: 'ওআইসি আন্তর্জাতিক প্রকৌশল বিশ্ববিদ্যালয় · QS WUR ১২০১–১৪০০',
    sourceCitation: 'QS World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'KUET',
    qsGlobal2026: '1401+',
    theGlobal2026: '1001–1200',
    qsRankScore: 1401,
    theRankScore: 1001,
    qsAsiaRankScore: 420,
    bangladeshStandingEn: 'Top Engineering University in QS WUR & THE WUR (1001–1200)',
    bangladeshStandingBn: 'QS WUR ও THE WUR (১০০১–১২০০)-এ শীর্ষ প্রকৌশল বিশ্ববিদ্যালয়',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'AIUB',
    qsGlobal2026: '1401+',
    theGlobal2026: '1201–1500',
    qsRankScore: 1401,
    theRankScore: 1201,
    qsAsiaRankScore: 771,
    bangladeshStandingEn: 'Top Private Tier in QS WUR 2026 & THE WUR 2026',
    bangladeshStandingBn: 'QS WUR ও THE WUR 2026-এ শীর্ষ প্রাইভেট বিশ্ববিদ্যালয় স্তর',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'CUET',
    qsGlobal2026: '1401+',
    theGlobal2026: '1201–1500',
    qsRankScore: 1401,
    theRankScore: 1201,
    qsAsiaRankScore: 480,
    bangladeshStandingEn: 'Engineering Tier in QS WUR 2026 & THE WUR 2026',
    bangladeshStandingBn: 'QS WUR ও THE WUR 2026-এ প্রকৌশল বিশ্ববিদ্যালয় স্তর',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'KU',
    qsGlobal2026: '1401+',
    theGlobal2026: '1201–1500',
    qsRankScore: 1401,
    theRankScore: 1201,
    qsAsiaRankScore: 460,
    bangladeshStandingEn: 'Public University Tier in QS WUR 2026 & THE WUR 2026',
    bangladeshStandingBn: 'QS WUR ও THE WUR 2026-এ পাবলিক বিশ্ববিদ্যালয় স্তর',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'EWU',
    qsGlobal2026: '1401+',
    theGlobal2026: '1501+',
    qsRankScore: 1401,
    theRankScore: 1501,
    qsAsiaRankScore: 491,
    bangladeshStandingEn: 'Private University Tier in QS WUR 2026 & QS Asia #491',
    bangladeshStandingBn: 'QS WUR 2026 ও QS এশিয়া (#৪৯১)-এ প্রাইভেট বিশ্ববিদ্যালয় স্তর',
    sourceCitation: 'QS World University Rankings & Times Higher Education (THE)',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'IUB',
    qsGlobal2026: '1401+',
    theGlobal2026: '—',
    qsRankScore: 1401,
    theRankScore: null,
    qsAsiaRankScore: 574,
    bangladeshStandingEn: 'Private University Tier in QS WUR 2026 & QS Asia #574',
    bangladeshStandingBn: 'QS WUR 2026 ও QS এশিয়া (#৫৭৪)-এ প্রাইভেট বিশ্ববিদ্যালয় স্তর',
    sourceCitation: 'QS World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },
  {
    institutionCode: 'RUET',
    qsGlobal2026: '1401+',
    theGlobal2026: '—',
    qsRankScore: 1401,
    theRankScore: null,
    qsAsiaRankScore: 520,
    bangladeshStandingEn: 'Engineering University Tier in QS WUR 2026',
    bangladeshStandingBn: 'QS WUR 2026-এ স্বীকৃত প্রকৌশল বিশ্ববিদ্যালয় স্তর',
    sourceCitation: 'QS World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
  },

  // --- THE World University Rankings 2026 Ranked & Reporter (Non-QS Overall) ---
  {
    institutionCode: 'GAU',
    qsGlobal2026: '—',
    theGlobal2026: '801–1000',
    qsRankScore: null,
    theRankScore: 801,
    qsAsiaRankScore: 450,
    bangladeshStandingEn: 'Joint #1 Tier in THE WUR 2026 · #1 Agricultural University',
    bangladeshStandingBn: 'THE WUR 2026-এ যৌথ শীর্ষ স্তর · শীর্ষ কৃষি বিশ্ববিদ্যালয়',
    sourceCitation: 'Times Higher Education (THE) World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'BAU',
    qsGlobal2026: '—',
    theGlobal2026: '1001–1200',
    qsRankScore: null,
    theRankScore: 1001,
    qsAsiaRankScore: 410,
    bangladeshStandingEn: 'Top Agricultural University in THE WUR 2026 (1001–1200)',
    bangladeshStandingBn: 'THE WUR 2026 (১০০১–১২০০)-এ শীর্ষ কৃষি বিশ্ববিদ্যালয়',
    sourceCitation: 'Times Higher Education (THE) World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'JUST',
    qsGlobal2026: '—',
    theGlobal2026: '1001–1200',
    qsRankScore: null,
    theRankScore: 1001,
    qsAsiaRankScore: 510,
    bangladeshStandingEn: 'Top GST Cluster University in THE WUR 2026 (1001–1200)',
    bangladeshStandingBn: 'THE WUR 2026 (১০০১–১২০০)-এ শীর্ষ জিএসটি গুচ্ছ বিশ্ববিদ্যালয়',
    sourceCitation: 'Times Higher Education (THE) World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'CU',
    qsGlobal2026: '—',
    theGlobal2026: '1201–1500',
    qsRankScore: null,
    theRankScore: 1201,
    qsAsiaRankScore: 440,
    bangladeshStandingEn: 'Leading Public University in THE WUR 2026 (1201–1500)',
    bangladeshStandingBn: 'THE WUR 2026 (১২০১–১৫০০)-এ স্বীকৃত পাবলিক বিশ্ববিদ্যালয়',
    sourceCitation: 'Times Higher Education (THE) World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'MBSTU',
    qsGlobal2026: '—',
    theGlobal2026: '1201–1500',
    qsRankScore: null,
    theRankScore: 1201,
    qsAsiaRankScore: 600,
    bangladeshStandingEn: 'GST Science & Technology University in THE WUR 2026',
    bangladeshStandingBn: 'THE WUR 2026-এ অন্তর্ভুক্ত জিএসটি বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়',
    sourceCitation: 'Times Higher Education (THE) World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'NSTU',
    qsGlobal2026: '—',
    theGlobal2026: '1201–1500',
    qsRankScore: null,
    theRankScore: 1201,
    qsAsiaRankScore: 610,
    bangladeshStandingEn: 'GST Science & Technology University in THE WUR 2026',
    bangladeshStandingBn: 'THE WUR 2026-এ অন্তর্ভুক্ত জিএসটি বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়',
    sourceCitation: 'Times Higher Education (THE) World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'MIST',
    qsGlobal2026: '—',
    theGlobal2026: '1501+',
    qsRankScore: null,
    theRankScore: 1501,
    qsAsiaRankScore: 550,
    bangladeshStandingEn: 'Specialized Engineering Institute in THE WUR 2026 (1501+)',
    bangladeshStandingBn: 'THE WUR 2026 (১৫০১+)-এ বিশেষায়িত প্রকৌশল প্রতিষ্ঠান',
    sourceCitation: 'Times Higher Education (THE) World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },
  {
    institutionCode: 'BUP',
    qsGlobal2026: '—',
    theGlobal2026: 'Reporter',
    qsRankScore: null,
    theRankScore: 2000,
    qsAsiaRankScore: 650,
    bangladeshStandingEn: 'THE WUR 2026 Reporter Institution · Public Research University',
    bangladeshStandingBn: 'THE WUR 2026 রিপোর্টার প্রতিষ্ঠান · পাবলিক বিশ্ববিদ্যালয়',
    sourceCitation: 'Times Higher Education (THE) World University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.timeshighereducation.com/world-university-rankings',
  },

  // --- QS Asia University Rankings 2026 Listed Universities ---
  {
    institutionCode: 'SUST',
    qsGlobal2026: 'QS Asia Listed',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 430,
    bangladeshStandingEn: 'Featured in QS Asia Rankings (GST Cluster Lead)',
    bangladeshStandingBn: 'QS এশিয়া ও বিষয়ভিত্তিক তালিকায় অন্তর্ভুক্ত (জিএসটি গুচ্ছ)',
    sourceCitation: 'QS Asia University Rankings & UGC Annual Directory',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'AUST',
    qsGlobal2026: 'QS Asia #518',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 518,
    bangladeshStandingEn: 'Top Private Engineering & Science University (QS Asia #518)',
    bangladeshStandingBn: 'শীর্ষ প্রাইভেট প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (QS এশিয়া #৫১৮)',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'IUBAT',
    qsGlobal2026: 'QS Asia #644',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 644,
    bangladeshStandingEn: 'Featured in QS Asia University Rankings 2026 (#644)',
    bangladeshStandingBn: 'QS এশিয়া বিশ্ববিদ্যালয় র‍্যাঙ্কিং ২০২৬-এ (#৬৪৪) অন্তর্ভুক্ত',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'UIU',
    qsGlobal2026: 'QS Asia #651',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 651,
    bangladeshStandingEn: 'Top Private Research University (QS Asia #651)',
    bangladeshStandingBn: 'শীর্ষ প্রাইভেট গবেষণা বিশ্ববিদ্যালয় (QS এশিয়া #৬৫১)',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'SEU',
    qsGlobal2026: 'QS Asia 741–750',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 741,
    bangladeshStandingEn: 'Featured in QS Asia University Rankings 2026 (741–750)',
    bangladeshStandingBn: 'QS এশিয়া বিশ্ববিদ্যালয় র‍্যাঙ্কিং ২০২৬ (৭৪১–৭৫০)-এ অন্তর্ভুক্ত',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'SU',
    qsGlobal2026: 'QS Asia 781–790',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 781,
    bangladeshStandingEn: 'Featured in QS Asia University Rankings 2026 (781–790)',
    bangladeshStandingBn: 'QS এশিয়া বিশ্ববিদ্যালয় র‍্যাঙ্কিং ২০২৬ (৭৮১–৭৯০)-এ অন্তর্ভুক্ত',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'UAP',
    qsGlobal2026: 'QS Asia 901–950',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 901,
    bangladeshStandingEn: 'Featured in QS Asia University Rankings 2026 (901–950)',
    bangladeshStandingBn: 'QS এশিয়া বিশ্ববিদ্যালয় র‍্যাঙ্কিং ২০২৬ (৯০১–৯৫০)-এ অন্তর্ভুক্ত',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'ULAB',
    qsGlobal2026: 'QS Asia 1001+',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 1001,
    bangladeshStandingEn: 'Featured in QS Asia University Rankings 2026 (1001+)',
    bangladeshStandingBn: 'QS এশিয়া বিশ্ববিদ্যালয় র‍্যাঙ্কিং ২০২৬ (১০০১+)-এ অন্তর্ভুক্ত',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'GUB',
    qsGlobal2026: 'QS Asia 1001+',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 1002,
    bangladeshStandingEn: 'Featured in QS Asia University Rankings 2026 (1001+)',
    bangladeshStandingBn: 'QS এশিয়া বিশ্ববিদ্যালয় র‍্যাঙ্কিং ২০২৬ (১০০১+)-এ অন্তর্ভুক্ত',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'IIUC',
    qsGlobal2026: 'QS Asia 1001+',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 1003,
    bangladeshStandingEn: 'Featured in QS Asia University Rankings 2026 (1001+)',
    bangladeshStandingBn: 'QS এশিয়া বিশ্ববিদ্যালয় র‍্যাঙ্কিং ২০২৬ (১০০১+)-এ অন্তর্ভুক্ত',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'DHAKA-IU',
    qsGlobal2026: 'QS Asia 1001+',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 1004,
    bangladeshStandingEn: 'Featured in QS Asia University Rankings 2026 (1001+)',
    bangladeshStandingBn: 'QS এশিয়া বিশ্ববিদ্যালয় র‍্যাঙ্কিং ২০২৬ (১০০১+)-এ অন্তর্ভুক্ত',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },
  {
    institutionCode: 'UU',
    qsGlobal2026: 'QS Asia 1001+',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: 1005,
    bangladeshStandingEn: 'Featured in QS Asia University Rankings 2026 (1001+)',
    bangladeshStandingBn: 'QS এশিয়া বিশ্ববিদ্যালয় র‍্যাঙ্কিং ২০২৬ (১০০১+)-এ অন্তর্ভুক্ত',
    sourceCitation: 'QS Asia University Rankings',
    citationYear: 2026,
    sourceUrl: 'https://www.topuniversities.com/asia-university-rankings',
  },

  // --- Flagship National Medical & Affiliated Institutions (Unranked in QS/THE Overall) ---
  {
    institutionCode: 'DMC',
    qsGlobal2026: '—',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: null,
    bangladeshStandingEn: 'Flagship Govt. Medical College (DGME Centralized MBBS Merit)',
    bangladeshStandingBn: 'শীর্ষ সরকারি মেডিকেল কলেজ (DGME কেন্দ্রীয় মেধাক্রম)',
    sourceCitation: 'Directorate General of Medical Education (DGME)',
    citationYear: 2026,
    sourceUrl: 'https://dgme.gov.bd',
  },
  {
    institutionCode: 'NU',
    qsGlobal2026: '—',
    theGlobal2026: '—',
    qsRankScore: null,
    theRankScore: null,
    qsAsiaRankScore: null,
    bangladeshStandingEn: 'Largest Public Affiliated College & Honours Network in Bangladesh',
    bangladeshStandingBn: 'দেশের বৃহত্তম অধিভুক্ত অনার্স কলেজ নেটওয়ার্ক',
    sourceCitation: 'University Grants Commission (UGC) Bangladesh',
    citationYear: 2026,
    sourceUrl: 'https://www.nu.ac.bd',
  },
];

const CATEGORY_TIER_ORDER: Record<AdmissionCategoryId, number> = {
  public: 0,
  engineering: 1,
  gst: 2,
  private: 3,
  medical: 4,
  national: 5,
};

function getDefaultNationalStanding(category: AdmissionCategoryId): {
  standingEn: string;
  standingBn: string;
  sourceCitation: string;
  sourceUrl: string;
} {
  switch (category) {
    case 'public':
      return {
        standingEn: 'UGC Approved Public University',
        standingBn: 'ইউজিসি অনুমোদিত পাবলিক বিশ্ববিদ্যালয়',
        sourceCitation: 'UGC Bangladesh Official Directory',
        sourceUrl: 'https://www.ugc.gov.bd',
      };
    case 'engineering':
      return {
        standingEn: 'Engineering & Technology University Tier',
        standingBn: 'প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় স্তর',
        sourceCitation: 'UGC Bangladesh Official Directory',
        sourceUrl: 'https://www.ugc.gov.bd',
      };
    case 'gst':
      return {
        standingEn: 'GST Cluster Public University',
        standingBn: 'জিএসটি গুচ্ছ পাবলিক বিশ্ববিদ্যালয়',
        sourceCitation: 'UGC Bangladesh Official Directory',
        sourceUrl: 'https://www.ugc.gov.bd',
      };
    case 'private':
      return {
        standingEn: 'UGC Approved Private University Tier',
        standingBn: 'ইউজিসি অনুমোদিত প্রাইভেট বিশ্ববিদ্যালয় স্তর',
        sourceCitation: 'UGC Bangladesh Official Directory',
        sourceUrl: 'https://www.ugc.gov.bd',
      };
    case 'medical':
      return {
        standingEn: 'DGME Accredited Medical / Dental College',
        standingBn: 'ডিজিএমই অনুমোদিত মেডিকেল / ডেন্টাল কলেজ',
        sourceCitation: 'DGME Official Directory',
        sourceUrl: 'https://dgme.gov.bd',
      };
    case 'national':
    default:
      return {
        standingEn: 'National University Affiliated Honours Network',
        standingBn: 'জাতীয় বিশ্ববিদ্যালয় অধিভুক্ত অনার্স নেটওয়ার্ক',
        sourceCitation: 'National University Bangladesh',
        sourceUrl: 'https://www.nu.ac.bd',
      };
  }
}

export function buildMergedInstitutionRankings(
  institutionRows: RankableInstitutionInput[],
  citationRows: RankingCitationSeed[] = RANKING_CITATIONS_2026
): UniversityRankingEntry[] {
  const citationMap = new Map(citationRows.map((c) => [c.institutionCode, c]));

  type SortableEntry = UniversityRankingEntry & {
    _qsScore: number | null;
    _theScore: number | null;
    _asiaScore: number | null;
    _hasCitationFlag: boolean;
  };

  const merged: SortableEntry[] = institutionRows.map((inst) => {
    const category = (
      inst.category in CATEGORY_TIER_ORDER ? inst.category : 'public'
    ) as AdmissionCategoryId;
    const citation = citationMap.get(inst.code);
    const defaults = getDefaultNationalStanding(category);

    return {
      code: inst.code,
      nameEn: inst.nameEn,
      nameBn: inst.nameBn,
      category,
      institutionTypeEn: inst.institutionType,
      institutionTypeBn: inst.institutionTypeBn,
      establishedYear: inst.establishedYear ?? null,
      qsGlobal2026: citation?.qsGlobal2026 ?? '—',
      theGlobal2026: citation?.theGlobal2026 ?? '—',
      bangladeshStandingEn: citation?.bangladeshStandingEn ?? defaults.standingEn,
      bangladeshStandingBn: citation?.bangladeshStandingBn ?? defaults.standingBn,
      sourceCitation: citation?.sourceCitation ?? defaults.sourceCitation,
      citationYear: citation?.citationYear ?? 2026,
      sourceUrl: citation?.sourceUrl ?? defaults.sourceUrl,
      _qsScore: citation?.qsRankScore ?? null,
      _theScore: citation?.theRankScore ?? null,
      _asiaScore: citation?.qsAsiaRankScore ?? null,
      _hasCitationFlag: Boolean(citation),
    };
  });

  merged.sort((a, b) => {
    // Tier 1: QS World Ranked 2026
    const aHasQs = a._qsScore !== null;
    const bHasQs = b._qsScore !== null;
    if (aHasQs !== bHasQs) return aHasQs ? -1 : 1;
    if (aHasQs && bHasQs) {
      if (a._qsScore! !== b._qsScore!) return a._qsScore! - b._qsScore!;
      const aThe = a._theScore ?? Number.MAX_SAFE_INTEGER;
      const bThe = b._theScore ?? Number.MAX_SAFE_INTEGER;
      if (aThe !== bThe) return aThe - bThe;
      const aAsia = a._asiaScore ?? Number.MAX_SAFE_INTEGER;
      const bAsia = b._asiaScore ?? Number.MAX_SAFE_INTEGER;
      if (aAsia !== bAsia) return aAsia - bAsia;
    }

    // Tier 2: THE World Ranked / Reporter 2026 (without QS World Rank)
    const aHasThe = a._theScore !== null;
    const bHasThe = b._theScore !== null;
    if (aHasThe !== bHasThe) return aHasThe ? -1 : 1;
    if (aHasThe && bHasThe) {
      if (a._theScore! !== b._theScore!) return a._theScore! - b._theScore!;
      const aAsia = a._asiaScore ?? Number.MAX_SAFE_INTEGER;
      const bAsia = b._asiaScore ?? Number.MAX_SAFE_INTEGER;
      if (aAsia !== bAsia) return aAsia - bAsia;
    }

    // Tier 3: QS Asia 2026 Ranked
    const aHasAsia = a._asiaScore !== null;
    const bHasAsia = b._asiaScore !== null;
    if (aHasAsia !== bHasAsia) return aHasAsia ? -1 : 1;
    if (aHasAsia && bHasAsia && a._asiaScore! !== b._asiaScore!) {
      return a._asiaScore! - b._asiaScore!;
    }

    // Tier 4: Unranked institutions ordered by Category Tier (Public -> Engineering -> GST -> Private -> Medical -> National)
    const tierDiff = CATEGORY_TIER_ORDER[a.category] - CATEGORY_TIER_ORDER[b.category];
    if (tierDiff !== 0) return tierDiff;

    // Put flagship national citations (e.g., DMC in medical, NU in national) first in their tier
    if (a._hasCitationFlag !== b._hasCitationFlag) return a._hasCitationFlag ? -1 : 1;

    // Then oldest established first, then alphabetical
    const aYear = a.establishedYear ?? Number.MAX_SAFE_INTEGER;
    const bYear = b.establishedYear ?? Number.MAX_SAFE_INTEGER;
    if (aYear !== bYear) return aYear - bYear;

    return a.nameEn.localeCompare(b.nameEn);
  });

  return merged.map(({ _qsScore, _theScore, _asiaScore, _hasCitationFlag, ...entry }) => entry);
}

export const VERIFIED_BANGLADESH_RANKINGS: UniversityRankingEntry[] =
  buildMergedInstitutionRankings(BANGLADESH_INSTITUTIONS_CATALOG);
