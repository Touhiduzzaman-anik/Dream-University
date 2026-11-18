import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ExtractedRuleCandidate {
  programName: string;
  minSscGpa?: number | null;
  minHscGpa?: number | null;
  minCombinedGpa?: number | null;
  allowedGroups: Array<'Science' | 'Commerce' | 'Humanities'>;
  allowedHscYears: number[];
  allowsSecondTimer: boolean;
  requiredSubjectMinGpa: Record<string, number>;
  pageReference: string;
}

async function generateWithRetry(
  ai: GoogleGenAI,
  requestFactory: (model: string) => Parameters<GoogleGenAI['models']['generateContent']>[0]
) {
  const models = ['gemini-4-hydrogen', 'gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: unknown;

  for (let attempt = 0; attempt < models.length; attempt++) {
    const model = models[attempt];
    try {
      return await ai.models.generateContent(requestFactory(model));
    } catch (error: unknown) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      const isTransient =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('429') ||
        msg.includes('high demand');
      if (!isTransient || attempt === models.length - 1) {
        break;
      }
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }

  const rawMsg = lastError instanceof Error ? lastError.message : String(lastError);
  if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('high demand')) {
    throw new Error('AI service is experiencing temporary high demand. Please retry in a few seconds.');
  }
  throw new Error('Unable to generate AI response at this moment. Please try again.');
}

