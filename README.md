# Aegis Lab

[![Assessment and lab checks](https://github.com/kjm0320/aegis-lab/actions/workflows/checks.yml/badge.svg)](https://github.com/kjm0320/aegis-lab/actions/workflows/checks.yml)

**허가된 웹 취약점 진단 결과를 분석하고, 개선·재검증 근거를 관리하는 포트폴리오 프로젝트.**

김재민의 요구사항에 따라 AI 개발 지원을 받아 구현한 규칙 기반 프로토타입입니다. 합성 데이터 실습 3종과 45개 자동 테스트를 포함합니다. 사용자 본인의 독립 재현은 확인 전이며, 실제 스캔·LLM 호출·운영 시스템 변경 기능은 없습니다.

[비공개 프로젝트 사례](https://aegis-security-lab.valid-crown-2222.chatgpt.site/portfolio.html) · [진단 대시보드](https://aegis-security-lab.valid-crown-2222.chatgpt.site)

이 소스는 GitHub 공개 포트폴리오용입니다. 배포 사이트는 소유자만 접근할 수 있습니다. 면접관은 이 저장소의 코드·문서·테스트를 확인하거나 로컬에서 실행할 수 있습니다.

## 프로젝트가 해결하려는 문제

진단 결과가 항목 목록으로만 남으면 담당자는 위험의 근거와 다음 개선 작업을 파악하기 어렵습니다. 이 도구는 입력된 문제를 심각도와 상태로 정리하고, 증거·개선안·재검증 기록을 한 흐름에서 확인하도록 구성했습니다.

## 기능

- 수동 다중 입력, JSON 붙여넣기·파일 가져오기, 형식·크기·건수 검증
- 점수와 심각도 분포, 검색·필터, 미조치 우선순위
- 증거·심각도 근거·권고·재검증 기록 확인
- 재검증 기록을 입력한 해결 처리와 미조치 복귀
- JSON 보고서 내보내기, 선택적 브라우저 저장
- 실습 3종의 수정 전후 결과를 대시보드로 가져오기

## 빠른 시작

필수: Python 3.10 이상, Node.js 20 이상. 앱·실습·테스트에는 외부 패키지 설치가 필요하지 않습니다. 검증 당시의 정확한 Python 버전은 `evidence/lab-results.json`에 있습니다.

저장소를 복제하거나 ZIP으로 내려받은 뒤 프로젝트 폴더에서 실행합니다.

```bash
git clone https://github.com/kjm0320/aegis-lab.git
cd aegis-lab
```

Windows CMD 또는 터미널에서 검사를 실행합니다.

```bash
python scripts/check_all.py
```

정상 결과: `31 JavaScript + 14 Python = 45 tests`.

실습 증거를 다시 생성하려면:

```bash
python -m lab.run_evidence
```

브라우저로 웹 화면을 직접 확인하려면:

```bash
python scripts/build_bundle.py
python -m http.server 8080 --bind 127.0.0.1 --directory dist
```

`http://127.0.0.1:8080/portfolio.html`을 엽니다. 이 명령은 로컬 정적 화면만 제공합니다. 취약한 실습 앱은 HTTP 서버로 노출하지 않습니다. 작업을 마치면 Ctrl+C로 종료합니다.

## 실제 실행한 사례

| 사례 | 수정 전 | 수정 후 | 회귀 확인 |
|---|---|---|---|
| LAB-001 접근 제어 | alice가 bob 주문 조회: 200 | 403 및 주문 데이터 미노출 | 본인 조회 200 유지 |
| LAB-002 SQL 인젝션 | 고정 입력으로 비공개 레코드 포함 3건 조회 | 같은 입력 0건 | 정상 검색 1건 유지 |
| LAB-003 쿠키 설정 | 보호 속성 누락 | Secure·HttpOnly·SameSite 명시 | 정상 발급 유지, 미인증 거부 |

실험은 Codex가 프로세스 내부 WSGI 요청으로 실행했습니다. 외부 트래픽·서버 실행·운영 데이터가 없습니다. [사례별 전체 증거](docs/CASE_STUDIES.md)를 확인하세요.

## 코드 안내

| 경로 | 역할 |
|---|---|
| `dist/model.mjs` | 입력 검증, 점수·우선순위, 상태와 재검증 기록 |
| `dist/app.mjs` | 대시보드 입력·필터·상세·내보내기 |
| `dist/portfolio.mjs` | 사례 표시, 확인 후 데이터 전달 |
| `lab/application.py` | 취약·수정 모드를 가진 격리 WSGI 실습 |
| `lab/test_security.py` | 보안 및 정상 동작 회귀 테스트 |
| `lab/run_evidence.py` | 성공한 실습의 증거·입력 JSON 생성 |
| `tests/` | 모델·UI 이벤트·사례 연결 테스트 |
| `evidence/` | 실제 실행 로그, 원본 응답, 소스 해시 |
| `docs/` | 구조·점수·사례·기여도·면접 안내 |

## 문서

- [구조와 데이터 경계](docs/ARCHITECTURE.md)
- [점수 근거와 한계](docs/SCORING.md)
- [45개 테스트와 검증 범위](docs/TEST_REPORT.md)
- [기여도](docs/CONTRIBUTIONS.md)
- [면접 예상 질문과 2분 시연 대본](docs/INTERVIEW_GUIDE.md)
- [GitHub 업로드 안내](docs/PUBLISHING.md)

## 중요한 범위

점수는 자체 가중치이며 CVSS 또는 사이트 안전성 인증이 아닙니다. 입력된 심각도와 조치 상태만 반영합니다. 100점도 미점검 영역의 안전을 의미하지 않습니다.

현재 45개 검사는 모델·경량 DOM 이벤트 어댑터·프로세스 내부 보안 실습 검사입니다. 실제 브라우저 E2E와 모바일 화면은 미검증입니다. GitHub Actions는 push와 pull request마다 동일한 검사를 실행하며, 최신 원격 결과는 [Actions](https://github.com/kjm0320/aegis-lab/actions)에서 확인할 수 있습니다.

현재 버전에서 AI는 개발 지원에 사용되었습니다. 실행 시에는 LLM을 호출하지 않습니다. 개인 기여를 설명할 때 실제로 이해·수정·재현한 부분을 구분해 기록하세요.

## 참고 자료

- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

소스 공개와 사이트 접근 범위는 별도로 관리합니다. 사이트는 비공개입니다. 첨부 PDF와 실행 증거는 2026-10-20 기준 기록이며 이후 공개·CI 상태는 저장소의 현재 정보와 Actions에서 확인합니다.
