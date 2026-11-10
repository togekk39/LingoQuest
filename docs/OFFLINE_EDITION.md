# 整合課程離線架構

目前 App 是 1.3，課程包是 2.0.0/schema 2。`content/source` 編寫八單元、32 課，builder 產生同一份 bundled JSON、release JSON、catalog 與 SHA-256。具體教材模型與開發資料重設說明見 [INTEGRATED_CURRICULUM.md](INTEGRATED_CURRICULUM.md)。

`apps/mobile/src/lib/api.ts` 只是既有畫面的本機呼叫介面，沒有 HTTP 請求。`packages/offline-engine` 在裝置完成回答判分、四維掌握證據、複習、XP、13 級挑戰、備份與刪除。Android 用 SQLite，web 用 localStorage。資料不會自動上傳。

首次從零開始不經程度測驗。學習課程沒有倒數或心數，錯誤給解說並可重試。挑戰是自願獨立模式，後端式的本機呼叫也必須通過相關課程完成檢查，題目不能混入未學技能；失敗不改學習 XP 或完成紀錄。

課程包嚴格驗證 schema、答案、翻譯、ID／前置引用、階段、素材與英文教學支援。更新先完整驗證再寫活動包，失敗保持原包。課程包的可選網路功能是使用者主動提供 GitHub 檔案網址並點選下載；新版尚未發布，預設不提供舊 schema 1 的下載網址。離線檔案匯入始終可用。

Android 不依賴 Expo Go／開發伺服器的正式安裝產物須由 APK 工作流程產生。`npm run build:android` 是 Hermes bundle 驗證。Web 首次下載靜態檔與 service worker 後可斷網重新啟動；首次打開未快取的 web 網址仍需要載入資產。

無預錄參考聲音或新圖片。發音預設使用系統 TTS；Android 透過原生橋接，只允許系統引擎中已安裝且不需網路的英文語音，優先使用系統預設英文語音，否則選用其他本機英文語音。每次播放都明確指定英文語言與英文 voice，不隨西語介面或裝置預設語言切換；Android 先設定所選英文方言的 locale，再套用並確認離線英文 voice，若引擎拒絕或保留其他語音則停止播放並提示。iOS 同樣明確指定已安裝的英文 voice；瀏覽器只使用 `localService === true` 的英文語音。設定畫面（手機與桌面皆可開啟）可選擇語音、系統語速或 0.75×／1×／1.25×、試聽及儲存偏好，供所有課程與練習共用；Android 另可開啟系統 TTS 設定，返回 App 後重新讀取引擎與語音。若沒有離線英文語音或已移除指定語音，會提示安裝或重新選擇，不會改用雲端發音。原生橋接須使用重新建置的 APK／開發版本，Expo Go 不包含此模組。TTS 不改用雲端語音；沒有捏造發音評分，錄音／重播可選且離開即刪除。

## 系統語音辨識（STT）

口說練習的「Practicar con mi voz」透過 `expo-speech-recognition` 接上 Android／iOS 系統 STT，web 使用瀏覽器 Web Speech API。固定辨識 `en-US`，顯示即時及最終文字，文字只供比較，不當作發音分數。App 不儲存辨識音訊或文字；系統／瀏覽器服務可能在線上處理語音，頁面會在啟動前說明。沒有額外的 STT 後端、API key 或付費評分服務。

麥克風／辨識權限拒絕、沒有英文模型、服務不可用、網路錯誤及未收到語音都有可重試提示。另可選「Solo grabar y escuchar (sin reconocimiento)」完全離線錄音與重播，離開即刪除。辨識、錄音及範例播放不會同時占用音訊。

需安裝重新建置的 APK／原生開發版；Expo Go 與舊 APK 不含此原生模組。Config plugin 設定 iOS 麥克風／語音辨識權限及 Android 系統語音服務可見性。裝置需啟用系統辨識服務，並具備英文支援。`npm run build:android` 只驗證 Hermes bundle，APK 由 Android APK workflow 產生。

瀏覽器整合測試使用 Web Speech fixture 驗證辨識文字、錯誤、重試及離開時中止，並用瀏覽器 MediaRecorder 驗證錄音重播與清除；不代表真機辨識準確度。真機驗收需確認實際收音、權限拒絕／恢復、斷網與權限提示中離開頁面。

## 資料與備份

整合課程的本機狀態／備份格式為 2，舊原型格式 1 明確拒絕讀寫並要求使用者決定是否重設。舊 bytes 不會自動刪除；錯誤頁可先匯出留存，再確認重設。這份留存不能還原成格式 2。新版備份則照常透過 Perfil 匯出、挑檔及確認覆蓋。還原不恢復進行中的挑戰。

目前沒有登入、Supabase、VPS、線上 AI、遙測或外部語音評估。舊 `apps/api`／SQL 保留作歷史原型，沒有接入離線版。
