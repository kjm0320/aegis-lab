export const LEVELS = ['critical','high','medium','low','info'];
export const LABELS = {critical:'치명적',high:'높음',medium:'보통',low:'낮음',info:'정보'};
export const WEIGHTS = {critical:20, high:10, medium:5, low:1, info:0};
const BASE='https://cheatsheetseries.owasp.org/cheatsheets/';
export const GUIDES = {
  '접근 제어': {action:'서버에서 모든 요청의 사용자 권한과 리소스 소유권을 검증하고, 명시적으로 허용되지 않은 요청은 거부하세요.', check:'서로 다른 권한과 소유자를 가진 테스트 계정으로 접근 허용·거부 결과를 다시 확인하세요.',ref:BASE+'Authorization_Cheat_Sheet.html'},
  '입력 검증': {action:'데이터베이스 질의에 매개변수화된 쿼리를 사용하고, 입력의 타입·길이·허용 형식을 서버에서 검증하세요.',check:'허가된 테스트 환경에서 정상 입력과 비정상 입력을 비교하고, 쿼리 구성에 사용자 입력이 직접 결합되지 않는지 코드로 검토하세요.',ref:BASE+'SQL_Injection_Prevention_Cheat_Sheet.html'},
  '세션 관리': {action:'세션 쿠키에 Secure·HttpOnly를 적용하고 서비스 흐름에 맞는 SameSite 정책을 설정하세요. 로그인·권한 변경 시 세션을 재발급하세요.',check:'HTTPS 응답의 Set-Cookie 속성과 로그아웃 후 세션 만료 동작을 확인하세요.',ref:BASE+'Session_Management_Cheat_Sheet.html'},
  '보안 헤더': {action:'서비스 리소스에 맞는 Content-Security-Policy를 설계하고 Report-Only 검증 후 적용하세요. X-Content-Type-Options: nosniff도 검토하세요.',check:'허가된 응답 캡처에서 헤더를 확인하고 실제 화면·인증·외부 리소스 흐름의 회귀 여부를 검증하세요.',ref:BASE+'HTTP_Headers_Cheat_Sheet.html'},
  '정보 노출': {action:'불필요한 서버 버전 정보와 상세 오류를 응답에서 제거하고, 민감한 진단 정보는 접근이 통제된 서버 로그에만 기록하세요.',check:'오류 응답과 정적 리소스에 내부 경로·비밀키·상세 버전 정보가 남지 않았는지 확인하세요.',ref:BASE+'Error_Handling_Cheat_Sheet.html'},
  '기타': {action:'입력된 증거와 영향을 담당자가 검토하고 서비스 환경에 맞는 원인 조치를 계획하세요. 변경 후 동일한 허가 범위에서 재검증하세요.',check:'발견 조건을 다시 확인하고 증거와 검토 결과를 기록하세요.',ref:BASE+'Secure_Code_Review_Cheat_Sheet.html'}
};
const text=(v,max=2000)=>typeof v==='string'?v.trim().slice(0,max):'';
export function validate(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('최상위 데이터는 JSON 객체여야 합니다.');
  const target=text(raw.target,160); if(!target)throw new Error('진단 대상 이름(target)을 입력해 주세요.');
  if(!Array.isArray(raw.findings)||raw.findings.length<1||raw.findings.length>200)throw new Error('findings에는 1~200개의 문제를 입력해 주세요. 점검 범위가 없는 빈 보고서는 분석하지 않습니다.');
  const seen=new Set();
  const findings=raw.findings.map((f,i)=>{
    if(!f||typeof f!=='object'||Array.isArray(f))throw new Error(`${i+1}번째 문제는 객체여야 합니다.`);
    const title=text(f.title,200);if(!title)throw new Error(`${i+1}번째 문제의 제목(title)이 필요합니다.`);
    if(!LEVELS.includes(f.severity))throw new Error(`${i+1}번째 심각도는 critical, high, medium, low, info 중 하나여야 합니다.`);
    if(f.status!==undefined&&!['open','resolved'].includes(f.status))throw new Error(`${i+1}번째 상태는 open 또는 resolved여야 합니다.`);
    const id=text(f.id,80)||`F-${String(i+1).padStart(3,'0')}`;if(seen.has(id))throw new Error(`문제 ID가 중복되었습니다: ${id}`);seen.add(id);
    const category=Object.hasOwn(GUIDES,f.category)?f.category:'기타';
    return {id,title,severity:f.severity,category,location:text(f.location,300)||'위치 미입력',evidence:text(f.evidence,4000)||'증거가 입력되지 않았습니다. 담당자의 확인이 필요합니다.',recommendation:text(f.recommendation,4000),severityReason:text(f.severityReason,2000),verification:text(f.verification,4000),status:f.status||'open'};
  });
  return {target,source:text(raw.source,160)||'직접 입력',isSample:raw.isSample===true,analyzedAt:new Date().toISOString(),findings};
}
export function parseInput(input){
  if(input.length>1000000)throw new Error('입력은 1MB 이하로 제한됩니다.');
  let raw;try{raw=JSON.parse(input)}catch{throw new Error('JSON 문법을 확인해 주세요. 큰따옴표, 쉼표, 중괄호가 올바른지 확인하세요.');}
  return validate(raw);
}
export function summarize(data){
 const open=data.findings.filter(f=>f.status==='open');
 const counts=Object.fromEntries(LEVELS.map(l=>[l,open.filter(f=>f.severity===l).length]));
 const score=Math.max(0,100-open.reduce((s,f)=>s+WEIGHTS[f.severity],0));
 const baseline=Math.max(0,100-data.findings.reduce((s,f)=>s+WEIGHTS[f.severity],0));
 return {score,baseline,gain:score-baseline,open:open.length,total:data.findings.length,resolved:data.findings.length-open.length,urgent:counts.critical+counts.high,counts,completion:Math.round((data.findings.length-open.length)/data.findings.length*100)};
}
export function prioritize(data){return data.findings.filter(f=>f.status==='open').sort((a,b)=>LEVELS.indexOf(a.severity)-LEVELS.indexOf(b.severity)||a.id.localeCompare(b.id));}
export function filterFindings(data,{status='all',severity='all',query=''}={}){const q=query.trim().toLowerCase();return [...data.findings].filter(f=>(status==='all'||f.status===status)&&(severity==='all'||f.severity===severity)&&`${f.title} ${f.category} ${f.location} ${f.id}`.toLowerCase().includes(q)).sort((a,b)=>Number(a.status==='resolved')-Number(b.status==='resolved')||LEVELS.indexOf(a.severity)-LEVELS.indexOf(b.severity));}
export function toggleFinding(data,id,verification=''){const finding=data.findings.find(f=>f.id===id);if(!finding)throw new Error('문제를 찾을 수 없습니다.');const note=text(verification,4000);if(finding.status==='open'&&note.length<10)throw new Error('재검증 방법과 결과를 10자 이상 기록해 주세요.');return {...data,findings:data.findings.map(f=>f.id===id?{...f,status:f.status==='open'?'resolved':'open',verification:f.status==='open'?note:''}:f)};}
export function exportData(data){return JSON.stringify({schemaVersion:1,target:data.target,source:data.source,analyzedAt:data.analyzedAt,scoring:{method:'100 - 미조치 항목 심각도 가중치 합계 (최저 0)',weights:WEIGHTS,scope:'입력된 문제만 평가하며 CVSS나 전체 사이트 안전성 인증이 아닙니다.'},summary:summarize(data),findings:data.findings},null,2);}
export function createSample(){return validate({target:'demo-commerce.test',source:'허가된 테스트 결과 · 데모 보고서',isSample:true,findings:[
 {id:'AEG-001',title:'다른 사용자의 주문 정보에 접근 가능',severity:'critical',category:'접근 제어',location:'/api/orders/:id',evidence:'[가상 예시] 테스트 계정 A가 계정 B 소유의 주문 조회에 성공했습니다. 리소스 소유권 검증 누락이 보고되었습니다.',status:'open'},
 {id:'AEG-002',title:'세션 쿠키 보안 속성 누락',severity:'high',category:'세션 관리',location:'Set-Cookie · session_id',evidence:'[가상 예시] 제공된 응답 기록에서 세션 쿠키의 Secure 및 HttpOnly 속성이 확인되지 않았습니다.',status:'open'},
 {id:'AEG-003',title:'콘텐츠 보안 정책(CSP) 미설정',severity:'medium',category:'보안 헤더',location:'응답 헤더 · Content-Security-Policy',evidence:'[가상 예시] 테스트 응답 헤더에 Content-Security-Policy가 포함되어 있지 않습니다.',status:'open'},
 {id:'AEG-004',title:'응답 헤더에 서버 버전 노출',severity:'low',category:'정보 노출',location:'응답 헤더 · Server',evidence:'[가상 예시] Server 헤더에서 사용 중인 웹 서버의 상세 버전이 노출되었습니다.',status:'open'},
 {id:'AEG-005',title:'검색 쿼리의 사용자 입력 직접 결합',severity:'high',category:'입력 검증',location:'/api/search',evidence:'[가상 예시] 매개변수화 쿼리로 변경 후 코드 검토와 허가된 회귀 테스트를 완료했습니다.',status:'resolved'},
 {id:'AEG-006',title:'상세 오류 메시지에 내부 경로 노출',severity:'low',category:'정보 노출',location:'/api/products',evidence:'[가상 예시] 일반 오류 응답으로 변경하고 내부 경로 미노출을 확인했습니다.',status:'resolved'}]});}
