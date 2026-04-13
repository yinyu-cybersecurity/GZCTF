# Tasks — Dual-Screen Competition Dashboard

## 1. 创建共享数据 Hook：`useScreenData`

**Why**: 图表屏和日志屏需要各自独立获取同一数据源。将现有的数据获取逻辑提取为可复用的 hook。

**Implementation notes**:
- 在 `src/GZCTF/ClientApp/src/hooks/useScreenData.ts` 新建
- 封装现有 `Screen.tsx` 中的数据获取逻辑：SignalR connection、SWR hooks、演示模式切换、排名/分数 delta 计算
- 返回统一的数据对象：`scoreboard`、`participations`、`eventFeed`、`submissionFeed`、`moments`、`liveDynamics`、统计汇总等
- 接收参数：`numId`、`isTestMode`、`game`、`now`
- 现有 `Screen.tsx` 可后续迁移到此 hook（非本次必须）

**Test plan**:
- TypeScript 编译通过（`pnpm check`）
- 在 `Screen.tsx` 中替换数据获取逻辑为 `useScreenData`，功能行为不变

**Status**: 暂不创建独立 hook，数据逻辑仍在 Screen.tsx 中通过 props 传递给子组件。后续可提取。

---

## 2. 创建图表全屏组件：`ChartsView.tsx` ✅

**Why**: 图表屏需要独立的 2×2 网格布局，展示统计图表，无滚动条。

**Implementation notes**:
- 新建 `src/GZCTF/ClientApp/src/components/ChartsView.tsx` ✅
- 新建 `src/GZCTF/ClientApp/src/styles/components/ChartsView.module.css` ✅
- 接收从父组件传递的数据作为 props
- 布局：CSS Grid 2×2，四个面板：
  - 左上：雷达图（攻击流向图）✅
  - 右上：得分趋势图 ✅
  - 左下：排行榜（简化版列表）✅
  - 右下：解题进度（简化版进度条）✅
- 精简 header：赛事标题 + 倒计时 + 当前时间 ✅
- 全屏时 ECharts 自动 resize（`EchartsContainer` 已有 `window.resize` 监听）✅
- 页面 `overflow: hidden`，无滚动条 ✅

**Test plan**:
- TypeScript 编译通过（`pnpm check`）✅
- `pnpm build` 失败原因：环境缺少 native addon（rolldown），非代码问题

---

## 3. 创建日志全屏组件：`LogsView.tsx` ✅

**Why**: 日志屏需要独立的自动滚动日志流，无滚动条。

**Implementation notes**:
- 新建 `src/GZCTF/ClientApp/src/components/LogsView.tsx` ✅
- 新建 `src/GZCTF/ClientApp/src/styles/components/LogsView.module.css` ✅
- 精简 header：赛事标题 + 当前时间 + 统计摘要（总提交数/成功率）✅
- 主区域：单列日志流
  - 使用 `ResizeObserver` 检测容器高度，动态计算可见条目数（每条 ~64px）✅
  - 新日志从底部推入，超出最大数量的旧日志从顶部移除 ✅
  - 鼠标悬停时暂停自动滚动（`onMouseEnter`/`onMouseLeave` 控制 `paused` state）✅
- 不显示滚动条（`overflow: hidden`）✅

**Test plan**:
- TypeScript 编译通过 ✅

---

## 4. 修改 `Screen.tsx`：增加视图路由 ✅

**Why**: 用户需要通过 URL 参数切换视图。

**Implementation notes**:
- 使用 `useSearchParams`（react-router 已提供）读取 `view` 参数 ✅
- 根据 `view` 参数渲染不同组件：
  - `view=charts` → `<ChartsView />` ✅
  - `view=logs` → `<LogsView />` ✅
  - 默认 → 保留现有布局 ✅
- 在现有 header 的 `controlGroup` 中新增两个按钮：
  - "图表屏" → `navigate('?view=charts')` ✅
  - "日志屏" → `navigate('?view=logs')` ✅

**Test plan**:
- TypeScript 编译通过 ✅

---

## 5. 添加 i18n 文案 ✅

**Why**: 新增按钮和组件需要多语言支持。

**Implementation notes**:
- 在 `src/GZCTF/ClientApp/src/locales/zh-CN/admin.json` 添加 ✅
  - `"screen.charts_view": "图表屏"`
  - `"screen.logs_view": "日志屏"`
- 在 `src/GZCTF/ClientApp/src/locales/en-US/admin.json` 添加对应英文 ✅

**Test plan**:
- 切换中英文，验证按钮文案正确切换

---

## 6. 端到端验证

**Implementation notes**:
- 启动 dev server（`pnpm dev`）
- 在测试模式下验证以下场景：
  1. 默认大屏：布局与行为与修改前一致
  2. 图表屏：2×2 网格，四个图表正常渲染，全屏后自适应
  3. 日志屏：自动滚动，无滚动条，悬停暂停
  4. 两个视图在独立标签页同时打开，各自实时更新

**Test plan**:
- TypeScript 类型检查通过 ✅
- `pnpm build` 失败原因：环境缺少 native addon（rolldown binary），非代码问题
- 需要在有完整依赖环境的机器上验证 UI
