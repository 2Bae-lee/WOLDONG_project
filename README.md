# 월동 (WOLDONG)

발달장애 아동의 안전하고 예측 가능한 외출을 돕는 보호자·동행인 협업 서비스입니다.
보호자는 아동 프로필과 외출 일정을 관리하고, 승인된 동행인은 일정과 아동 특성을 공유받아 외출을 지원할 수 있습니다. AI를 활용해 아동 맞춤형 캐릭터, 주의사항, 소셜 스토리와 음성을 생성합니다.

## 주요 기능

- 보호자·동행인 회원가입, 이메일 인증 및 JWT 로그인
- 아동 특성, 의사소통 방식, 주의사항과 캐릭터 설정 관리
- 초대 코드 기반 동행인 연결 및 보호자 승인
- 보호자·동행인 공동 일정, 준비물, 체크리스트와 외출 기록 관리
- 일정과 아동 특성을 반영한 AI 주의사항 예측
- AI 캐릭터 및 말하는 캐릭터 프레임 생성
- 아동별 말투·속도·목소리를 적용한 소셜 스토리, 장면 이미지와 음성 생성
- 승인 요청, 일정 및 아동 관련 알림 제공

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Mobile | Expo SDK 54, React Native 0.81, React 19, Expo Router, TypeScript |
| Backend | FastAPI, Beanie, Motor, MongoDB, JWT |
| AI Server | FastAPI, OpenAI API, TensorFlow, scikit-learn |
| AI Features | GPT Image, OpenAI TTS, 주의사항·소셜 스토리 분류 모델 |

## 프로젝트 구조

```text
WOLDONG_project/
├── app/                  # Expo Router 화면
├── assets/               # 앱 이미지 및 폰트
├── components/           # 공통 UI 컴포넌트
├── constants/            # API 클라이언트, 색상, 공통 상태
├── backend/
│   ├── app/
│   │   ├── models/       # Beanie 문서 모델
│   │   ├── routers/      # REST API
│   │   ├── middleware/   # JWT 인증 및 역할 권한
│   │   └── utils/
│   ├── config/           # 환경 설정 및 MongoDB 연결
│   └── main.py
└── ai-server/
    ├── ai_model/         # 학습 모델, 데이터 및 추론 코드
    ├── app/
    │   ├── routers/      # AI API
    │   ├── services/     # 이미지·음성·스토리 생성
    │   └── static/       # 생성된 이미지와 음성
    └── requirements.txt
```

## 실행 환경

- Node.js 20.19 이상
- Python 3.10 이상
- MongoDB
- Expo Go 또는 Android/iOS 에뮬레이터
- OpenAI API Key

Expo SDK 54는 Node.js 20.19 이상을 요구합니다.

## 환경 변수

### 프론트엔드

프로젝트 루트에 `.env`를 생성합니다.

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8003
```

실기기와 백엔드가 다른 네트워크에 있다면 ngrok의 HTTPS 주소를 사용합니다.

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-domain.ngrok-free.app
```

### 백엔드

`backend/.env`를 생성합니다.

```env
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=change-this-secret
JWT_EXPIRES_DAYS=7
PORT=8003
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-app-password
AI_SERVER_URL=http://127.0.0.1:8004
```

AI 서버가 다른 컴퓨터에서 실행된다면 `AI_SERVER_URL`에 해당 서버의 ngrok HTTPS 주소를 입력합니다.

### AI 서버

`ai-server/.env`를 생성합니다.

```env
OPENAI_API_KEY=your-openai-api-key
```

환경 변수 파일은 Git에 커밋하지 않습니다.

## 설치 및 실행

### 1. 프론트엔드

```bash
npm install
npx expo start -c
```

### 2. 백엔드

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8003
```

Windows에서 `Asia/Seoul` 시간대 데이터를 찾지 못하는 경우 다음 패키지를 설치합니다.

```powershell
python -m pip install tzdata
```

상태 확인:

```text
http://127.0.0.1:8003/health
```

### 3. AI 서버

```powershell
cd ai-server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8004
```

상태 확인:

```text
http://127.0.0.1:8004/
```

## 원격 기기 테스트

백엔드와 AI 서버를 각각 외부에 공개해야 할 때는 별도 터널을 실행합니다.

```powershell
ngrok http 8003
ngrok http 8004
```

- 백엔드 ngrok 주소: 프론트의 `EXPO_PUBLIC_API_BASE_URL`
- AI 서버 ngrok 주소: 백엔드의 `AI_SERVER_URL`
- ngrok 주소가 변경되면 환경 변수를 수정하고 해당 서버 또는 Expo를 재시작해야 합니다.

## 주요 API

| 구분 | 경로 |
| --- | --- |
| 인증 | `/api/auth` |
| 아동 프로필 | `/api/children` |
| 보호자 홈 | `/api/home` |
| 동행인 프로필·연결 아동 | `/api/companion` |
| 초대 및 승인 | `/api/invite` |
| 일정·체크리스트·기록 | `/api/schedules` |
| 알림 | `/api/notifications` |
| 캐릭터·주의사항·소셜 스토리 | `/api/ai` |

백엔드 실행 후 상세 명세는 Swagger UI에서 확인할 수 있습니다.

```text
http://127.0.0.1:8003/docs
```

## 개발 브랜치

통합 개발 브랜치는 `new-plan/develop`입니다. 기능 작업은 별도 브랜치에서 진행한 뒤 통합 브랜치에 반영합니다.

## 주의사항

- JWT 관련 환경 변수를 변경하면 기존 로그인 토큰이 무효화될 수 있습니다.
- Expo에서 `401 Unauthorized`가 반복되면 앱의 로그인 세션을 지우고 다시 로그인합니다.
- AI 이미지 생성은 여러 장을 순차 생성하므로 응답 시간이 길어질 수 있습니다.
- 생성된 이미지와 음성 파일은 AI 서버의 `app/static`에서 제공됩니다.
- API 키, JWT 비밀키, 이메일 앱 비밀번호를 저장소에 올리지 않습니다.
