# 오늘도 대단한 척

사소한 일상을 과장된 RPG 업적으로 인정해 주는 모바일 미니앱입니다.

## 실행

- `pnpm dev`: 웹/Sites 개발 서버
- `pnpm build`: 웹/Sites 배포 빌드
- `pnpm dev:ait-web`: 앱인토스 WebView 개발 서버
- `pnpm build:ait-web`: 앱인토스 WebView 정적 빌드
- `pnpm ait:dev`: 앱인토스 Sandbox 개발 모드
- `pnpm ait:build`: 앱인토스 콘솔 업로드용 빌드

## 앱인토스

WebView SDK `@apps-in-toss/web-framework` 2.4.1을 사용합니다. 업적 획득 시
네이티브 `confetti` 햅틱, 토스 공유 링크와 공유 시트, 네이티브 Storage가
연결되며 일반 브라우저에서는 Web Share와 `localStorage`로 대체됩니다.

앱인토스 콘솔의 앱 ID는 `goodjob-me`입니다. 다른 앱 ID로 빌드하려면
`AIT_APP_NAME` 환경 변수를 실제 앱 ID로 설정하세요. 브랜드 아이콘 URL도
콘솔에 업로드한 정사각형 아이콘 URL로 교체할 수 있습니다.
