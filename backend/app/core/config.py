from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = ""  # Optional - can be empty
    SECRET_KEY: str
    GOOGLE_CLIENT_ID: str = "YOUR_CLIENT_ID"  # Set in .env file

    # Daraja M-Pesa (Safaricom)
    DARAJA_CONSUMER_KEY: str = ""
    DARAJA_CONSUMER_SECRET: str = ""
    DARAJA_SHORTCODE: str = "174379"  # Sandbox default
    DARAJA_PASSKEY: str = ""
    DARAJA_CALLBACK_URL: str = "https://your-ngrok-url.ngrok.io/payments/mpesa/callback"
    DARAJA_ENV: str = "sandbox"  # "sandbox" or "production"

    # Airtel Money (Airtel Africa Collection API)
    AIRTEL_CLIENT_ID: str = ""
    AIRTEL_CLIENT_SECRET: str = ""
    AIRTEL_CALLBACK_URL: str = "https://your-ngrok-url.ngrok.io/payments/airtel/callback"
    AIRTEL_ENV: str = "sandbox"  # "sandbox" or "production"

    # Cloudinary Image Storage
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Flutterwave Card Payments
    FLUTTERWAVE_SECRET_KEY: str = ""
    FLUTTERWAVE_PUBLIC_KEY: str = ""

    # SMTP Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "AfriStay"
    SUPPORT_EMAIL: str = "zacthuku7@gmail.com"
    FRONTEND_URL: str = "http://localhost:5173"

    # Pydantic v2 config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()