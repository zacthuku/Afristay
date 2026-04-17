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
        subject = "Reset your AfriStay password"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;background:#f9f9f9;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color:#C4622D;margin-top:0;">Password Reset Request</h2>
              <p>We received a request to reset the password for your AfriStay account associated with <strong>{email}</strong>.</p>
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
        subject = "Welcome to AfriStay!"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Welcome to AfriStay, {name}!</h2>
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
        subject = f"Booking Confirmed - {service_title}"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Booking Confirmed!</h2>
              <p>Hi {user_name},</p>
              <p>Your booking has been confirmed. Here are the details:</p>
              <div style="background:#f5f5f5;padding:15px;border-radius:5px;margin:20px 0;">
                <p><strong>Service:</strong> {service_title}</p>
                <p><strong>Check-in:</strong> {start_time}</p>
                <p><strong>Check-out:</strong> {end_time}</p>
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
        subject = "Your Host Application Has Been Approved!"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Congratulations, {host_name}!</h2>
              <p>Your host application has been approved. You can now create listings and accept bookings.</p>
              <p style="margin-top:30px;color:#666;font-size:12px;">Best regards,<br>The AfriStay Team</p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_host_rejection_email(host_name: str, email: str, reason: str = "") -> bool:
        subject = "Update on Your AfriStay Host Application"
        reason_block = f"""
            <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:12px 16px;margin:16px 0;border-radius:4px;">
                <p style="margin:0;color:#c53030;font-size:14px;"><strong>Reason:</strong> {reason}</p>
            </div>
        """ if reason else ""
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Host Application — Not Approved</h2>
              <p>Hi {host_name},</p>
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
        subject = f"Your Service '{service_title}' Has Been Approved!"
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Service Approved!</h2>
              <p>Hi {host_name},</p>
              <p>Your service "<strong>{service_title}</strong>" is now visible to travelers.</p>
              <p style="margin-top:30px;color:#666;font-size:12px;">Best regards,<br>The AfriStay Team</p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_service_rejection_email(host_name: str, email: str, service_title: str, reason: str = "") -> bool:
        subject = f"Update on Your Listing '{service_title}'"
        reason_block = f"""
            <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:12px 16px;margin:16px 0;border-radius:4px;">
                <p style="margin:0;color:#c53030;font-size:14px;"><strong>Reason:</strong> {reason}</p>
            </div>
        """ if reason else ""
        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="color:#C4622D;">Service Listing Not Approved</h2>
              <p>Hi {host_name},</p>
              <p>Your listing "<strong>{service_title}</strong>" could not be approved at this time.</p>
              {reason_block}
              <p>You can update and resubmit from your host dashboard.</p>
              <p style="margin-top:30px;color:#666;font-size:12px;">Best regards,<br>The AfriStay Team</p>
            </div>
          </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)