export async function extractAdmissionRulesFromCircular(params: {
  institutionName: string;
  circularTitle: string;
  session: string;
  pdfBase64?: string | null;
  rawText?: string | null;
}): Promise<ExtractedRuleCandidate[]> {
  const ai = getGeminiClient();

  const prompt = [
    `You are an admission rule extraction assistant for Bangladesh universities.`,
    `Institution: ${params.institutionName}`,
    `Circular Title: ${params.circularTitle}`,
    `Session: ${params.session}`,
    `Extract ONLY admission eligibility rules explicitly supported by the circular document/text.`,
    `Do NOT invent requirements that are absent. If a field is not stated, omit it or use null.`,
    `Allowed groups must use exact values from ["Science", "Commerce", "Humanities"].`,
    `For subject minimum GPA requirements, populate subjectRules as an array of { subject, minGpa }.`,
    params.rawText ? `\nCircular Text Context:\n${params.rawText}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const parts: Array<Record<string, unknown>> = [];
  if (params.pdfBase64) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: params.pdfBase64,
      },
    });
  }
  parts.push({ text: prompt });

  const response = await generateWithRetry(ai, (model) => ({
    model,
    contents: { parts: parts as never },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      systemInstruction:
        'Extract structured Bangladesh university admission eligibility rules accurately from official PDFs and text without fabricating numbers.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            programName: { type: Type.STRING },
            minSscGpa: { type: Type.NUMBER },
            minHscGpa: { type: Type.NUMBER },
            minCombinedGpa: { type: Type.NUMBER },
            allowedGroups: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            allowedHscYears: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
            },
            allowsSecondTimer: { type: Type.BOOLEAN },
            subjectRules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  minGpa: { type: Type.NUMBER },
                },
                required: ['subject', 'minGpa'],
              },
            },
            pageReference: { type: Type.STRING },
          },
          required: ['programName', 'allowedGroups', 'allowsSecondTimer', 'pageReference'],
        },
      },
    },
  }));

  const rawJson = (response.text ?? '[]').trim();
  const parsed = JSON.parse(rawJson) as Array<{
    programName: string;
    minSscGpa?: number;
    minHscGpa?: number;
    minCombinedGpa?: number;
    allowedGroups?: string[];
    allowedHscYears?: number[];
    allowsSecondTimer?: boolean;
    subjectRules?: Array<{ subject: string; minGpa: number }>;
    pageReference?: string;
  }>;

  const validGroups = new Set(['Science', 'Commerce', 'Humanities']);

  return parsed.map((item) => {
    const requiredSubjectMinGpa: Record<string, number> = {};
    for (const s of item.subjectRules ?? []) {
      if (s.subject && Number.isFinite(s.minGpa)) {
        requiredSubjectMinGpa[s.subject.trim()] = Number(s.minGpa);
      }
    }

    return {
      programName: item.programName || 'General Admission Track',
      minSscGpa: typeof item.minSscGpa === 'number' ? item.minSscGpa : null,
      minHscGpa: typeof item.minHscGpa === 'number' ? item.minHscGpa : null,
      minCombinedGpa: typeof item.minCombinedGpa === 'number' ? item.minCombinedGpa : null,
      allowedGroups: (item.allowedGroups ?? []).filter((g): g is 'Science' | 'Commerce' | 'Humanities' =>
        validGroups.has(g)
      ),
      allowedHscYears: (item.allowedHscYears ?? []).filter((y) => Number.isInteger(y)),
      allowsSecondTimer: Boolean(item.allowsSecondTimer),
      requiredSubjectMinGpa,
      pageReference: item.pageReference || 'Page 1',
    };
  });
}

export interface EligibleRecommendationCandidate {
  ruleId: number;
  institutionId: number;
  institutionCode: string;
  institutionNameEn: string;
  institutionNameBn: string;
  institutionType: string;
  city: string;
  programName: string;
  estimatedTotalCostBdt: number | null;
  circularTitle: string;
  sourceUrl: string;
}

export interface GroundedAiRecommendation {
  tier: 'dream' | 'match' | 'safer';
  ruleId: number;
  institutionCode: string;
  institutionNameEn: string;
  institutionNameBn: string;
  programName: string;
  academicMatchReason: string;
  relevantProgramReason: string;
  locationSuitability: string;
  budgetSuitability: string;
  circularTitle: string;
  sourceUrl: string;
}

export async function generateGroundedRecommendations(params: {
  studentSummary: {
    sscGpa?: number | null;
    hscGpa?: number | null;
    hscGroup?: string | null;
    preferredSubject?: string | null;
    preferredCity?: string | null;
    tuitionBudgetBdt?: number | null;
  };
  eligibleCandidates: EligibleRecommendationCandidate[];
  lang: 'en' | 'bn';
}): Promise<{ summary: string; recommendations: GroundedAiRecommendation[] }> {
  if (params.eligibleCandidates.length === 0) {
    return {
      summary:
        params.lang === 'bn'
          ? 'আপনার বর্তমান প্রোফাইল অনুযায়ী এখনো কোনো যাচাইকৃত যোগ্য প্রতিষ্ঠান পাওয়া যায়নি। প্রোফাইল আপডেট করুন অথবা যোগ্যতা যাচাইকারী দেখুন।'
          : 'No deterministically verified eligible programs were found for your current profile. Update your academic grades or check failed criteria in Eligibility Checker.',
      recommendations: [],
    };
  }

  const ai = getGeminiClient();

  const prompt = [
    `Student Profile:`,
    `- SSC GPA: ${params.studentSummary.sscGpa ?? 'Not set'}`,
    `- HSC GPA: ${params.studentSummary.hscGpa ?? 'Not set'}`,
    `- HSC Group: ${params.studentSummary.hscGroup ?? 'Not set'}`,
    `- Preferred Subject: ${params.studentSummary.preferredSubject ?? 'Open'}`,
    `- Preferred City: ${params.studentSummary.preferredCity ?? 'Any in Bangladesh'}`,
    `- Tuition Budget (BDT): ${params.studentSummary.tuitionBudgetBdt ?? 'Not specified'}`,
    ``,
    `Verified Eligible Candidates (STRICT ALLOWLIST — ONLY recommend from these exact ruleId values):`,
    JSON.stringify(params.eligibleCandidates, null, 2),
    ``,
    `Respond in ${params.lang === 'bn' ? 'Bangla (বাংলা)' : 'English'}.`,
    `Classify each chosen eligible candidate into tier: "dream", "match", or "safer".`,
    `Explain strictly based on academic match, relevant programs, location suitability, and budget suitability.`,
    `Do NOT invent admission probabilities, rankings, or institutions outside the list above.`,
  ].join('\n');

  const response = await generateWithRetry(ai, (model) => ({
    model,
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      systemInstruction:
        'You are Dream University’s explainable admission recommender for Bangladesh. Only categorize and explain pre-verified eligible institutions provided in the prompt. Never hallucinate universities or invent fake probabilities.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tier: { type: Type.STRING },
                ruleId: { type: Type.INTEGER },
                academicMatchReason: { type: Type.STRING },
                relevantProgramReason: { type: Type.STRING },
                locationSuitability: { type: Type.STRING },
                budgetSuitability: { type: Type.STRING },
              },
              required: [
                'tier',
                'ruleId',
                'academicMatchReason',
                'relevantProgramReason',
                'locationSuitability',
                'budgetSuitability',
              ],
            },
          },
        },
        required: ['summary', 'recommendations'],
      },
    },
  }));

  const parsed = JSON.parse((response.text ?? '{}').trim()) as {
    summary?: string;
    recommendations?: Array<{
      tier: string;
      ruleId: number;
      academicMatchReason: string;
      relevantProgramReason: string;
      locationSuitability: string;
      budgetSuitability: string;
    }>;
  };

  const candidateMap = new Map(params.eligibleCandidates.map((c) => [c.ruleId, c]));
  const validTiers = new Set(['dream', 'match', 'safer']);

  const verifiedRecs: GroundedAiRecommendation[] = [];
  for (const rec of parsed.recommendations ?? []) {
    const candidate = candidateMap.get(rec.ruleId);
    if (!candidate) continue; // Strict allowlist guard: never allow hallucinated rules
    const normalizedTier = validTiers.has(rec.tier.toLowerCase())
      ? (rec.tier.toLowerCase() as 'dream' | 'match' | 'safer')
      : 'match';

    verifiedRecs.push({
      tier: normalizedTier,
      ruleId: candidate.ruleId,
      institutionCode: candidate.institutionCode,
      institutionNameEn: candidate.institutionNameEn,
      institutionNameBn: candidate.institutionNameBn,
      programName: candidate.programName,
      academicMatchReason: rec.academicMatchReason,
      relevantProgramReason: rec.relevantProgramReason,
      locationSuitability: rec.locationSuitability,
      budgetSuitability: rec.budgetSuitability,
      circularTitle: candidate.circularTitle,
      sourceUrl: candidate.sourceUrl,
    });
  }

  return {
    summary:
      parsed.summary ||
      (params.lang === 'bn'
        ? 'আপনার যাচাইকৃত যোগ্যতার ভিত্তিতে সুপারিশ তৈরি করা হয়েছে।'
        : 'Recommendations generated strictly from your deterministically verified eligible institutions.'),
    recommendations: verifiedRecs,
  };
}
