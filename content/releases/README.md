# Offline course release artifacts

本目錄保存可上傳到 GitHub Releases 的課程包與靜態目錄。產生檔案不會自動上傳、建立 release、推送 Git 或呼叫線上 API。課程 1.0.0 現已獨立發布至 `course-pack-v1.0.0` 分支，固定 commit 為 `f3e609e468a69630e14b544197a346dca79a093e`；可用對應 raw.githubusercontent.com 檔案網址下載。本文的 GitHub Releases URL 仍是後續 tag 發行目標。

在 repository 根目錄執行：

```bash
npm run packs:build
```

也可直接執行 `npx tsx scripts/build-course-pack.ts`。預設會產生：

- `lingoquest-es419-enus-a1a2-1.0.0.lqp.json`：完整課程包。
- 同名 `.sha256`：發布檔案摘要，供手動核對。
- `catalog.json`：App 可讀的靜態版本、下載位置、大小與摘要。
- `apps/mobile/src/content/bundled-course.json`：與發布檔相同的內建包。

首次課程包目標為 `https://github.com/togekk39/LingoQuest/releases/tag/course-v1.0.0`。以這個 tag 建立 GitHub Release，將上述三個 release artifacts 作為附件上傳，靜態 catalog 的發布位置為：

```text
https://github.com/togekk39/LingoQuest/releases/download/course-v1.0.0/catalog.json
```

目前 App 直接下載 `.lqp.json` 檔，不會先讀 catalog 或背景查詢 release。App 不需要 GitHub API token，也不應呼叫 GitHub REST API 搜尋帳號或 release。使用者可自行下載 `.lqp.json` 後離線匯入。

更新例子：

```bash
COURSE_PACK_VERSION=1.0.1 \
COURSE_PACK_CREATED_AT=2026-11-09T00:00:00.000Z \
npm run packs:build
```

然後以 `course-v1.0.1` 發佈新包與 catalog。更換來源 repo 可設定 `COURSE_PACK_REPOSITORY=owner/repository`。相同版本的已發布檔應保留原始位元組，不要只為改縮排重新儲存；真正內容變動要升版本並重新產生摘要。

本版不包含預先錄製的聲音或影片。瀏覽器僅在能驗證本機離線語音時播放示範；Android 目前不啟用無法確認離線的系統 TTS，仍可讀文字、自行錄音與重播。
