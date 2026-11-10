-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Jobs search and filtering performance
CREATE INDEX `idx_jobs_filter_main` ON `jobs` (`status`, `moderation_status`, `province`, `category_id`);
CREATE INDEX `idx_jobs_employment_exp` ON `jobs` (`employment_type`, `experience_level`);
CREATE INDEX `idx_jobs_salary` ON `jobs` (`salary_min`, `salary_max`, `salary_currency`);
CREATE INDEX `idx_jobs_created_at` ON `jobs` (`created_at` DESC);
CREATE INDEX `idx_jobs_company_id` ON `jobs` (`company_id`);

-- Applications & Recruitment
CREATE INDEX `idx_applications_job_id` ON `applications` (`job_id`);
CREATE INDEX `idx_applications_seeker_id` ON `applications` (`seeker_id`);
CREATE INDEX `idx_applications_status` ON `applications` (`status`);
CREATE INDEX `idx_interviews_application` ON `interviews` (`application_id`);

-- User & Seeker Lookups
CREATE INDEX `idx_seeker_profiles_province` ON `seeker_profiles` (`province`);
CREATE INDEX `idx_companies_verification` ON `companies` (`verification_status`);
CREATE INDEX `idx_saved_jobs_seeker` ON `saved_jobs` (`seeker_id`);
CREATE INDEX `idx_notifications_user_read` ON `notifications` (`user_id`, `is_read`);

-- Audit and Reports
CREATE INDEX `idx_audit_logs_entity` ON `audit_logs` (`entity_type`, `entity_id`);
CREATE INDEX `idx_audit_logs_created` ON `audit_logs` (`created_at` DESC);
CREATE INDEX `idx_reports_status` ON `reports` (`status`);
