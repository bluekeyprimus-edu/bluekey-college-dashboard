"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatAmountInput } from "@/lib/format";
import type { Contract } from "@/lib/types";

const CONTRACT_TITLES: Record<string, string> = {
  standard: "[EC] 미국 대학 입시 컨설팅 서비스 계약서",
  premium: "[Premium] 미국 대학 입시 통합 컨설팅 회원 가입서",
  application: "미국 대학 컨설팅 회원 가입서",
  instructor: "강사 위촉 계약서",
};

function formatKorDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${y}년 ${m}월 ${d}일`;
}

type Clause3Item = { t: string; d?: string; subs?: string[] };
type Refund = { type: string; star3?: string[]; items: string[] };
type Clauses = {
  clause1: string;
  clause2: string[];
  clause3: Clause3Item[];
  clause4: string[];
  clause8_extra: string[];
  refund: Refund;
};

function getClauses(contractType: string, numSchools: string | null): Clauses {
  const n = numSchools || "12";
  const isPremium = contractType === "premium";
  const isApp = contractType === "application";

  const clause1 = isPremium
    ? "본 계약은 블루키 컨설팅(이하 '회사')과 회원 및 학부모(이하 '회원') 간의 상호 신뢰를 바탕으로, 회원의 잠재력을 발굴하여 최상위권 대학 진학을 위한 학업 로드맵 수립, 교과 외 활동(EC) 기획 및 실행, 그리고 대학 원서 지원 전 과정을 전략적으로 통합 관리하는 것을 목적으로 한다."
    : isApp
      ? "이 계약은 블루키컨설팅 ('회사'라 함)와 회원, 학부모 간의 계약 내용에 관한 제반 사항을 규정하는 데에 그 목적이 있다."
      : "이 계약은 블루키컨설팅(이하 '회사'라 함)와 회원 및 학부모 간의 연간(EC) 컨설팅 서비스 이용에 관한 제반 사항 및 권리·의무 관계를 규정하는 데 그 목적이 있다.";

  const clause2 = isPremium
    ? [
        "1. Academic Management: 학업 역량 극대화를 위한 학년별 교과 선택 전략 수립 및 내신/표준화 시험의 통합 관리",
        "2. Extracurricular Activities (EC) Strategy: 전공 적합성과 학생의 개별 특성을 반영한 독창적인 활동 기획 및 실행 가이드",
        "3. College Application Service: 데이터 기반의 대학 리스트 구축 및 원서/에세이 전 과정에 대한 전략적 첨삭 및 최적화 — a. 고객의 진학하고자 하는 대학 프로그램 지원을 위한 관련정보의 분석과 판단과 보고 / b. 고객이 지원하는 기본 10-12개의 대학 원서 작성 (Common Application 과 Supplement), 모든 원서에세이의 작성 및 검토 작업, 원서지원 행정 서비스 제공(원서작성→발송→합격학교등록확인까지)",
        "4. Holistic Mentoring & Counseling: 전문 컨설턴트의 정기적인 상담 및 멘토링 제공",
      ]
    : isApp
      ? [
          "1. 회원에게 맞는 전반적인 아카데믹 플랜작성 및 리서치",
          "2. 회원의 진학하고자 하는 대학 프로그램 지원을 위한 관련정보의 분석과 판단과 보고",
          `3. 회원이 지원하는 기본 ${n}개의 대학 원서 작성 (Common Application 과 Supplement), 모든 원서에세이의 작성 및 검토 작업, 원서지원 행정 서비스 제공(원서작성→발송→합격학교등록확인까지)`,
        ]
      : [
          "1. 회원에게 맞는 전반적인 EC 플랜작성",
          "2. 회원이 원하는 프로그램 지원을 위한 관련정보의 분석 및 검토",
          "3. EC 활동 이력 정리 및 원서작업과 대회 맞춤형 에세이 가이딩·검토(Editing) 서비스 제공",
        ];

  const clause3: Clause3Item[] = isPremium
    ? [
        { t: "1. 전체 일정 주관", d: "'회사'는 회원에게 계약 시점부터 대학 지원까지의 모든 일정과 플랜을 주관하며 적절한 과정과 진행을 안내한다. (단, 상황에 따라 회사는 지정된 메인 카운슬러와 전문 분야별 코디네이터를 포함한 전담 팀을 구성하거나 전문가를 별도로 추가할 수 있다.)" },
        { t: "2. 지속적 연락 관리", d: "이메일과 별도로 지정된 방법('회사'의 유선전화 및 '회사'의 카카오톡 그리고 다양한 비대면 Application: Google Meet, Zoom, Skype 등)들을 통해서 지속적인 연락하고 관리한다. (*별2참조)" },
        { t: "3. 활동 지원", d: "'회사'는 회원의 전공 적합성 강화를 위한 대회 참가, 인턴십 지원, 외부 리서치 프로그램 등록 등의 과정에서 필요한 행정적 가이드와 서류 준비를 지원한다." },
        { t: "4. 부대비용 안내", d: "대학 및 외부 기관(대회, 인턴십 등) 지원 시 발생하는 전형료, 리포트 발송비, 참가비 등 모든 부대 비용은 '회원'이 부담한다." },
        { t: "5. 추가 정보 발송", d: "'회사'는 회원이 지원하는 대학에서 차후 필요한 정보와 자료를 요청시 회원과 협의하여 필요한 절차와 정보를 해당대학에 발송한다." },
        { t: "6. 학교측 서류 면책", d: "'회사'는 성실히 가이드할 의무가 있으나, 회원의 학교 측에서 기한 내에 서류나 추천서를 발송하지 않아 발생하는 불이익이나, 외부 기관(대회, 인턴십, 대학 등)의 최종 선발 결과에 대해서는 책임을 지지 아니한다." },
      ]
    : isApp
      ? [
          { t: "1. 전체 일정 주관", d: "'회사'는 회원에게, 계약시점부터 대학지원까지의 모든 일정과 플랜을 주관하고, 회원에게 적절한 과정과 진행을 안내한다." },
          { t: "2. 지속적 연락 관리", d: "이메일과 별도로 지정된 방법('회사'의 유선전화 및 '회사'의 카카오톡 그리고 다양한 비대면 Application: Google Meet, Zoom, Skype 등)들을 통해서 지속적인 연락하고 관리한다. (*별2참조)" },
          { t: "3. 성적 리포트 요청", d: "'회사'는 회원이 지원하는 대학에 보내는 Test (TOEFL, SAT, AP)의 성적 Report Request 한다. (여기에 발생하는 데에 따른 추가적인 Fee는 회원이 지불한다.)" },
          { t: "4. 추가 정보 발송", d: "'회사'는 회원이 지원하는 대학에서 차후 필요한 정보와 자료를 요청시 회원과 협의하여 필요한 절차와 정보를 해당대학에 발송한다." },
          { t: "5. 학교측 서류 면책", d: "다만, 대학에 지원하는 과정에서 회원의 학교측에서 기한 내에 대학측에 마땅히 발송이 되어야 할 성적관련 서류와 추천서들이 발송되어지지 않을 경우는 '회사'는 책임을 지지 아니한다." },
        ]
      : [
          {
            t: "1. Student Onboarding Process (초기 진단 및 플랜 수립)",
            subs: [
              "Student Self-Assessment & Profile: 회원은 계약 후 1주일 이내에 '회사'가 제공하는 자기평가서(Student Self-Assessment)를 작성하여 공식 이메일(bluekeyprep@gmail.com)로 제출해야 한다.",
              "Consultation: 제출된 프로필을 바탕으로 담당 컨설턴트가 학부모 및 학생과 전반적인 아카데믹 상담을 진행한다.",
              "Plan 제공: 상담 결과를 바탕으로 향후 1년간 매월 수행할 과제가 명시된 연간 계획(Annual Plan), 방학 계획(Summer & Winter Plan), 및 비교과 활동 계획(EC Plans)을 제공한다. 여기에는 겨울 방학 중 지원 가능한 이듬해 여름방학 캠프 추천 및 맞춤형 활동 프로그램/대회 소개가 포함된다.",
            ],
          },
          {
            t: "2. Mentoring Session (정기 멘토링 관리)",
            subs: [
              "회원은 2주에 1회 주니어 컨설턴트, EC 담당자와 정해진 일정에 맞춰 각각 정기 면담을 진행한다. (세션당 30분~1시간 소요)",
              "멘토링은 대면 면담, 비대면 커뮤니케이션(Zoom, Google Meet 등), 또는 유선 전화를 통해 진행되며 내신(GPA) 현황 점검, 과외 활동(EC), 시험 준비, 추천서 등 학업 전반을 관리한다.",
              "긴급 요청에 의한 추가 멘토링은 컨설턴트의 일정을 고려하여 사전 협의 하에 조율하되, 효율적인 관리를 위해 이메일 연락은 주 2회 이하로 제한하는 것을 권장한다.",
              "매년 12월에는 학생의 비교과 (Extracurricular Activities) 주제 및 학업 수준에 맞춘 여름 방학 프로그램(Summer Program) 지원을 집중적으로 준비하고 스케줄을 조정한다.",
              "학생이 추수감사절이나 방학 등을 맞아 한국을 방문하거나 시간적 여유가 있을 때, 사전에 알릴 경우 인하우스(In-house) 컨설팅을 통해 방학 계획을 보완한다.",
            ],
          },
          {
            t: "3. 학부모 피드백 및 모니터링",
            subs: ["'회사'는 정기적으로 멘토링 세션을 점검하며, 학부모와의 대면 미팅 및 요청에 따른 상담을 통해 진행 상황(Progress)을 업데이트한다."],
          },
        ];

  const clause4 = isPremium
    ? [
        "1. 회원은 '회사'의 요청에 따라 학교 성적, 공인 시험 결과, 수상 경력 등 컨설팅에 필요한 개인 정보를 제출할 의무가 있으며, 제출되는 정보는 정확한 사실로 이루어져야 한다. 또한, 상담 시 거짓이 없이 사실을 바탕으로 컨설팅에 응해야 하며, 사실과 다른 것이 있을 경우, '회사'는 그에 따른 결과에 대하여 책임을 지지 않는다.",
        "2. 회원은 '회사'의 컨설팅을 바탕으로 스스로 필요한 노력을 하여야 하며, 회원의 불성실함에 따른 피해와 예상되지 않은 결과에 대한 책임을 '회사'에 물을 수 없다.",
        "3. '회사'는 학생 고유의 목소리(Voice)와 진정성(Authenticity)을 담은 지원서 작성을 최우선 가치로 한다.",
        "4. 제 2 조에 포함된 서비스 이외에 추가적인 비용과 인력이 투입되는 서비스를 별도로 받게 되는 경우, 이에 대한 비용은 별도로 청구된다. 필요할 경우 제공될 수 있는 별도의 서비스는 오프라인 튜터링, 온라인 튜터링, 특강 수업, 그리고 외부 기관 연계 인턴십이나 전문 리서치 프로젝트 참여 지원 등을 포함할 수 있다.",
        "5. 회원의 컨설팅 진행에 필요한 부대비용(DHL, Fedex와 같은 국제 화물 택배사를 통한 서류 제출, 시험등록, 교재구입 등)은 컨설팅 비용에 포함되지 않는다. 단, 사전에 상의할 수 없는 긴급을 요하는 작업인 경우에 '회사'가 처리한 후 비용을 내역과 함께 학부모에게 청구하는 방법을 취할 수 있다.",
        "6. 회원은 '회사'와 협의된 진행 사항을 성실히 수행할 의무가 있으며 변경이 있을 때는 즉시 '회사' 및 '회사'에서 지정한 담당 직원에게 알리고 안내에 따라야 한다.",
      ]
    : isApp
      ? [
          "1. 회원은 '회사'의 요청에 따라 학교 성적, 공인 시험 결과, 수상 경력 등 컨설팅에 필요한 개인 정보를 제출할 의무가 있으며, 제출되는 정보는 정확한 사실로 이루어져야 한다. 또한, 상담 시 거짓이 없이 사실을 바탕으로 컨설팅에 응해야 하며, 사실과 다른 것이 있을 경우, '회사'는 그에 따른 결과에 대하여 책임을 지지 않는다.",
          "2. 회원은 '회사'의 컨설팅을 바탕으로 스스로 필요한 노력을 하여야 하며, 회원의 불성실함에 따른 피해와 예상되지 않은 결과에 대한 책임을 '회사'에 물을 수 없다.",
          "3. 회원은 본인이 수행하여야 할 학교 과제의 대행을 '회사'에 요구할 수 없다.",
          "4. 제 2 조에 포함된 서비스 이외에 추가적인 비용과 인력이 투입되는 서비스를 별도로 받게 되는 경우, 이에 대한 비용은 별도로 청구된다. 필요할 경우 제공될 수 있는 별도의 서비스는 오프라인 튜터링, 온라인 튜터링, 특강 수업등을 포함할 수 있다.",
          "5. 회원의 컨설팅 진행에 필요한 부대비용(DHL, Fedex와 같은 국제 화물 택배사를 통한 서류 제출, 시험등록, 교재구입 등)은 컨설팅 비용에 포함되지 않는다. 단, 사전에 상의할 수 없는 긴급을 요하는 작업인 경우에 '회사'가 처리한 후 비용을 내역과 함께 학부모에게 청구하는 방법을 취할 수 있다.",
          "6. 회원은 '회사'와 협의된 진행 사항을 성실히 수행할 의무가 있으며 변경이 있을 때는 즉시 '회사' 및 '회사'에서 지정한 담당 직원에게 알리고 안내에 따라야 한다.",
        ]
      : [
          "1. 회원은 '회사'의 요청에 따라 자기평가서, 학교 성적, 공인 시험 결과 등 컨설팅에 필요한 정보를 정확하고 성실하게 제출하여야 한다.",
          "2. 회원은 본인이 수행해야 할 학교 과제나 대행이 불가능한 업무를 '회사'에 요구할 수 없다.",
          "3. GPA 관리 제한: 학기 중 내신(GPA) 성적 관리는 별도의 '개인 지도 서비스(튜터링)' 영역이므로 본 연간 컨설팅 서비스 범위에 포함되지 않는다. 필요 시 '회사'에 별도로 신청하여야 한다.",
        ];

  const clause8_extra = isPremium || isApp
    ? [
        "'회사'는 회원의 개인 정보를 제외한 이름과 진학 실적을 추후 상담 자료에 활용할 수 있다.",
        "회원은 '회사'의 컨설팅 방침을 참고하여 자신의 책임 하에 스스로 판단하여 진로를 개척하고, 그 결과에 대해 '회사'에게 책임을 물을 수 없고, 회원은 '회사'에 계약내용 외 어떠한 권리도 주장할 수 없다. 단, '회사'는 회원을 위해 충실하게 컨설팅을 제공해야 한다.",
      ]
    : [];

  const refund: Refund = isPremium
    ? {
        type: "premium",
        star3: [
          "대학교 원서의 common application에 대한 에세이작업이 시작 된 경우, 50% 환불 가능",
          "대학교의 Early Decision 혹은 Early Action의 일반적 마감일 11월 1일 이후에는 환불 불가능",
          "대학교의 Early Decision 혹은 Early Action에 지원하지 않는 경우라도 11월 1일 이후 환불 불가능",
        ],
        items: [
          "1. 원서 작업 시작 전 해지 시: 계약 체결 시점부터 해지 시점까지 실제로 제공된 서비스에 대하여 아래 기준에 따라 정산 후 잔액을 환불한다.|○ 전략 기획 및 상담: 수행된 초기 프로필 분석, 전략 로드맵 수립 비용 및 실제 진행된 상담 횟수/시간에 따른 비용을 공제한다.|○ 활동 및 프로젝트 진행: 학생과 함께 기획하여 진행 중이거나 완료된 개별 활동(EC, 인턴십, 리서치 프로젝트 등)의 경우, 투입된 리소스와 진행 단계 및 도출된 성과물(결과 보고서, 포트폴리오 등)을 근거로 '회사'의 정산 내역에 따라 산정된 비용을 공제한다.",
          "2. 원서 작업 시작 후 해지 시: 대학교 원서 에세이 작업(브레인스토밍 및 초안 작성 등)이 본격적으로 시작된 이후에는 총액의 50% 이하로 환불이 제한되며, 12학년 11월 1일(Early 전형 마감일 기준) 이후에는 실제 지원 여부와 관계없이 환불이 불가하다.",
          "3. 회원, 또는 학부모의 귀책 사유로 계약이 해지 될 경우 기 입금된 회비는 환불이 되지 않으며 미 입금된 추가비용이 있을 경우 완납하여야 한다.",
          "4. 회원은 '회사'로부터 불성실한 서비스를 제공 받을 경우 객관적 자료를 구비하여 진행을 중단할 수 있다. 이 때, 회원은 '회사'의 귀책사유가 있는 경우 *별3의 환불 조항에 따라 환불을 요구할 수 있다.",
          "5. 환불시, 기존에 작업된 업무와 회원의 개인정보를 제외한 모든 컨설팅서류와 지적사유재산의 소유권은 '회사'에게만 귀속된다.",
        ],
      }
    : isApp
      ? {
          type: "app",
          star3: [
            "컨설팅이 진행되며 원서지원 혹은 에세이작업이 시작된 경우, 70% 환불 가능",
            "대학교 원서의 common application에 대한 에세이작업이 시작된 경우, 50% 환불 가능",
            "대학교의 Early Decision 혹은 Early Action의 일반적 마감일 11월 1일 이후에는 환불 불가능",
            "대학교의 Early Decision 혹은 Early Action에 지원하지 않는 경우라도 11월 1일 이후 환불 불가능",
          ],
          items: [
            "1. '회사'는 회원과의 컨설팅 서비스의 진행이 원만하게 진행이 될 수 없다는 자체적인 판단이 될 경우 객관적인 자료를 구비하여 진행을 중단할 수 있다. 이 때, 기 입금된 금액은 *별3 컨설팅의 진행상황에 따라 환불된다.",
            "2. 회원, 또는 학부모의 귀책 사유로 계약이 해지 될 경우 기 입금된 연회비는 환불이 되지 않으며 미 입금된 추가비용이 있을 경우 완납하여야 한다.",
            "3. 회원은 '회사'로부터 불성실한 서비스를 제공 받을 경우 객관적 자료를 구비하여 진행을 중단할 수 있다. 이 때, 회원은 '회사'의 귀책사유가 있는 경우 *별3의 환불 조항에 따라 환불을 요구할 수 있다.",
            "4. 환불시, 기존에 작업된 업무와 회원의 개인정보를 제외한 모든 컨설팅서류와 지적사유재산의 소유권은 '회사'에게만 귀속된다.",
          ],
        }
      : {
          type: "standard",
          star3: ["컨설팅이 진행되며 EC 계획이 수립된 경우, 70% 환불 가능", "EC 계획이 실행된 경우, 50% 환불 가능"],
          items: [
            "1. '회사'는 회원과의 컨설팅 서비스의 진행이 원만하게 진행이 될 수 없다는 자체적인 판단이 될 경우 객관적인 자료를 구비하여 진행을 중단할 수 있다. 이 때, 기 입금된 금액은 *별3 컨설팅의 진행상황에 따라 환불된다.",
            "2. 회원, 또는 학부모의 귀책 사유로 계약이 해지 될 경우 기 입금된 연회비는 환불이 되지 않으며 미 입금된 추가비용이 있을 경우 완납하여야 한다.",
            "3. 회원의 일방적인 서비스 절차 거부, 연락 두절, 프로그램 불참 등으로 인해 서비스 진행이 불가능해진 경우, 원칙적으로 환불은 불가능하다.",
            "4. 회원은 '회사'로부터 불성실한 서비스를 제공 받을 경우 객관적 자료를 구비하여 진행을 중단할 수 있다. 이 때, 회원은 '회사'의 귀책사유가 있는 경우 *별3의 환불 조항에 따라 환불을 요구할 수 있다.",
            "5. 환불시, 기존에 작업된 업무와 회원의 개인정보를 제외한 모든 컨설팅서류와 지적사유재산의 소유권은 '회사'에게만 귀속된다.",
          ],
        };

  return { clause1, clause2, clause3, clause4, clause8_extra, refund };
}

const pkgIndex: Record<string, number> = { junior: 0, standard: 1, application: 2, premium: 3, ec: 1, ec_application: 3 };

const features: Record<number, number[]> = {
  1: [0, 1, 0, 1], 2: [1, 1, 0, 1], 3: [0, 1, 0, 1], 4: [1, 1, 0, 1],
  5: [0, 1, 0, 1], 6: [0, 1, 0, 1], 7: [1, 1, 0, 1], 8: [1, 1, 0, 1],
  9: [1, 0, 0, 0], 10: [1, 0, 0, 0], 11: [1, 1, 0, 1], 12: [1, 1, 1, 1],
  13: [1, 1, 0, 1], 14: [0, 1, 0, 1], 15: [0, 1, 0, 1], 16: [0, 1, 0, 1],
  17: [0, 1, 0, 1], 18: [0, 1, 0, 1], 19: [0, 1, 0, 1], 36: [0, 0, 0, 1],
  20: [0, 0, 1, 1], 21: [0, 0, 1, 1], 22: [0, 0, 1, 1], 23: [0, 0, 1, 1],
  24: [0, 0, 1, 1], 25: [0, 0, 1, 1], 26: [0, 0, 1, 1], 27: [0, 0, 1, 1],
  28: [0, 0, 1, 1], 29: [0, 0, 1, 1], 30: [0, 0, 1, 1], 31: [0, 0, 1, 1], 32: [0, 0, 1, 1],
  33: [0, 1, 0, 1], 34: [0, 0, 1, 1], 35: [0, 0, 0, 1],
  38: [0, 1, 0, 1], 39: [0, 1, 0, 1],
};

const featureList = [
  { category: "Standardized Test & GPA", items: [
    { id: 1, name: "Comprehensive testing plan (SAT/ACT/AP/TOEFL)", desc: "학생의 학년과 목표 대학에 맞춰 SAT, ACT, AP, TOEFL 등 표준화 시험의 전체적인 응시 전략과 일정을 설계해 드립니다." },
    { id: 2, name: "Mock Test 제공 (SAT, ACT)", desc: "실제 시험과 동일한 형식의 SAT/ACT 모의고사를 제공하여 실전 감각을 익히고 약점을 파악할 수 있도록 돕습니다." },
    { id: 3, name: "Test schedule management", desc: "여러 시험 일정(SAT, AP, 학교 내신 등)이 겹치지 않도록 전체 일정을 조율하고 관리해 드립니다." },
    { id: 4, name: "Class preparation sessions", extra: "비용 별도", desc: "시험 과목별 전문 강사의 수업 세션입니다. 정규 컨설팅과 별도로 신청 및 비용이 발생합니다." },
  ] },
  { category: "GPA (Academic)", items: [
    { id: 5, name: "Academic course guidance", desc: "학생의 진로 방향에 맞춰 학교에서 수강해야 할 과목(AP, Honors 등)을 추천하고 가이드합니다." },
    { id: 6, name: "Individual academic roadmap", desc: "재학 중 학교 안팎에서 수행할 학업 활동을 학년별로 정리한 맞춤형 로드맵을 제공합니다." },
    { id: 7, name: "1:1 session private tutoring", extra: "비용 별도", desc: "과목별 1:1 개인 튜터링입니다. 정규 컨설팅과 별도로 신청 및 비용이 발생합니다." },
    { id: 8, name: "Homework Feedback", extra: "비용 별도", desc: "학교 과제에 대한 첨삭 및 피드백 서비스입니다. 별도 비용이 발생합니다." },
  ] },
  { category: "Activities", items: [
    { id: 9, name: "Assessment + Aptitude Test", desc: "학생의 성향과 적성을 파악하기 위한 진단 평가 및 적성 검사를 진행합니다." },
    { id: 10, name: "Leadership Profile", desc: "학생의 리더십 경험과 강점을 정리하여 프로필로 구성해 드립니다." },
    { id: 11, name: "In-school club activity guidance", desc: "교내 동아리 활동 선택과 참여 방향에 대한 가이드를 제공합니다." },
    { id: 12, name: "1:1 biweekly meetings", desc: "2주에 1회 정기적으로 진행되는 1:1 면담으로 학업 및 활동 전반을 점검합니다." },
    { id: 13, name: "Major interest exploration", desc: "학생이 관심 있는 전공 분야를 탐색하고 방향을 설정하도록 돕습니다." },
    { id: 14, name: "Extracurricular activities plan", desc: "학생의 강점과 관심사를 살린 비교과 활동 계획을 수립합니다." },
    { id: 15, name: "Internship matching", desc: "학생의 관심 분야와 맞는 인턴십 기회를 연결해 드립니다." },
    { id: 16, name: "Volunteering opportunities", desc: "학생에게 적합한 봉사활동 기회를 안내하고 연결해 드립니다." },
    { id: 17, name: "Future major interest guidance", desc: "향후 진학할 전공 방향에 대한 심화 가이드를 제공합니다." },
    { id: 18, name: "Research project with professor", extra: "비용 별도", desc: "대학 교수와 함께하는 리서치 프로젝트 연계입니다. 별도 비용이 발생합니다." },
    { id: 19, name: "Summer Camp list and execution", desc: "여름방학 캠프 리스트 추천부터 지원, 실행까지 전 과정을 지원합니다." },
    { id: 36, name: "Summer Project by intended majors", desc: "희망 전공에 맞춘 맞춤형 여름방학 프로젝트를 설계하고 진행합니다. (Premium 전용)" },
  ] },
  { category: "Application", items: [
    { id: 12, name: "1:1 biweekly meetings", desc: "2주에 1회 정기적으로 진행되는 1:1 면담으로 학업 및 활동 전반을 점검합니다." },
    { id: 20, name: "Counselor/teacher recommendation letters", desc: "카운슬러 및 교사 추천서 작성에 필요한 자료 준비와 가이드를 제공합니다." },
    { id: 21, name: "College application timeline", desc: "대학 지원 전체 일정(원서, 에세이, 시험 등)을 체계적으로 정리해 드립니다." },
    { id: 22, name: "Resume incl. activities and honors/awards", desc: "학생의 활동과 수상 경력을 정리한 이력서(Resume)를 작성합니다." },
    { id: 23, name: "Personalized admissions strategy", desc: "학생의 프로필에 맞춘 맞춤형 입시 전략을 수립합니다." },
    { id: 24, name: "College list (ED, EA, and regular schools)", desc: "ED, EA, 정시 지원 대학 리스트를 학생 프로필에 맞춰 작성합니다." },
    { id: 25, name: "UC Application", desc: "캘리포니아 주립대(UC) 계열 지원서 작성을 지원합니다." },
    { id: 26, name: "Finalized intended major (1st–3rd)", desc: "1지망부터 3지망까지 희망 전공을 최종 확정하도록 돕습니다." },
    { id: 27, name: "Brainstorm/revise main & supplemental essays", desc: "메인 에세이와 추가 에세이의 아이디어 구상부터 수정까지 전 과정을 가이드합니다." },
    { id: 28, name: "Review of the Common Application", desc: "Common Application 전체 내용을 검토하고 보완합니다." },
    { id: 29, name: "Preparation for interviews (mock sessions)", desc: "대학 입시 인터뷰를 대비한 모의 인터뷰 세션을 진행합니다." },
    { id: 30, name: "Application timelines & deadlines", desc: "각 대학별 지원 마감일을 관리하고 놓치지 않도록 안내합니다." },
    { id: 31, name: "Management of application portals", desc: "각 대학 지원 포털 계정 관리 및 제출 현황을 관리해 드립니다." },
    { id: 32, name: "Required documents (Financial / Int'l students)", desc: "국제학생에게 필요한 재정 증빙 서류 등 필수 서류 준비를 안내합니다." },
  ] },
  { category: "Consulting", items: [
    { id: 33, name: "Essay contests preparation", desc: "에세이 공모전 참가를 위한 준비와 가이드를 제공합니다." },
    { id: 34, name: "Annual plan including college list", desc: "대학 리스트를 포함한 연간 종합 계획을 수립합니다." },
    { id: 35, name: "Strengthen academic & extracurricular weaknesses", desc: "학업 및 비교과 활동에서 보완이 필요한 부분을 진단하고 강화 전략을 제시합니다." },
    { id: 38, name: "Strengthen academic & extracurricular weaknesses", desc: "학업 및 비교과 활동에서 보완이 필요한 부분을 진단하고 강화 전략을 제시합니다." },
    { id: 39, name: "Monthly parent consultation updates", desc: "매월 학부모님께 학생의 진행 상황과 다음 달 계획을 업데이트해 드립니다." },
  ] },
];

// 원장님(대표) 서명 이미지 — public/images/signature_eunju_lee.png
function DirectorSignature() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/signature_eunju_lee.png"
      alt="대표 서명"
      style={{ height: "68px", width: "auto", objectFit: "contain" }}
    />
  );
}

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("contracts").select("*").eq("token", token).single();
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setContract(data as Contract);
      setLoading(false);
    }
    load();
  }, [token]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  }
  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setDrawing(true);
  }
  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = getPos(e);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#7c3819";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!hasSig) setHasSig(true);
  }
  function endDraw() {
    setDrawing(false);
  }
  function clearSig() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  }

  async function handleSubmit() {
    if (!supabase) return;
    if (!agreed) {
      alert("계약 내용에 동의해주세요.");
      return;
    }
    if (!hasSig) {
      alert("서명을 해주세요.");
      return;
    }
    setSubmitting(true);
    const sigData = canvasRef.current!.toDataURL("image/png");
    const signedAt = new Date().toISOString();
    const { error } = await supabase
      .from("contracts")
      .update({ status: "signed", signature_data: sigData, signed_at: signedAt })
      .eq("token", token);
    if (error) {
      alert("오류: " + error.message);
      setSubmitting(false);
      return;
    }
    // 서명 완료 알림 메일 — 실패해도 서명 자체는 이미 끝난 상태이므로 조용히 무시.
    if (contract) {
      fetch("/api/contract-signed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractType: contract.contract_type,
          studentName: contract.student_name,
          studentGrade: contract.student_grade,
          parentName: contract.parent_name,
          parentPhone: contract.parent_phone,
          amount: contract.amount,
          startDate: contract.start_date,
          endDate: contract.end_date,
          signedAt,
        }),
      }).catch(() => {});
    }
    setDone(true);
  }

  const pkgIdx = (contract && pkgIndex[contract.contract_type]) ?? 0;
  const center: React.CSSProperties = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e6e0" };

  if (loading) return <div style={center}><div style={{ color: "#aaa" }}>불러오는 중...</div></div>;
  if (notFound) return <div style={center}><div style={{ textAlign: "center" }}><div style={{ fontSize: "40px", marginBottom: "12px" }}>❌</div><p style={{ color: "#666" }}>유효하지 않은 계약서 링크입니다.</p></div></div>;
  if (contract?.status === "cancelled") return <div style={center}><div style={{ textAlign: "center" }}><div style={{ fontSize: "40px", marginBottom: "12px" }}>🚫</div><p style={{ color: "#666" }}>취소된 계약서입니다.</p></div></div>;

  if (contract?.contract_type === "instructor") {
    const dateKor = formatKorDate(contract.start_date);
    const endKor = formatKorDate(contract.end_date);
    const amount = contract.amount ? formatAmountInput(contract.amount) : "별도 협의";
    const name = contract.student_name || "";
    const ssn = contract.student_school || "";
    const address = contract.parent_address || "";
    const contact = contract.parent_phone || "";
    const isSigned = contract.status === "signed" || contract.status === "terminated" || done;

    return (
      <div style={{ minHeight: "100vh", background: "#e8e6e0" }}>
        <div style={{ background: "#0a1628", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#e8cc7a,#f0d78f,#e8cc7a,transparent)" }} />
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/key_logo_gold.png" alt="logo" style={{ width: "14px", height: "auto", filter: "brightness(0) invert(1)" }} />
              <div style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", color: "#fff", letterSpacing: "2px", lineHeight: 1.3, whiteSpace: "nowrap" }}>Bluekey Prep</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#e8cc7a", letterSpacing: "2px", textTransform: "uppercase" }}>Electronic Contract</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>{CONTRACT_TITLES.instructor}</div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "24px 16px 60px" }}>
          {isSigned && (
            <div style={{ background: "#1a7a3c", borderRadius: "6px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <span style={{ fontSize: "20px" }}>✅</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>서명이 완료된 계약서입니다</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: "2px" }}>
                  서명일: {contract.signed_at ? new Date(contract.signed_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : ""} (한국시간 기준)
                </div>
              </div>
              <button onClick={() => window.print()} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "6px", padding: "7px 16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
                🖨️ PDF 저장
              </button>
            </div>
          )}

          <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", marginBottom: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 01</span>
              <span style={{ fontWeight: 700, color: "#0a1628", fontSize: "14px" }}>계약 당사자 정보</span>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "16px" }}>
              <div style={{ border: "1px solid #0a1628", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ background: "#0a1628", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#e8cc7a", fontSize: "11px", letterSpacing: "2px" }}>갑</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>㈜블루키프렙</span>
                </div>
                <div style={{ padding: "14px 16px", background: "#f9f8f6" }}>
                  {[["사업자번호", "885-88-01373"], ["주소", "서울시 강남구 신사동 609번지 이소니프라자 3층"], ["대표이사", "강요셉, 이은주"]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", gap: "10px", marginBottom: "6px", fontSize: "12px" }}><span style={{ color: "#aaa", minWidth: "64px" }}>{l}</span><span>{v}</span></div>
                  ))}
                </div>
              </div>
              <div style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ background: "#1e3a5f", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#e8cc7a", fontSize: "11px", letterSpacing: "2px" }}>을</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>강사</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  {[["성명", name || "—"], ["직책", "강사"], ["주민등록번호", ssn || "—"], ["연락처", contact || "—"], ["주소", address || "—"], ["계약일자", dateKor || "—"]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", gap: "10px", marginBottom: "6px", fontSize: "12px" }}><span style={{ color: "#aaa", minWidth: "64px" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", marginBottom: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 02</span>
              <span style={{ fontWeight: 700, color: "#0a1628", fontSize: "14px" }}>계약 조건</span>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ background: "#0a1628", borderRadius: "6px", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>계약기간</div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: "15px" }}>{dateKor} ~ {endKor}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#e8cc7a", fontSize: "18px", fontWeight: 700 }}>{amount}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "3px" }}>강사료</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", marginBottom: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 03</span>
              <span style={{ fontWeight: 700, color: "#0a1628", fontSize: "14px" }}>계약서 내용{!isSigned ? " 확인" : ""}</span>
            </div>
            <div style={isSigned ? { padding: "20px 24px", fontSize: "12px", lineHeight: "1.9", color: "#444" } : { padding: "20px 24px" }}>
              <div style={!isSigned ? { border: "1px solid #ddd", borderRadius: "4px", maxHeight: "320px", overflowY: "auto", padding: "20px 24px", background: "#fafaf8", fontSize: "12px", lineHeight: "1.9", color: "#444" } : {}}>
                <div style={{ marginBottom: "14px", fontWeight: 600, color: "#555" }}>
                  본 계약서(이하 &quot;본 계약&quot;)는 ㈜블루키프렙(이하 &quot;갑&quot;)와 {name}(이하 &quot;을&quot;)간에 {dateKor}자로 체결되었다.
                </div>

                <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 1 조 (계약의 목적)</div>
                  <div>본 계약은 갑이 현재 서울시 강남구 신사동 609번지 등에서 교육관련 서비스업 등(이하 &quot;본건 사업&quot;)을 하고 있는 것과 관련하여 갑과 을 사이의 권리, 의무 관계 등에 필요한 사항을 정함을 목적으로 한다.</div>
                </div>

                <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 2 조 (계약기간)</div>
                  <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
                    <li style={{ marginBottom: "4px" }}>본 계약의 기간은 {dateKor}부터 {endKor}까지(이하 &quot;본건 계약기간&quot;)로 한다. 단, 갑과 을의 협의 하에 계약기간은 변경될 수 있다.</li>
                    <li style={{ marginBottom: "4px" }}>갑 또는 을이 본 계약을 연장하고자 할 경우 본건 계약기간 만료일로부터 30일 이전에 상대방에게 서면으로 연장 의사를 통지하여야 하고, 연장 여부 및 연장 계약의 조건은 상호 협의하여 결정한다.</li>
                  </ol>
                </div>

                <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 3 조 (업무의 범위)</div>
                  <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
                    <li style={{ marginBottom: "4px" }}>을의 직책은 강사직으로 한다.</li>
                    <li style={{ marginBottom: "4px" }}>갑은 을에게 본건 사업과 관련하여 을과 협의하여 을이 담당하여야 할 구체적인 업무를 정하여 이를 수행할 것을 요구하고, 을은 갑의 요구에 따라 선량한 관리자의 주의의무로 업무를 수행한다.</li>
                  </ol>
                </div>

                <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 4 조 (보수)</div>
                  <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
                    <li style={{ marginBottom: "4px" }}>보수의 지급 시기는 매월 10일로 한다.</li>
                    <li style={{ marginBottom: "4px" }}>갑은 을에게 개인 수업은 강사료 {amount}으로 한다.</li>
                    <li style={{ marginBottom: "4px" }}>본 계약의 보수에는 퇴직금 및 기반 제비용을 모두 포함한 것으로 한다.</li>
                    <li style={{ marginBottom: "4px" }}>상기 소득에 관한 세금은 모두 을이 부담한다.</li>
                  </ol>
                </div>

                <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 5 조 (비밀유지 및 준수의무)</div>
                  <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
                    <li style={{ marginBottom: "4px" }}>을은 본건 계약기간 중 을이 담당한 업무를 수행하는 데 필요한 품위를 지키며 갑의 제반 규칙을 준수하여야 한다.</li>
                    <li style={{ marginBottom: "4px" }}>을은 최선을 다하여 갑의 업무지시에 응하여 본 계약에 의하여 부과된 업무를 성실히 수행하여야 한다.</li>
                    <li style={{ marginBottom: "4px" }}>을은 관련법규에 따른 의무에 따라 공개하는 경우를 제외하고는 본건 계약의 이행이 완료된 후에도 본건 계약의 체결 및 이행 과정에서 지득한 본건 사업 및 을의 업무에 관한 정보를 비밀로 유지하여야 한다.</li>
                  </ol>
                </div>

                <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 6 조 (부업행위의 금지)</div>
                  <div>을은 회사의 시설이나 서비스를 이용하여 별도의 보수를 받고 본건 계약과 동일하거나 유사한 서비스를 제공하지 않는다.</div>
                </div>

                <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 7 조 (지적재산권)</div>
                  <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
                    <li style={{ marginBottom: "4px" }}>을이 본건 계약기간 중 업무와 관련하여 개발하거나 편집한 강의교재를 포함한 일체의 자료 중, 갑이 비용을 부담하거나 인력·시설·자료 등을 지원하는 등 갑의 투자가 이루어진 자료에 대한 저작권을 포함한 일체의 지적재산권은 갑에게 귀속된다.</li>
                    <li style={{ marginBottom: "4px" }}>제1항에도 불구하고, 을이 갑의 투자 없이 독자적으로 개발한 자료에 대한 저작권을 포함한 일체의 지적재산권은 을에게 귀속되며, 갑은 이에 대하여 권리를 주장하지 않는다.</li>
                    <li style={{ marginBottom: "4px" }}>을은 업무상 습득한 지적 재산, 업무지식을 타 업체에 제공하거나 자격증 등을 임의로 다른 업체에 대여하지 않는다.</li>
                  </ol>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 8 조 (계약의 해지)</div>
                  <div style={{ marginBottom: "4px" }}>갑은 을이 다음 사항 중 하나에 해당할 경우 즉시 본 계약을 해지하거나 또는 재계약 체결을 거부할 수 있다.</div>
                  <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
                    <li style={{ marginBottom: "4px" }}>본 계약의 의무 및 금지의 행위를 위반하였을 경우</li>
                    <li style={{ marginBottom: "4px" }}>을의 근무태만 등의 사유로 업무실적이 현저하게 저조하다고 판단되는 경우</li>
                    <li style={{ marginBottom: "4px" }}>을이 폐질, 불구, 질병, 기타의 사유로 본 계약상의 의무를 성실히 수행할 수 없다고 판단되는 경우</li>
                    <li style={{ marginBottom: "4px" }}>을이 계속하여 3일 이상 무단 결근한 경우</li>
                    <li style={{ marginBottom: "4px" }}>회사업무와 관련하여 청탁을 받고 재물을 수령한 경우</li>
                    <li style={{ marginBottom: "4px" }}>전과사실이 있거나 신체검사에 불합격 판정을 받았을 경우, 신체 및 정신상의 결함 등으로 직무를 수행 할 수 없는 경우</li>
                    <li style={{ marginBottom: "4px" }}>학력, 경력 등에 대한 허위사실이 발견된 경우</li>
                    <li style={{ marginBottom: "4px" }}>을이 대학원이나 학위 취득을 위해서 진학하여 기타 교육관련 활동을 그만두게 될 경우</li>
                  </ol>
                </div>

                <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 9 조 (분쟁의 해결)</div>
                  <div>이 계약의 체결, 이행 또는 이 계약의 위반과 관련하여 당사자들 사이에서 분쟁이 발생한 경우에는 서울중앙지방법원의 관할로 한다.</div>
                </div>

                <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 10 조 (기타)</div>
                  <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
                    <li style={{ marginBottom: "4px" }}>양도: 본 계약 어느 당사자도 다른 당사자의 서면 동의 없이는 본 계약상의 권리, 의무 또는 채무를 다른 개인 또는 단체에게 양도할 수 없다.</li>
                    <li style={{ marginBottom: "4px" }}>통지: 본 계약에 규정된 모든 의사전달은 서면(직접전달, 등기우편, 팩시밀리, 텔렉스 또는 전보)으로 행한다.</li>
                    <li style={{ marginBottom: "4px" }}>계약 부수: 본 계약서는 2통으로 작성되고 각각 원본으로 간주한다.</li>
                    <li style={{ marginBottom: "4px" }}>변경: 본 계약은 각 당사자들이 서명한 서면증서에 의하여 변경될 수 있다.</li>
                    <li style={{ marginBottom: "4px" }}>해지: 갑과 을은 본건 용역계약을 해지할 경우 각 30일전 상대방에게 통지하여야 한다.</li>
                  </ol>
                </div>

                {contract.special_terms && (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontWeight: 700, color: "#0a1628", marginBottom: "4px" }}>제 11 조 (특약사항)</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{contract.special_terms}</div>
                  </div>
                )}
              </div>

              {!isSigned && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "14px", padding: "14px 16px", background: "#faf4e6", border: "1px solid #e8d89a", borderRadius: "4px", cursor: "pointer" }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: "2px", accentColor: "#0a1628", width: "16px", height: "16px", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#0a1628", fontWeight: 500 }}>본인은 위 계약서의 내용을 모두 읽고 충분히 이해하였으며, 본 계약의 모든 조항에 동의합니다.</span>
                </label>
              )}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 04</span>
              <span style={{ fontWeight: 700, color: "#0a1628", fontSize: "14px" }}>서명{!isSigned ? " 및 제출" : ""}</span>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: isSigned ? 0 : "24px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>갑 · ㈜블루키프렙</div>
                  <div style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", background: "#f9f8f6", fontSize: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}><span style={{ color: "#aaa", width: "48px" }}>대표</span><span>강요셉, 이은주</span></div>
                      <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#aaa", width: "48px" }}>사업자</span><span>885-88-01373</span></div>
                    </div>
                    <div style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", borderTop: "1px solid #eee", minHeight: "90px" }}>
                      <DirectorSignature />
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>을 · 강사 서명{isSigned ? "" : "란"}</div>
                  <div style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                    {isSigned ? (
                      <>
                        <div style={{ padding: "8px 14px", background: "#f9f8f6", fontSize: "12px", borderBottom: "1px solid #eee" }}>
                          <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}><span style={{ color: "#aaa", width: "48px" }}>성명</span><span style={{ fontWeight: 600 }}>{name}</span></div>
                          <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#aaa", width: "48px" }}>서명일</span><span>{contract.signed_at ? new Date(contract.signed_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : ""} <span style={{ color: "#bbb", fontSize: "10px" }}>(한국시간 기준)</span></span></div>
                        </div>
                        {contract.signature_data && (
                          <div style={{ padding: "12px", background: "#fff", display: "flex", justifyContent: "center" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={contract.signature_data} alt="서명" style={{ maxHeight: "80px", maxWidth: "100%" }} />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ position: "relative", background: "#fff", touchAction: "none" }}>
                          <canvas ref={canvasRef} width={400} height={110} style={{ display: "block", width: "100%", height: "110px", cursor: "crosshair" }}
                            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
                          {!hasSig && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", color: "#ccc" }}>
                              <span style={{ fontSize: "22px", marginBottom: "4px" }}>✍️</span>
                              <span style={{ fontSize: "11px" }}>이곳에 서명해 주세요</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f9f8f6", borderTop: "1px solid #eee" }}>
                          <span style={{ fontSize: "11px", color: "#aaa" }}>{new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} 서명 (한국시간 기준)</span>
                          <button onClick={clearSig} style={{ background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "3px 10px", fontSize: "11px", color: "#888", cursor: "pointer" }}>지우기</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!isSigned && (
                <>
                  <div style={{ height: "1px", background: "linear-gradient(90deg,transparent,#e8cc7a,transparent)", opacity: 0.5, marginBottom: "20px" }} />
                  <button onClick={handleSubmit} disabled={submitting}
                    style={{ width: "100%", background: "#0a1628", color: "#fff", border: "none", borderRadius: "6px", padding: "15px", fontSize: "14px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px", position: "relative", overflow: "hidden" }}>
                    <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,#b8952a,#e8cc7a,#b8952a)" }} />
                    {submitting ? "제출 중..." : "계약서 제출 및 전자 서명 완료"}
                  </button>
                  <p style={{ textAlign: "center", fontSize: "11px", color: "#bbb", marginTop: "10px" }}>문의: bluekeyprep@gmail.com · 02-548-2228</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSignedConsulting = contract?.status === "signed" || contract?.status === "terminated" || done;
  const cl = getClauses(contract?.contract_type || "standard", contract?.num_schools ?? null);

  const partiesBlock = (
    <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", marginBottom: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 01</span>
        <span style={{ fontWeight: 700, color: "#7c3819", fontSize: "14px" }}>계약 당사자 정보</span>
      </div>
      <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "16px" }}>
        <div style={{ border: "1px solid #7c3819", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ background: "#7c3819", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#f2d17e", fontSize: "11px", letterSpacing: "2px" }}>갑</span>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>블루키컨설팅</span>
          </div>
          <div style={{ padding: "14px 16px", background: "#f9f8f6" }}>
            {[["사업자번호", "887-85-02270"], ["주소", "서울시 강남구 압구정로 30길 16, 3층"], ["전화", "02-548-2228"], ["대표", "이 은 주"]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", gap: "10px", marginBottom: "6px", fontSize: "12px" }}><span style={{ color: "#aaa", minWidth: "64px" }}>{l}</span><span>{v}</span></div>
            ))}
          </div>
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ background: "#a8623a", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#f2d17e", fontSize: "11px", letterSpacing: "2px" }}>을</span>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>회원 및 학부모</span>
          </div>
          <div style={{ padding: "14px 16px" }}>
            {[["학부모", contract?.parent_name || "—"], ["연락처", contract?.parent_phone || "—"], ["주소", contract?.parent_address || "—"], ["학생", `${contract?.student_name} (${contract?.student_grade})`], ["학교", contract?.student_school || "—"]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", gap: "10px", marginBottom: "6px", fontSize: "12px" }}><span style={{ color: "#aaa", minWidth: "64px" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const packageBlock = (
    <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", marginBottom: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 02</span>
        <span style={{ fontWeight: 700, color: "#7c3819", fontSize: "14px" }}>서비스 패키지</span>
      </div>
      <div style={{ padding: "20px 24px" }}>
        <div style={{ background: "#7c3819", borderRadius: "6px", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>Selected Plan</div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "15px" }}>
              {contract?.contract_type === "application" ? "Application (College App.)" : contract?.contract_type === "premium" ? "Premium (All-Inclusive Consulting EC+Academic+College App.)" : "Standard (EC+Academic Management)"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#f2d17e", fontSize: "18px", fontWeight: 700 }}>{contract?.amount ? formatAmountInput(contract.amount) : "별도 문의"}</div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "3px" }}>컨설팅 서비스 비용</div>
          </div>
        </div>
        {contract?.start_date && contract?.end_date && (
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>서비스 기간: <span style={{ fontWeight: 600, color: "#333" }}>{contract.start_date} ~ {contract.end_date}</span></div>
        )}
        {contract?.contract_type === "application" && (
          <div style={{ background: "#faf4e6", border: "1px solid #e8d89a", borderRadius: "6px", padding: "14px 18px", fontSize: "13px", color: "#7a5d1a", marginBottom: "8px" }}>
            기본 <b>{contract?.num_schools || "12"}개</b> 대학 원서 작성 및 제출 행정 서비스가 포함됩니다. (Safety 지원 학교는 상호 합의 하에 조율 가능)
          </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          {featureList
            .filter((section) => {
              const ct = contract?.contract_type;
              if (ct === "standard" && section.category === "Application") return false;
              if (ct === "application" && (section.category === "Standardized Test & GPA" || section.category === "GPA (Academic)" || section.category === "Activities" || section.category === "Consulting")) return false;
              return true;
            })
            .map((section) => (
              <tbody key={section.category}>
                <tr><td colSpan={2} style={{ background: "#7c3819", color: "#f2d17e", padding: "8px 14px", fontWeight: 700, letterSpacing: "1px", fontSize: "11px", textTransform: "uppercase" }}>{section.category}</td></tr>
                {section.items
                  .filter((item) => {
                    if (contract?.contract_type === "application" && item.id === 34) return false;
                    return features[item.id]?.[pkgIdx] === 1;
                  })
                  .map((item, i) => (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf8" }}>
                      <td style={{ padding: "8px 14px", color: "#444" }}>{item.name}{item.extra && <span style={{ color: "#aaa", marginLeft: "6px" }}>({item.extra})</span>}</td>
                      <td style={{ padding: "8px 14px", textAlign: "center", width: "60px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", background: "#e8f4ed", borderRadius: "50%", color: "#2e6b45", fontWeight: 700, fontSize: "11px" }}>✓</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            ))}
        </table>
      </div>
    </div>
  );

  const clausesBlock = (
    <>
      <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 1 조 (목적)</div><div>{cl.clause1}</div></div>
      <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 2 조 (계약의 내용)</div><div>&apos;회사&apos;는 회원에게 다음과 같은 서비스를 제공한다.</div><ul style={{ paddingLeft: "18px", marginTop: "4px" }}>{cl.clause2.map((t, i) => <li key={i} style={{ marginBottom: "3px" }}>{t}</li>)}</ul></div>
      <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 3 조 (컨설팅의 방법)</div><ul style={{ paddingLeft: "18px", listStyleType: "none" }}>{cl.clause3.map((item, i) => (
        <li key={i} style={{ marginBottom: "6px" }}>
          <b>{item.t}</b>
          {item.subs ? (
            <ul style={{ paddingLeft: "16px", marginTop: "4px", listStyleType: "none" }}>
              {item.subs.map((s, si) => <li key={si} style={{ marginBottom: "3px" }}>○ {s}</li>)}
            </ul>
          ) : <span>: {item.d}</span>}
        </li>
      ))}</ul></div>
      <div style={{ background: "#f5f2ec", border: "1px solid #e0d9cf", borderLeft: "3px solid #b8952a", borderRadius: "4px", padding: "12px 14px", margin: "10px 0", fontSize: "12px" }}>
        <div style={{ fontWeight: 700, color: "#b8952a", marginBottom: "4px" }}>*별2</div>
        <div style={{ color: "#555" }}>회원과 담당 컨설턴트와의 연락은 주 5일 근무일 기준으로 월요일부터 금요일, 대한민국 서울 시각으로 오전 9시부터 저녁 6시까지이며, 그 외 급한 사항은 이메일과 유선전화를 이용하여 연락을 취한다.</div>
      </div>
      <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 4 조 (회원의 의무)</div><ul style={{ paddingLeft: "18px", listStyleType: "none" }}>{cl.clause4.map((t, i) => <li key={i} style={{ marginBottom: "3px" }}>{t}</li>)}</ul></div>
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 5 조 (비용 및 지불)</div>
        {contract?.contract_type === "premium" ? (
          <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
            <li style={{ marginBottom: "4px" }}>계약 기간: 계약 체결일로부터 지원 대학의 결과 발표 후 최종 입학 대학 선정 및 등록(Enrollment) 시점까지로 한다.</li>
            <li style={{ marginBottom: "4px" }}>모든 서비스는 입금이 확인된 이후 진행함을 원칙으로 하되, 구체적인 납부 방법 및 기한(분납 등)은 학부모와 회사의 사전 협의를 통해 조정 및 변경할 수 있다.</li>
            <li style={{ marginBottom: "4px" }}>&apos;회사&apos;는 회원의 컨설팅 기간 동안 추가로 견적이 나오는 금액을 추가로 청구 할 수 있으며, 추가 금액은 사전에 회원에게 통보를 하여 회원의 동의를 얻은 추가 비용에 한한다.</li>
            <li style={{ marginBottom: "4px" }}>회원의 추가 항목은 Extracurricular Activity에 소요될 수 있는 기타 제반비용, Application Fee, Test 성적 Request비, 학교기관과 해당 학교 외 추가로 발송되는 우편료, 다른 서류의 번역, 공증비 등 그 외 컨설팅 기간 동안 청구가 될 수 있는 모든 항목을 명시한다. &apos;회사&apos;는 추가 학교에 대한 청구는 추가사항이 발생할 때 월말에 청구를 하며, 회원은 인보이스 발행 3일 이내에 입금을 완료한다.</li>
            <li style={{ marginBottom: "4px" }}>지불 및 납부 방식: 현금 납부, 계좌 이체 모두 가능하며, 현금/이체 시 관련 법령에 따라 현금영수증을 발급한다.</li>
          </ol>
        ) : contract?.contract_type === "application" ? (
          <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
            <li style={{ marginBottom: "4px" }}>계약 기간은 컨설팅 서비스를 시작하는 시점부터 지원한 대학 가운데 가장 늦은 대학의 원서 마감일까지로 한다.</li>
            <li style={{ marginBottom: "4px" }}>학부모는 계약서를 수령한 후 연회비를 입금하여야 하며, 모든 서비스는 입금이 확인된 이후 진행된다.</li>
            <li style={{ marginBottom: "4px" }}>회원은 이에 해당하는 계약금을 &apos;회사&apos;에게 지급하며, &apos;회사&apos;는 회원의 컨설팅 기간 동안 추가로 견적이 나오는 금액을 추가로 청구 할 수 있으며, 추가 금액은 사전에 회원에게 통보를 하여 회원의 동의를 얻은 추가 비용에 한한다.</li>
            <li style={{ marginBottom: "4px" }}>회원의 추가 항목은 Extracurricular Activity에 소요될 수 있는 기타 제반비용, Application Fee, Test 성적 Request비, 학교기관과 해당 학교 외 추가로 발송되는 우편료, 다른 서류의 번역, 공증비 등 그 외 컨설팅 기간 동안 청구가 될 수 있는 모든 항목을 명시한다. &apos;회사&apos;는 컨설팅 기간중 사전에 회원과 동의하에 발생되는 기타소요비용에 대한 청구를 월 별로 할 수 있다. &apos;회사&apos;는 추가 학교에 대한 청구는 추가사항이 발생할 때 월말에 청구를 하며, 회원은 인보이스 발행 5일 이내에 입금을 완료한다.</li>
          </ol>
        ) : (
          <ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}>
            <li style={{ marginBottom: "4px" }}>모든 서비스는 입금이 확인된 이후 시작된다.</li>
            <li style={{ marginBottom: "4px" }}>회원은 이에 해당하는 계약금을 &apos;회사&apos;에게 지급하며, &apos;회사&apos;는 회원의 컨설팅 기간 동안 추가로 견적이 나오는 금액을 추가로 청구 할 수 있으며, 추가 금액은 사전에 회원에게 통보를 하여 회원의 동의를 얻은 추가 비용에 한한다.</li>
            <li style={{ marginBottom: "4px" }}>회원의 Extracurricular Activity에 소요될 수 있는 기타 제반비용, Application Fee, Test 성적 Request비, 학교기관과 해당 학교 외 추가로 발송되는 우편료, 다른 서류의 번역, 공증비 등 그 외 컨설팅 기간 동안 청구가 될 수 있는 모든 항목을 명시한다. &apos;회사&apos;는 컨설팅 기간중 사전에 회원과 동의하에 발생되는 기타소요비용에 대한 청구를 월 별로 할 수 있다.</li>
          </ol>
        )}
      </div>
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 6 조 (계약의 해지 및 환불)</div>
        <ul style={{ paddingLeft: "0px", listStyleType: "none" }}>{cl.refund.items.map((item, i) => (
          <li key={i} style={{ marginBottom: "4px" }}>
            {item.split("|").map((line, li) => (
              <span key={li} style={{ display: "block", paddingLeft: li > 0 ? "12px" : "0" }}>{line}</span>
            ))}
          </li>
        ))}</ul>
        {cl.refund.star3 && (
          <div style={{ background: "#f5f2ec", border: "1px solid #e0d9cf", borderLeft: "3px solid #b8952a", borderRadius: "4px", padding: "12px 14px", margin: "10px 0" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#b8952a", marginBottom: "6px" }}>*별3 환불 기준</div>
            <ul style={{ paddingLeft: "16px", listStyleType: "none" }}>{cl.refund.star3.map((item, i) => <li key={i} style={{ marginBottom: "3px", fontSize: "12px", color: item.includes("불가") ? "#c0392b" : "#555" }}>– {item}</li>)}</ul>
          </div>
        )}
      </div>
      <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 7 조 (회사의 면책)</div><ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}><li style={{ marginBottom: "4px" }}>회원 및 학부모가 제공한 서류와 정보가 사실과 다르거나 적법하지 않아서 발생하는 불이익에 대하여 &apos;회사&apos;는 그 책임을 지지 않는다.</li><li style={{ marginBottom: "4px" }}>회원 및 회원의 학부모의 비협조적인 태도로 서비스가 원활하게 이루어지지 않거나 기타 회원의 귀책 사유로 서비스가 진행되지 못할 경우, &apos;회사&apos;는 그 책임을 지지 않는다.</li><li style={{ marginBottom: "4px" }}>회원 및 회원의 학부모가 서비스 방침 및 컨설턴트의 지시에 따르지 않아 발생한 불이익에 대해서 회사는 그 책임을 지지 않는다.</li></ol></div>
      <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 8 조 (상호 존중과 비밀의 유지)</div><ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}><li style={{ marginBottom: "4px" }}>&apos;회사&apos;와 회원, 회원의 학부모는 서로의 의사를 존중하며 서비스의 원활한 진행을 위하여 적극 노력한다.</li><li style={{ marginBottom: "4px" }}>회원은 컨설팅 리포트를 포함한 모든 자료를 제3자에게 공개하거나 컨설팅 이외의 용도로 활용할 수 없으며, &apos;회사&apos;의 기밀 및 업무 내용의 유출로 회사가 유, 무형의 피해를 입을 경우 회사는 손실에 대한 보상을 요구할 수 있다.</li><li style={{ marginBottom: "4px" }}>&apos;회사&apos;는 계약 기간 동안 회원 및 학부모가 제공한 정보 및 신상 명세적 비밀을 누설하지 않으며, &apos;회사&apos;의 서비스 내용과 지적 자산을 제3자에게 제공하거나 컨설팅 이외의 목적으로 활용할 수 없다. &apos;회사&apos;가 회원의 개인 정보를 유출함으로써 회원이 유, 무형의 피해를 입을 경우 회원은 피해에 대한 보상을 요구할 수 있다.</li>{cl.clause8_extra.map((t, i) => <li key={i} style={{ marginBottom: "4px" }}>{t}</li>)}</ol></div>
      <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 9 조 (계약의 변경)</div><ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}><li style={{ marginBottom: "4px" }}>본 계약의 변경 또는 수정은 학부모와 &apos;회사&apos;가 서면 합의하여야 한다.</li><li style={{ marginBottom: "4px" }}>본 계약에서 규정하지 않은 사항들은 관계 법령 및 업계의 관행을 고려하여 신의 성실의 원칙에 따라 해결한다.</li><li style={{ marginBottom: "4px" }}>본 계약과 관련된 분쟁이 생길 경우, 소송은 &apos;회사&apos; 소재지의 관할 법원에 제기한다.</li></ol></div>
      <div style={{ marginBottom: "14px" }}><div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 10 조 (기타)</div><ol style={{ paddingLeft: "18px", listStyleType: "decimal" }}><li>이 계약으로 명백하게 정할 수 없는 사항은 &apos;회사&apos;와 회원, 회원의 학부모가 상호 협의하여 조정하되, 유학 업계의 일반적인 관례를 참고한다.</li></ol></div>
      {contract?.special_terms && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontWeight: 700, color: "#7c3819", marginBottom: "4px" }}>제 11 조 (특약사항)</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{contract.special_terms}</div>
        </div>
      )}
    </>
  );

  if (isSignedConsulting) {
    return (
      <div style={{ minHeight: "100vh", background: "#e8e6e0" }}>
        <div style={{ background: "#7c3819", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#f2d17e,#e8c96a,#f2d17e,transparent)" }} />
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/key_logo_gold.png" alt="logo" style={{ width: "22px", height: "auto" }} />
              <div style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", color: "#f2d17e", letterSpacing: "2px", lineHeight: 1.3 }}>Bluekey<br />Consulting</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#f2d17e", letterSpacing: "2px", textTransform: "uppercase" }}>Electronic Contract</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>{CONTRACT_TITLES[contract?.contract_type || "standard"]}</div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "24px 16px 60px" }}>
          <div style={{ background: "#1a7a3c", borderRadius: "6px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span style={{ fontSize: "20px" }}>✅</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>서명이 완료된 계약서입니다</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: "2px" }}>서명일: {contract?.signed_at ? new Date(contract.signed_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : ""} (한국시간 기준)</div>
            </div>
            <button onClick={() => window.print()} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "6px", padding: "7px 16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
              🖨️ PDF 저장
            </button>
          </div>

          {partiesBlock}
          {packageBlock}

          <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", marginBottom: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 03</span>
              <span style={{ fontWeight: 700, color: "#7c3819", fontSize: "14px" }}>계약서 내용</span>
            </div>
            <div style={{ padding: "20px 24px", fontSize: "12px", lineHeight: "1.9", color: "#444" }}>{clausesBlock}</div>
          </div>

          <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 04</span>
              <span style={{ fontWeight: 700, color: "#7c3819", fontSize: "14px" }}>서명</span>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>갑 · 블루키컨설팅</div>
                  <div style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", background: "#f9f8f6", fontSize: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}><span style={{ color: "#aaa", width: "48px" }}>대표</span><span>이 은 주</span></div>
                      <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#aaa", width: "48px" }}>사업자</span><span>887-85-02270</span></div>
                    </div>
                    <div style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", borderTop: "1px solid #eee", minHeight: "90px" }}>
                      <DirectorSignature />
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>을 · 학부모 서명</div>
                  <div style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ padding: "8px 14px", background: "#f9f8f6", fontSize: "12px", borderBottom: "1px solid #eee" }}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}><span style={{ color: "#aaa", width: "48px" }}>성명</span><span style={{ fontWeight: 600 }}>{contract?.parent_name}</span></div>
                      <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#aaa", width: "48px" }}>서명일</span><span>{contract?.signed_at ? new Date(contract.signed_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : ""} <span style={{ color: "#bbb", fontSize: "10px" }}>(한국시간 기준)</span></span></div>
                    </div>
                    {contract?.signature_data && (
                      <div style={{ padding: "12px", background: "#fff", display: "flex", justifyContent: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={contract.signature_data} alt="서명" style={{ maxHeight: "80px", maxWidth: "100%" }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#e8e6e0" }}>
      <div style={{ background: "#7c3819", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#f2d17e,#e8c96a,#f2d17e,transparent)" }} />
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/key_logo_gold.png" alt="logo" style={{ width: "22px", height: "auto" }} />
            <div style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", color: "#f2d17e", letterSpacing: "2px", lineHeight: 1.3 }}>Bluekey<br />Consulting</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#f2d17e", letterSpacing: "2px", textTransform: "uppercase" }}>Electronic Contract</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>{CONTRACT_TITLES[contract?.contract_type || "standard"]}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "24px 16px 60px" }}>
        {partiesBlock}
        {packageBlock}

        <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", marginBottom: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 03</span>
            <span style={{ fontWeight: 700, color: "#7c3819", fontSize: "14px" }}>계약서 내용 확인</span>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ border: "1px solid #ddd", borderRadius: "4px", maxHeight: "320px", overflowY: "auto", padding: "20px 24px", background: "#fafaf8", fontSize: "12px", lineHeight: "1.9", color: "#444" }}>
              {clausesBlock}
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "14px", padding: "14px 16px", background: "#faf4e6", border: "1px solid #e8d89a", borderRadius: "4px", cursor: "pointer" }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: "2px", accentColor: "#7c3819", width: "16px", height: "16px", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "#7c3819", fontWeight: 500 }}>본인은 위 계약서의 내용을 모두 읽고 충분히 이해하였으며, 본 계약의 모든 조항에 동의합니다.</span>
            </label>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: "6px", border: "1px solid #ddd8cc", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ background: "#f8f6f1", borderBottom: "1px solid #ddd8cc", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#b8952a", border: "1px solid #e8d89a", background: "#faf4e6", padding: "3px 10px", borderRadius: "2px", letterSpacing: "2px" }}>SECTION 04</span>
            <span style={{ fontWeight: 700, color: "#7c3819", fontSize: "14px" }}>서명 및 제출</span>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>갑 · 블루키컨설팅</div>
                <div style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", background: "#f9f8f6", fontSize: "12px" }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}><span style={{ color: "#aaa", width: "48px" }}>대표</span><span>이 은 주</span></div>
                    <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#aaa", width: "48px" }}>사업자</span><span>887-85-02270</span></div>
                  </div>
                  <div style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", borderTop: "1px solid #eee", minHeight: "90px" }}>
                    <DirectorSignature />
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>을 · 학부모 서명란</div>
                <div style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ position: "relative", background: "#fff", touchAction: "none" }}>
                    <canvas ref={canvasRef} width={400} height={110} style={{ display: "block", width: "100%", height: "110px", cursor: "crosshair" }}
                      onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                      onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
                    {!hasSig && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", color: "#ccc" }}>
                        <span style={{ fontSize: "22px", marginBottom: "4px" }}>✍️</span>
                        <span style={{ fontSize: "11px" }}>이곳에 서명해 주세요</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f9f8f6", borderTop: "1px solid #eee" }}>
                    <span style={{ fontSize: "11px", color: "#aaa" }}>{new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} 서명 (한국시간 기준)</span>
                    <button onClick={clearSig} style={{ background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "3px 10px", fontSize: "11px", color: "#888", cursor: "pointer" }}>지우기</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: "1px", background: "linear-gradient(90deg,transparent,#f2d17e,transparent)", opacity: 0.5, marginBottom: "20px" }} />

            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: "100%", background: "#7c3819", color: "#fff", border: "none", borderRadius: "6px", padding: "15px", fontSize: "14px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px", position: "relative", overflow: "hidden" }}>
              <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,#b8952a,#f2d17e,#b8952a)" }} />
              {submitting ? "제출 중..." : "계약서 제출 및 전자 서명 완료"}
            </button>
            <p style={{ textAlign: "center", fontSize: "11px", color: "#bbb", marginTop: "10px" }}>문의: bluekeyprep@gmail.com · 02-548-2228</p>
          </div>
        </div>
      </div>
    </div>
  );
}
