-- ============================================================
-- ระบบประเมินบุคลากร (Personnel Evaluation System)
-- Database schema — MariaDB
-- ตรงตาม Class Diagram (docs/flowcharts.html ข้อ 2.4) และ
-- RESTful API design (docs/flowcharts.html ข้อ 4.1-4.5)
-- ============================================================

CREATE DATABASE IF NOT EXISTS person_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE person_system;

-- ------------------------------------------------------------
-- users : ผู้ใช้งานทั้ง 3 บทบาท (ฝ่ายบุคลากร / ผู้รับการประเมิน / กรรมการ)
-- ------------------------------------------------------------
CREATE TABLE users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,          -- bcrypt hash
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(150) NULL,
  role            ENUM('hr', 'evaluatee', 'evaluator') NOT NULL,
  department      VARCHAR(150) NULL,
  is_first_login  TINYINT(1)   NOT NULL DEFAULT 1,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- evaluation_topics : หัวข้อการประเมิน (5.1.1, 5.1.2)
-- ------------------------------------------------------------
CREATE TABLE evaluation_topics (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description VARCHAR(500) NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      ENUM('draft', 'open', 'closed') NOT NULL DEFAULT 'draft',
  created_by  INT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_topics_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- indicators : ตัวชี้วัด (5.1.3, 5.1.4)
-- ------------------------------------------------------------
CREATE TABLE indicators (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id        INT UNSIGNED NOT NULL,
  name            VARCHAR(200) NOT NULL,
  description     VARCHAR(500) NULL,
  weight          DECIMAL(5,2) NOT NULL,          -- น้ำหนักคะแนน %
  score_type      ENUM('yesno', 'scale_1_4') NOT NULL DEFAULT 'scale_1_4',
  evidence_types  VARCHAR(100) NULL,              -- comma list: pdf,image,url
  level1_desc     VARCHAR(255) NULL,               -- คำอธิบายระดับ 1-4 (เมื่อ score_type = scale_1_4)
  level2_desc     VARCHAR(255) NULL,
  level3_desc     VARCHAR(255) NULL,
  level4_desc     VARCHAR(255) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_indicators_topic FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id) ON DELETE CASCADE,
  INDEX idx_indicators_topic (topic_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- assignments : การมอบหมายกรรมการ (5.1.8, 5.1.9)
-- ------------------------------------------------------------
CREATE TABLE assignments (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id         INT UNSIGNED NOT NULL,
  evaluator_id     INT UNSIGNED NOT NULL,
  evaluatee_id     INT UNSIGNED NOT NULL,
  committee_role   ENUM('chair', 'member') NOT NULL DEFAULT 'member',
  status           ENUM('not_started', 'draft', 'confirmed') NOT NULL DEFAULT 'not_started',
  overall_comment  TEXT NULL,
  signature_path   VARCHAR(255) NULL,
  submitted_at     DATETIME NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assign_topic     FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_assign_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id),
  CONSTRAINT fk_assign_evaluatee FOREIGN KEY (evaluatee_id) REFERENCES users(id),
  UNIQUE KEY uq_assignment (topic_id, evaluator_id, evaluatee_id),
  INDEX idx_assign_evaluator (evaluator_id),
  INDEX idx_assign_evaluatee (evaluatee_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- evaluation_details : รายละเอียด+หลักฐานที่ผู้รับการประเมินกรอก (5.2.3, 5.2.4)
-- เพิ่มได้หลายรายการต่อหนึ่งตัวชี้วัด
-- ------------------------------------------------------------
CREATE TABLE evaluation_details (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  indicator_id   INT UNSIGNED NOT NULL,
  evaluatee_id   INT UNSIGNED NOT NULL,
  description    TEXT NOT NULL,
  evidence_type  ENUM('pdf', 'image', 'url', 'none') NOT NULL DEFAULT 'none',
  evidence_path  VARCHAR(500) NULL,               -- path ไฟล์ หรือ URL
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_details_indicator FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE,
  CONSTRAINT fk_details_evaluatee FOREIGN KEY (evaluatee_id) REFERENCES users(id),
  INDEX idx_details_lookup (indicator_id, evaluatee_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- self_scores : คะแนนประเมินตนเอง (5.2.5, 5.2.6) — 1 แถวต่อ (indicator, evaluatee)
-- ------------------------------------------------------------
CREATE TABLE self_scores (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  indicator_id  INT UNSIGNED NOT NULL,
  evaluatee_id  INT UNSIGNED NOT NULL,
  score_value   DECIMAL(3,1) NOT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_selfscore_indicator FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE,
  CONSTRAINT fk_selfscore_evaluatee FOREIGN KEY (evaluatee_id) REFERENCES users(id),
  UNIQUE KEY uq_self_score (indicator_id, evaluatee_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- scores : คะแนนที่กรรมการให้ตามตัวชี้วัด (5.3.4, 5.3.6, 5.3.7)
-- ------------------------------------------------------------
CREATE TABLE scores (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assignment_id  INT UNSIGNED NOT NULL,
  indicator_id   INT UNSIGNED NOT NULL,
  score_value    DECIMAL(3,1) NULL,
  comment        VARCHAR(500) NULL,
  is_draft       TINYINT(1) NOT NULL DEFAULT 1,
  scored_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_scores_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_scores_indicator  FOREIGN KEY (indicator_id) REFERENCES indicators(id),
  UNIQUE KEY uq_score (assignment_id, indicator_id)
) ENGINE=InnoDB;
