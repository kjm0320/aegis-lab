export const evidence = {
  "generatedAt": "2026-10-20T06:51:20.561951+00:00",
  "executor": "Codex automated execution; user hands-on review pending",
  "environment": {
    "python": "3.12.14",
    "transport": "in-process WSGI; no listener and no external traffic",
    "data": "synthetic fixtures only",
    "authentication": "trusted test principal; password authentication out of scope"
  },
  "tests": {
    "total": 14,
    "failures": 0,
    "errors": 0,
    "passed": 14
  },
  "sourceHashes": {
    "lab/application.py": "38419109d451bfed531780905b9c6b55dfb2c9780650b1c1121827e3c994e0e5",
    "lab/test_security.py": "1b3f7f2d235fbf5cb592f36beeaf6ce8348716a15569200352208a14d191de49"
  },
  "cases": [
    {
      "id": "LAB-001",
      "title": "주문 조회의 객체 소유권 검증 누락",
      "severity": "high",
      "category": "접근 제어",
      "location": "GET /api/orders/202",
      "before": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json; charset=utf-8"
        },
        "body": {
          "id": 202,
          "owner": "bob",
          "item": "Private sample order"
        }
      },
      "after": {
        "status": 403,
        "headers": {
          "Content-Type": "application/json; charset=utf-8"
        },
        "body": {
          "error": "forbidden"
        }
      },
      "condition": "인증된 테스트 사용자 alice가 bob 소유의 주문 202 조회",
      "reason": "다른 사용자 소유 주문의 내용이 노출되는 기밀성 영향. 합성 데이터와 제한된 실습 범위에 근거한 high 분류.",
      "rootCause": "인증 성공 후 주문 소유자와 요청 주체를 비교하지 않음.",
      "fix": "응답 생성 전에 order.owner와 인증 주체를 비교하고 불일치 시 403을 반환.",
      "regression": "본인 주문 조회 200 유지, 다른 사용자 주문 403 및 본문 미노출, 미인증 401, 없는 주문 404.",
      "reference": "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
    },
    {
      "id": "LAB-002",
      "title": "검색 쿼리 문자열 결합으로 공개 범위 우회",
      "severity": "high",
      "category": "입력 검증",
      "location": "GET /api/search",
      "before": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json; charset=utf-8"
        },
        "body": {
          "products": [
            {
              "id": 1,
              "name": "Desk"
            },
            {
              "id": 2,
              "name": "Notebook"
            },
            {
              "id": 3,
              "name": "Internal sample"
            }
          ]
        }
      },
      "after": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json; charset=utf-8"
        },
        "body": {
          "products": []
        }
      },
      "condition": "합성 SQLite 데이터에 고정된 테스트 문자열을 전달",
      "reason": "비공개 레코드의 조회가 재현되어 high로 분류. 데이터 수정·운영 DB 침해는 시험하지 않음.",
      "rootCause": "사용자 문자열을 SQL 문장에 직접 삽입해 질의의 조건을 변경할 수 있음.",
      "fix": "SQL 자리표시자와 바인딩 매개변수로 명령과 데이터를 분리.",
      "regression": "동일 입력은 0건, 정상 검색 Desk는 1건 유지, 작은따옴표 포함 입력 200, 빈 검색에서 비공개 레코드 제외.",
      "reference": "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
    },
    {
      "id": "LAB-003",
      "title": "세션 쿠키 보호 속성 누락",
      "severity": "medium",
      "category": "세션 관리",
      "location": "POST /session/refresh",
      "before": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json; charset=utf-8",
          "Set-Cookie": "lab_session=SYNTHETIC_ONLY; Path=/"
        },
        "body": {
          "message": "synthetic cookie issued"
        }
      },
      "after": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json; charset=utf-8",
          "Set-Cookie": "lab_session=SYNTHETIC_ONLY; Path=/; Secure; HttpOnly; SameSite=Lax"
        },
        "body": {
          "message": "synthetic cookie issued"
        }
      },
      "condition": "인증된 테스트 사용자에 대한 합성 쿠키 발급 응답 검사",
      "reason": "보호 속성 누락만 확인했으며 세션 탈취나 TLS 공격을 재현한 것은 아니므로 medium으로 분류.",
      "rootCause": "쿠키 발급에 Path만 지정하고 보안 속성을 생략.",
      "fix": "Secure, HttpOnly, SameSite=Lax를 명시. SameSite는 실제 서비스 인증 흐름에 맞춰 별도 검토.",
      "regression": "세 속성 및 Path 확인, 정상 발급 200 유지, 미인증 발급 거부. 브라우저 쿠키 동작은 미검증.",
      "reference": "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"
    }
  ]
};
export const beforeReport = {
  "target": "aegis-local-lab (in-process)",
  "source": "Codex가 실행한 합성 데이터 실습 / before",
  "findings": [
    {
      "id": "LAB-001",
      "title": "주문 조회의 객체 소유권 검증 누락",
      "severity": "high",
      "category": "접근 제어",
      "location": "GET /api/orders/202",
      "evidence": "{\"status\": 200, \"headers\": {\"Content-Type\": \"application/json; charset=utf-8\"}, \"body\": {\"id\": 202, \"owner\": \"bob\", \"item\": \"Private sample order\"}}",
      "recommendation": "응답 생성 전에 order.owner와 인증 주체를 비교하고 불일치 시 403을 반환.",
      "severityReason": "다른 사용자 소유 주문의 내용이 노출되는 기밀성 영향. 합성 데이터와 제한된 실습 범위에 근거한 high 분류.",
      "status": "open",
      "verification": ""
    },
    {
      "id": "LAB-002",
      "title": "검색 쿼리 문자열 결합으로 공개 범위 우회",
      "severity": "high",
      "category": "입력 검증",
      "location": "GET /api/search",
      "evidence": "{\"status\": 200, \"headers\": {\"Content-Type\": \"application/json; charset=utf-8\"}, \"body\": {\"products\": [{\"id\": 1, \"name\": \"Desk\"}, {\"id\": 2, \"name\": \"Notebook\"}, {\"id\": 3, \"name\": \"Internal sample\"}]}}",
      "recommendation": "SQL 자리표시자와 바인딩 매개변수로 명령과 데이터를 분리.",
      "severityReason": "비공개 레코드의 조회가 재현되어 high로 분류. 데이터 수정·운영 DB 침해는 시험하지 않음.",
      "status": "open",
      "verification": ""
    },
    {
      "id": "LAB-003",
      "title": "세션 쿠키 보호 속성 누락",
      "severity": "medium",
      "category": "세션 관리",
      "location": "POST /session/refresh",
      "evidence": "{\"status\": 200, \"headers\": {\"Content-Type\": \"application/json; charset=utf-8\", \"Set-Cookie\": \"lab_session=SYNTHETIC_ONLY; Path=/\"}, \"body\": {\"message\": \"synthetic cookie issued\"}}",
      "recommendation": "Secure, HttpOnly, SameSite=Lax를 명시. SameSite는 실제 서비스 인증 흐름에 맞춰 별도 검토.",
      "severityReason": "보호 속성 누락만 확인했으며 세션 탈취나 TLS 공격을 재현한 것은 아니므로 medium으로 분류.",
      "status": "open",
      "verification": ""
    }
  ]
};
export const afterReport = {
  "target": "aegis-local-lab (in-process)",
  "source": "Codex가 실행한 합성 데이터 실습 / after",
  "findings": [
    {
      "id": "LAB-001",
      "title": "주문 조회의 객체 소유권 검증 누락",
      "severity": "high",
      "category": "접근 제어",
      "location": "GET /api/orders/202",
      "evidence": "{\"status\": 200, \"headers\": {\"Content-Type\": \"application/json; charset=utf-8\"}, \"body\": {\"id\": 202, \"owner\": \"bob\", \"item\": \"Private sample order\"}}",
      "recommendation": "응답 생성 전에 order.owner와 인증 주체를 비교하고 불일치 시 403을 반환.",
      "severityReason": "다른 사용자 소유 주문의 내용이 노출되는 기밀성 영향. 합성 데이터와 제한된 실습 범위에 근거한 high 분류.",
      "status": "resolved",
      "verification": "본인 주문 조회 200 유지, 다른 사용자 주문 403 및 본문 미노출, 미인증 401, 없는 주문 404. 실행: 2026-10-20T06:51:20.561951+00:00"
    },
    {
      "id": "LAB-002",
      "title": "검색 쿼리 문자열 결합으로 공개 범위 우회",
      "severity": "high",
      "category": "입력 검증",
      "location": "GET /api/search",
      "evidence": "{\"status\": 200, \"headers\": {\"Content-Type\": \"application/json; charset=utf-8\"}, \"body\": {\"products\": [{\"id\": 1, \"name\": \"Desk\"}, {\"id\": 2, \"name\": \"Notebook\"}, {\"id\": 3, \"name\": \"Internal sample\"}]}}",
      "recommendation": "SQL 자리표시자와 바인딩 매개변수로 명령과 데이터를 분리.",
      "severityReason": "비공개 레코드의 조회가 재현되어 high로 분류. 데이터 수정·운영 DB 침해는 시험하지 않음.",
      "status": "resolved",
      "verification": "동일 입력은 0건, 정상 검색 Desk는 1건 유지, 작은따옴표 포함 입력 200, 빈 검색에서 비공개 레코드 제외. 실행: 2026-10-20T06:51:20.561951+00:00"
    },
    {
      "id": "LAB-003",
      "title": "세션 쿠키 보호 속성 누락",
      "severity": "medium",
      "category": "세션 관리",
      "location": "POST /session/refresh",
      "evidence": "{\"status\": 200, \"headers\": {\"Content-Type\": \"application/json; charset=utf-8\", \"Set-Cookie\": \"lab_session=SYNTHETIC_ONLY; Path=/\"}, \"body\": {\"message\": \"synthetic cookie issued\"}}",
      "recommendation": "Secure, HttpOnly, SameSite=Lax를 명시. SameSite는 실제 서비스 인증 흐름에 맞춰 별도 검토.",
      "severityReason": "보호 속성 누락만 확인했으며 세션 탈취나 TLS 공격을 재현한 것은 아니므로 medium으로 분류.",
      "status": "resolved",
      "verification": "세 속성 및 Path 확인, 정상 발급 200 유지, 미인증 발급 거부. 브라우저 쿠키 동작은 미검증. 실행: 2026-10-20T06:51:20.561951+00:00"
    }
  ]
};
