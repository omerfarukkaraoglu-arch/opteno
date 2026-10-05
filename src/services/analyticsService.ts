import { Exam, ScanResult, ScannedAnswer } from '../types';

export interface StudentRankInfo {
  studentId: string;
  institutionRank: number;
  institutionTotal: number;
  classRank: number;
  classTotal: number;
  percentile: number;
}

export interface QuestionStat {
  subjectName: string;
  questionNumber: number;
  correctAnswer: string;
  learningOutcome?: string;
  totalStudents: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  correctRate: number; // 0 - 100 %
  optionCounts: Record<string, number>; // 'A', 'B', 'C', 'D', 'E', 'BLANK', 'MULTIPLE'
  optionPercentages: Record<string, number>;
  primaryDistractor?: { option: string; count: number; percentage: number };
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface AggregateOutcomeStat {
  subjectName: string;
  outcome: string;
  questionNumbers: number[];
  totalQuestions: number;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  successRate: number; // 0 - 100 %
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  needsReview: boolean;
}

/**
 * Calculates institution rank, class rank, and percentile for every student in the exam.
 */
export function calculateStudentRankings(results: ScanResult[]): Map<string, StudentRankInfo> {
  const rankMap = new Map<string, StudentRankInfo>();
  if (results.length === 0) return rankMap;

  // 1. Overall institution ranking (sorted descending by totalScore, then totalNet)
  const sortedOverall = [...results].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return b.totalNet - a.totalNet;
  });

  const institutionTotal = sortedOverall.length;

  // 2. Class grouping
  const classGroups = new Map<string, ScanResult[]>();
  results.forEach(res => {
    const cls = res.className || 'Genel';
    if (!classGroups.has(cls)) {
      classGroups.set(cls, []);
    }
    classGroups.get(cls)!.push(res);
  });

  // Sort each class group
  classGroups.forEach((list) => {
    list.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.totalNet - a.totalNet;
    });
  });

  sortedOverall.forEach((res, index) => {
    const institutionRank = index + 1;
    const percentile = Number(((institutionRank / institutionTotal) * 100).toFixed(1));

    const cls = res.className || 'Genel';
    const classList = classGroups.get(cls) || [res];
    const classIndex = classList.findIndex(r => r.id === res.id);
    const classRank = classIndex >= 0 ? classIndex + 1 : 1;
    const classTotal = classList.length;

    rankMap.set(res.id, {
      studentId: res.studentId,
      institutionRank,
      institutionTotal,
      classRank,
      classTotal,
      percentile
    });
  });

  return rankMap;
}

/**
 * Calculates per-question item statistics, distractor distributions and difficulty levels.
 */
