// One-time script: creates (or links) a Supabase Auth login for an
// existing counselor row, so the counselor can log in to the dashboard.
//
// Usage:
//   node --env-file=.env.local scripts/bootstrap-counselor.mjs <email> <password>
//
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local.

import { createClient } from "@supabase/supabase-js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("사용법: node --env-file=.env.local scripts/bootstrap-counselor.mjs <email> <password>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없어요.");
  process.exit(1);
}

if (password.length < 6) {
  console.error("비밀번호는 6자 이상이어야 해요.");
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Find the existing counselor row by email.
  const { data: counselor, error: counselorError } = await supabaseAdmin
    .from("counselors")
    .select("id, name, email, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (counselorError) {
    console.error("카운슬러 조회 실패:", counselorError.message);
    process.exit(1);
  }
  if (!counselor) {
    console.error(`이메일 "${email}"로 등록된 카운슬러가 없어요. 먼저 /settings/counselors 에서 카운슬러를 추가하거나, Supabase에서 counselors 테이블의 email을 확인해주세요.`);
    process.exit(1);
  }

  // 2. Create (or find existing) Supabase Auth user.
  let authUserId;
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "counselor" },
  });

  if (createError || !created.user) {
    const { data: existing, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const match = listError ? undefined : existing.users.find((u) => u.email === email);
    if (!match) {
      console.error("계정 생성 실패:", createError?.message ?? "알 수 없는 오류");
      process.exit(1);
    }
    authUserId = match.id;
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password,
      user_metadata: { role: "counselor" },
    });
    console.log(`이미 존재하는 계정을 찾아서 비밀번호를 재설정했어요. (${email})`);
  } else {
    authUserId = created.user.id;
    console.log(`새 로그인 계정을 만들었어요. (${email})`);
  }

  // 3. Link the Auth user to the counselor row.
  const { error: linkError } = await supabaseAdmin
    .from("counselors")
    .update({ auth_user_id: authUserId })
    .eq("id", counselor.id);

  if (linkError) {
    console.error("연결 실패:", linkError.message);
    process.exit(1);
  }

  console.log(`완료! "${counselor.name}" 카운슬러 계정이 이메일 ${email} 로 로그인할 수 있게 연결됐어요.`);
}

main();
