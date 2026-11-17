-- =============================================================================
-- CAMBODIA RECRUITMENT PLATFORM - INITIAL SEED DATA
-- =============================================================================

-- 1. Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'job_seeker', 'Individual looking for career opportunities in Cambodia'),
(2, 'employer', 'Recruiter or company representative hiring talent'),
(3, 'admin', 'Platform administrator with moderation and verification privileges')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 2. Cambodian Provinces & Municipalities (25 administrative regions)
INSERT INTO `locations` (`id`, `province_en`, `province_km`, `city_en`, `city_km`) VALUES
(1, 'Phnom Penh', 'រាជធានីភ្នំពេញ', 'Khan Doun Penh', 'ខណ្ឌដូនពេញ'),
(2, 'Phnom Penh', 'រាជធានីភ្នំពេញ', 'Khan Chamkar Mon', 'ខណ្ឌចំការមន'),
(3, 'Phnom Penh', 'រាជធានីភ្នំពេញ', 'Khan Tuol Kouk', 'ខណ្ឌទួលគោក'),
(4, 'Phnom Penh', 'រាជធានីភ្នំពេញ', 'Khan Boeng Keng Kang', 'ខណ្ឌបឹងកេងកង'),
(5, 'Siem Reap', 'សៀមរាប', 'Krong Siem Reap', 'ក្រុងសៀមរាប'),
(6, 'Battambang', 'បាត់ដំបង', 'Krong Battambang', 'ក្រុងបាត់ដំបង'),
(7, 'Preah Sihanouk', 'ព្រះសីហនុ', 'Krong Preah Sihanouk', 'ក្រុងព្រះសីហនុ'),
(8, 'Kampong Cham', 'កំពង់ចាម', 'Krong Kampong Cham', 'ក្រុងកំពង់ចាម'),
(9, 'Kandal', 'កណ្តាល', 'Krong Ta Khmau', 'ក្រុងតាខ្មៅ'),
(10, 'Kampot', 'កំពត', 'Krong Kampot', 'ក្រុងកំពត'),
(11, 'Koh Kong', 'កោះកុង', 'Krong Khemara Phoumin', 'ក្រុងខេមរភូមិន្ទ'),
(12, 'Banteay Meanchey', 'បន្ទាយមានជ័យ', 'Krong Serei Saophoan', 'ក្រុងសិរីសោភ័ណ'),
(13, 'Banteay Meanchey', 'បន្ទាយមានជ័យ', 'Krong Poipet', 'ក្រុងប៉ោយប៉ែត'),
(14, 'Kampong Chhnang', 'កំពង់ឆ្នាំង', 'Krong Kampong Chhnang', 'ក្រុងកំពង់ឆ្នាំង'),
(15, 'Kampong Speu', 'កំពង់ស្ពឺ', 'Krong Chbar Mon', 'ក្រុងច្បារមន'),
(16, 'Kampong Thom', 'កំពង់ធំ', 'Krong Stueng Saen', 'ក្រុងស្ទឹងសែន'),
(17, 'Kep', 'កែប', 'Krong Kep', 'ក្រុងកែប'),
(18, 'Kratie', 'ក្រចេះ', 'Krong Kratie', 'ក្រុងក្រចេះ'),
(19, 'Mondulkiri', 'មណ្ឌលគិរី', 'Krong Senmonorom', 'ក្រុងសែនមនោរម្យ'),
(20, 'Oddar Meanchey', 'ឧត្តរមានជ័យ', 'Krong Samraong', 'ក្រុងសំរោង'),
(21, 'Pailin', 'ប៉ៃលិន', 'Krong Pailin', 'ក្រុងប៉ៃលិន'),
(22, 'Preah Vihear', 'ព្រះវិហារ', 'Krong Preah Vihear', 'ក្រុងព្រះវិហារ'),
(23, 'Prey Veng', 'ព្រៃវែង', 'Krong Prey Veng', 'ក្រុងព្រៃវែង'),
(24, 'Pursat', 'ពោធិ៍សាត់', 'Krong Pursat', 'ក្រុងពោធិ៍សាត់'),
(25, 'Ratanakiri', 'រតនគិរី', 'Krong Banlung', 'ក្រុងបានលុង'),
(26, 'Stung Treng', 'ស្ទឹងត្រែង', 'Krong Stung Treng', 'ក្រុងស្ទឹងត្រែង'),
(27, 'Svay Rieng', 'ស្វាយរៀង', 'Krong Svay Rieng', 'ក្រុងស្វាយរៀង'),
(28, 'Svay Rieng', 'ស្វាយរៀង', 'Krong Bavet', 'ក្រុងបាវិត'),
(29, 'Takeo', 'តាកែវ', 'Krong Doun Kaev', 'ក្រុងដូនកែវ'),
(30, 'Tboung Khmum', 'ត្បូងឃ្មុំ', 'Krong Suong', 'ក្រុងសួង')
ON DUPLICATE KEY UPDATE `province_km` = VALUES(`province_km`);

