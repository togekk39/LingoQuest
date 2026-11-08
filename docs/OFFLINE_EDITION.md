# LingoQuest 1.2 離線版

最新產品決策是先完成獨立離線 App，課程可經 GitHub 下載更新；其他線上服務待重新規劃。此決策優先於舊規格中的伺服器判分、線上帳號與答案不得下發等線上架構假設。

## 執行邊界

- 第一次啟動即使用內建課程包，載入教材、判分與存檔不會要求連線。
- 不註冊／登入、不取得 JWT、不呼叫 OpenAI／Azure／Supabase，也不送出學習事件、錄音或分析資料。
- 所有學習與個人挑戰結果由 `packages/offline-engine` 決定；相同答題事件不會重複給獎勵。
- `apps/mobile/src/lib/api.ts` 保留既有畫面的呼叫介面，但只分派到本機引擎，不是 HTTP API client。
- `apps/api` 與 `supabase` 是保留的舊原型，不是離線 App 啟動、測試或使用所需的服務。
- 只有使用者在內容管理畫面按下 `Descargar e instalar`，才對指定 HTTPS GitHub 位置發出下載請求。沒有背景自動更新或 GitHub REST API 依賴。

Android 儲存使用 `expo-sqlite`，瀏覽器使用本機儲存；個人進度與活動課程包分開保存。瀏覽器靜態產物附 service worker，用於完成首次載入後的離線重新啟動。正式 Android 產物直接包含教材及字型；Expo Go 開發時的 Metro 連線不代表成品需要後端。

## 為何不用 OBB

第一版內容約 275 KB（269 KiB），包含 32 課／320 題、13 級挑戰規則及題庫、12 題程度診斷、40 組發音文字練習與兩個文字任務。沒有大型影片或預錄音訊。

`.lqp.json` 是有版本、結構與完整性檢查的 UTF-8 JSON envelope，可用一般檔案下載或選檔器匯入，Android 和瀏覽器共用。OBB 對這種小型文字內容沒有優勢，且牽涉 APK expansion 的發行方式。未來如果增加大型錄音，可新增格式版本及媒體資產包，現在不預先接入下載服務或媒體 API。

課程包包含離線判分答案。裝置擁有者可以查看或修改本機資料，因此此版明確定位為個人練習；不把本機分數當作可信的線上排名或官方能力證明。

## 建置與發布內容

原始內容編寫於 `content/source/curriculum.ts`、`content/source/challenges.ts`。在 repository 根目錄執行：

```bash
npm run packs:build
```

預設產生內容版本 `1.0.0`、最低 App 版本 `1.2.0`：

```text
content/releases/lingoquest-es419-enus-a1a2-1.0.0.lqp.json
content/releases/lingoquest-es419-enus-a1a2-1.0.0.lqp.json.sha256
content/releases/catalog.json
apps/mobile/src/content/bundled-course.json
```

發布檔案的目標 tag 為 `course-v1.0.0`，repo 為 `togekk39/LingoQuest`。課程包已發布到獨立分支 `course-pack-v1.0.0`，commit `f3e609e468a69630e14b544197a346dca79a093e`；實際下載的 274765 bytes 與本機已驗證檔完全一致。GitHub Release 的 tag／附件流程仍留作後續版本使用。管理者可把發布包、摘要檔與 catalog 上傳為同一個 GitHub Release 的附件。App 使用直接檔案網址，例如：

```text
https://github.com/togekk39/LingoQuest/releases/download/course-v1.0.0/lingoquest-es419-enus-a1a2-1.0.0.lqp.json
```

上面的 Releases URL 仍是預備目標。已發布的靜態檔使用 `apps/mobile/src/content/course-source.json` 中的 commit 固定 raw.githubusercontent.com URL；下載預設填入此連結，僅在使用者按下按鈕時讀取。`catalog.json` 提供版本／大小／完整檔案摘要，供發布管理與人工核對；目前 App 的下載入口直接讀取 `.lqp.json`，不會先請求 catalog 或背景查詢 release。

