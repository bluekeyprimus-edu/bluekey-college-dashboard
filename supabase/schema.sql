-- BlueKey College Consulting Dashboard — initial schema
-- Pragmatic MVP schema: TEXT + CHECK constraints instead of custom enum types
-- so values are easy to extend later without ALTER TYPE migrations.
-- RLS is left OFF for now (internal counselor tool, single Supabase project) —
-- matches the pattern used on bluekey-sat's ap_wrong_answer_progress table.

create extension if not exists "pgcrypto";

-- ============================================================
-- Counselors
-- ============================================================
create table if not exists counselors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  auth_user_id uuid unique,
  is_admin boolean not null default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Students — core profile (Section 1)
-- ============================================================
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  english_name text,
  current_grade int check (current_grade between 8 and 12),
  graduation_year int,
  high_school text,
  school_country text,
  school_type text,
  curriculum text check (curriculum in ('AP','IB','A-Level','Korean','Other')),
  citizenship text,
  us_permanent_resident boolean default false,
  intended_major text,
  secondary_major_interest text,
  career_interest text,
  counselor_id uuid references counselors(id) on delete set null,
  -- Two optional, narrower assignments alongside the general counselor
  -- above: an application lead (college list / essays / recommendations)
  -- and an EC coordinator (extracurriculars / awards). Either can be the
  -- same person as counselor_id or someone else entirely; both are
  -- nullable since most students just have the one general counselor.
  application_counselor_id uuid references counselors(id) on delete set null,
  ec_counselor_id uuid references counselors(id) on delete set null,
  status text default 'active' check (status in ('active','inactive','graduated')),
  photo_url text,
  -- Counselor-set free text: "what to do next" for this student, shown on
  -- the main Dashboard's My Students table (Section: Counselor Dashboard).
  next_action text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_students_counselor on students(counselor_id);
create index if not exists idx_students_application_counselor on students(application_counselor_id);
create index if not exists idx_students_ec_counselor on students(ec_counselor_id);

-- Overall progress breakdown (Section 1) — stored per category so counselors
-- can set/override until automatic calculation is wired up later.
create table if not exists student_progress (
  student_id uuid primary key references students(id) on delete cascade,
  academic_profile int default 0 check (academic_profile between 0 and 100),
  testing int default 0 check (testing between 0 and 100),
  extracurricular_activities int default 0 check (extracurricular_activities between 0 and 100),
  awards int default 0 check (awards between 0 and 100),
  college_list int default 0 check (college_list between 0 and 100),
  common_application int default 0 check (common_application between 0 and 100),
  personal_statement int default 0 check (personal_statement between 0 and 100),
  supplemental_essays int default 0 check (supplemental_essays between 0 and 100),
  recommendation_letters int default 0 check (recommendation_letters between 0 and 100),
  school_documents int default 0 check (school_documents between 0 and 100),
  updated_at timestamptz default now()
);

-- ============================================================
-- Academic Profile (Section 2)
-- ============================================================
create table if not exists academic_overview (
  student_id uuid primary key references students(id) on delete cascade,
  unweighted_gpa numeric(4,3),
  weighted_gpa numeric(4,3),
  gpa_scale numeric(3,2) default 4.0,
  class_rank int,
  class_size int,
  percentile numeric(5,2),
  school_does_not_rank boolean default false,
  updated_at timestamptz default now()
);

-- ============================================================
-- Academic Record: Grade -> Term (semester/trimester/quarter) -> Course.
-- GPA is COMPUTED from each course's grade + credit (see src/lib/gpa.ts),
-- never typed in as a bare number — but every computed level (term, grade,
-- cumulative) has a manual override column that wins when set, because
-- schools weight/scale GPA differently and a computed number could
-- disagree with the school's own official transcript GPA. academic_overview
-- (below) still holds class rank/percentile, and its unweighted_gpa /
-- weighted_gpa columns now double as the manual override for the
-- student's CUMULATIVE GPA specifically.
-- ============================================================
create table if not exists grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  grade_level int not null check (grade_level between 9 and 12),
  academic_year text,
  term_system text not null check (term_system in ('2_semesters','3_trimesters','4_quarters','custom')),
  -- Only used when term_system = 'custom'.
  custom_term_count int,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  manual_unweighted_gpa numeric(4,3),
  manual_weighted_gpa numeric(4,3),
  created_at timestamptz default now(),
  unique(student_id, grade_level)
);
create index if not exists idx_grade_records_student on grade_records(student_id);

