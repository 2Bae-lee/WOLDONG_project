from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import User, Role
from app.models.verification import Verification
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.utils.response import success, error
from app.utils.email import generate_code, send_verification_email
from app.middleware.auth import get_current_user
router = APIRouter(prefix="/api/auth", tags=["인증"])

# ─── 요청 스키마 ────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CheckEmailRequest(BaseModel):
    email: EmailStr

class UpdateMeRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

# ─── 라우트 ────────────────────────────────────────────

# POST /api/auth/signup - 회원가입
@router.post("/signup")
async def signup(body: SignupRequest):
    # 이메일 중복 확인
    existing = await User.find_one(User.email == body.email)
    if existing:
        return error("이미 사용 중인 이메일입니다", 409)

    # 비밀번호 유효성
    if len(body.password) < 8:
        return error("비밀번호는 8자 이상이어야 합니다", 400)

    # 유저 생성
    user = User(
        name=body.name,
        email=body.email,
        password=hash_password(body.password),
        role=body.role,
        phone=body.phone
    )
    await user.insert()

    token = create_access_token(str(user.id), user.role)
    return success({
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }, "회원가입이 완료되었습니다", 201)


# POST /api/auth/login - 로그인
@router.post("/login")
async def login(body: LoginRequest):
    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.password):
        return error("이메일 또는 비밀번호가 올바르지 않습니다", 401)

    token = create_access_token(str(user.id), user.role)
    return success({
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }, "로그인 성공")


# POST /api/auth/check-email - 이메일 중복 확인
@router.post("/check-email")
async def check_email(body: CheckEmailRequest):
    exists = await User.find_one(User.email == body.email)
    if exists:
        return success({"available": False}, "이미 사용 중인 이메일입니다")
    return success({"available": True}, "사용 가능한 이메일입니다")


# GET /api/auth/me - 내 정보 조회 (토큰 필요)
@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return success({
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "created_at": str(user.created_at)
    })


# PATCH /api/auth/me - 내 정보 수정 (토큰 필요)
@router.patch("/me")
async def update_me(body: UpdateMeRequest, user: User = Depends(get_current_user)):
    if body.name:
        user.name = body.name
    if body.phone:
        user.phone = body.phone
    await user.save()
    return success({
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone
    }, "정보가 수정되었습니다")

# POST /api/auth/logout - 로그아웃
@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    return success(None, "로그아웃 되었습니다")


# DELETE /api/auth/me - 회원탈퇴
@router.delete("/me")
async def delete_me(user: User = Depends(get_current_user)):
    await user.delete()
    return success(None, "회원탈퇴가 완료되었습니다")

# POST /api/auth/send-code - 인증번호 발송
@router.post("/send-code")
async def send_code(body: CheckEmailRequest):
    code = generate_code()
    
    # 기존 인증번호 삭제
    await Verification.find(Verification.email == body.email).delete()
    
    # 새 인증번호 저장
    await Verification(email=body.email, code=code).insert()
    
    # 이메일 발송
    await send_verification_email(body.email, code)
    
    return success(None, "인증번호가 발송되었습니다")


# POST /api/auth/verify-code - 인증번호 확인
@router.post("/verify-code")
async def verify_code(body: VerifyCodeRequest):
    record = await Verification.find_one(Verification.email == body.email)
    
    if not record:
        return error("인증번호를 먼저 요청해주세요", 400)
    
    if record.code != body.code:
        return error("인증번호가 올바르지 않습니다", 400)
    
    record.is_verified = True
    await record.save()
    
    return success(None, "이메일 인증이 완료되었습니다")
