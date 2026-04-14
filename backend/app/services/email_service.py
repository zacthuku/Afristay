import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


class EmailService:
    """Service for sending emails"""

    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str):
        """
        Send email using SMTP.
        Falls back to console logging if SMTP not configured.
        """
        try:
            # For development: log to console instead of actually sending
            print(f"\n{'='*60}")
            print(f"EMAIL TO: {to_email}")
            print(f"SUBJECT: {subject}")
            print(f"{'='*60}")
            print(html_content)
            print(f"{'='*60}\n")
            
            # TODO: Configure actual SMTP when email provider is ready
            # msg = MIMEMultipart("alternative")
            # msg["Subject"] = subject
            # msg["From"] = settings.SMTP_FROM_EMAIL
            # msg["To"] = to_email
            # msg.attach(MIMEText(html_content, "html"))
            
            # with smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            #     server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            #     server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            
            return True
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False

    @staticmethod
    def send_welcome_email(name: str, email: str):
        """Send welcome email after registration"""
        subject = "Welcome to AfriStay!"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #C4622D;">Welcome to AfriStay, {name}!</h2>
                    <p>Thank you for registering with AfriStay. We're excited to have you on board!</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Browse and book amazing accommodations and transport services</li>
                        <li>Apply to become a host and earn money</li>
                        <li>Manage your profile and preferences</li>
                    </ul>
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                        Best regards,<br>
                        The AfriStay Team
                    </p>
                </div>
            </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_booking_confirmation(user_name: str, email: str, service_title: str, start_time: str, end_time: str, total_price: float):
        """Send booking confirmation email"""
        subject = f"Booking Confirmed - {service_title}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #C4622D;">Booking Confirmed!</h2>
                    <p>Hi {user_name},</p>
                    <p>Your booking has been confirmed. Here are the details:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Service:</strong> {service_title}</p>
                        <p><strong>Check-in:</strong> {start_time}</p>
                        <p><strong>Check-out:</strong> {end_time}</p>
                        <p><strong>Total Price:</strong> ₦{total_price:,.2f}</p>
                    </div>
                    <p>Please contact the host if you have any special requests.</p>
                    <p>If you need to cancel, you can do so from your booking history in your account.</p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                        Best regards,<br>
                        The AfriStay Team
                    </p>
                </div>
            </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_host_approval_email(host_name: str, email: str):
        """Send email when host application is approved"""
        subject = "Your Host Application Has Been Approved!"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #C4622D;">Congratulations, {host_name}!</h2>
                    <p>Great news! Your host application has been approved.</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Create and manage service listings</li>
                        <li>Accept bookings from guests</li>
                        <li>Earn money from your services</li>
                        <li>Access the host dashboard</li>
                    </ul>
                    <p>Your services will be visible to travelers once they are approved by our admin team.</p>
                    <p>For detailed guidelines on being a great host, visit our Help Center.</p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                        Best regards,<br>
                        The AfriStay Team
                    </p>
                </div>
            </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)

    @staticmethod
    def send_service_approval_email(host_name: str, email: str, service_title: str):
        """Send email when service is approved"""
        subject = f"Your Service '{service_title}' Has Been Approved!"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #C4622D;">Service Approved!</h2>
                    <p>Hi {host_name},</p>
                    <p>Your service "<strong>{service_title}</strong>" has been approved and is now visible to travelers.</p>
                    <p>You can now:</p>
                    <ul>
                        <li>View and respond to booking inquiries</li>
                        <li>Manage your service availability</li>
                        <li>Update service details anytime</li>
                    </ul>
                    <p>Best of luck with your bookings!</p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                        Best regards,<br>
                        The AfriStay Team
                    </p>
                </div>
            </body>
        </html>
        """
        return EmailService.send_email(email, subject, html_content)
