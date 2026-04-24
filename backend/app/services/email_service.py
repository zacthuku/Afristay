import html
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


class EmailService:

    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str) -> bool:
        # If SMTP not configured, fall back to console log
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            print(f"\n{'='*60}")
            print(f"[EMAIL - no SMTP configured]")
            print(f"TO: {to_email}")
            print(f"SUBJECT: {subject}")
            print(f"{'='*60}")
            print(html_content)
            print(f"{'='*60}\n")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], to_email, msg.as_string())

            return True
        except Exception as e:
            print(f"[EmailService] Error sending email: {e}")
            return False

    @staticmethod
    def send_password_reset_email(email: str, reset_token: str, frontend_url: str = "") -> bool:
        base = (frontend_url or settings.FRONTEND_URL).rstrip("/")
        reset_url = f"{base}/reset-password?token={reset_token}"
        safe_email = html.escape(email or "")
        subject = "Reset your AfriStay password"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;background:#f9f9f9;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color:#C4622D;margin-top:0;">Password Reset Request</h2>
              <p>We received a request to reset the password for your AfriStay account associated with <strong>{safe_email}</strong>.</p>
              <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="{reset_url}"
                   style="background:#C4622D;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                  Reset Password
                </a>
              </div>
              <p style="font-size:13px;color:#666;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="{reset_url}" style="color:#C4622D;word-break:break-all;">{reset_url}</a>
              </p>
              <p style="font-size:13px;color:#999;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will not be changed.
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
              <p style="font-size:12px;color:#aaa;margin:0;">
                &copy; AfriStay &mdash; Discover Africa's finest stays.
              </p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_welcome_email(name: str, email: str) -> bool:
        safe_name = html.escape(name or "")
        subject = "Welcome to AfriStay!"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Welcome to AfriStay, {safe_name}!</h2>
              <p>Thank you for registering. We're excited to have you on board!</p>
              <ul>
                <li>Browse and book amazing accommodations and transport services</li>
                <li>Apply to become a host and earn money</li>
                <li>Manage your profile and preferences</li>
              </ul>
              <p style="margin-top:30px;color:#666;font-size:12px;">
                Best regards,<br>The AfriStay Team
              </p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_booking_confirmation(user_name: str, email: str, service_title: str, start_time: str, end_time: str, total_price: float) -> bool:
        safe_name = html.escape(user_name or "")
        safe_title = html.escape(service_title or "")
        safe_start = html.escape(str(start_time))
        safe_end = html.escape(str(end_time))
        subject = f"Booking Confirmed - {service_title}"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Booking Confirmed!</h2>
              <p>Hi {safe_name},</p>
              <p>Your booking has been confirmed. Here are the details:</p>
              <div style="background:#f5f5f5;padding:15px;border-radius:5px;margin:20px 0;">
                <p><strong>Service:</strong> {safe_title}</p>
                <p><strong>Check-in:</strong> {safe_start}</p>
                <p><strong>Check-out:</strong> {safe_end}</p>
                <p><strong>Total:</strong> KES {total_price:,.2f}</p>
              </div>
              <p style="margin-top:30px;color:#666;font-size:12px;">
                Best regards,<br>The AfriStay Team
              </p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_host_approval_email(host_name: str, email: str) -> bool:
        safe_name = html.escape(host_name or "")
        subject = "Your Host Application Has Been Approved!"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Congratulations, {safe_name}!</h2>
              <p>Your host application has been approved. You can now create listings and accept bookings.</p>
              <p style="margin-top:30px;color:#666;font-size:12px;">Best regards,<br>The AfriStay Team</p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_host_rejection_email(host_name: str, email: str, reason: str = "") -> bool:
        safe_name = html.escape(host_name or "")
        safe_reason = html.escape(reason or "")
        subject = "Update on Your AfriStay Host Application"
        reason_block = f"""
            <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:12px 16px;margin:16px 0;border-radius:4px;">
                <p style="margin:0;color:#c53030;font-size:14px;"><strong>Reason:</strong> {safe_reason}</p>
            </div>
        """ if reason else ""
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Host Application — Not Approved</h2>
              <p>Hi {safe_name},</p>
              <p>After reviewing your application, we are unable to approve it at this time.</p>
              {reason_block}
              <p>You are welcome to re-apply after addressing the points above.</p>
              <p style="margin-top:30px;color:#666;font-size:12px;">Best regards,<br>The AfriStay Team</p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_service_approval_email(host_name: str, email: str, service_title: str) -> bool:
        safe_name = html.escape(host_name or "")
        safe_title = html.escape(service_title or "")
        subject = f"Your Service '{service_title}' Has Been Approved!"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Service Approved!</h2>
              <p>Hi {safe_name},</p>
              <p>Your service "<strong>{safe_title}</strong>" is now visible to travelers.</p>
              <p style="margin-top:30px;color:#666;font-size:12px;">Best regards,<br>The AfriStay Team</p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_host_onboarding_email(name: str, email: str, temp_password: str) -> bool:
        safe_name = html.escape(name or "")
        safe_email = html.escape(email or "")
        safe_password = html.escape(temp_password or "")
        subject = "Welcome to AfriStay — Your Host Account is Ready"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;background:#f9f9f9;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color:#C4622D;margin-top:0;">Welcome to AfriStay, {safe_name}!</h2>
              <p>Your host account has been created by the AfriStay team. You can start listing services immediately.</p>
              <p>Use the credentials below to log in:</p>
              <div style="background:#FAF6EF;border:1px solid #E8D9B8;border-radius:8px;padding:16px 20px;margin:24px 0;">
                <p style="margin:0 0 8px;"><strong>Email:</strong> {safe_email}</p>
                <p style="margin:0;"><strong>Temporary Password:</strong>
                  <span style="font-family:monospace;background:#fff;border:1px solid #ddd;padding:2px 8px;border-radius:4px;">{safe_password}</span>
                </p>
              </div>
              <p style="color:#c53030;font-size:13px;">
                &#9888; Please change your password after your first login via <strong>Settings → Change Password</strong>.
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="{settings.FRONTEND_URL}/login"
                   style="background:#C4622D;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
                  Log In to AfriStay
                </a>
              </div>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
              <p style="font-size:12px;color:#aaa;margin:0;">
                &copy; AfriStay &mdash; Discover Africa's finest stays.
              </p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_service_rejection_email(host_name: str, email: str, service_title: str, reason: str = "") -> bool:
        safe_name = html.escape(host_name or "")
        safe_title = html.escape(service_title or "")
        safe_reason = html.escape(reason or "")
        subject = f"Update on Your Listing '{service_title}'"
        reason_block = f"""
            <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:12px 16px;margin:16px 0;border-radius:4px;">
                <p style="margin:0;color:#c53030;font-size:14px;"><strong>Reason:</strong> {safe_reason}</p>
            </div>
        """ if reason else ""
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Service Listing Not Approved</h2>
              <p>Hi {safe_name},</p>
              <p>Your listing "<strong>{safe_title}</strong>" could not be approved at this time.</p>
              {reason_block}
              <p>You can update and resubmit from your host dashboard.</p>
              <p style="margin-top:30px;color:#666;font-size:12px;">Best regards,<br>The AfriStay Team</p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_contact_message(sender_name: str, sender_email: str, subject: str, message: str) -> bool:
        safe_name    = html.escape(sender_name or "")
        safe_email   = html.escape(sender_email or "")
        safe_subject = html.escape(subject or "")
        safe_message = html.escape(message or "").replace("\n", "<br>")
        email_subject = f"[AfriStayHub Contact] {safe_subject}"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;background:#f9f9f9;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color:#C4622D;margin-top:0;">New Contact Message</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tr><td style="padding:8px 0;font-weight:bold;width:80px;">From:</td><td>{safe_name}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;">Email:</td><td><a href="mailto:{safe_email}" style="color:#C4622D;">{safe_email}</a></td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;">Subject:</td><td>{safe_subject}</td></tr>
              </table>
              <div style="background:#FAF6EF;border:1px solid #E8D9B8;border-radius:8px;padding:20px;">
                <p style="margin:0;line-height:1.7;">{safe_message}</p>
              </div>
              <p style="margin-top:24px;color:#999;font-size:12px;">
                Sent via AfriStayHub contact form · Reply directly to {safe_email}
              </p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(settings.SUPPORT_EMAIL, email_subject, html_content)
