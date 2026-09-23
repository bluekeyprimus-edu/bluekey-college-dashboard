-- Sample data so the dashboard has something to show right away.
-- Safe to delete later: `truncate students cascade;`

insert into counselors (id, name, email) values
  ('11111111-1111-1111-1111-111111111111', 'Jacob Chung', 'bluekeyprep@gmail.com'),
  ('11111111-1111-1111-1111-111111111112', 'Grace Lim', 'grace@bluekeyprep.com'),
  ('11111111-1111-1111-1111-111111111113', 'David Park', 'david@bluekeyprep.com')
on conflict (email) do nothing;

insert into students (id, student_name, english_name, current_grade, graduation_year, high_school, school_country, school_type, curriculum, citizenship, us_permanent_resident, intended_major, secondary_major_interest, career_interest, counselor_id) values
  ('22222222-2222-2222-2222-222222222221', '정서연', 'Sarah Jung', 12, 2027, 'Seoul International School', 'South Korea', 'International', 'AP', 'South Korea', false, 'Computer Science', 'Economics', 'Product Management', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', '김민준', 'Ethan Kim', 11, 2028, 'Korea International School', 'South Korea', 'International', 'IB', 'South Korea', true, 'Biology', 'Public Health', 'Medicine', '11111111-1111-1111-1111-111111111112'),
  ('22222222-2222-2222-2222-222222222223', '이하은', 'Hannah Lee', 12, 2027, 'Daewon Foreign Language High School', 'South Korea', 'Public — Foreign Language', 'AP', 'South Korea', false, 'International Relations', 'Political Science', 'Diplomacy / Law', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222224', '박지훈', 'Jason Park', 10, 2029, 'Chadwick International', 'South Korea', 'International', 'IB', 'United States', true, 'Mechanical Engineering', 'Physics', 'Robotics', '11111111-1111-1111-1111-111111111113'),
  ('22222222-2222-2222-2222-222222222225', '최유나', 'Yuna Choi', 9, 2030, 'Bundang International School', 'South Korea', 'International', 'AP', 'South Korea', false, 'Undecided', null, null, '11111111-1111-1111-1111-111111111112')
on conflict (id) do nothing;

insert into student_progress (student_id, academic_profile, testing, extracurricular_activities, awards, college_list, common_application, personal_statement, supplemental_essays, recommendation_letters, school_documents, financial_aid) values
  ('22222222-2222-2222-2222-222222222221', 95, 90, 80, 70, 85, 60, 55, 30, 50, 40, 20),
  ('22222222-2222-2222-2222-222222222222', 85, 60, 70, 40, 30, 10, 5, 0, 20, 10, 0),
  ('22222222-2222-2222-2222-222222222223', 90, 85, 90, 85, 95, 90, 100, 75, 80, 70, 50),
  ('22222222-2222-2222-2222-222222222224', 65, 30, 55, 20, 10, 0, 0, 0, 0, 10, 0),
  ('22222222-2222-2222-2222-222222222225', 40, 0, 25, 0, 0, 0, 0, 0, 0, 0, 0)
on conflict (student_id) do nothing;

insert into academic_overview (student_id, unweighted_gpa, weighted_gpa, gpa_scale, class_rank, class_size, percentile, school_does_not_rank) values
  ('22222222-2222-2222-2222-222222222221', 3.92, 4.45, 4.0, 4, 210, 98.1, false),
  ('22222222-2222-2222-2222-222222222222', 3.78, 4.10, 4.0, null, null, null, true),
  ('22222222-2222-2222-2222-222222222223', 3.97, 4.52, 4.0, 1, 320, 99.7, false),
  ('22222222-2222-2222-2222-222222222224', 3.55, 3.90, 4.0, null, null, null, true),
  ('22222222-2222-2222-2222-222222222225', 3.85, 3.85, 4.0, null, null, null, true)
on conflict (student_id) do nothing;

insert into gpa_by_grade (student_id, grade_level, subject, gpa, notes) values
  ('22222222-2222-2222-2222-222222222221', 9, 'overall', 3.80, null),
  ('22222222-2222-2222-2222-222222222221', 10, 'overall', 3.90, null),
  ('22222222-2222-2222-2222-222222222221', 11, 'overall', 3.97, null),
  ('22222222-2222-2222-2222-222222222221', 12, 'overall', 4.00, 'First semester')
on conflict (student_id, grade_level, subject) do nothing;

insert into courses (student_id, course_name, grade_level, academic_year, course_level, subject_area) values
  ('22222222-2222-2222-2222-222222222221', 'AP Calculus BC', 11, '2025-2026', 'AP', 'STEM'),
  ('22222222-2222-2222-2222-222222222221', 'AP Computer Science A', 11, '2025-2026', 'AP', 'STEM'),
  ('22222222-2222-2222-2222-222222222221', 'AP English Literature', 12, '2026-2027', 'AP', 'Humanities');

insert into sat_scores (student_id, test_date, total_score, reading_writing, math) values
  ('22222222-2222-2222-2222-222222222221', '2025-11-01', 1540, 760, 780),
  ('22222222-2222-2222-2222-222222222221', '2025-08-01', 1490, 720, 770);

insert into ap_scores (student_id, subject, score, test_date) values
  ('22222222-2222-2222-2222-222222222221', 'Calculus BC', 5, '2026-05-01'),
  ('22222222-2222-2222-2222-222222222221', 'Computer Science A', 5, '2026-05-01');

insert into extracurriculars (student_id, activity_name, category, organization, position_role, grades_participated, hours_per_week, weeks_per_year, description, achievements, quantifiable_impact, leadership, major_relevance, common_app_activity, status, rating_strength, rating_leadership, rating_impact, rating_uniqueness, rating_major_relevance) values
  ('22222222-2222-2222-2222-222222222221', 'Robotics Club', 'STEM / Technology', 'Seoul International School', 'Team Captain', '10, 11, 12', 8, 30, 'Led a 12-person FRC robotics team; designed the autonomous navigation module.', 'Regional finalist, 2026 FRC Korea Regional', 'Grew club membership from 8 to 24 students over two years', 'Team Captain, recruited and trained underclassmen', 'Directly relevant to Computer Science', true, 'Impact Created', 5, 5, 4, 3, 5),
  ('22222222-2222-2222-2222-222222222221', 'Model United Nations', 'Leadership / Debate', 'Seoul International School', 'Delegate, then Secretary-General', '9, 10, 11', 4, 25, 'Represented four countries across three years of conferences.', 'Best Delegate, SEOMUN 2025', null, 'Secretary-General of school MUN chapter', 'Supports Economics interest', true, 'Common App Ready', 4, 4, 3, 3, 3);

insert into awards (student_id, award_name, organization, grade_level, award_level, placement, num_participants, selectivity, academic_area, major_relevance) values
  ('22222222-2222-2222-2222-222222222221', 'USA Computing Olympiad — Gold Division', 'USACO', 11, 'International', 'Top 5%', 8000, 'Highly selective', 'Computer Science', 'Directly relevant');

insert into college_list (id, student_id, category, university_name, intended_major, application_round, application_deadline, student_preference_level, parent_preference_level, counselor_recommendation, application_status, notes) values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 'Reach', 'Cornell University', 'Computer Science', 'ED', '2026-11-01', 5, 5, 'Strong reach — apply ED for admissions boost', 'In Progress', 'Engineering supplement needs another revision pass.'),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222221', 'High Target', 'University of Michigan', 'Computer Science', 'EA', '2026-11-01', 4, 4, 'Strong EA option', 'Not Started', null),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222221', 'Target', 'University of Wisconsin—Madison', 'Computer Science', 'RD', '2027-01-15', 3, 3, null, 'Not Started', null),
  ('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222221', 'Safety', 'Purdue University', 'Computer Science', 'RD', '2027-01-15', 3, 4, 'Solid safety with strong CS program', 'Not Started', null);

insert into application_checklist (college_list_id, college_added, major_selected, common_app_profile, activities, honors, personal_statement, supplemental_essays, counselor_recommendation, teacher_recommendation_1, teacher_recommendation_2, transcript, test_scores_submission, financial_aid, application_submitted) values
  ('33333333-3333-3333-3333-333333333331', true, true, true, true, true, true, false, true, true, false, true, true, false, false);

insert into tasks (student_id, task, assigned_to, deadline, priority, status, notes) values
  ('22222222-2222-2222-2222-222222222221', 'Finalize Cornell engineering supplement', 'Sarah', '2026-10-10', 'High', 'In Progress', null),
  ('22222222-2222-2222-2222-222222222221', 'Request teacher recommendation #2', 'Jacob Chung', '2026-10-05', 'High', 'Not Started', 'Ask AP CS teacher'),
  ('22222222-2222-2222-2222-222222222222', 'Book SAT retake', 'Ethan', '2026-12-01', 'Medium', 'Not Started', null),
  ('22222222-2222-2222-2222-222222222224', 'Draft initial college list', 'David Park', '2026-10-20', 'Medium', 'Waiting', null);