-- 3. Job Categories (English & Khmer)
INSERT INTO `job_categories` (`id`, `name_en`, `name_km`, `slug`, `icon`) VALUES
(1, 'Information Technology & Software', 'បច្ចេកវិទ្យាព័ត៌មាន និងកម្មវិធី', 'it-software', 'Code2'),
(2, 'Banking & Financial Services', 'ធនាគារ និងសេវាហិរញ្ញវត្ថុ', 'banking-finance', 'Building2'),
(3, 'Sales, Retail & Business Development', 'ការលក់ ការលក់រាយ និងអភិវឌ្ឍន៍អាជីវកម្ម', 'sales-marketing', 'TrendingUp'),
(4, 'Accounting & Auditing', 'គណនេយ្យ និងសវនកម្ម', 'accounting-auditing', 'Calculator'),
(5, 'Human Resources & Recruitment', 'ធនធានមនុស្ស និងជ្រើសរើសបុគ្គលិក', 'hr-recruitment', 'Users'),
(6, 'Engineering & Architecture', 'វិស្វកម្ម និងស្ថាបត្យកម្ម', 'engineering-architecture', 'Compass'),
(7, 'Education, Teaching & Training', 'ការអប់រំ ការបង្រៀន និងបណ្តុះបណ្តាល', 'education-training', 'GraduationCap'),
(8, 'Hospitality, Tourism & Catering', 'បដិសណ្ឋារកិច្ច ទេសចរណ៍ និងម្ហូបអាហារ', 'hospitality-tourism', 'Utensils'),
(9, 'Customer Support & Call Center', 'សេវាកម្មអតិថិជន និងមជ្ឈមណ្ឌលហៅចូល', 'customer-support', 'Headphones'),
(10, 'Graphic Design & Creative Media', 'រចនាក្រាហ្វិក និងប្រព័ន្ធផ្សព្វផ្សាយច្នៃប្រឌិត', 'design-media', 'Palette'),
(11, 'Healthcare, Nursing & Pharmacy', 'ការថែទាំសុខភាព គិលានុបដ្ឋាយិកា និងឱសថស្ថាន', 'healthcare-pharma', 'HeartPulse'),
(12, 'Logistics, Warehouse & Supply Chain', 'ភស្តុភារកម្ម ឃ្លាំង និងខ្សែច្រវាក់ផ្គត់ផ្គង់', 'logistics-supply', 'Truck')
ON DUPLICATE KEY UPDATE `name_km` = VALUES(`name_km`);

