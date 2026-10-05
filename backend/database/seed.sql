-- ============================================================
-- ข้อมูลตัวอย่าง — ตรงกับ Template Layout ที่ออกแบบไว้ (docs/ui-templates)
-- รหัสผ่านทุกบัญชี (plain text ก่อน hash): Passw0rd!
-- bcrypt hash ด้านล่าง generate ด้วย bcrypt.hashSync('Passw0rd!', 10)
-- ============================================================

USE person_system;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
INSERT INTO users (username, password, full_name, email, role, department, is_first_login) VALUES
('hr.somying',   '$2b$10$Il1cp6ZTX/kA85yesl8fauMaPQQoyjrzTK8EY2E9kYQGsLVTfIMdG', 'สมหญิง วิไลพร', 'somying@college.ac.th', 'hr', 'ฝ่ายบุคลากร', 0),
('eval.kan',     '$2b$10$Il1cp6ZTX/kA85yesl8fauMaPQQoyjrzTK8EY2E9kYQGsLVTfIMdG', 'กานต์ ศรีวิเศษ', 'kan@college.ac.th', 'evaluatee', 'แผนกเทคโนโลยีสารสนเทศ', 0),
('eval.piyada',  '$2b$10$Il1cp6ZTX/kA85yesl8fauMaPQQoyjrzTK8EY2E9kYQGsLVTfIMdG', 'ปิยะดา เพชรรัตน์', 'piyada@college.ac.th', 'evaluatee', 'แผนกบัญชี', 0),
('eval.thanakorn','$2b$10$Il1cp6ZTX/kA85yesl8fauMaPQQoyjrzTK8EY2E9kYQGsLVTfIMdG', 'ธนกร ทองสุข', 'thanakorn@college.ac.th', 'evaluatee', 'แผนกช่างยนต์', 1),
('eval.maneerat', '$2b$10$Il1cp6ZTX/kA85yesl8fauMaPQQoyjrzTK8EY2E9kYQGsLVTfIMdG', 'มณีรัตน์ แก้วใส', 'maneerat@college.ac.th', 'evaluatee', 'แผนกคอมพิวเตอร์ธุรกิจ', 0),
('judge.somchai', '$2b$10$Il1cp6ZTX/kA85yesl8fauMaPQQoyjrzTK8EY2E9kYQGsLVTfIMdG', 'สมชาย ใจดี', 'somchai@college.ac.th', 'evaluator', 'ฝ่ายวิชาการ', 0),
('judge.suneeya', '$2b$10$Il1cp6ZTX/kA85yesl8fauMaPQQoyjrzTK8EY2E9kYQGsLVTfIMdG', 'สุนีย์ แสงทอง', 'suneeya@college.ac.th', 'evaluator', 'ฝ่ายวิชาการ', 0);

-- ------------------------------------------------------------
-- evaluation_topics  (created_by = hr.somying -> id 1)
-- ------------------------------------------------------------
INSERT INTO evaluation_topics (name, description, start_date, end_date, status, created_by) VALUES
('ด้านการสอนและการจัดการเรียนรู้', 'ประเมินความสามารถด้านการจัดการเรียนการสอน', '2026-10-01', '2026-10-31', 'open', 1),
('ด้านงานสนับสนุนการสอน', 'ประเมินงานสนับสนุนนอกเหนือจากการสอน', '2026-10-01', '2026-10-31', 'open', 1),
('ด้านการพัฒนาตนเองและวิชาชีพ', 'ประเมินการพัฒนาตนเองและความก้าวหน้าทางวิชาชีพ', '2026-10-01', '2026-10-31', 'draft', 1);

-- ------------------------------------------------------------
-- indicators (topic 1: ด้านการสอนฯ)
-- ------------------------------------------------------------
INSERT INTO indicators (topic_id, name, description, weight, score_type, evidence_types, level1_desc, level2_desc, level3_desc, level4_desc) VALUES
(1, 'การจัดทำแผนการสอนรายวิชา', 'จัดทำแผนการสอนที่ครบถ้วนและสอดคล้องกับหลักสูตร', 15, 'scale_1_4', 'pdf',
  'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก', 'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง',
  'ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง', 'ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง'),
