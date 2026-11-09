# LingoQuest · Integrated offline edition 1.3

Android 優先的離線英語學習 App，使用 Expo／React Native／TypeScript。學習介面是自然拉美西語 `es-419`，目標為美式英語 `en-US`。安裝後即可使用完整 A1–A2 課程，不需要帳號、後端、雲端 AI、語音 API 或憑證。

## 開發與建置

需要 Node.js 24+ 與 npm：

```bash
npm ci
npm run dev
```

開啟 `http://localhost:8081`。不需要 `.env` 或 API server。Android 開發使用 `npm run android`；瀏覽器靜態預覽使用 `npm run build:web`、`npm run preview`，開啟 `http://localhost:3000`。瀏覽器需先載入靜態檔並安裝離線快取，Android 安裝包則直接內含課程和字型。

`npm run build:android` 驗證 Android Hermes 匯出，並不產生 APK。可安裝 APK 仍由既有 [Android APK workflow](https://github.com/togekk39/LingoQuest/actions/workflows/android-apk.yml) 建置，相關說明見 [docs/APK_BUILDS.md](docs/APK_BUILDS.md)。此工作未推送或發布遠端版本。

## 從零開始的課程

首次啟動選 **Empiezo desde cero** 就直接進入第一課；**Ya sé algo de inglés** 才會開啟可略過的程度診斷。個人姓名、目標與動機可以稍後設定。

八個情境單元、32 課，含 200 個新詞彙、68 次明確字彙回顧與 360 道練習。教材整合字彙、文法和溝通目的，每課依序經過：

1. **Meta**：西語說明情境與能做到的目標。
2. **Vocabulario**：英文詞句、西語意思、詞性與雙語例句，先辨認意思和配對。
3. **Gramática**：一個主要句型，明確解釋必要的小詞和形式。
4. **Conversación**：原創短對話，逐句西語支援。
5. **Práctica**：有支援的填空、重排／改錯到短句產出。
6. **Hablar**：自願播放可驗證本機語音、錄音、重播或略過。
7. **Recordar**：回顧詞彙、句型與延後複習安排。

第一單元「¡Hola! Mucho gusto」從「Me presento」的 `I am`／`You are` 開始，接著介紹家人、描述人與物、詢問身分與來源。後續涵蓋日常、問句、過去、正在發生的事、未來計畫、經驗及旅行／工作情境。教材來源在 `content/source/curriculum.ts` 與分單元的編寫檔；不再保留原本固定八句種子的文法優先課程。

**Aprender** 無倒數、無心數懲罰，可重試或看解說後繼續。課程完成與 XP、長期掌握、挑戰成績各自獨立。四種練習證據分別記錄字彙辨認、字彙回想、文法理解、文法產出；一次選對不代表精熟。複習以 1／3／7／14 日間隔累積證據。

**Desafíos** 是自願的本機挑戰，保留 13 級、計時與心數。引擎檢查相關課程是否完成，題目只能取自已學內容；目前提供日常現在式主題。失敗、逾時或退出不扣學習 XP、不重設課程。

## 離線內容包與驗證

唯一課程來源產生嚴格驗證的 LQP JSON schema 2：

```bash
npm run packs:build
npm run packs:verify
```

預設產生課程版本 `2.0.0`，最低 App `1.3.0`。`content/releases/` 內含完整包、SHA-256、catalog；`apps/mobile/src/content/bundled-course.json` 為相同內建副本。舊 schema 1 發行檔不再隨此版本保留。

驗證包含唯一 ID、翻譯、答案、選項歧義、字彙／技能／前置課程引用、階段順序、素材引用與練習的未教英文。功能詞可以用有西語意思的 contextual gloss 明確支援。格式與作者規範見 [docs/INTEGRATED_CURRICULUM.md](docs/INTEGRATED_CURRICULUM.md)。

在 **Perfil → Contenido sin conexión** 可以完全離線匯入包；只有主動貼上 GitHub 檔案網址並點下載時才會連線。新版包尚未遠端發布，因此預設下載欄位為空；catalog 連結是發布目標，不能當成已存在的下載。安裝採先完整驗證再切換，失敗保留活動包。發布流程見 [content/releases/README.md](content/releases/README.md)。

## 開發資料格式重設（重要）

這次重整有意將本機進度與備份格式改成 **2**，不遷移尚未公開的原型進度。啟動遇到格式 1 時會明確說明不相容並停止讀寫，**不會自動刪除資料**。

先點 **Guardar copia de los datos anteriores** 把舊資料存到自己選擇的位置，再點 **Restablecer datos locales**、閱讀刪除說明並確認。重設會刪除本機舊個人檔案、回答、XP、完成紀錄與挑戰紀錄，保留課程，並重新顯示從零開始入口。舊檔只能留存參考，不能還原成新格式。不同意重設即可保留資料並離開。

新版 **Exportar mis datos／Restaurar respaldo** 繼續支援格式 2 本機備份，還原前必須確認覆蓋進度，不還原進行中的挑戰。移除 App／清除裝置儲存會移除紀錄，請先備份。

## 語音、素材與隱私

本課程不內含預錄音訊或外部圖片，也不背景下載字型、AI 回答或媒體。現有本機字型與插圖保持原設計；新增教材為原創文字，沒有複製教科書。

發音預設使用系統 TTS；Android 透過原生橋接，只允許系統引擎中已安裝且不需網路的英文語音，優先使用系統預設英文語音，否則選用其他本機英文語音。每次播放都明確指定英文語言與英文 voice，不隨西語介面或裝置預設語言切換；Android 先設定所選英文方言的 locale，再套用並確認離線英文 voice，若引擎拒絕或保留其他語音則停止播放並提示。iOS 同樣明確指定已安裝的英文 voice；瀏覽器只使用 `localService === true` 的英文語音。設定畫面（手機與桌面皆可開啟）可選擇語音、系統語速或 0.75×／1×／1.25×、試聽及儲存偏好，供所有課程與練習共用；Android 另可開啟系統 TTS 設定，返回 App 後重新讀取引擎與語音。若沒有離線英文語音或已移除指定語音，會提示安裝或重新選擇，不會改用雲端發音。原生橋接須使用重新建置的 APK／開發版本，Expo Go 不包含此模組。錄音／重播可用且完全自願，錄音留在本機並在離開練習時刪除；沒有自動發音分數，不把文字相符當發音正確。

## 檢查

```bash
npm run check
npm test
npm run packs:build
npm run packs:verify
npm run build:web
npm run build:android
# 先在另一個終端 npm run preview
npm run test:e2e
```

實際結果見 [docs/VERIFICATION.md](docs/VERIFICATION.md)，離線人工驗收見 [docs/OFFLINE_TEST_PLAN.md](docs/OFFLINE_TEST_PLAN.md)。短句產出使用明確情境與經編寫的可接受答案集合，並非任意自由文字的語意評分；自己的名字可以在選擇性口說中練習。教材仍須英語教師／母語編輯審查自然度、A1–A2 節奏、地區用語和可接受短句答案；真機麥克風、低階 Android、螢幕閱讀器及正式簽章仍需發行前驗收。

`apps/api` 與 `supabase` 為保留的舊線上原型，不接入目前 App；`docs/VERIFICATION_ONLINE_PROTOTYPE.md` 只記錄歷史，不代表新版離線教材的驗證結果。
