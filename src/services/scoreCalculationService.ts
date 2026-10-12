import { Exam, SubjectResult, SubjectConfig } from '../types';

/**
 * Returns default coefficient based on subject name and grade level / scoring standard
 */
export const getDefaultSubjectCoefficient = (
  subjectName: string,
  gradeLevelOrStandard?: string | number
): number => {
  const norm = (subjectName || '').toLowerCase().trim();
  const strGrade = String(gradeLevelOrStandard || '').toLowerCase();

  const isLise = strGrade.includes('lise') ||
    strGrade.includes('9') ||
    strGrade.includes('10') ||
    strGrade.includes('11') ||
    strGrade.includes('12') ||
    strGrade.includes('yks') ||
    strGrade.includes('tyt') ||
    strGrade.includes('ayt') ||
    strGrade.includes('mezun');

  if (isLise) {
    // YKS / TYT Standart Katsayıları (ÖSYM yaklaşık test ağırlıkları)
    if (norm.includes('türk') || norm.includes('edebiyat')) return 3.3;
    if (norm.includes('mat') || norm.includes('geometri')) return 3.3;
    if (norm.includes('fizik') || norm.includes('kimya') || norm.includes('biyo') || norm.includes('fen')) return 3.4;
    if (norm.includes('tarih') || norm.includes('coğrafya') || norm.includes('felsefe') || norm.includes('din') || norm.includes('sosyal')) return 3.4;
    if (norm.includes('yabancı') || norm.includes('ingilizce') || norm.includes('dil')) return 3.0;
    return 3.3;
  }

  // Ortaokul / LGS Standart Katsayıları (MEB Resmi Katsayıları)
  // Türkçe: 4, Matematik: 4, Fen: 4
  // T.C. İnkılap Tarihi: 1, Din Kültürü: 1, Yabancı Dil: 1
  if (norm.includes('türk')) return 4.0;
  if (norm.includes('mat')) return 4.0;
  if (norm.includes('fen')) return 4.0;
  if (norm.includes('inkılap') || norm.includes('tarih') || norm.includes('sosyal')) return 1.0;
  if (norm.includes('din')) return 1.0;
  if (norm.includes('ingilizce') || norm.includes('yabancı') || norm.includes('dil')) return 1.0;

  return 1.0;
};

/**
 * Determines scoring standard from exam grade level or explicit scoringType
 */
export const detectExamScoringStandard = (exam: Exam): 'LGS' | 'YKS_TYT' | 'CUSTOM' | 'EQUAL_WEIGHT' => {
  if (exam.scoringStandard) return exam.scoringStandard;

  const str = `${exam.title || ''} ${String(exam.gradeLevel || '')}`.toLowerCase();

  if (
    str.includes('lgs') ||
    str.includes('ortaokul') ||
    str.includes('8. sınıf') ||
    str.includes('7. sınıf') ||
    str.includes('6. sınıf') ||
    str.includes('5. sınıf')
  ) {
    return 'LGS';
  }

  if (
    str.includes('yks') ||
    str.includes('tyt') ||
    str.includes('ayt') ||
    str.includes('lise') ||
    str.includes('12. sınıf') ||
    str.includes('11. sınıf') ||
    str.includes('10. sınıf') ||
    str.includes('9. sınıf') ||
    str.includes('mezun')
  ) {
    return 'YKS_TYT';
  }

  // Check if any subject has a non-default coefficient
  const hasCustomCoeff = exam.subjects?.some(s => s.coefficient && s.coefficient > 0 && s.coefficient !== 1);
  if (hasCustomCoeff) return 'CUSTOM';

  return 'EQUAL_WEIGHT';
};

/**
 * Calculates exam total score taking into account:
 * - Subject coefficients (katsayılar)
 * - Base score (100 base score for LGS / YKS)
 * - Penalty ratio (3Y = 1D for LGS, 4Y = 1D for YKS)
 */
export const calculateTotalExamScore = (
  exam: Exam,
  subjectResults: SubjectResult[],
  totalNet: number
): number => {
  if (!exam.subjects || exam.subjects.length === 0) return 0;

  const standard = detectExamScoringStandard(exam);
  const isLGS = standard === 'LGS';
  const isYKS = standard === 'YKS_TYT';
  const isScaled100to500 = isLGS || isYKS || exam.baseScore === 100;

  // Build subject coefficient map
  let totalWeightedNet = 0;
  let maxWeightedScore = 0;
  let hasSpecificCoefficients = false;

  exam.subjects.forEach(subject => {
    // 1. Explicit coefficient on subject config, OR default from standard
    let coeff = subject.coefficient;
    if (coeff === undefined || coeff === null) {
      if (isLGS || isYKS) {
        coeff = getDefaultSubjectCoefficient(subject.name, isLGS ? 'ortaokul' : 'lise');
      } else {
        coeff = 1.0;
      }
    }

    if (coeff !== 1.0) {
      hasSpecificCoefficients = true;
    }

    const subRes = subjectResults.find(sr => sr.subjectName === subject.name);
    const subNet = subRes ? Math.max(0, subRes.netCount) : 0;

    totalWeightedNet += subNet * coeff;
    maxWeightedScore += subject.questionCount * coeff;
  });

  if (maxWeightedScore <= 0) return 0;

  // 1. Standard LGS or YKS Formula (100 Base Point + 400 Scale)
  // MEB LGS & ÖSYM TYT: 0 Net = 100 Puan, Full Net = 500 Puan
  if (isScaled100to500) {
    const score = 100 + (totalWeightedNet / maxWeightedScore) * 400;
    return parseFloat(Math.min(500, Math.max(100, score)).toFixed(2));
  }

  // 2. Custom Coefficients without 100 Base Point (Direct 500 Scale)
  if (hasSpecificCoefficients) {
    const score = (totalWeightedNet / maxWeightedScore) * 500;
    return parseFloat(Math.min(500, Math.max(0, score)).toFixed(2));
  }

  // 3. Fallback: Classic Flat Scale (totalNet / totalQuestions * 500)
  const totalMaxQuestions = exam.totalQuestions || 40;
  return parseFloat(((Math.max(0, totalNet) / totalMaxQuestions) * 500).toFixed(2));
};