(1, 'เทคนิคการสอนที่หลากหลาย', 'ความสามารถในการใช้เทคนิคการสอนที่หลากหลายเหมาะสมกับเนื้อหาและผู้เรียน', 20, 'scale_1_4', 'image,url',
  'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก', 'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง',
  'ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง', 'ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง'),
(1, 'การวัดและประเมินผู้เรียน', 'ออกแบบและดำเนินการวัดผลที่สอดคล้องกับจุดประสงค์การเรียนรู้', 15, 'scale_1_4', 'pdf',
  'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก', 'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง',
  'ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง', 'ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง'),
(1, 'การใช้สื่อและเทคโนโลยี', 'ใช้สื่อการสอนและเทคโนโลยีได้อย่างเหมาะสม', 10, 'yesno', 'image', NULL, NULL, NULL, NULL);

-- indicators (topic 2: งานสนับสนุนการสอน)
INSERT INTO indicators (topic_id, name, description, weight, score_type, evidence_types) VALUES
(2, 'งานทะเบียนและวัดผล', 'ปฏิบัติงานด้านทะเบียนและวัดผลตามที่ได้รับมอบหมาย', 12, 'yesno', 'pdf'),
(2, 'งานกิจกรรมนักเรียนนักศึกษา', 'มีส่วนร่วมในการจัดกิจกรรมพัฒนาผู้เรียน', 10, 'scale_1_4', 'image,url');

-- ------------------------------------------------------------
-- assignments (topic 1)
-- ------------------------------------------------------------
INSERT INTO assignments (topic_id, evaluator_id, evaluatee_id, committee_role, status, overall_comment) VALUES
(1, 6, 2, 'chair',  'draft',
  'การจัดการเรียนรู้มีความหลากหลายดี ควรเพิ่มหลักฐานเชิงประจักษ์ของผลลัพธ์ผู้เรียนประกอบด้วย โดยรวมมีความตั้งใจปฏิบัติงานตามมาตรฐานที่กำหนด'),
(1, 6, 3, 'chair',  'confirmed', 'ปฏิบัติงานได้ตามมาตรฐานครบถ้วนทุกตัวชี้วัด'),
(1, 6, 4, 'chair',  'not_started', NULL),
(1, 7, 5, 'member', 'confirmed', 'มีความตั้งใจและพัฒนาตนเองอย่างต่อเนื่อง');

-- ------------------------------------------------------------
-- evaluation_details (กานต์ ศรีวิเศษ -> เทคนิคการสอนที่หลากหลาย = indicator 2)
-- ------------------------------------------------------------
INSERT INTO evaluation_details (indicator_id, evaluatee_id, description, evidence_type, evidence_path) VALUES
(2, 2, 'จัดการเรียนรู้แบบ Active Learning ในรายวิชาโครงสร้างข้อมูล ภาคเรียนที่ 2/2569', 'pdf', '/uploads/evidence/plan-2-2569.pdf'),
(2, 2, 'ใช้สื่อวิดีโอประกอบการสอนและเกมฝึกปฏิบัติเพื่อเพิ่มการมีส่วนร่วมของผู้เรียน', 'image', '/uploads/evidence/activity-01.jpg'),
(1, 2, 'จัดทำแผนการสอนรายวิชาโครงสร้างข้อมูลและขั้นตอนวิธี', 'pdf', '/uploads/evidence/syllabus-01.pdf');

-- ------------------------------------------------------------
-- self_scores
-- ------------------------------------------------------------
INSERT INTO self_scores (indicator_id, evaluatee_id, score_value) VALUES
(1, 2, 3),
(2, 2, 4);

-- ------------------------------------------------------------
-- scores (กรรมการ สมชาย ให้คะแนน กานต์ บางส่วน -> assignment id 1)
-- ------------------------------------------------------------
INSERT INTO scores (assignment_id, indicator_id, score_value, is_draft) VALUES
(1, 1, 3, 1),
(1, 2, 4, 1);