create table if not exists terms (
  id uuid primary key default gen_random_uuid(),
  grade_record_id uuid references grade_records(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  term_number int not null,
  manual_unweighted_gpa numeric(4,3),
  manual_weighted_gpa numeric(4,3),
  created_at timestamptz default now(),
  unique(grade_record_id, term_number)
);
create index if not exists idx_terms_student on terms(student_id);
create index if not exists idx_terms_grade_record on terms(grade_record_id);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  term_id uuid references terms(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  course_name text not null,
  subject_category text check (subject_category in ('English','Math','Science','Social Studies','Foreign Language','Arts','Computer Science','Other')),
  course_level text not null check (course_level in ('Regular','Honors','Advanced','AP','IB SL','IB HL','A-Level','Dual Enrollment','College Level','Other')),
  credit numeric(4,2) not null default 1,
  grade_scale text not null default 'letter' check (grade_scale in ('letter','100_point','custom')),
  -- Exactly one of these three is populated, matching grade_scale.
  -- 'custom' grades (e.g. Pass/Fail) are shown as-is but excluded from
  -- the GPA calculation entirely.
  letter_grade text,
  point_score numeric(5,2),
  custom_grade text,
  created_at timestamptz default now()
);
create index if not exists idx_courses_term on courses(term_id);
create index if not exists idx_courses_student on courses(student_id);

-- ============================================================
-- Standardized Testing (Section 3)
-- ============================================================
create table if not exists sat_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  -- Which sitting this is (1st, 2nd, ...) — SAT/ACT are commonly retaken,
  -- so this plus test_date is how multiple attempts are told apart.
  attempt_number int,
  test_date date,
  total_score int,
  reading_writing int,
  math int,
  created_at timestamptz default now()
);
create index if not exists idx_sat_student on sat_scores(student_id);

create table if not exists act_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  attempt_number int,
  test_date date,
  composite numeric(3,1),
  english int,
  math int,
  reading int,
  science int,
  created_at timestamptz default now()
);
create index if not exists idx_act_student on act_scores(student_id);

create table if not exists other_test_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  test_type text check (test_type in ('TOEFL','IELTS','Duolingo')),
  test_date date,
  score text,
  created_at timestamptz default now()
);
create index if not exists idx_other_tests_student on other_test_scores(student_id);

create table if not exists ap_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  subject text not null,
  score int check (score between 1 and 5),
  test_date date,
  created_at timestamptz default now()
);
create index if not exists idx_ap_scores_student on ap_scores(student_id);

create table if not exists ib_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  subject text not null,
  level text check (level in ('HL','SL')),
  predicted_score int,
  final_score int,
  updated_at timestamptz default now()
);
create index if not exists idx_ib_scores_student on ib_scores(student_id);

