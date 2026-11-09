# 課程包發布產物

新版預設為整合課程 `2.0.0`，LQP schema 2，最低 App `1.3.0`。本機產生包不會上傳、推送 Git、建立 release 或連線。

```bash
npm run packs:build
npm run packs:verify
```

產物：

- `lingoquest-es419-enus-a1a2-2.0.0.lqp.json`：完整原創草稿教材、離線答案與 13 級挑戰。
- 同名 `.sha256`：完整檔案 SHA-256。
- `catalog.json`：版本、大小、最低 App 與目標下載網址。

`apps/mobile/src/content/bundled-course.json` 是相同內建副本。舊文法優先 schema 1 檔案不再附帶，避免兩套課程並存。

新版尚未遠端發布，catalog 的 `course-v2.0.0` 網址只是發布目標；App 預設下載欄位保持空白。可先透過本機檔案匯入使用。發布者確認教材後，可建立 `togekk39/LingoQuest` 的 `course-v2.0.0` GitHub Release，將包、摘要檔、catalog 放在同一次 release。發布後先下載並驗證不可變檔案的大小與摘要，再設定 `apps/mobile/src/content/course-source.json` 的 `url` 和 `published:true`；不要把尚未存在的網址標成已發布。重新執行 builder 會把這份來源 metadata 重設成未發布。

更換版本用 `COURSE_PACK_VERSION`；更換目標 repository 用 `COURSE_PACK_REPOSITORY=owner/repository`。發布 artifacts、catalog 與內建副本必須來自同一次 build，驗證後一起提交。版本 2 內的更新需保留當前 lesson IDs；不接受降版或同版不同內容。格式 1 的舊進度需經 App 明確重設流程，不能用新包匯入繞過格式檢查。
