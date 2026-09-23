import { HistoricalAdmission } from "./types";

// College Recommendation Engine (Section 11).
//
// Deliberately NOT a chance-of-admission predictor — BlueKey's own
// terminology is "Admissions Positioning" (where the student's academic
// numbers sit relative to BlueKey's own historical admits at that school)
// and "Profile Fit" (a coarse bucket derived from that). Never compute or
// display a probability/percentage of admission anywhere downstream of
// this module.

export interface PositioningResult {
  label: string; // Admissions Positioning
  fitLabel: string; // Profile Fit
  detail: string;
  sampleSize: number;
}

const MIN_SAMPLE = 2;
const GPA_MARGIN = 0.05;
const SAT_MARGIN = 30;

export function computeAdmissionsPositioning(
  student: { gpa: number | null; sat: number | null },
  historical: HistoricalAdmission[]
): PositioningResult {
  const accepted = historical.filter((h) => h.admission_result === "Accepted");
  const gpaValues = accepted.map((h) => h.gpa).filter((v): v is number => v != null);
  const satValues = accepted.map((h) => h.sat_score).filter((v): v is number => v != null);

  if (accepted.length < MIN_SAMPLE || (gpaValues.length === 0 && satValues.length === 0)) {
    return {
      label: "Insufficient Historical Data",
      fitLabel: "Data Limited",
      detail: "이 대학에 대한 블루키 과거 합격 데이터가 아직 충분하지 않아요.",
      sampleSize: accepted.length,
    };
  }

  const avgGpa = gpaValues.length ? gpaValues.reduce((a, b) => a + b, 0) / gpaValues.length : null;
  const avgSat = satValues.length ? satValues.reduce((a, b) => a + b, 0) / satValues.length : null;

  let gpaSignal: 1 | 0 | -1 | null = null;
  if (avgGpa != null && student.gpa != null) {
    const diff = student.gpa - avgGpa;
    gpaSignal = diff >= GPA_MARGIN ? 1 : diff <= -GPA_MARGIN ? -1 : 0;
  }
  let satSignal: 1 | 0 | -1 | null = null;
  if (avgSat != null && student.sat != null) {
    const diff = student.sat - avgSat;
    satSignal = diff >= SAT_MARGIN ? 1 : diff <= -SAT_MARGIN ? -1 : 0;
  }

  const signals = [gpaSignal, satSignal].filter((s): s is 1 | 0 | -1 => s !== null);
  if (signals.length === 0) {
    return {
      label: "Insufficient Historical Data",
      fitLabel: "Data Limited",
      detail: "학생의 GPA·SAT 정보가 아직 등록되지 않았어요. 학업 프로필을 먼저 입력해주세요.",
      sampleSize: accepted.length,
    };
  }

  const sum = signals.reduce((a: number, b) => a + b, 0);
  let label: string;
  let fitLabel: string;
  if (sum > 0) {
    label = "Above Historical Range";
    fitLabel = "Strong Fit";
  } else if (sum < 0) {
    label = "Below Historical Range";
    fitLabel = "Reach Fit";
  } else {
    label = "Within Historical Range";
    fitLabel = "Competitive Fit";
  }

  const parts: string[] = [];
  if (avgGpa != null) parts.push(`평균 GPA ${avgGpa.toFixed(2)}`);
  if (avgSat != null) parts.push(`평균 SAT ${Math.round(avgSat)}`);
  const detail = `블루키 합격생 데이터 ${accepted.length}건 기준(${parts.join(", ")}) 대비 학업 프로필 위치예요. 합격 가능성 예측이 아닌 참고 지표예요.`;

  return { label, fitLabel, detail, sampleSize: accepted.length };
}
