# Fix Charts View: No-Scroll Enforcement

## Why

在上一轮 validate 中发现 ChartsView 的排行榜和解题进度条目使用了固定上限（`MAX_RANK_ITEMS = 10`, `MAX_PROGRESS_ITEMS = 8`），未根据屏幕高度动态计算。这导致在较小分辨率下可能出现内容溢出、滚动条或截断不完整的问题。spec 明确要求"所有内容严格在显示器全屏显示范围内，不出现滚动条"。

## What

- 在 ChartsView 中引入 `ResizeObserver` 检测面板可用高度
- 根据面板高度动态计算排行榜和解题进度条目可见数量
- 确保 2×2 网格中四个面板的 header + 内容总高度不超过面板高度
- 所有面板保持 `overflow: hidden`，溢出内容自动截断

## Constraints

- 不改变现有 ChartsView 的 2×2 网格布局
- 不改变 LogsView（已使用 ResizeObserver 动态计算）
- 不修改后端或数据层
- 必须保留现有深色主题样式

## Open Questions

- 是否需要为排行榜和进度条目设置最小可见数量下限（如至少 3 条）？
