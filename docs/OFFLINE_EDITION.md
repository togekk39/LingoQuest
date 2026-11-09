# 整合課程離線架構

目前 App 是 1.3，課程包是 2.0.0/schema 2。`content/source` 編寫八單元、32 課，builder 產生同一份 bundled JSON、release JSON、catalog 與 SHA-256。具體教材模型與開發資料重設說明見 [INTEGRATED_CURRICULUM.md](INTEGRATED_CURRICULUM.md)。

`apps/mobile/src/lib/api.ts` 只是既有畫面的本機呼叫介面，沒有 HTTP 請求。`packages/offline-engine` 在裝置完成回答判分、四維掌握證據、複習、XP、13 級挑戰、備份與刪除。Android 用 SQLite，web 用 localStorage。資料不會自動上傳。

首次從零開始不經程度測驗。學習課程沒有倒數或心數，錯誤給解說並可重試。挑戰是自願獨立模式，後端式的本機呼叫也必須通過相關課程完成檢查，題目不能混入未學技能；失敗不改學習 XP 或完成紀錄。

課程包嚴格驗證 schema、答案、翻譯、ID／前置引用、階段、素材與英文教學支援。更新先完整驗證再寫活動包，失敗保持原包。唯一可選網路功能是使用者主動提供 GitHub 檔案網址並點選下載；新版尚未發布，預設不提供舊 schema 1 的下載網址。離線檔案匯入始終可用。

Android 不依賴 Expo Go／開發伺服器的正式安裝產物須由 APK 工作流程產生。`npm run build:android` 是 Hermes bundle 驗證。Web 首次下載靜態檔與 service worker 後可斷網重新啟動；首次打開未快取的 web 網址仍需要載入資產。

無預錄參考聲音或新圖片。只有可確認本機的 en-US 瀏覽器語音可以播放；Android 未驗證系統 TTS 保持停用並揭露限制。沒有雲端語音或捏造發音評分，錄音／重播可選且離開即刪除。

## 資料與備份

整合課程的本機狀態／備份格式為 2，舊原型格式 1 明確拒絕讀寫並要求使用者決定是否重設。舊 bytes 不會自動刪除；錯誤頁可先匯出留存，再確認重設。這份留存不能還原成格式 2。新版備份則照常透過 Perfil 匯出、挑檔及確認覆蓋。還原不恢復進行中的挑戰。

目前沒有登入、Supabase、VPS、線上 AI、遙測或外部語音評估。舊 `apps/api`／SQL 保留作歷史原型，沒有接入離線版。
