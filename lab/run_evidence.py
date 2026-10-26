"""Run tests then produce reproducible evidence and dashboard-compatible data."""
import hashlib
import json
import platform
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from lab.application import request

ROOT = Path(__file__).resolve().parents[1]
REF = "https://cheatsheetseries.owasp.org/cheatsheets/"


def main():
    suite = unittest.defaultTestLoader.loadTestsFromName("lab.test_security")
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        return 1
    now = datetime.now(timezone.utc).isoformat()
    cases = [
      {"id":"LAB-001","title":"주문 조회의 객체 소유권 검증 누락","severity":"high","category":"접근 제어","location":"GET /api/orders/202", "before":request(False,"/api/orders/202",actor="alice"),"after":request(True,"/api/orders/202",actor="alice"),"condition":"인증된 테스트 사용자 alice가 bob 소유의 주문 202 조회", "reason":"다른 사용자 소유 주문의 내용이 노출되는 기밀성 영향. 합성 데이터와 제한된 실습 범위에 근거한 high 분류.","rootCause":"인증 성공 후 주문 소유자와 요청 주체를 비교하지 않음.","fix":"응답 생성 전에 order.owner와 인증 주체를 비교하고 불일치 시 403을 반환.","regression":"본인 주문 조회 200 유지, 다른 사용자 주문 403 및 본문 미노출, 미인증 401, 없는 주문 404.","reference":REF+"Authorization_Cheat_Sheet.html"},
      {"id":"LAB-002","title":"검색 쿼리 문자열 결합으로 공개 범위 우회","severity":"high","category":"입력 검증","location":"GET /api/search", "before":request(False,"/api/search",query={"q":"%' OR 1=1 --"}),"after":request(True,"/api/search",query={"q":"%' OR 1=1 --"}),"condition":"합성 SQLite 데이터에 고정된 테스트 문자열을 전달", "reason":"비공개 레코드의 조회가 재현되어 high로 분류. 데이터 수정·운영 DB 침해는 시험하지 않음.","rootCause":"사용자 문자열을 SQL 문장에 직접 삽입해 질의의 조건을 변경할 수 있음.","fix":"SQL 자리표시자와 바인딩 매개변수로 명령과 데이터를 분리.","regression":"동일 입력은 0건, 정상 검색 Desk는 1건 유지, 작은따옴표 포함 입력 200, 빈 검색에서 비공개 레코드 제외.","reference":REF+"SQL_Injection_Prevention_Cheat_Sheet.html"},
      {"id":"LAB-003","title":"세션 쿠키 보호 속성 누락","severity":"medium","category":"세션 관리","location":"POST /session/refresh", "before":request(False,"/session/refresh",actor="alice",method="POST"),"after":request(True,"/session/refresh",actor="alice",method="POST"),"condition":"인증된 테스트 사용자에 대한 합성 쿠키 발급 응답 검사", "reason":"보호 속성 누락만 확인했으며 세션 탈취나 TLS 공격을 재현한 것은 아니므로 medium으로 분류.","rootCause":"쿠키 발급에 Path만 지정하고 보안 속성을 생략.","fix":"Secure, HttpOnly, SameSite=Lax를 명시. SameSite는 실제 서비스 인증 흐름에 맞춰 별도 검토.","regression":"세 속성 및 Path 확인, 정상 발급 200 유지, 미인증 발급 거부. 브라우저 쿠키 동작은 미검증.","reference":REF+"Session_Management_Cheat_Sheet.html"}
    ]
    evidence = {"generatedAt":now,"executor":"Codex automated execution; user hands-on review pending","environment":{"python":platform.python_version(),"transport":"in-process WSGI; no listener and no external traffic","data":"synthetic fixtures only","authentication":"trusted test principal; password authentication out of scope"},"tests":{"total":result.testsRun,"failures":len(result.failures),"errors":len(result.errors),"passed":result.testsRun-len(result.failures)-len(result.errors)},"sourceHashes":{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'lab/application.py',ROOT/'lab/test_security.py')},"cases":cases}
    out=ROOT/'evidence';out.mkdir(exist_ok=True)
    (out/'lab-results.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding='utf-8')
    for stage in ('before','after'):
      findings=[]
      for c in cases:
        f={k:c[k] for k in ('id','title','severity','category','location')}
        f.update(evidence=json.dumps(c['before'],ensure_ascii=False),recommendation=c['fix'],severityReason=c['reason'],status='resolved' if stage=='after' else 'open',verification=(c['regression']+' 실행: '+now if stage=='after' else ''))
        findings.append(f)
      report={"target":"aegis-local-lab (in-process)","source":"Codex가 실행한 합성 데이터 실습 / "+stage,"findings":findings}
      (out/f'lab-{stage}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    (ROOT/'dist/case-data.mjs').write_text('export const evidence = '+json.dumps(evidence,ensure_ascii=False,indent=2)+';\nexport const beforeReport = '+(out/'lab-before.json').read_text(encoding='utf-8')+';\nexport const afterReport = '+(out/'lab-after.json').read_text(encoding='utf-8')+';\n',encoding='utf-8')
    print(f"Evidence written: {result.testsRun} tests passed; 3 cases; no external traffic.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