`.github/workflows/course-release.yml` 已準備好：推送 `course-v*` tag 時，會驗證已提交的版本化檔案、catalog 與完整 SHA-256，再建立 Release 附件。它不會重新產生不同時間戳的同版課程，也不會覆寫已存在的 Release。

發佈前先執行 `npm run packs:build`、`npm run packs:verify`，並提交相符的版本化檔案，再推送對應 tag。此工作階段已發布課程分支，未推送 tag 或建立線上 Release。

更改課程版本或 repository 可設定 `COURSE_PACK_VERSION`、`COURSE_PACK_CREATED_AT`、`COURSE_PACK_REPOSITORY`。發布後保留相同版本的原始 bytes；修改內容時升版並重新產生摘要。

## 安裝與更新保護

`Perfil` → `Contenido sin conexión` 提供 `Importar paquete de curso` 及 `Descargar e instalar`。

1. 下載只接受指定 HTTPS GitHub 網域／release 路徑；有大小上限與逾時，沒有帳號 token 或追蹤參數。
2. 解析上限 4 MiB，嚴格檢查 format、schema、字串／集合限制、穩定 ID、課程與情境引用、可接受答案、完整 13 級與 App 版本相容。
3. 內部 SHA-256 綁定 canonical manifest metadata 與 payload，能偵測內容或 metadata 意外變更。它是完整性檢查，不是作者身分簽章；來源信任仍依賴使用者選擇的 HTTPS GitHub 來源。
4. 安裝只接受相同 `packageId` 的更新。拒絕降版、同版本但不同內容，以及會移除現有課程 ID 的更新。
5. 完整驗證後才以單次儲存替換活動包。錯誤、下載中斷或不相容包都不覆蓋原課程；XP、技能證據與課程完成紀錄保持在獨立本機資料中。
6. `Volver al curso incluido` 可切回內建內容，保留個人學習紀錄。

下載與匯入不會把尚未人工審查的教材改標為已審查。此版仍標示原創草稿。

## 本機個人資料與備份

只使用本機 profile。`Perfil` 的 `Exportar mis datos` 會產生 `lingoquest-respaldo.json`，由使用者選擇保存位置；不自動傳到 GitHub、雲端硬碟或其他服務。

`Restaurar respaldo` 會先讓使用者選檔，再確認覆蓋目前本機進度。引擎驗證備份格式、欄位與大小後才寫入；錯誤備份不能取代舊資料。進行中的挑戰場次不隨備份恢復，避免重啟後出現過期倒數。

備份不是課程包：課程包只有教材，備份包含使用者的本機學習紀錄。換手機、刪除 App 或清除瀏覽器資料前應先匯出備份。重設本機學習資料不會刪除隨 App 安裝的內建課程。

## 語音與錄音

- 40 組練習是文字參考句及發音提示，沒有預錄示範音訊檔。
- 瀏覽器僅使用能確認 `localService` 的本機英文語音；沒有可驗證離線語音時顯示提示，仍可讀文字及自行錄音。
- Android 目前不啟用無法證明不需連線的 TTS voice；未來可透過原生離線語音橋接或離線音訊包補上，現在不接雲端代替。
- 麥克風始終可略過。錄音只在裝置中暫存，可重播，離開該次練習即刪除；沒有上傳、轉錄或音素評分服務。

## 執行與驗證

```bash
npm ci
npm run packs:build
npm run check
npm test
npm run build:web
npm run build:android
```

在另一個終端執行 `npm run preview`，再執行 `npm run test:e2e`，測試的是無 API 的純靜態 App。課程包、引擎與瀏覽器測試的執行結果由 `docs/VERIFICATION.md` 記錄。

`npm run build:android` 是 Expo Android Hermes 執行碼建置，不是簽章 APK／AAB，也不代表真機功能或商店發行驗收完成。離線版後續發行需要簽章安裝檔、Android 裝置測試、教材人工審查及隱私說明；沒有任何線上服務憑證是此版的前置條件。
