import os
import urllib.parse
import datetime
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from common.database import execute_insert


def parse_datetime_safe(val):
    """Safely parse various datetime formats or strings into a datetime object"""
    if isinstance(val, datetime.datetime):
        return val
    if isinstance(val, datetime.date):
        return datetime.datetime.combine(val, datetime.time(10, 0))
    if not isinstance(val, str):
        return datetime.datetime.now() + datetime.timedelta(days=1)
    val_clean = val.replace("Z", "+00:00").replace(" ", "T")
    try:
        return datetime.datetime.fromisoformat(val_clean)
    except Exception:
        pass
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"):
        try:
            return datetime.datetime.strptime(val[:19], fmt)
        except Exception:
            pass
    return datetime.datetime.now() + datetime.timedelta(days=1)


def format_iso_for_google(dt: datetime.datetime) -> str:
    """Format datetime as YYYYMMDDTHHMMSSZ for Google Calendar"""
    if hasattr(dt, "tzinfo") and dt.tzinfo:
        dt = dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    return dt.strftime("%Y%m%dT%H%M%SZ")


def build_google_calendar_url(title: str, start_dt: datetime.datetime, end_dt: datetime.datetime, details: str, location: str) -> str:
    """Generate 1-click Google Calendar Event Creation URL"""
    params = {
        "action": "TEMPLATE",
        "text": title,
        "dates": f"{format_iso_for_google(start_dt)}/{format_iso_for_google(end_dt)}",
        "details": details,
        "location": location,
    }
    return f"https://calendar.google.com/calendar/render?{urllib.parse.urlencode(params)}"


def build_outlook_calendar_url(title: str, start_dt: datetime.datetime, end_dt: datetime.datetime, details: str, location: str) -> str:
    """Generate 1-click Microsoft Outlook Calendar Creation URL"""
    start_iso = start_dt.isoformat() if not (hasattr(start_dt, "tzinfo") and start_dt.tzinfo) else start_dt.astimezone(datetime.timezone.utc).replace(tzinfo=None).isoformat()
    end_iso = end_dt.isoformat() if not (hasattr(end_dt, "tzinfo") and end_dt.tzinfo) else end_dt.astimezone(datetime.timezone.utc).replace(tzinfo=None).isoformat()
    params = {
        "subject": title,
        "startdt": start_iso,
        "enddt": end_iso,
        "body": details,
        "location": location,
    }
    return f"https://outlook.live.com/calendar/0/deeplink/compose?{urllib.parse.urlencode(params)}"


def attach_calendar_urls(interview: dict, job_title: str, company_name: str) -> dict:
    """Inject 1-click calendar links into an interview dict"""
    if not interview or not interview.get("scheduled_at"):
        return interview
    try:
        start_dt = parse_datetime_safe(interview["scheduled_at"])
        end_dt = start_dt + datetime.timedelta(minutes=45)
        title = f"Interview: {job_title} at {company_name}"
        details = (
            f"Interview for {job_title} with {company_name}.\n"
            f"Format: {str(interview.get('interview_type') or 'online').capitalize()}\n"
            f"Location/Link: {interview.get('location_or_link') or 'TBD'}\n"
            f"Notes: {interview.get('notes') or 'No special notes'}"
        )
        location = interview.get("location_or_link") or ""
        interview["google_calendar_url"] = build_google_calendar_url(title, start_dt, end_dt, details, location)
        interview["outlook_calendar_url"] = build_outlook_calendar_url(title, start_dt, end_dt, details, location)
    except Exception as e:
        print(f"[attach_calendar_urls error]: {e}")
    return interview


def get_html_email_template(title: str, preheader: str, body_html: str, action_button: dict = None) -> str:
    """
    Standard responsive HTML email layout with CambodiaJobs branding.
    """
    button_html = ""
    if action_button and action_button.get("url") and action_button.get("text"):
        button_html = f"""
        <div style="margin: 28px 0; text-align: center;">
            <a href="{action_button['url']}" target="_blank" style="display: inline-block; background-color: #2563EB; color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                {action_button['text']}
            </a>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
        <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #1E293B 100%); padding: 28px 32px; text-align: left;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                    Cambodia<span style="color: #93C5FD;">Jobs</span>
                </h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #DBEAFE; font-weight: 400;">
                    {preheader}
                </p>
            </div>

            <!-- Content Area -->
            <div style="padding: 32px; line-height: 1.6; font-size: 14px;">
                {body_html}
                {button_html}
            </div>

            <!-- Footer -->
            <div style="background-color: #F1F5F9; padding: 20px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #64748B;">
                <p style="margin: 0 0 6px 0;">This is an automated notification from <strong>CambodiaJobs Recruitment Platform</strong>.</p>
                <p style="margin: 0;">Phnom Penh, Kingdom of Cambodia &bull; <a href="http://127.0.0.1:5173" style="color: #2563EB; text-decoration: none;">Visit Portal</a></p>
            </div>
        </div>
    </body>
    </html>
    """


