# LingoQuest offline course pack v2

`.lqp.json` 是 UTF-8 JSON，包含整合情境課程、本機判分規則、發音文字、情境分支與 13 級挑戰。App 內建完整基礎包，首次啟動不需連線或登入；使用者也可主動從 GitHub 下載或由系統選檔器匯入更新。

這版以小型文字課程為主，沒有外部媒體請求，也沒有 OBB、ZIP 解壓縮、程式碼執行或任意檔案路徑。容量上限為 4 MiB。`assets` 預設為空；若未來加入媒體，必須把 Base64 內容、MIME 類型、來源與授權一起封裝。音訊與插圖引用必須對應包內同類型資產，不能放遠端 URL。沒有參考音訊時，介面必須明示限制；裝置本機錄音／重播不依賴教材音訊。

## 資料格式

```text
manifest
  format: "lingoquest-course-pack"
  schemaVersion: 2
  packageId: 穩定課程識別碼
  version: 課程內容版本（例如 2.0.0）
  minAppVersion: 最低 App 版本（目前 1.3.0）
  titleEs / locale: es-419 / targetLanguage: en-US / createdAt
  sha256: canonical manifest（不含 sha256）+ payload 摘要
payload
  units / lessons / challengePools / challengeLevels
  placementQuestions / missions / speechDrills / contentStatus / assets
lesson
  id / unitId / order / cefr / title / objectiveEs / contextEs / estimatedMinutes
  vocabulary: id / en / es / partOfSpeech / example / status（new 或 review）
  grammar: skillId / prerequisiteSkillIds / explanationEs / examples / taughtForms
  dialogue: speaker / en / es / glosses
  stages: goal → vocabulary → grammar → dialogue → practice → speaking → recap
  exercises: 明確題型、答案、回饋、difficulty、vocabularyIds、dimension
  review: vocabularyIds / skillIds
```

`vocabulary` 與 `practice` 階段以 `exerciseIds` 指向該課題目，每題只能安排一次。單字階段先用 `meaning`、`matching` 或選擇題辨識意思；後續可使用填空、重排、改錯及短句產出。`matchingPairs` 的左側是英語、右側是西語；作答的 `matches` 為「左側 ID → 右側 ID」對應表。

每題的 `dimension` 必須明確標記為 `vocabulary_recognition`、`vocabulary_recall`、`grammar_understanding` 或 `grammar_production`。選擇／配對題不能宣稱提供獨立產出證據。字彙題以 `vocabularyIds` 指向被練習的詞；文法題使用 `skillId`。這些標籤提供本機引擎分開累積證據，不把課程完成、XP 或挑戰等級當成長期掌握。

## 編寫驗證

- 嚴格 Zod schema 拒絕未知欄位、缺少翻譯或答案、空白文字、不相容 schema／App 版本及超量內容。
- 引用驗證拒絕重複 ID、未知課程／技能／單字、尚未學過的文法前置技能、錯誤課序、缺題或順序錯誤的階段。
- 選項 ID 與正確答案必須一致；重複或標點／大小寫不同但意義相同的選項、重複配對內容與無法由詞塊組成的答案會被拒絕。
- 英語題幹、閱讀段落、詞塊、英語選項及文字答案的詞彙，必須已由當課或前課的 `vocabulary`／`grammar.taughtForms` 教過，或由該題 `contextualGlosses` 明確提供西語意思。人名、地名使用 `properNames` 宣告。西語選項必須標記 `optionsLanguage: es`。
- 同一單字以原 ID、相同英／西語文字及 `status: review` 重複練習；不能把未知 ID 宣稱為已學字彙。
- 挑戰題必須宣告 `requiredLessonIds`，技能與字彙不能超出這些課程累積教過的範圍。引擎另外檢查使用者確實完成所需課程。
- 媒體引用必須存在於 `assets`，類型必須正確，並有來源與授權資料。

驗證能攔截可機械判斷的缺漏，不能證明翻譯、教學難度或語境自然。新增教材仍需人工語言與教育審查；測試通過不會把 `draft_needs_human_review` 改成已審查。

## 摘要與來源

`canonicalStringify()` 將物件鍵排序，保留陣列順序，對 `{manifest: 不含 sha256 的 manifest, payload}` 的 UTF-8 位元組計算 SHA-256。`catalog.json` 與 `.sha256` 另外記錄完整發布檔的原始位元組摘要和大小；App 的直接匯入入口驗證包內摘要與內容，沒有背景 catalog 請求。

SHA-256 驗證完整性，並非作者簽章。使用者選擇的 HTTPS GitHub 來源決定來源信任。包內沒有 JavaScript、SQL、外掛或任意執行入口，也會拒絕 prototype keys 及過深物件。

## 版本與開發資料

v2 是開發中的破壞性課綱與資料格式更新，不支援 v1 課程包，也沒有雙課綱或相容層。舊開發版學習資料不會自動轉成新課綱進度；App 會說明開發版重設，舊備份格式不能還原為新版。詳見根目錄 README 的開發資料說明。

新版個人進度、XP、字彙／文法證據與挑戰結果仍獨立儲存於裝置，**不寫入課程包**。同一新版課綱內更新應維持 ID 穩定。安裝新包前完整驗證，成功後才切換活動包；匯入失敗保留目前內容和資料。離線答案必須存在裝置內，因此只供個人練習，不宣稱可信線上排名、官方成績或不可修改的獎章。

## 對外介面

- `parseCoursePack(text, appVersion?)`：限制大小、解析、schema／引用／詞彙／最低版本／摘要驗證。
- `createCoursePack(payload, metadata)`：建立經驗證的新包。
- `serializeCoursePack(pack)`：canonical JSON 加最後換行，輸出可重現檔案。
- `validateReferences(payload)`：供編寫工具進行內容關聯驗證。
- `compareVersions(a, b)`：三段數字版本比較。
- `parseCourseCatalog(text)`：驗證 catalog 大小、重複版本及 HTTPS GitHub URL。
- `sha256Hex()`／`utf8Bytes()`：不依賴 Node、付費原生服務或網路的可攜實作。
