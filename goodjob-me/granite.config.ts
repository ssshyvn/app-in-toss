import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: process.env.AIT_APP_NAME ?? "goodjob-me",
  brand: {
    displayName: "오늘도 대단한 척",
    primaryColor: "#FFD64A",
    icon: process.env.AIT_BRAND_ICON_URL ?? "https://oneuldo-awesome.ssshyvn.chatgpt.site/app-icon.png",
  },
  web: {
    host: "localhost",
    port: 5174,
    commands: {
      dev: "pnpm run dev:ait-web",
      build: "pnpm run build:ait-web",
    },
  },
  permissions: [],
  outdir: "ait-dist",
  webViewProps: {
    type: "partner",
    bounces: true,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsBackForwardNavigationGestures: false,
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
});
