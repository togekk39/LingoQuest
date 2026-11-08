# LingoQuest offline course pack v1

`.lqp.json` 是 UTF-8 JSON 檔案，封裝教材、離線判分答案、發音文字練習、情境分支與挑戰參數。App 內建完整基礎包，第一次啟動也不必連線；更新包可由 GitHub Releases 下載，或透過 Android 系統選檔器匯入。

目前教材約 275 KB，沒有大型影片／音訊檔，JSON 比 OBB 更適合獨立更新與驗證。OBB 與 APK expansion／特定發行流程綁定，對這版小型文字課程沒有實益。未來若加入大量離線音訊，可定義 v2 ZIP／媒體資產格式；v1 不會解壓縮、執行程式碼或解讀任意檔案路徑。

## 資料格式

```text
manifest
  format: "lingoquest-course-pack"
  schemaVersion: 1
  packageId: 穩定課程識別碼
  version: 課程內容版本（例如 1.0.0）
  minAppVersion: 最低 App 版本（目前 1.2.0）
  titleEs / locale / targetLanguage / createdAt
  sha256: 下述 canonical metadata + payload 的雜湊
payload
  units / lessons / challengePools / challengeLevels
  placementQuestions / missions / speechDrills / contentStatus
```

- 摘要計算：將 `{manifest: 不含 sha256 的 manifest, payload}` 以 `canonicalStringify()` 排序物件鍵，保留陣列順序，轉 UTF-8，再計算 SHA-256。
- `catalog.json` 另列每個完整 `.lqp.json` 檔案的 **原始位元組 SHA-256 與大小**。這份外部摘要供發布管理／人工核對；目前 App 的下載入口直接安裝課程檔，驗證其內部摘要與結構，不會先請求 catalog。
- 容量上限 4 MiB；課程數、題數、字串長度、物件深度也有上限。
- Zod 嚴格 schema 拒絕未知欄位；拒絕 prototype keys、重複 ID、失效課程／情境引用、無效選項答案、不完整 13 級與不相容 App 版本。
- 只有資料，沒有 JavaScript、SQL、外掛程式或任意執行入口。
- SHA-256 用於驗證完整性，不是來源簽章。來源信任依賴使用者選擇的 HTTPS GitHub 位置；不要把摘要聲稱為作者身分驗證。

## 版本與進度

App 的個人進度、XP、技能證據與挑戰結果存放於獨立的本機儲存，**不寫入課程包**。同一 `packageId` 的更新需沿用既有 unit、lesson、exercise ID；改標題或新增課程不應清除進度。App 安裝流程先完整驗證新包，成功後才以單次儲存切換活動版本。匯入失敗必須保留舊包與個人紀錄。

離線判分需要把答案包含在裝置內容中，因此這版只提供個人練習／自我挑戰，不聲稱有可信的線上排名、官方成績或不可竄改的獎章。

## 對外介面

- `parseCoursePack(text, appVersion?)`：限制大小、解析、結構與引用驗證、最低版本與摘要驗證。
- `createCoursePack(payload, metadata)`：建立經驗證的新包；以完整舊 manifest spread 再改 `version` 也可使用。
- `serializeCoursePack(pack)`：canonical JSON + 最後一個換行，輸出可重現發布檔。
- `compareVersions(a, b)`：三段數字版本比較。
- `parseCourseCatalog(text)`：限制 catalog 大小及 HTTPS GitHub URL。
- `sha256Hex()`／`utf8Bytes()`：不依賴 Node、原生付費服務或網路的可攜實作。

新增教材仍需教育／語言人工審查。內建包目前如實標示 `draft_needs_human_review`，不因打包或測試通過而改成已審查。