-- 4. Industries
INSERT INTO `industries` (`id`, `name_en`, `name_km`, `slug`) VALUES
(1, 'Fintech & Microfinance', 'បច្ចេកវិទ្យាហិរញ្ញវត្ថុ និងមីក្រូហិរញ្ញវត្ថុ', 'fintech-microfinance'),
(2, 'Commercial Banking', 'ធនាគារពាណិជ្ជកម្ម', 'commercial-banking'),
(3, 'Telecommunications & Internet', 'ទូរគមនាគមន៍ និងអ៊ីនធឺណិត', 'telecom-internet'),
(4, 'E-Commerce & Digital Services', 'ពាណិជ្ជកម្មអេឡិចត្រូនិច និងសេវាឌីជីថល', 'e-commerce'),
(5, 'Hospitality, Hotels & Resorts', 'បដិសណ្ឋារកិច្ច សណ្ឋាគារ និងរមណីយដ្ឋាន', 'hospitality-hotels'),
(6, 'Real Estate & Property Development', 'អចលនទ្រព្យ និងការអភិវឌ្ឍន៍ដីធ្លី', 'real-estate'),
(7, 'Manufacturing & Apparel', 'កម្មន្តសាល និងកាត់ដេរ', 'manufacturing-apparel'),
(8, 'Healthcare & Medical Centers', 'ការថែទាំសុខភាព និងមជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ', 'healthcare')
ON DUPLICATE KEY UPDATE `name_km` = VALUES(`name_km`);

