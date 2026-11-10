-- =============================================================================
-- CAMBODIA JOB SEARCH & RECRUITMENT PLATFORM - DATABASE SCHEMA
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. AUTHENTICATION & USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone_number` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `role_id` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_user_role` (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `token` VARCHAR(512) NOT NULL UNIQUE,
    `revoked` BOOLEAN NOT NULL DEFAULT FALSE,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. JOB SEEKER PROFILES & RESUMES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `seeker_profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `headline` VARCHAR(255) NULL,
    `summary` TEXT NULL,
    `date_of_birth` DATE NULL,
    `gender` VARCHAR(20) NULL,
    `province` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `address` VARCHAR(255) NULL,
    `current_salary` DECIMAL(12, 2) NULL,
    `expected_salary` DECIMAL(12, 2) NULL,
    `salary_currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `avatar_url` VARCHAR(500) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_seeker_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `educations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `seeker_id` INT NOT NULL,
    `institution` VARCHAR(255) NOT NULL,
    `degree` VARCHAR(150) NOT NULL,
    `field_of_study` VARCHAR(150) NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `is_current` BOOLEAN NOT NULL DEFAULT FALSE,
    `description` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_educations_seeker` FOREIGN KEY (`seeker_id`) REFERENCES `seeker_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `work_experiences` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `seeker_id` INT NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `job_title` VARCHAR(255) NOT NULL,
    `location` VARCHAR(150) NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `is_current` BOOLEAN NOT NULL DEFAULT FALSE,
    `description` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_work_experiences_seeker` FOREIGN KEY (`seeker_id`) REFERENCES `seeker_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `skills` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `category` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `seeker_skills` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `seeker_id` INT NOT NULL,
    `skill_id` INT NOT NULL,
    `proficiency_level` VARCHAR(50) NOT NULL DEFAULT 'intermediate',
    CONSTRAINT `fk_seeker_skills_seeker` FOREIGN KEY (`seeker_id`) REFERENCES `seeker_profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_seeker_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_seeker_skill` (`seeker_id`, `skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `resumes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `seeker_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_size` INT NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_resumes_seeker` FOREIGN KEY (`seeker_id`) REFERENCES `seeker_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. COMPANIES & RECRUITERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `companies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `logo_url` VARCHAR(500) NULL,
    `banner_url` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `website` VARCHAR(255) NULL,
    `industry` VARCHAR(100) NULL,
    `company_size` VARCHAR(50) NULL,
    `province` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `address` VARCHAR(255) NULL,
    `verification_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `verified_at` TIMESTAMP NULL,
    `created_by` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_companies_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `employer_members` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'recruiter',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_employer_members_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_employer_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_company_user` (`company_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. CATEGORIES, INDUSTRIES & CAMBODIA LOCATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `job_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name_en` VARCHAR(100) NOT NULL,
    `name_km` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `icon` VARCHAR(50) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `industries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name_en` VARCHAR(100) NOT NULL,
    `name_km` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `locations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `province_en` VARCHAR(100) NOT NULL,
    `province_km` VARCHAR(100) NOT NULL,
    `city_en` VARCHAR(100) NULL,
    `city_km` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. JOBS & SKILLS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jobs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL,
    `category_id` INT NULL,
    `title` VARCHAR(255) NOT NULL,
    `title_km` VARCHAR(255) NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NOT NULL,
    `description_km` TEXT NULL,
    `requirements` TEXT NULL,
    `employment_type` VARCHAR(50) NOT NULL DEFAULT 'full_time',
    `workplace_type` VARCHAR(50) NOT NULL DEFAULT 'on_site',
    `experience_level` VARCHAR(50) NOT NULL DEFAULT 'entry',
    `education_level` VARCHAR(100) NULL,
    `province` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NULL,
    `address` VARCHAR(255) NULL,
    `salary_min` DECIMAL(12, 2) NULL,
    `salary_max` DECIMAL(12, 2) NULL,
    `salary_currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `is_salary_negotiable` BOOLEAN NOT NULL DEFAULT FALSE,
    `vacancies_count` INT NOT NULL DEFAULT 1,
    `status` VARCHAR(50) NOT NULL DEFAULT 'published',
    `moderation_status` VARCHAR(50) NOT NULL DEFAULT 'approved',
    `published_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `created_by` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_jobs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_jobs_category` FOREIGN KEY (`category_id`) REFERENCES `job_categories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_jobs_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `job_skills` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `job_id` INT NOT NULL,
    `skill_id` INT NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT `fk_job_skills_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_job_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_job_skill` (`job_id`, `skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. RECRUITMENT: APPLICATIONS, INTERVIEWS, SAVED JOBS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `job_id` INT NOT NULL,
    `seeker_id` INT NOT NULL,
    `resume_id` INT NULL,
    `cover_letter` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'submitted',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_applications_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_applications_seeker` FOREIGN KEY (`seeker_id`) REFERENCES `seeker_profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_applications_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE SET NULL,
    UNIQUE KEY `uk_application_job_seeker` (`job_id`, `seeker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `application_status_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `application_id` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `notes` TEXT NULL,
    `changed_by` INT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_status_history_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_status_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `interviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `application_id` INT NOT NULL,
    `scheduled_at` TIMESTAMP NOT NULL,
    `location_or_link` VARCHAR(500) NULL,
    `interview_type` VARCHAR(50) NOT NULL DEFAULT 'in_person',
    `notes` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    `created_by` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_interviews_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_interviews_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `saved_jobs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `seeker_id` INT NOT NULL,
    `job_id` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_saved_jobs_seeker` FOREIGN KEY (`seeker_id`) REFERENCES `seeker_profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_saved_jobs_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_saved_jobs_seeker_job` (`seeker_id`, `job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. ADMINISTRATION, NOTIFICATIONS, REPORTS, BILLING, AUDIT
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `notification_type` VARCHAR(50) NOT NULL DEFAULT 'system',
    `data` JSON NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reporter_id` INT NOT NULL,
    `target_type` VARCHAR(50) NOT NULL,
    `target_id` INT NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `details` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `resolved_by` INT NULL,
    `resolved_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reports_resolver` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL,
    `plan_name` VARCHAR(50) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `starts_at` TIMESTAMP NOT NULL,
    `ends_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_subscriptions_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL,
    `subscription_id` INT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'aba_payway',
    `transaction_reference` VARCHAR(100) NOT NULL UNIQUE,
    `status` VARCHAR(50) NOT NULL DEFAULT 'completed',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_payments_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_payments_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT NULL,
    `details` JSON NULL,
    `ip_address` VARCHAR(50) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

