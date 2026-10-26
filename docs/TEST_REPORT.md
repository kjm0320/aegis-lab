# 검증 결과

실행 시각(UTC): 2026-10-20T06:56:24.391956+00:00

총 **45개 테스트 통과**: Node 31개, Python 14개.

| 영역 | 수 | 방법 |
|---|---:|---|
| 입력·점수·상태 모델 | 14 | Node test runner |
| UI 이벤트 | 12 | 경량 DOM 어댑터, 실제 브라우저 아님 |
| 사례 데이터·페이지 연결 | 5 | 소스 해시, 데이터 전달 및 오류 처리 |
| 접근 제어 실습 | 5 | WSGI 함수 내부 호출 |
| SQL 실습 | 5 | 메모리 SQLite의 수정 전후 결과 |
| 쿠키 응답 실습 | 4 | Set-Cookie 파싱 및 미인증 거부 |

## 증거 파일

- `evidence/javascript-tests.tap`: Node 실행 로그
- `evidence/python-tests.txt`: Python 실행 로그
- `evidence/verification-summary.json`: 실행 시각, 테스트 수, 웹앱 소스 SHA-256
- `evidence/lab-results.json`: 실습 응답, 환경, 실습 소스 SHA-256
- `evidence/lab-before.json`, `evidence/lab-after.json`: 대시보드 입력 데이터

## 검증하지 않은 것

실제 브라우저의 레이아웃·키보드 초점·쿠키 강제 동작, 모바일 기기, Sites 로그인 경로, 운영 보안 진단, 성능/부하, LLM 정확도, 원격 GitHub Actions 실행은 검증하지 않았습니다. DOM 어댑터 테스트는 브라우저 E2E 테스트를 대체하지 않습니다.

## 재실행

```bash
python scripts/check_all.py
python -m lab.run_evidence
```

실습 코드를 바꾸면 증거를 다시 생성한 후 `check_all.py`를 실행해 소스 해시와 결과가 일치하는지 확인하세요.