export function calculateQuestionAnalytics(
  exam: Exam,
  results: ScanResult[],
  classFilter: string = 'ALL'
): QuestionStat[] {
  const filteredResults = classFilter === 'ALL'
    ? results
    : results.filter(r => r.className === classFilter);

  const stats: QuestionStat[] = [];
  const totalStudents = filteredResults.length;

  if (totalStudents === 0) return stats;

  exam.subjects.forEach(subject => {
    for (let qNum = 1; qNum <= subject.questionCount; qNum++) {
      const correctAns = subject.correctAnswers[qNum - 1] || 'A';
      const outcome = subject.learningOutcomes?.[qNum - 1];

      let correctCount = 0;
      let wrongCount = 0;
      let emptyCount = 0;

      const optionCounts: Record<string, number> = {
        A: 0, B: 0, C: 0, D: 0, E: 0, BLANK: 0, MULTIPLE: 0
      };

      filteredResults.forEach(res => {
        const studentAns = res.answers.find(
          a => a.subjectName === subject.name && a.questionNumber === qNum
        );

        if (!studentAns || studentAns.isBlank || !studentAns.selectedOption) {
          emptyCount++;
          optionCounts.BLANK++;
        } else if (studentAns.selectedOption === 'MULTIPLE') {
          wrongCount++;
          optionCounts.MULTIPLE++;
        } else {
          const opt = studentAns.selectedOption.toUpperCase();
          if (optionCounts[opt] !== undefined) {
            optionCounts[opt]++;
          }
          if (studentAns.isCorrect) {
            correctCount++;
          } else {
            wrongCount++;
          }
        }
      });

      const correctRate = Math.round((correctCount / totalStudents) * 100);

      const optionPercentages: Record<string, number> = {};
      Object.keys(optionCounts).forEach(opt => {
        optionPercentages[opt] = Math.round((optionCounts[opt] / totalStudents) * 100);
      });

      // Find primary distractor (the wrong answer that lured the most students)
      let primaryDistractor: { option: string; count: number; percentage: number } | undefined;
      let maxDistractorCount = 0;
      let maxDistractorOpt = '';

      ['A', 'B', 'C', 'D', 'E'].forEach(opt => {
        if (opt !== correctAns && optionCounts[opt] > maxDistractorCount) {
          maxDistractorCount = optionCounts[opt];
          maxDistractorOpt = opt;
        }
      });

      if (maxDistractorCount > 0) {
        primaryDistractor = {
          option: maxDistractorOpt,
          count: maxDistractorCount,
          percentage: Math.round((maxDistractorCount / totalStudents) * 100)
        };
      }

      let difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
      if (correctRate >= 70) {
        difficultyLevel = 'EASY';
      } else if (correctRate < 40) {
        difficultyLevel = 'HARD';
      }

      stats.push({
        subjectName: subject.name,
        questionNumber: qNum,
        correctAnswer: correctAns,
        learningOutcome: outcome,
        totalStudents,
        correctCount,
        wrongCount,
        emptyCount,
        correctRate,
        optionCounts,
        optionPercentages,
        primaryDistractor,
        difficultyLevel
      });
    }
  });

  return stats;
}

/**
 * Calculates aggregate outcome mastery levels across all students or a selected class.
 */
export function calculateAggregateOutcomes(
  exam: Exam,
  results: ScanResult[],
  classFilter: string = 'ALL'
): AggregateOutcomeStat[] {
  const filteredResults = classFilter === 'ALL'
    ? results
    : results.filter(r => r.className === classFilter);

  const stats: AggregateOutcomeStat[] = [];
  if (filteredResults.length === 0) return stats;

  exam.subjects.forEach(subject => {
    if (!subject.learningOutcomes || subject.learningOutcomes.length === 0) return;

    // Group questions by outcome name
    const outcomeMap = new Map<string, number[]>();
    subject.learningOutcomes.forEach((outcomeName, idx) => {
      const qNum = idx + 1;
      const cleanName = outcomeName?.trim();
      if (!cleanName) return;

      if (!outcomeMap.has(cleanName)) {
        outcomeMap.set(cleanName, []);
      }
      outcomeMap.get(cleanName)!.push(qNum);
    });

    outcomeMap.forEach((qNumbers, outcomeName) => {
      let correctCount = 0;
      let wrongCount = 0;
      let emptyCount = 0;

      filteredResults.forEach(res => {
        qNumbers.forEach(qNum => {
          const ans = res.answers.find(
            a => a.subjectName === subject.name && a.questionNumber === qNum
          );

          if (!ans || ans.isBlank || !ans.selectedOption) {
            emptyCount++;
          } else if (ans.isCorrect) {
            correctCount++;
          } else {
            wrongCount++;
          }
        });
      });

      const totalAttempts = correctCount + wrongCount + emptyCount;
      const successRate = totalAttempts > 0
        ? Math.round((correctCount / totalAttempts) * 100)
        : 0;

      let status: 'SUCCESS' | 'WARNING' | 'DANGER' = 'SUCCESS';
      let needsReview = false;

      if (successRate < 50) {
        status = 'DANGER';
        needsReview = true;
      } else if (successRate < 75) {
        status = 'WARNING';
        needsReview = true;
      }

      stats.push({
        subjectName: subject.name,
        outcome: outcomeName,
        questionNumbers: qNumbers,
        totalQuestions: qNumbers.length,
        totalAttempts,
        correctCount,
        wrongCount,
        emptyCount,
        successRate,
        status,
        needsReview
      });
    });
  });

  return stats;
}