-- ============================================================
-- Extracurricular Activities (Section 4)
-- ============================================================
create table if not exists extracurriculars (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  activity_name text not null,
  category text,
  position_role text,
  grades_participated text,
  start_date date,
  end_date date, -- null/blank end_date means "still ongoing" (displayed as "~현재")
  description text,
  major_relevance text,
  common_app_activity boolean default false,
  status text check (status in ('Developing','Completed','Common App Ready')) default 'Developing',
  -- counselor-only narrative evaluation — must never be exposed on any student/parent-facing view or API response
  counselor_evaluation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_ec_student on extracurriculars(student_id);

-- ============================================================
-- Awards & Honors (Section 5)
-- ============================================================
create table if not exists awards (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  award_name text not null,
  organization text,
  grade_level int,
  award_level text check (award_level in ('School','Regional','State','National','International')),
  placement text,
  num_participants int,
  selectivity text,
  description text,
  academic_area text,
  major_relevance text,
  created_at timestamptz default now()
);
create index if not exists idx_awards_student on awards(student_id);

-- ============================================================
-- College Preferences (Section 6)
-- ============================================================
create table if not exists college_preferences (
  student_id uuid primary key references students(id) on delete cascade,
  intended_major text,
  preferred_locations text[],
  setting text check (setting in ('Urban','Suburban','Rural')),
  size text check (size in ('Small','Medium','Large')),
  public_private text check (public_private in ('Public','Private')),
  weather_preference text,
  campus_environment text,
  research_opportunities boolean default false,
  pre_med boolean default false,
  business boolean default false,
  engineering boolean default false,
  liberal_arts boolean default false,
  financial_aid_importance int check (financial_aid_importance between 1 and 5),
  merit_scholarship_importance int check (merit_scholarship_importance between 1 and 5),
  updated_at timestamptz default now()
);

-- ============================================================
-- College List (Section 7) + Application Tracker (Section 8)
-- ============================================================
create table if not exists college_list (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  category text check (category in ('Reach','Target','Safety')) not null,
  university_name text not null,
  intended_major text,
  application_round text check (application_round in ('ED','ED2','EA','REA','RD')),
  application_deadline date,
  student_preference_level int check (student_preference_level between 1 and 5),
  parent_preference_level int check (parent_preference_level between 1 and 5),
  counselor_recommendation text,
  application_status text default 'Not Started',
  notes text,
  sort_order int default 0,
  -- Whether this school doesn't require SAT/ACT scores (school-level
  -- policy, tracked per list entry since there's no separate universities
  -- table) — shown as a badge on the college card.
  test_optional boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_college_list_student on college_list(student_id);

create table if not exists application_checklist (
  college_list_id uuid primary key references college_list(id) on delete cascade,
  college_added boolean default true,
  major_selected boolean default false,
  common_app_profile boolean default false,
  activities boolean default false,
  honors boolean default false,
  personal_statement boolean default false,
  supplemental_essays boolean default false,
  counselor_recommendation boolean default false,
  teacher_recommendation_1 boolean default false,
  teacher_recommendation_2 boolean default false,
  transcript boolean default false,
  test_scores_submission boolean default false,
  financial_aid boolean default false,
  application_submitted boolean default false,
  updated_at timestamptz default now()
);

-- ============================================================
-- Essay Management (Section 9)
-- ============================================================
create table if not exists personal_statement (
  student_id uuid primary key references students(id) on delete cascade,
  status text check (status in ('Brainstorming','Topic Selected','Outline','First Draft','Revision 1','Revision 2','Final Review','Completed')) default 'Brainstorming',
  topic text,
  draft_link text,
  last_updated timestamptz default now()
);

create table if not exists supplemental_essays (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  college_list_id uuid references college_list(id) on delete set null,
  university_name text,
  prompt text,
  word_limit int,
  status text check (status in ('Brainstorming','Topic Selected','Outline','First Draft','Revision 1','Revision 2','Final Review','Completed')) default 'Brainstorming',
  draft_link text,
  counselor text,
  editor text,
  counselor_comments text,
  last_updated timestamptz default now()
);
create index if not exists idx_supp_essays_student on supplemental_essays(student_id);

-- ============================================================
-- Action Items & Tasks (Section 10)
-- ============================================================
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  task text not null,
  assigned_to text,
  deadline date,
  priority text check (priority in ('High','Medium','Low')) default 'Medium',
  status text check (status in ('Not Started','In Progress','Waiting','Completed')) default 'Not Started',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_tasks_student on tasks(student_id);

-- ============================================================
-- BlueKey Historical Admissions Database (Section 12)
-- ============================================================
create table if not exists historical_admissions (
  id uuid primary key default gen_random_uuid(),
  graduation_year int,
  high_school text,
  gpa numeric(4,3),
  sat_score int,
  act_score numeric(3,1),
  curriculum text,
  intended_major text,
  ec_strength int check (ec_strength between 1 and 5),
  awards_strength int check (awards_strength between 1 and 5),
  application_round text,
  university_name text,
  admission_result text check (admission_result in ('Accepted','Waitlisted','Deferred','Rejected')),
  created_at timestamptz default now()
);
create index if not exists idx_historical_major on historical_admissions(intended_major);
create index if not exists idx_historical_university on historical_admissions(university_name);

-- ============================================================
-- Parent portal accounts (Section: parent login)
-- Links a Supabase Auth user (parent) to one or more students. One auth
-- user can link to multiple students (siblings sharing a parent login).
-- Created/managed by counselors from the student profile page, using the
-- service-role key server-side — parents never sign themselves up.
-- ============================================================
create table if not exists parent_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  student_id uuid not null references students(id) on delete cascade,
  parent_name text,
  email text not null,
  created_at timestamptz default now(),
  unique (auth_user_id, student_id)
);
create index if not exists idx_parent_accounts_student on parent_accounts(student_id);
create index if not exists idx_parent_accounts_auth_user on parent_accounts(auth_user_id);

