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
  status text default 'active' check (status in ('active','inactive','graduated')),
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_students_counselor on students(counselor_id);

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
  financial_aid int default 0 check (financial_aid between 0 and 100),
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

create table if not exists gpa_by_grade (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  grade_level int check (grade_level between 9 and 12),
  subject text check (subject in ('english','math','science','social_studies','foreign_language','other','overall')),
  gpa numeric(4,3),
  notes text,
  unique(student_id, grade_level, subject)
);
create index if not exists idx_gpa_by_grade_student on gpa_by_grade(student_id);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  course_name text not null,
  grade_level int check (grade_level between 9 and 12),
  academic_year text,
  course_level text check (course_level in ('Regular','Honors','AP','IB HL','IB SL','A-Level','Dual Enrollment','College Level')),
  subject_area text check (subject_area in ('STEM','Humanities','Other')),
  created_at timestamptz default now()
);
create index if not exists idx_courses_student on courses(student_id);

-- ============================================================
-- Standardized Testing (Section 3)
-- ============================================================
create table if not exists sat_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
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
  organization text,
  position_role text,
  grades_participated text,
  start_date date,
  end_date date,
  hours_per_week numeric(4,1),
  weeks_per_year numeric(4,1),
  description text,
  achievements text,
  quantifiable_impact text,
  leadership text,
  major_relevance text,
  common_app_activity boolean default false,
  status text check (status in ('Idea','Planning','Started','Developing','Impact Created','Completed','Common App Ready')) default 'Idea',
  -- counselor-only ratings — must never be exposed on any student/parent-facing view or API response
  rating_strength int check (rating_strength between 1 and 5),
  rating_leadership int check (rating_leadership between 1 and 5),
  rating_impact int check (rating_impact between 1 and 5),
  rating_uniqueness int check (rating_uniqueness between 1 and 5),
  rating_major_relevance int check (rating_major_relevance between 1 and 5),
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
  category text check (category in ('Reach','High Target','Target','Likely','Safety')) not null,
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
-- Seed a couple of counselors + one sample student so the UI has something
-- to render immediately. Safe to delete once real data is entered.
-- ============================================================
insert into counselors (name, email)
values ('Jacob Chung', 'bluekeyprep@gmail.com')
on conflict (email) do nothing;
