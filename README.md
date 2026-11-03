# 토론 퀘스트

중학교 1학년 눈높이의 사회 토론 활동 사이트입니다. HTML·CSS·JavaScript로 동작하며 별도 서버나 회원가입은 필요하지 않습니다.

## 사용
왼쪽에서 주제를 선택 → 가상 상황 읽기 → 찬반 선택 → 주장과 근거 작성 → 내 기록 확인 / PDF 다운로드.
주장 200자, 근거 각각 500자. 입장·주장·근거 1을 작성하면 완료됩니다. 내용의 옳고 그름을 자동 평가하지 않습니다.

주제별 기록은 현재 사이트 주소의 브라우저 localStorage에 저장됩니다. 다른 기기·브라우저와 공유되지 않습니다. 시크릿 모드, 저장 차단, 브라우저 데이터 삭제에 따라 기록이 유지되지 않을 수 있습니다. 공용 기기에서는 사용 후 '이 주제 기록 삭제'를 이용하세요. PDF는 기기 안에서 생성됩니다.

## GitHub Pages 배포
1. `youe2019-commits/debate-quest` 공개 저장소를 생성합니다.
2. 이 프로젝트의 배포 파일을 `main` 브랜치 루트에 업로드합니다. `.tools`, `node_modules`, `qa`, `.tmp`는 업로드하지 않습니다.
3. 저장소 Settings → Pages → Deploy from a branch → main / (root) → Save.
4. 배포 완료 후 https://youe2019-commits.github.io/debate-quest/ 를 확인합니다.
5. 각 `#sns`, `#cctv`, `#forest` 주소와 PDF 버튼을 확인합니다.

배포 폴더를 압축한 파일에는 운영에 필요한 파일만 포함합니다. GitHub에는 ZIP 자체가 아니라 압축을 푼 파일과 폴더를 올립니다. 웹사이트 공개와 학생 기록 공개는 별개입니다. 학생 작성 내용은 저장소에 포함되지 않습니다.

## 수정
- `content.js`: 논제, 제시문, 용어, 생각거리, 성취기준.
- `styles.css`: 색상·레이아웃·모바일·인쇄 스타일.
- `assets/*.svg`: 상황 그림.
- `storage.js`: 개인 기록 저장. 기존 기록 호환성을 유지하거나 버전을 명시적으로 올리세요.
- `pdf.js`: A4 PDF 조판. 한글 글꼴이 필요합니다.

수정 파일을 main에 커밋하면 Pages가 다시 배포됩니다. 저장 키와 topic ID를 바꾸지 않으면 기존 작성 기록을 유지합니다. 외부 서버·API 키·추적 도구는 사용하지 않습니다.

## 로컬 실행 및 검증
Node.js 22 이상 권장. `node preview.mjs` 실행 후 http://127.0.0.1:4173 접속.
파일을 더블클릭하는 file:// 방식은 JavaScript 모듈과 글꼴 로딩이 제한되므로 HTTP 서버를 사용하세요.

`npm install` 후 `npm test`로 데이터·저장·DOM 상호작용을 검증합니다.
`npm run test:pdf`는 6종 PDF와 최대 길이 작성본을 `qa/pdfs`에 만들고 페이지별 PNG·텍스트 검사 결과를 생성합니다.
자동 DOM 검사는 실제 브라우저의 시각·키보드 검증을 대신하지 않습니다.

## 자료와 라이선스
성취기준: 2022 개정 사회과 교육과정, 국가교육위원회 고시 제2024-3호 별책 7.
교육과정 MCP 자료 `kr-nec-2024-3-annex7`, 첨부번호 10003993. PDF 60쪽·62쪽·66쪽.
중학교 1~3학년군 성취기준을 중1 수준으로 재구성했습니다. 원문 띄어쓰기를 유지했습니다.
제시문·그림은 창작 가상 상황이며 현행 법·제도를 설명하지 않습니다.

- jsPDF 3.0.4: MIT, `assets/vendor/LICENSE-jsPDF.txt`
- Nanum Gothic: SIL Open Font License, `assets/fonts/OFL.txt`
- 폰트 출처: https://github.com/google/fonts/tree/main/ofl/nanumgothic
- jsPDF 출처: https://github.com/parallax/jsPDF/tree/v3.0.4
