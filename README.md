# LingoQuest · Offline edition 1.2

Android 優先的離線英語學習 App，使用 Expo／React Native／TypeScript。介面為拉美西語 `es-419`，目標英語為 `en-US`。**安裝後，第一啟動就能學完整課程，不需要帳號、後端或任何線上 API。**

依最新需求，課程、判分、XP、技能證據、複習與挑戰均改在裝置上執行。唯一可選網路操作是使用者主動從 GitHub 下載課程更新；OpenAI、Azure、Supabase、線上登入及同步全部暫緩。

## 開發與預覽

需要 Node.js 24+ 與 npm。從 repository 根目錄執行：

```bash
npm ci
npm run dev
```

瀏覽器開啟 `http://localhost:8081`。此指令只啟動 Expo，不啟動 API server，也不需要 `.env` 或雲端憑證。

建置後以純靜態服務預覽：

```bash
npm run build:web
npm run preview
```

開啟 `http://localhost:3000`。這個服務只提供網頁、字型等靜態資產，沒有 `/v1` API。瀏覽器版首次載入並安裝離線快取後，可在斷網時重新開啟；Android 正式安裝產物則直接內含課程與字型。

Android 開發預覽：

```bash
npm run android
```

使用相容 SDK 54 的 Expo Go／模擬器進行開發。`npm run build:android` 驗證 Android Hermes 執行碼；可獨立安裝的 APK 由 GitHub Actions 建置。

## 自動 APK 建置與下載

完整原始碼存放於 [togekk39/LingoQuest](https://github.com/togekk39/LingoQuest)。每次 push commit（包含合併到 `main`）會啟動 [Android APK workflow](https://github.com/togekk39/LingoQuest/actions/workflows/android-apk.yml)，也可從 Actions 手動執行。

成功後，開啟該次 run 的 **Artifacts**，下載 `lingoquest-apk-...` ZIP，解壓縮並安裝 `.apk`。內附 SHA-256 與版本／commit 資訊，保留 30 天。APK 包含程式、課程與字型，不依賴 Expo Go 或開發伺服器；支援 ARM Android 7+。

此為固定公開測試憑證簽章的 standalone preview APK，可供安裝測試及後續測試版更新。正式商店版需另設正式簽章。建置流程不需要 Expo 帳號或付費 API，詳細說明見 [docs/APK_BUILDS.md](docs/APK_BUILDS.md)。

## 離線功能

- 8 單元 × 4 課、320 道原創示範練習；選擇、填空、重排、改錯、短句產出與西語解說。學習無倒數、無愛心懲罰，可一直重試，口說可略過。
- 12 題可選程度診斷、1／3／7／14 日複習、技能證據與本機 XP。課程完成、長期掌握與挑戰結果保持分開。
- 13 級個人挑戰及文法、克漏字、閱讀題型，計時、心數與結算全在本機；失敗不扣學習 XP 或課程進度。
- 40 組發音文字練習、可選錄音與重播；錄音不會上傳，離開練習即刪除。不連接雲端語音評分，也不捏造發音分數。
- 機場與求職有限狀態文字情境任務，無 AI API。
- 本機個人偏好、資料匯出／還原與重設。Android 以 SQLite 儲存；瀏覽器使用本機儲存，不同步到伺服器。

此包不含預先錄製的示範音訊。瀏覽器只有在能確認語音為裝置本機服務時才播放 TTS；Android 目前未啟用無法證明離線的系統語音，文字學習、自己錄音與重播仍可使用。

## 課程包與 GitHub

使用版本化 **`.lqp.json`**，而非 OBB。內建完整基礎包約 275 KB（269 KiB），包含教材、離線答案、13 級規則與文字發音練習；小型文字內容用 JSON 即可獨立更新、驗證及跨平台匯入，無需 OBB 的 APK expansion 發行流程。

```bash
npm run packs:build
npm run packs:verify
```

產物位於 `content/releases/`，含完整包、SHA-256 檔及靜態 `catalog.json`；App 內建副本位於 `apps/mobile/src/content/bundled-course.json`。目標 GitHub repo 為 `togekk39/LingoQuest`。**課程包已發布至 `course-pack-v1.0.0` 獨立分支，尚未建立 GitHub Release。** 發佈步驟見 [content/releases/README.md](content/releases/README.md)。

已實際下載並核對 SHA-256 的固定版本：

[課程包 v1.0.0](https://raw.githubusercontent.com/togekk39/LingoQuest/f3e609e468a69630e14b544197a346dca79a093e/content/releases/lingoquest-es419-enus-a1a2-1.0.0.lqp.json)

App 的下載欄位預先填入這個 commit 固定的 URL；不會自動連線。按下下載時會額外核對已知發布檔的完整 SHA-256 與大小。

在 `Perfil` → `Contenido sin conexión`：

- `Importar paquete de curso`：從 Android／瀏覽器檔案選擇器匯入，完全不需網路。
- `Descargar e instalar`：主動下載指定 GitHub Releases `.lqp.json` 檔；不使用 GitHub API token。
- 安裝前驗證大小、格式、引用、最低 App 版本、內容完整性與版本順序；拒絕降版或同版本不同內容。先完整驗證，再切換活動包。失敗保留原包，更新不清除個人進度。

目前 App 直接安裝課程檔並驗證其內部摘要；`catalog.json` 與外部 `.sha256` 提供發布資訊／額外人工核對，沒有背景自動檢查更新。完整設計見 [docs/OFFLINE_EDITION.md](docs/OFFLINE_EDITION.md)。

## 備份與換機

在 `Perfil` 選 `Exportar mis datos`，保存產生的 `lingoquest-respaldo.json`。新裝置先安裝 App，再選 `Restaurar respaldo` 匯入並確認覆蓋目前本機進度。備份只由使用者選擇儲存位置，不會自動上傳；還原不會恢復進行中的限時挑戰。

刪除 App、清除 Android 資料或清除瀏覽器儲存，會移除本機學習紀錄，請先匯出備份。

## 驗證

```bash
npm run packs:build
npm run packs:verify
npm run check
npm test
npm run build:web
npm run build:android
# 另一個終端先執行 npm run preview，再跑瀏覽器測試
npm run test:e2e
```

課程包測試涵蓋可攜 SHA-256、內容與 metadata 竄改、容量／版本限制、未知欄位、無效引用、重複 ID、選項答案與 catalog。離線引擎及瀏覽器測試涵蓋無後端啟動、本機判分、進度持久化、備份還原、內容匯入與更新失敗保留紀錄。實際執行結果見 `docs/VERIFICATION.md`。

## 結構與狀態

```text
apps/mobile           離線 Expo／React Native／web App
packages/offline-engine  本機學習、複習、判分、進度與挑戰
packages/course-pack     課程包格式、版本與 SHA-256 驗證
content/source          原創課程與挑戰的編寫來源
content/releases        準備上傳 GitHub Releases 的課程包
apps/api / supabase     舊線上原型與 SQL，保留備查，不接入本版
```

教材仍是待人工教育／語言審查的原創草稿，僅作個人學習與自我挑戰，不提供可信線上排名或官方評分。正式 Android 發行仍需正式簽章、真機、無障礙與隱私驗收；自動產生的測試 APK 不需要先設定任何線上帳號或付費服務。
