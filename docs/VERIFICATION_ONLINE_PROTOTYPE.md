# 驗證紀錄

執行日期：2026-11-08。本機 Node.js 24、系統 Chromium、PostgreSQL 16。

| 檢查                              | 結果                                 |
| --------------------------------- | ------------------------------------ |
| TypeScript 嚴格型別與 ESLint      | 通過                                 |
| Fastify API／安全整合測試         | 17 項通過                            |
| Playwright 桌面／390px 手機瀏覽器 | 12 項通過                            |
| PostgreSQL 遷移與 RLS 隔離        | 通過；以最小 Supabase Auth stub 驗證 |
| Expo web production export        | 通過                                 |
| Expo Android Hermes bundle export | 通過；非 APK、非真機驗收             |
| Prettier                          | 通過                                 |

瀏覽器實測涵蓋整堂答錯依然可完成、略過口說、持久進度、離線下載及重連只計一次 XP、帳號切換與同步交錯隔離、登出／刪除不誤清其他帳號佇列、離線冷啟動、40 組發音練習、12 題診斷、機場情境、13 級挑戰入口、閱讀獨立時間預算、失敗不影響學習，以及回應遺失後重送不重複扣心。

後端測試包含全部 320 題／32 課完整走完、伺服器時鐘、冪等、JWT 與跨帳號隔離、13 級、私人題庫快照、資料刪除與匯出，以及跨日無提示產出。

RLS 測試在一次性 PostgreSQL 容器執行，沒有連線到 Hosted Supabase。沒有呼叫付費 API、沒有部署雲端，也沒有聲稱教材已經人工審核或教育成效已被證實。正式發行工作見 `PRODUCTION_SETUP.md`。