-- ============================================================
-- Consultation Notes (Section: student/parent meeting logs)
-- Counselors log a summary each time they meet with a student and/or
-- parent (target: 2+ times/month). Visible to the counselor AND, unlike
-- the hidden EC/award ratings, shown on the parent portal too.
-- ============================================================
create table if not exists consultation_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  counselor_id uuid references counselors(id) on delete set null,
  meeting_date date not null default current_date,
  attendees text,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_consultation_notes_student on consultation_notes(student_id, meeting_date desc);

-- ============================================================
-- Attachments (Section: files on activities / awards / essays)
-- Generic polymorphic table: entity_type + entity_id point at whichever
-- extracurriculars / awards / personal_statement / supplemental_essays row
-- the file belongs to. Actual bytes live in Supabase Storage (bucket
-- "attachments", created below); this row is just the pointer + metadata.
-- ============================================================
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  entity_type text not null check (entity_type in ('extracurricular', 'award', 'personal_statement', 'essay', 'transcript')),
  entity_id uuid not null,
  file_name text not null,
  storage_path text not null,
  file_url text not null,
  file_size int,
  uploaded_by uuid references counselors(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_attachments_entity on attachments(entity_type, entity_id);
create index if not exists idx_attachments_student on attachments(student_id);

-- Storage bucket the app uploads into (via the service-role key, so no
-- storage.objects RLS policy is needed — the service role bypasses RLS).
-- Public so the app can just store/use a plain public URL per file rather
-- than generating signed URLs on every render.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- ============================================================
-- Student Finances (Section: admin-only profitability tracking)
-- consulting_fee is what the student/family paid for the whole engagement
-- (often spanning 1-2+ years); student_expenses are itemized costs against
-- it (EC program fees, essay coaching, test prep, etc). Net profit is
-- computed in the app as consulting_fee minus the sum of expenses —
-- nothing here is a running balance, so there's no risk of it drifting.
-- Admin-only everywhere: never surfaced to non-admin counselors or parents.
-- ============================================================
create table if not exists student_finances (
  student_id uuid primary key references students(id) on delete cascade,
  consulting_fee bigint not null default 0 check (consulting_fee >= 0),
  contract_start date,
  contract_end date,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists student_expenses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  category text not null check (category in ('extracurricular', 'essay', 'test_prep', 'other')),
  description text,
  amount bigint not null check (amount >= 0),
  expense_date date default current_date,
  created_at timestamptz default now()
);
create index if not exists idx_student_expenses_student on student_expenses(student_id);

-- ============================================================
-- System Settings (Section: misc key/value state for background jobs)
-- Right now just tracks the school-year label the grade auto-bump last
-- ran for, so a retry (or the admin's manual "지금 실행" button) can't
-- double-bump everyone's grade within the same school year.
-- ============================================================
create table if not exists system_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- ============================================================
-- Seed a couple of counselors + one sample student so the UI has something
-- to render immediately. Safe to delete once real data is entered.
-- ============================================================
insert into counselors (name, email)
values ('Jacob Jeong', 'bluekeyprep@gmail.com')
on conflict (email) do nothing;
