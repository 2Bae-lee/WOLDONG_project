import aiosmtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config.settings import settings

def generate_code() -> str:
    return str(random.randint(100000, 999999))

async def send_verification_email(to_email: str, code: str):
    message = MIMEMultipart("alternative")
    message["Subject"] = "[월동] 이메일 인증번호"
    message["From"] = settings.EMAIL_USER
    message["To"] = to_email

    html = f"""
    <div style="font-family: sans-serif; padding: 20px;">
        <h2>월동 이메일 인증</h2>
        <p>아래 인증번호를 입력해주세요.</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">{code}</h1>
        <p style="color: gray;">인증번호는 5분간 유효합니다.</p>
    </div>
    """
    message.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        username=settings.EMAIL_USER,
        password=settings.EMAIL_PASS,
        start_tls=True,
        local_hostname="localhost",
    )