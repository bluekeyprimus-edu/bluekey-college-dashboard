import nodemailer from "nodemailer";
import { CONTRACT_TITLE_LABEL } from "@/lib/labels";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bluekeyprep@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const {
      contractType,
      studentName,
      studentGrade,
      parentName,
      parentPhone,
      amount,
      startDate,
      endDate,
      signedAt,
    } = await request.json();

    const isInstructor = contractType === "instructor";
    const pkgLabel = CONTRACT_TITLE_LABEL[contractType] ?? contractType;

    const rowsHtml = isInstructor
      ? `
              <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;width:80px;">강사</td><td style="padding:8px 0;font-weight:600;">${studentName}</td></tr>
              <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">강사료</td><td style="padding:8px 0;font-weight:600;color:#0a1628;">${amount || "—"}</td></tr>
              <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">계약기간</td><td style="padding:8px 0;">${startDate || "—"} ~ ${endDate || "—"}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">서명일시</td><td style="padding:8px 0;">${new Date(signedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} <span style="color:#aaa;font-size:11px;">(한국시간 기준)</span></td></tr>
    `
      : `
              <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;width:80px;">학생</td><td style="padding:8px 0;font-weight:600;">${studentName} (${studentGrade || "—"})</td></tr>
              <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">학부모</td><td style="padding:8px 0;">${parentName || "—"} · ${parentPhone || "—"}</td></tr>
              <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">패키지</td><td style="padding:8px 0;font-weight:600;color:#0a1628;">${pkgLabel}</td></tr>
              <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">기간</td><td style="padding:8px 0;">${startDate || "—"} ~ ${endDate || "—"}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">서명일시</td><td style="padding:8px 0;">${new Date(signedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} <span style="color:#aaa;font-size:11px;">(한국시간 기준)</span></td></tr>
    `;

    await transporter.sendMail({
      from: '"블루키컨설팅" <bluekeyprep@gmail.com>',
      to: "bluekeyprep@gmail.com",
      subject: isInstructor
        ? `[블루키프렙] ${studentName} 강사 계약서 서명 완료`
        : `[블루키컨설팅] ${studentName} 학생 계약서 서명 완료`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f4ee;border-radius:12px;">
          <div style="background:#0e1b3d;border-radius:8px;padding:20px;text-align:center;margin-bottom:20px;">
            <div style="color:#d4af5a;font-size:20px;font-family:'Times New Roman',serif;">Bluekey Consulting</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:6px;">계약서 서명 완료 알림</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e0d9cf;">
            <div style="font-size:16px;font-weight:700;color:#0a1628;margin-bottom:16px;">✅ 새 계약서가 서명되었습니다</div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              ${rowsHtml}
            </table>
          </div>
          <p style="text-align:center;font-size:11px;color:#aaa;margin-top:16px;">블루키컨설팅 관리 시스템</p>
        </div>
      `,
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
