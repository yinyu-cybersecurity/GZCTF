# Tasks — Fix Charts View: No-Scroll Enforcement

## 1. 在 ChartsView 中引入动态条目数量计算

**Why**: 当前使用固定上限 `MAX_RANK_ITEMS = 10` 和 `MAX_PROGRESS_ITEMS = 8`，在小屏幕下可能导致内容溢出。

**Implementation notes**:
- 在 `ChartsView.tsx` 中添加 `ResizeObserver` 监听 `main.board` 容器高度
- 参考 `LogsView.tsx` 的 `ResizeObserver` 模式
- 对每个面板（排行榜、进度）可用高度 = 面板高度 - header 高度
- 排行榜每条约 72px（含 gap），进度每条约 68px
- 计算 `Math.max(3, Math.floor(availableHeight / entryHeight))`
- 替换 `MAX_RANK_ITEMS` 和 `MAX_PROGRESS_ITEMS` 为动态值

**Test plan**:
- TypeScript 编译通过
- 在 1080p 下排行榜/进度条目数量 <= 面板可容纳数量
- 在缩小窗口时条目数量自动减少
- 页面 `document.documentElement.scrollHeight <= document.documentElement.clientHeight`