-- 5. Standard Skills
INSERT INTO `skills` (`id`, `name`, `category`) VALUES
(1, 'React.js', 'Frontend Development'),
(2, 'TypeScript', 'Software Development'),
(3, 'Python', 'Backend Development'),
(4, 'Django', 'Backend Development'),
(5, 'MySQL', 'Databases'),
(6, 'Node.js', 'Backend Development'),
(7, 'Flutter', 'Mobile Development'),
(8, 'Khmer Language (Fluent)', 'Languages'),
(9, 'English Language (Professional)', 'Languages'),
(10, 'Financial Modeling', 'Finance'),
(11, 'Taxation & Cambodia Law', 'Accounting'),
(12, 'QuickBooks', 'Accounting'),
(13, 'Customer Relationship Management', 'Customer Service'),
(14, 'Digital Marketing & SEO', 'Marketing'),
(15, 'Graphic Design (Photoshop / Illustrator)', 'Design'),
(16, 'UI/UX Design (Figma)', 'Design'),
(17, 'Git & Version Control', 'DevOps'),
(18, 'Docker & Cloud Deployment', 'DevOps'),
(19, 'B2B Sales Negotiation', 'Sales'),
(20, 'Human Resources Management', 'Management')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 6. Demo Users (Password: Password123!)
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `phone_number`, `is_active`) VALUES
(1, 'admin@cambodiajobs.kh', 'pbkdf2_sha256$1000000$vvaTIUAKOzvFuVRYBsleRy$XjS+rIAzJYp1AYzbYfI75ou+nz7rv87ubobW7TXpmxY=', 'Serey Vathanak (Admin)', '+855 12 888 999', TRUE),
(2, 'recruiter@smart.com.kh', 'pbkdf2_sha256$1000000$vvaTIUAKOzvFuVRYBsleRy$XjS+rIAzJYp1AYzbYfI75ou+nz7rv87ubobW7TXpmxY=', 'Dara Chan', '+855 10 999 888', TRUE),
(3, 'careers@aba.com.kh', 'pbkdf2_sha256$1000000$vvaTIUAKOzvFuVRYBsleRy$XjS+rIAzJYp1AYzbYfI75ou+nz7rv87ubobW7TXpmxY=', 'Bopha Pich', '+855 12 777 666', TRUE),
(4, 'sokha.meas@gmail.com', 'pbkdf2_sha256$1000000$vvaTIUAKOzvFuVRYBsleRy$XjS+rIAzJYp1AYzbYfI75ou+nz7rv87ubobW7TXpmxY=', 'Sokha Meas', '+855 98 123 456', TRUE),
(5, 'channary.voeun@gmail.com', 'pbkdf2_sha256$1000000$vvaTIUAKOzvFuVRYBsleRy$XjS+rIAzJYp1AYzbYfI75ou+nz7rv87ubobW7TXpmxY=', 'Channary Voeun', '+855 77 654 321', TRUE)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- User Roles
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 3), -- admin
(2, 2), -- employer (Smart)
(3, 2), -- employer (ABA)
(4, 1), -- job seeker (Sokha)
(5, 1)  -- job seeker (Channary)
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- 7. Demo Companies
INSERT INTO `companies` (`id`, `name`, `slug`, `logo_url`, `banner_url`, `description`, `website`, `industry`, `company_size`, `province`, `city`, `address`, `verification_status`, `verified_at`, `created_by`) VALUES
(1, 'Smart Axiata Co., Ltd.', 'smart-axiata', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=160&h=160&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=300&fit=crop', 'Smart Axiata Co., Ltd., Cambodia leading telecommunications operator, currently serves 8 million subscribers under the Smart brand. Smart Axiata is at the forefront of mobile technology advancement in Cambodia.', 'https://www.smart.com.kh', 'Telecommunications & Internet', '500-1000', 'Phnom Penh', 'Khan Doun Penh', 'No. 464A, Monivong Blvd, Sangkat Tonle Bassac', 'verified', NOW(), 2),
(2, 'ABA Bank (Advanced Bank of Asia)', 'aba-bank', 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=160&h=160&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=300&fit=crop', 'ABA Bank is Cambodia largest commercial bank by assets, deposits, and loans. We offer a full spectrum of advanced financial services to individuals and businesses across the Kingdom.', 'https://www.ababank.com', 'Commercial Banking', '1000+', 'Phnom Penh', 'Khan Chamkar Mon', 'No. 148, Preah Sihanouk Blvd, Phnom Penh', 'verified', NOW(), 3),
(3, 'Wing Bank (Cambodia) Plc.', 'wing-bank', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=160&h=160&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=300&fit=crop', 'Wing Bank is a leading digital banking ecosystem in Cambodia, driven by the vision to provide financial inclusion to every Cambodian through accessible fintech innovations.', 'https://www.wingmoney.com', 'Fintech & Microfinance', '1000+', 'Phnom Penh', 'Khan Tuol Kouk', 'No. 721, Preah Monivong Blvd, Phnom Penh', 'verified', NOW(), 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Employer Members
INSERT INTO `employer_members` (`company_id`, `user_id`, `role`) VALUES
(1, 2, 'owner'),
(2, 3, 'owner')
ON DUPLICATE KEY UPDATE `role` = VALUES(`role`);

-- 8. Demo Jobs
INSERT INTO `jobs` (`id`, `company_id`, `category_id`, `title`, `title_km`, `slug`, `description`, `description_km`, `requirements`, `employment_type`, `workplace_type`, `experience_level`, `education_level`, `province`, `city`, `address`, `salary_min`, `salary_max`, `salary_currency`, `is_salary_negotiable`, `vacancies_count`, `status`, `moderation_status`, `published_at`, `created_by`) VALUES
(1, 1, 1, 'Senior Full-Stack Engineer (React & Python)', 'វិស្វករ Full-Stack ជាន់ខ្ពស់ (React & Python)', 'senior-full-stack-engineer-react-python',
'We are looking for an experienced Senior Full-Stack Engineer to architect, build, and scale digital products for millions of subscribers in Cambodia. You will collaborate with cross-functional teams in Phnom Penh to deliver resilient web applications and microservices.',
'យើងកំពុងស្វែងរកវិស្វករ Full-Stack ជាន់ខ្ពស់ដែលមានបទពិសោធន៍ដើម្បីរចនា កសាង និងអភិវឌ្ឍផលិតផលឌីជីថលសម្រាប់អតិថិជនរាប់លាននាក់នៅក្នុងប្រទេសកម្ពុជា។',
'- 4+ years of professional experience with React.js and Python (Django/FastAPI)\n- Proficient in MySQL and database optimization\n- Strong understanding of RESTful APIs, JWT authentication, and Docker\n- Fluency in Khmer and English',
'full_time', 'hybrid', 'senior', 'Bachelor Degree in Computer Science', 'Phnom Penh', 'Khan Doun Penh', 'Smart Axiata HQ, Monivong Blvd', 1800.00, 3000.00, 'USD', FALSE, 2, 'published', 'approved', NOW(), 2),

(2, 2, 1, 'Mobile Application Developer (Flutter / iOS / Android)', 'អ្នកអភិវឌ្ឍន៍កម្មវិធីទូរស័ព្ទ (Flutter / iOS / Android)', 'mobile-application-developer-flutter',
'Join ABA Bank award-winning Mobile Banking development team! As a Mobile Developer, you will create high-performance, secure, and user-friendly mobile banking features for our millions of active monthly users.',
'ចូលរួមជាមួយក្រុមអភិវឌ្ឍន៍កម្មវិធីទូរស័ព្ទរបស់ធនាគារ ABA! ក្នុងនាមជាអ្នកបង្កើតកម្មវិធីទូរស័ព្ទ អ្នកនឹងបង្កើតមុខងារធនាគារដែលមានសុវត្ថិភាព និងល្បឿនលឿនសម្រាប់អតិថិជនប្រើប្រាស់រាប់លាននាក់។',
'- 3+ years of native or Flutter mobile development\n- Deep understanding of state management, mobile security, and encryption\n- Experience integrating with core banking APIs\n- Bachelor in IT or Software Engineering',
'full_time', 'on_site', 'mid', 'Bachelor Degree in Information Technology', 'Phnom Penh', 'Khan Chamkar Mon', 'ABA Head Office, Sihanouk Blvd', 1400.00, 2400.00, 'USD', TRUE, 3, 'published', 'approved', NOW(), 3),

(3, 2, 2, 'Branch Relationship Officer', 'មន្ត្រីទំនាក់ទំនងអតិថិជនសាខា', 'branch-relationship-officer-siem-reap',
'Deliver exceptional financial advisory and customer onboarding services to retail and corporate clients at our premier Siem Reap branch.',
'ផ្តល់សេវាកម្មប្រឹក្សាហិរញ្ញវត្ថុ និងទទួលស្វាគមន៍អតិថិជនដ៏ល្អឥតខ្ចោះនៅសាខាសៀមរាប។',
'- Bachelor degree in Banking, Finance, or Management\n- Excellent communication skills in Khmer and English\n- Customer-centric attitude, high integrity and attention to detail\n- Fresh graduates are warmly encouraged to apply!',
'full_time', 'on_site', 'fresh_graduate', 'Bachelor Degree in Banking/Finance/Business', 'Siem Reap', 'Krong Siem Reap', 'ABA Bank Siem Reap Central Branch', 2000000.00, 3500000.00, 'KHR', FALSE, 4, 'published', 'approved', NOW(), 3),

(4, 1, 3, 'Digital Marketing & Content Specialist', 'អ្នកឯកទេសទីផ្សារឌីជីថល និងមាតិកា', 'digital-marketing-content-specialist',
'Lead creative campaigns across TikTok, Facebook, Instagram, and digital channels to connect Cambodians with high-speed internet and digital lifestyle offerings.',
'ដឹកនាំយុទ្ធនាការច្នៃប្រឌិតនៅលើបណ្តាញសង្គម TikTok, Facebook, Instagram ដើម្បីភ្ជាប់ប្រជាជនកម្ពុជាជាមួយសេវាកម្មអ៊ីនធឺណិត និងឌីជីថល។',
'- 2+ years experience in social media management and digital campaigns\n- Experience with Adobe Photoshop, Premiere, or Canva\n- Strong creative copywriting skills in Khmer and English',
'full_time', 'hybrid', 'mid', 'Bachelor Degree in Marketing or Media', 'Phnom Penh', 'Khan Doun Penh', 'Smart Axiata HQ', 700.00, 1200.00, 'USD', FALSE, 1, 'published', 'approved', NOW(), 2),

(5, 3, 4, 'Senior Accounting & Tax Officer', 'មន្ត្រីជាន់ខ្ពស់គណនេយ្យ និងពន្ធដារ', 'senior-accounting-tax-officer',
'Manage financial reporting, general ledger reconciliation, and Cambodia GDT (General Department of Taxation) monthly tax declarations for Wing ecosystem products.',
'គ្រប់គ្រងរបាយការណ៍ហិរញ្ញវត្ថុ ការផ្ទៀងផ្ទាត់បញ្ជីទូទៅ និងការប្រកាសពន្ធប្រចាំខែជូនអគ្គនាយកដ្ឋានពន្ធដារ (GDT)។',
'- Bachelor in Accounting or ACCA candidate\n- Thorough understanding of Cambodia Tax Law and CIFRS\n- 3+ years experience with accounting software',
'full_time', 'on_site', 'mid', 'Bachelor Degree in Accounting', 'Phnom Penh', 'Khan Tuol Kouk', 'Wing Bank Head Office', 800.00, 1300.00, 'USD', TRUE, 1, 'published', 'approved', NOW(), 1),

(6, 1, 1, 'Junior Web Developer (Fresh Graduate Welcome)', 'អ្នកអភិវឌ្ឍន៍គេហទំព័រកម្រិតដំបូង (ស្វាគមន៍និស្សិតទើបបញ្ចប់ការសិក្សា)', 'junior-web-developer-fresh-graduate',
'Kickstart your tech career at Smart Axiata! Work alongside senior developers on modern web portals and customer self-service applications.',
'ចាប់ផ្តើមអាជីពបច្ចេកវិទ្យារបស់អ្នកនៅ Smart Axiata! ធ្វើការជាមួយវិស្វកររៀមច្បងដើម្បីបង្កើតគេហទំព័រទំនើបៗ។',
'- Passion for coding with HTML, CSS, JavaScript, and React or Python\n- Fast learner with proactive problem-solving mindset\n- Fresh graduates from Cambodian universities are welcome',
'full_time', 'on_site', 'fresh_graduate', 'Bachelor Degree in Computer Science or IT', 'Phnom Penh', 'Khan Doun Penh', 'Smart Axiata HQ', 450.00, 750.00, 'USD', FALSE, 2, 'published', 'approved', NOW(), 2),

(7, 2, 9, 'Call Center & Customer Service Specialist', 'អ្នកឯកទេសមជ្ឈមណ្ឌលហៅចូល និងសេវាកម្មអតិថិជន', 'call-center-customer-service-specialist',
'Provide 24/7 dedicated telephone and live-chat customer support for ABA Mobile users. Shift work with generous night allowances.',
'ផ្តល់ជំនួយ និងដោះស្រាយបញ្ហាជូនអតិថិជន ABA Mobile តាមរយៈទូរស័ព្ទ និងសារឆ្លើយឆ្លង ២៤/៧។',
'- Polite, patient, and problem-solving attitude\n- Good command of spoken Khmer and English\n- Open to fresh graduates with strong communication skills',
'full_time', 'on_site', 'entry', 'Associate or Bachelor Degree', 'Phnom Penh', 'Khan Chamkar Mon', 'ABA 24/7 Service Hub', 1800000.00, 2600000.00, 'KHR', FALSE, 5, 'published', 'approved', NOW(), 3),

(8, 3, 1, 'DevOps & Cloud Infrastructure Engineer', 'វិស្វករ DevOps និងហេដ្ឋារចនាសម្ព័ន្ធ Cloud', 'devops-cloud-infrastructure-engineer',
'Automate CI/CD pipelines, containerize microservices with Kubernetes and Docker, and ensure high availability across multi-zone infrastructure.',
'រៀបចំប្រព័ន្ធស្វ័យប្រវត្តិកម្ម CI/CD, គ្រប់គ្រង Docker/Kubernetes និងធានានូវស្ថិរភាពហេដ្ឋារចនាសម្ព័ន្ធ។',
'- 3+ years experience with Linux, Docker, Kubernetes, CI/CD\n- Experience with cloud providers (AWS/GCP/Alibaba Cloud)\n- Background in financial system reliability is an advantage',
'full_time', 'hybrid', 'senior', 'Bachelor Degree in Computer Engineering or IT', 'Phnom Penh', 'Khan Tuol Kouk', 'Wing Bank Technology Center', 1700.00, 2800.00, 'USD', TRUE, 1, 'published', 'approved', NOW(), 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Job Skills
INSERT INTO `job_skills` (`job_id`, `skill_id`, `is_required`) VALUES
(1, 1, TRUE),  -- React.js
(1, 2, TRUE),  -- TypeScript
(1, 3, TRUE),  -- Python
(1, 4, TRUE),  -- Django
(1, 5, TRUE),  -- MySQL
(2, 7, TRUE),  -- Flutter
(2, 2, TRUE),  -- TypeScript
(2, 9, TRUE),  -- English
(3, 8, TRUE),  -- Khmer
(3, 9, TRUE),  -- English
(3, 13, TRUE), -- Customer Service
(4, 14, TRUE), -- Digital Marketing
(4, 15, TRUE), -- Graphic Design
(5, 11, TRUE), -- Tax & Law
(5, 12, TRUE), -- QuickBooks
(6, 1, TRUE),  -- React.js
(6, 2, FALSE), -- TypeScript
(7, 8, TRUE),  -- Khmer
(7, 9, TRUE),  -- English
(7, 13, TRUE), -- Customer Service
(8, 17, TRUE), -- Git
(8, 18, TRUE)  -- Docker & Cloud
ON DUPLICATE KEY UPDATE `is_required` = VALUES(`is_required`);

-- 9. Seeker Profiles
INSERT INTO `seeker_profiles` (`id`, `user_id`, `headline`, `summary`, `date_of_birth`, `gender`, `province`, `city`, `address`, `current_salary`, `expected_salary`, `salary_currency`, `avatar_url`) VALUES
(1, 4, 'Full-Stack Developer (React, Node, Python)', 'Passionate full-stack developer based in Phnom Penh with 3 years of experience building modern web applications. Looking for rewarding engineering opportunities with forward-thinking tech companies.', '1998-05-15', 'male', 'Phnom Penh', 'Khan Tuol Kouk', 'Street 315, Boeung Kak 2', 950.00, 1600.00, 'USD', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop&crop=faces'),
(2, 5, 'Finance & Relationship Officer', 'Experienced banking professional specialized in corporate relationship management, retail loans, and customer consultation. Fluent in Khmer and English.', '1999-09-20', 'female', 'Siem Reap', 'Krong Siem Reap', 'Street 6, Sala Kamreuk', 600.00, 900.00, 'USD', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=faces')
ON DUPLICATE KEY UPDATE `headline` = VALUES(`headline`);

-- Educations
INSERT INTO `educations` (`id`, `seeker_id`, `institution`, `degree`, `field_of_study`, `start_date`, `end_date`, `is_current`, `description`) VALUES
(1, 1, 'Royal University of Phnom Penh (RUPP)', 'Bachelor of Science', 'Computer Science and Engineering', '2016-10-01', '2020-08-30', FALSE, 'Graduated with honors. Key coursework: Data Structures, Database Systems, Web Technologies.'),
(2, 2, 'National University of Management (NUM)', 'Bachelor of Business Administration', 'Banking and Finance', '2017-10-01', '2021-08-30', FALSE, 'Specialized in commercial credit risk and financial analysis.')
ON DUPLICATE KEY UPDATE `institution` = VALUES(`institution`);

-- Work Experiences
INSERT INTO `work_experiences` (`id`, `seeker_id`, `company_name`, `job_title`, `location`, `start_date`, `end_date`, `is_current`, `description`) VALUES
(1, 1, 'Cambodia Web Solutions', 'Web Developer', 'Phnom Penh', '2020-09-01', '2023-01-31', FALSE, 'Developed responsive web interfaces using React.js and RESTful backends.'),
(2, 1, 'Khmer Digital Labs', 'Software Engineer', 'Phnom Penh', '2023-02-01', NULL, TRUE, 'Designed microservices in Python and optimized MySQL database queries for e-commerce platforms.'),
(3, 2, 'Canadia Bank PLC', 'Customer Service Representative', 'Siem Reap', '2021-09-01', NULL, TRUE, 'Handled daily account openings, loan inquiries, and cross-sold financial products.')
ON DUPLICATE KEY UPDATE `company_name` = VALUES(`company_name`);

-- Seeker Skills
INSERT INTO `seeker_skills` (`seeker_id`, `skill_id`, `proficiency_level`) VALUES
(1, 1, 'expert'),        -- React.js
(1, 2, 'advanced'),      -- TypeScript
(1, 3, 'advanced'),      -- Python
(1, 4, 'advanced'),      -- Django
(1, 5, 'advanced'),      -- MySQL
(1, 8, 'native'),        -- Khmer
(1, 9, 'fluent'),        -- English
(2, 8, 'native'),        -- Khmer
(2, 9, 'advanced'),      -- English
(2, 10, 'intermediate'), -- Financial Modeling
(2, 13, 'expert')        -- Customer Service
ON DUPLICATE KEY UPDATE `proficiency_level` = VALUES(`proficiency_level`);

-- Resumes
INSERT INTO `resumes` (`id`, `seeker_id`, `title`, `file_path`, `file_name`, `file_size`, `is_primary`) VALUES
(1, 1, 'Sokha_Meas_Software_Engineer_CV.pdf', '/media/resumes/sokha_meas_cv.pdf', 'Sokha_Meas_CV.pdf', 245100, TRUE),
(2, 2, 'Channary_Voeun_Banking_Resume.pdf', '/media/resumes/channary_voeun_cv.pdf', 'Channary_Voeun_CV.pdf', 189400, TRUE)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 10. Sample Applications
INSERT INTO `applications` (`id`, `job_id`, `seeker_id`, `resume_id`, `cover_letter`, `status`) VALUES
(1, 1, 1, 1, 'I am excited to apply for the Senior Full-Stack Engineer role at Smart Axiata. With 3+ years of experience in React, Python, and scalable architecture, I am confident in delivering top quality features for Smart subscribers.', 'shortlisted'),
(2, 3, 2, 2, 'Dear Hiring Team at ABA Bank, I am a dedicated banking professional based in Siem Reap. I would love the opportunity to contribute to ABA Bank Siem Reap branch growth and customer satisfaction.', 'reviewing')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- Application History
INSERT INTO `application_status_history` (`application_id`, `status`, `notes`, `changed_by`) VALUES
(1, 'submitted', 'Application submitted by candidate', 4),
(1, 'reviewing', 'Profile screened by Smart HR', 2),
(1, 'shortlisted', 'Selected for technical interview', 2),
(2, 'submitted', 'Application submitted by candidate', 5),
(2, 'reviewing', 'Assigned to Siem Reap branch manager for screening', 3);

-- Sample Interview
INSERT INTO `interviews` (`id`, `application_id`, `scheduled_at`, `location_or_link`, `interview_type`, `notes`, `status`, `created_by`) VALUES
(1, 1, DATE_ADD(NOW(), INTERVAL 3 DAY), 'https://meet.google.com/abc-demo-job', 'online', 'Technical architecture and system design interview with Lead Architect.', 'scheduled', 2)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- Saved Jobs
INSERT INTO `saved_jobs` (`seeker_id`, `job_id`) VALUES
(1, 2), -- Sokha saved ABA Mobile Dev job
(1, 6), -- Sokha saved Junior Web Dev job
(2, 7)  -- Channary saved ABA Call Center job
ON DUPLICATE KEY UPDATE `job_id` = VALUES(`job_id`);

-- Notifications
INSERT INTO `notifications` (`user_id`, `title`, `message`, `notification_type`, `data`, `is_read`) VALUES
(4, 'Application Shortlisted!', 'Congratulations! Smart Axiata has shortlisted your application for Senior Full-Stack Engineer.', 'application_status', '{"job_id": 1, "status": "shortlisted"}', FALSE),
(4, 'Interview Scheduled', 'Smart Axiata has scheduled an online interview for you on Monday.', 'interview', '{"application_id": 1}', FALSE),
(5, 'Application Under Review', 'ABA Bank is currently reviewing your application for Branch Relationship Officer in Siem Reap.', 'application_status', '{"job_id": 3, "status": "reviewing"}', FALSE);