def send_html_email(to_email: str, to_name: str, subject: str, html_content: str, template_type: str, plain_text_content: str = None) -> bool:
    """
    Dispatches multi-part HTML email safely and records to email_logs.
    """
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "CambodiaJobs <no-reply@cambodiajobs.kh>")
    plain_text = plain_text_content or "Please open this email in an HTML-compatible client to view the full details."

    status_result = "sent"
    error_msg = None

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=from_email,
            to=[to_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
    except Exception as e:
        status_result = "failed"
        error_msg = str(e)
        print(f"[EmailService Error] Failed to send '{template_type}' email to {to_email}: {e}")

    # Record to email_logs table
    try:
        execute_insert(
            """
            INSERT INTO email_logs (recipient_email, recipient_name, subject, template_type, status, error_message)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            [to_email, to_name or "", subject, template_type, status_result, error_msg],
        )
    except Exception as log_err:
        print(f"[EmailService Log Error] Could not write to email_logs: {log_err}")

    return status_result == "sent"


# =========================================================================
# 1. ទទួលបានពាក្យសុំរួចរាល់ (Application Received Confirmation)
# =========================================================================
def send_application_received_email(candidate_email: str, candidate_name: str, job_title: str, company_name: str, application_id: int):
    subject = f"[CambodiaJobs] Application Received: {job_title} at {company_name}"
    preheader = "Your job application has been successfully submitted"

    body_html = f"""
    <p>Dear <strong>{candidate_name}</strong>,</p>
    <p>Thank you for your interest! Your job application for <strong>{job_title}</strong> at <strong>{company_name}</strong> has been received successfully by the hiring team.</p>
    
    <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1E40AF; font-size: 13px;">Application Summary</h4>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #1E3A8A;">
            <li><strong>Vacancy:</strong> {job_title}</li>
            <li><strong>Organization:</strong> {company_name}</li>
            <li><strong>Application Reference:</strong> #{application_id}</li>
            <li><strong>Status:</strong> <span style="background-color: #DBEAFE; color: #1E40AF; padding: 2px 8px; border-radius: 6px; font-size: 11px;">Submitted (Under Review)</span></li>
        </ul>
    </div>

    <p>The recruiter is currently reviewing candidate profiles. You can monitor the real-time stage of your application and any upcoming interview requests directly on your dashboard.</p>
    """

    action_btn = {
        "text": "Track Application Progress",
        "url": "http://127.0.0.1:5173/seeker/applications",
    }

    html = get_html_email_template(subject, preheader, body_html, action_btn)
    return send_html_email(candidate_email, candidate_name, subject, html, "application_received")


# =========================================================================
# 2. លិខិតអញ្ជើញសម្ភាសន៍ (Interview Invitation & Calendar Sync)
# =========================================================================
def send_interview_invitation_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company_name: str,
    scheduled_at_dt: datetime.datetime,
    location_or_link: str,
    interview_type: str,
    notes: str = None
):
    subject = f"[Interview Invitation] {company_name} - {job_title}"
    preheader = f"You are invited to an interview for {job_title}"

    end_dt = scheduled_at_dt + datetime.timedelta(minutes=45)
    formatted_date_time = scheduled_at_dt.strftime("%A, %B %d, %Y at %I:%M %p")

    # Calendar Links
    event_title = f"Interview: {job_title} at {company_name}"
    event_details = f"Interview for {job_title} with {company_name}.\nFormat: {interview_type.capitalize()}\nLocation / Link: {location_or_link}\n\nNotes: {notes or 'No special instructions.'}"
    
    google_cal_url = build_google_calendar_url(event_title, scheduled_at_dt, end_dt, event_details, location_or_link)
    outlook_cal_url = build_outlook_calendar_url(event_title, scheduled_at_dt, end_dt, event_details, location_or_link)

    type_label = "Online Video Call" if interview_type == "online" else "In-Person Office Interview" if interview_type == "in_person" else "Phone Interview"

    meeting_display = ""
    if location_or_link:
        if location_or_link.startswith("http"):
            meeting_display = f'<p style="margin: 6px 0;"><strong>Meeting Link:</strong> <a href="{location_or_link}" target="_blank" style="color: #2563EB; font-weight: 600;">{location_or_link}</a></p>'
        else:
            meeting_display = f'<p style="margin: 6px 0;"><strong>Office Location:</strong> {location_or_link}</p>'

    notes_display = ""
    if notes:
        notes_display = f"""
        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #CBD5E1;">
            <strong style="color: #475569; font-size: 12px;">Notes / Preparation Instructions from Employer:</strong>
            <p style="margin: 4px 0 0 0; color: #334155; font-size: 13px; font-style: italic;">{notes}</p>
        </div>
        """

    body_html = f"""
    <p>Dear <strong>{candidate_name}</strong>,</p>
    <p>Congratulations! After reviewing your application for <strong>{job_title}</strong>, <strong>{company_name}</strong> would like to invite you for an interview.</p>
    
    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 14px;">Interview Schedule Details</h4>
        <p style="margin: 6px 0;"><strong>Date & Time:</strong> <span style="color: #15803D; font-weight: 700; font-size: 14px;">{formatted_date_time}</span></p>
        <p style="margin: 6px 0;"><strong>Format:</strong> {type_label}</p>
        {meeting_display}
        {notes_display}
    </div>

    <!-- Calendar Sync Buttons -->
    <div style="margin: 22px 0; padding: 16px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; color: #475569;">Sync to your personal calendar:</p>
        <div style="display: inline-block;">
            <a href="{google_cal_url}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #1E293B; border: 1px solid #CBD5E1; text-decoration: none; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 8px; margin: 0 4px;">
                📅 Add to Google Calendar
            </a>
            <a href="{outlook_cal_url}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #1E293B; border: 1px solid #CBD5E1; text-decoration: none; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 8px; margin: 0 4px;">
                📅 Add to Outlook
            </a>
        </div>
    </div>

    <p style="font-size: 12px; color: #64748B;">Please ensure you are prepared 5-10 minutes prior to the scheduled time. If you have any scheduling conflicts, please reply directly or notify the recruiter through the portal.</p>
    """

    action_btn = {
        "text": "View Application & Join Details",
        "url": "http://127.0.0.1:5173/seeker/applications",
    }

    html = get_html_email_template(subject, preheader, body_html, action_btn)
    return send_html_email(candidate_email, candidate_name, subject, html, "interview_invitation")


# =========================================================================
# 3. លិខិតថ្លែងអំណរគុណ/បដិសេធ (Application Status Update / Regret Letter)
# =========================================================================
def send_application_rejected_email(candidate_email: str, candidate_name: str, job_title: str, company_name: str):
    subject = f"[Application Update] {job_title} at {company_name}"
    preheader = f"Status update on your application for {job_title}"

    body_html = f"""
    <p>Dear <strong>{candidate_name}</strong>,</p>
    <p>Thank you very much for taking the time to apply for the <strong>{job_title}</strong> position at <strong>{company_name}</strong>.</p>
    
    <p>We received many applications from talented candidates. While your qualifications and experience are impressive, the hiring team has decided to proceed with another applicant whose profile more closely aligns with the immediate requirements of this specific role.</p>
    
    <div style="background-color: #F8FAFC; border-left: 4px solid #94A3B8; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #475569;">
        We genuinely appreciate your interest in {company_name}. We encourage you to keep your profile active and apply for future openings that match your skills.
    </div>

    <p>We wish you the very best in your career journey and job search.</p>
    <p style="margin-top: 20px;">Sincerely,<br><strong>The Hiring Team at {company_name}</strong></p>
    """

    action_btn = {
        "text": "Explore Other Openings",
        "url": "http://127.0.0.1:5173/jobs",
    }

    html = get_html_email_template(subject, preheader, body_html, action_btn)
    return send_html_email(candidate_email, candidate_name, subject, html, "application_rejected")


# =========================================================================
# 4. លិខិតផ្តល់ឱកាសការងារ (Job Offer Letter)
# =========================================================================
def send_job_offer_email(candidate_email: str, candidate_name: str, job_title: str, company_name: str, details_note: str = None):
    subject = f"[Congratulations!] Job Offer: {job_title} at {company_name}"
    preheader = f"Offer of employment for {job_title}"

    note_html = ""
    if details_note:
        note_html = f"""
        <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px; margin: 18px 0;">
            <strong style="color: #1E40AF; font-size: 13px;">Offer Notes / Next Steps:</strong>
            <p style="margin: 6px 0 0 0; color: #1E3A8A; font-size: 13px;">{details_note}</p>
        </div>
        """

    body_html = f"""
    <p>Dear <strong>{candidate_name}</strong>,</p>
    <p>We are delighted to inform you that <strong>{company_name}</strong> is extending a formal offer of employment for the position of <strong>{job_title}</strong>!</p>
    
    <p>The team was thoroughly impressed by your skills, experience, and the discussions throughout the hiring process. We are confident you will make a tremendous impact in our organization.</p>
    
    {note_html}

    <p>Please check your application workspace on CambodiaJobs to review details, and our HR team will be in touch shortly regarding contract documentation and your start date.</p>
    
    <p style="margin-top: 20px;">Warm congratulations once again!</p>
    <p>Sincerely,<br><strong>The Management & Recruiting Team at {company_name}</strong></p>
    """

    action_btn = {
        "text": "View Offer on Dashboard",
        "url": "http://127.0.0.1:5173/seeker/applications",
    }

    html = get_html_email_template(subject, preheader, body_html, action_btn)
    return send_html_email(candidate_email, candidate_name, subject, html, "job_offer")


# =========================================================================
# 5. ដំណឹងបេក្ខជនដាក់ពាក្យថ្មីផ្ញើទៅនិយោជក (New Candidate Application to Recruiter)
# =========================================================================
def send_new_application_to_employer_email(
    recruiter_email: str,
    recruiter_name: str,
    candidate_name: str,
    candidate_email: str,
    candidate_phone: str,
    job_title: str,
    company_name: str,
    job_id: int,
    application_id: int,
    expected_salary: str = None,
):
    subject = f"[CambodiaJobs] New Applicant: {candidate_name} applied for {job_title}"
    preheader = f"A new candidate application has arrived for {job_title}"

    salary_info = f"<li><strong>Expected Salary:</strong> ${expected_salary}/mo</li>" if expected_salary else ""

    body_html = f"""
    <p>Dear <strong>{recruiter_name}</strong>,</p>
    <p>Great news! A new candidate has just submitted an application for your active opening: <strong>{job_title}</strong> at <strong>{company_name}</strong>.</p>
    
    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 13px;">Applicant Overview</h4>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #14532D; line-height: 1.8;">
            <li><strong>Candidate Name:</strong> {candidate_name}</li>
            <li><strong>Email:</strong> <a href="mailto:{candidate_email}" style="color: #2563EB;">{candidate_email}</a></li>
            <li><strong>Phone:</strong> {candidate_phone or 'Not provided'}</li>
            <li><strong>Vacancy:</strong> {job_title}</li>
            {salary_info}
            <li><strong>Application ID:</strong> #{application_id}</li>
        </ul>
    </div>

    <p>You can review their profile, CV, and schedule an interview directly from your Employer Workspace.</p>
    """

    action_btn = {
        "text": "Review Applicant in Workspace",
        "url": f"http://127.0.0.1:5173/employer/jobs/{job_id}/applications",
    }

    html = get_html_email_template(subject, preheader, body_html, action_btn)
    return send_html_email(recruiter_email, recruiter_name, subject, html, "new_applicant_alert")


# =========================================================================
# 6. លិខិតជូនដំណឹងជាប់សម្រាំង (Candidate Shortlisted Notification)
# =========================================================================
def send_candidate_shortlisted_email(candidate_email: str, candidate_name: str, job_title: str, company_name: str):
    subject = f"[Application Shortlisted] {job_title} at {company_name}"
    preheader = f"Congratulations! Your application has advanced to Shortlisted stage"

    body_html = f"""
    <p>Dear <strong>{candidate_name}</strong>,</p>
    <p>We are pleased to inform you that your application for <strong>{job_title}</strong> has impressed the hiring team at <strong>{company_name}</strong> and has been moved to the <strong>Shortlisted</strong> stage!</p>
    
    <div style="background-color: #F0FDFA; border: 1px solid #99F6E4; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #0F766E; font-size: 13px;">What Happens Next?</h4>
        <p style="margin: 0; color: #115E59; font-size: 13px; line-height: 1.6;">
            The recruitment team is finalizing interview slots. You will receive an invitation email and portal notification as soon as an interview session is scheduled.
        </p>
    </div>

    <p>Please keep an eye on your email inbox and portal dashboard for upcoming meeting details.</p>
    <p style="margin-top: 18px;">Best regards,<br><strong>Recruiting Team at {company_name}</strong></p>
    """

    action_btn = {
        "text": "View Application Stage",
        "url": "http://127.0.0.1:5173/seeker/applications",
    }

    html = get_html_email_template(subject, preheader, body_html, action_btn)
    return send_html_email(candidate_email, candidate_name, subject, html, "candidate_shortlisted")


# =========================================================================
# 7. ដំណឹងសុវត្ថិភាពនៅពេលចូលគណនី (Sign-in Security Alert Email)
# =========================================================================
def send_login_notification_email(user_email: str, user_name: str):
    subject = f"[CambodiaJobs] Account Sign-in Notification"
    preheader = "Security notification: Your account was accessed"
    now_str = datetime.datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")

    body_html = f"""
    <p>Dear <strong>{user_name}</strong>,</p>
    <p>Your CambodiaJobs account (<strong>{user_email}</strong>) was successfully signed in on <strong>{now_str}</strong>.</p>
    
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin: 18px 0; font-size: 13px; color: #475569;">
        <p style="margin: 0 0 6px 0;"><strong>Security Notice:</strong></p>
        <p style="margin: 0;">If this was you, you can safely ignore this automated message. If you did not initiate this login, please secure your account by changing your password immediately.</p>
    </div>

    <p>Thank you for using CambodiaJobs!</p>
    """

    action_btn = {
        "text": "Open Dashboard",
        "url": "http://127.0.0.1:5173/",
    }

    html = get_html_email_template(subject, preheader, body_html, action_btn)
    return send_html_email(user_email, user_name, subject, html, "login_alert")


# =========================================================================
# 8. លិខិតស្វាគមន៍ការចុះឈ្មោះគណនីថ្មី (Welcome Registration Email)
# =========================================================================
def send_welcome_email(user_email: str, user_name: str, role: str):
    role_label = "Employer & Recruiter" if role == "employer" else "Job Seeker"
    subject = f"Welcome to CambodiaJobs, {user_name}!"
    preheader = f"Your {role_label} account has been created successfully"

    if role == "employer":
        guide_html = """
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #1E3A8A; line-height: 1.8;">
            <li>Complete your <strong>Company Profile</strong> with official logo and description</li>
            <li>Post your first job vacancy to reach qualified professionals nationwide</li>
            <li>Review candidate CVs and schedule video interviews directly</li>
        </ul>
        """
        dashboard_url = "http://127.0.0.1:5173/employer/dashboard"
    else:
        guide_html = """
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #1E3A8A; line-height: 1.8;">
            <li>Complete your professional profile and upload your CV/Resume</li>
            <li>Explore hundreds of verified vacancies in IT, Banking, Sales, and Accounting</li>
            <li>Receive real-time email updates on your application status</li>
        </ul>
        """
        dashboard_url = "http://127.0.0.1:5173/seeker/dashboard"

    body_html = f"""
    <p>Dear <strong>{user_name}</strong>,</p>
    <p>Welcome to <strong>CambodiaJobs</strong> — Cambodia's premier digital recruitment platform. We are delighted to have you onboard as a <strong>{role_label}</strong>!</p>
    
    <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #1E40AF; font-size: 13px;">Quick Steps to Get Started:</h4>
        {guide_html}
    </div>

    <p>If you ever need any assistance, our support team is always here to help you succeed.</p>
    """

    action_btn = {
        "text": "Go to My Dashboard",
        "url": dashboard_url,
    }

    html = get_html_email_template(subject, preheader, body_html, action_btn)
    return send_html_email(user_email, user_name, subject, html, "welcome_registration")
