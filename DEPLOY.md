# Render 배포 준비물

이 앱(Next.js, 화면 + 백엔드가 한 프로젝트)을 Render 같은 클라우드에 올려
**다른 사람도 인터넷 주소로** 쓸 수 있게 할 때 필요한 것들입니다.
과제 필수 범위는 "준비물 정리"까지이고, 실제 배포는 선택입니다.

## 왜 길 B(Supabase)여야 하나
- Render 무료 서버의 디스크는 **재시작하면 초기화**됩니다. 길 A의 `todo.db` 파일은 사라집니다.
- 그래서 배포할 때는 데이터를 **Supabase(클라우드 DB)** 에 두는 `DB_PROVIDER=supabase`만 씁니다.
- 로그인 + RLS가 있어야 인터넷의 여러 사람이 써도 "자기 것만" 보입니다.

## 준비물 체크리스트

| 준비물 | 값 / 설명 |
|---|---|
| **코드 보관 위치** | GitHub 저장소 https://github.com/jhwksh/todo (`main` 브랜치) |
| **서비스 종류** | Render → New → **Web Service** (서버가 계속 켜져 있어야 함. Static Site 아님) |
| **런타임** | Node (로컬과 같은 버전: 24) → 환경변수 `NODE_VERSION=24` |
| **빌드 명령** | `npm ci && npm run build` |
| **시작 명령** | `npm run start` (Next.js가 Render가 정해 주는 `PORT`를 자동으로 사용) |
| **환경변수** | 아래 표 (Render 대시보드 → Environment에 직접 입력. `.env.local`은 GitHub에 없으므로 올라가지 않는다) |
| **무료 플랜 한계** | 15분 동안 요청이 없으면 잠들고, 첫 접속이 30초~1분 느림 |

### 환경변수

| 이름 | 값 | 비고 |
|---|---|---|
| `DB_PROVIDER` | `supabase` | 배포에서는 SQLite를 쓰지 않는다 |
| `SUPABASE_URL` | `https://<프로젝트>.supabase.co` | |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | 공개용 키. 보호는 RLS가 한다 |
| `NODE_VERSION` | `24` | |

**넣으면 안 되는 것**
- `SUPABASE` **secret / service_role 키**: RLS를 건너뛰는 관리자 키라 앱에서 쓰지 않는다
- `RLS_TEST_*`: 내 컴퓨터에서 테스트할 때만 쓰는 계정 정보
- `SQLITE_URL`: 배포에서는 쓰지 않는다

## Supabase 쪽 설정 (배포 주소가 생긴 뒤)
1. **Authentication → URL Configuration**
   - **Site URL**: Render 주소 (예: `https://todo-xxxx.onrender.com`)
   - **Redirect URLs**: 같은 주소 추가 (가입 확인 메일 링크가 이 주소로 돌아온다)
2. **Authentication → Sign In / Providers → Email → Confirm email 켜기**: 실제 공개할 때는 이메일 확인을 켠다

## 배포 후 확인 방법
1. Render 대시보드의 **Logs**에 `Ready`가 나오는지 본다
2. 배포 주소로 접속하면 `/login`으로 보내지는지 본다 (로그인 안 한 상태)
3. 회원가입 → 기본 루틴 생성 → 할 일 추가 → 새로고침해도 남는지 본다
4. 다른 계정으로 로그인해 내 데이터가 안 보이는지 본다
5. 시간 확인: 서버는 해외에 있어도 앱이 날짜/시간을 **한국 시간(Asia/Seoul)** 으로 계산하므로 "오늘"이 맞게 나와야 한다
