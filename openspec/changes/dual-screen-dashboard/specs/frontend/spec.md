# Frontend Spec — Dual-Screen Competition Dashboard

## Overview

在赛事大屏页面新增双屏（多显示器适配）模式，通过 URL 参数区分图表视图和日志视图，两个视图各自独立全屏展示，无滚动条，自适应屏幕尺寸。

---

## MODIFIED Requirements

### Requirement: 大屏路由支持视图参数

大屏页面路由 `/admin/games/:id/screen` 必须支持 `view` 查询参数：
- `view=charts` → 图表视图（统计图表全屏）
- `view=logs` → 日志视图（滚动日志全屏）
- 无 `view` 参数或 `view=default` → 保留现有单页多面板布局

#### Scenario: 用户访问带 view 参数的大屏 URL

- **Given** 大屏已配置且赛事存在
- **When** 用户访问 `/admin/games/1/screen?view=charts`
- **Then** 页面渲染全屏自适应的图表视图，无滚动条
- **When** 用户访问 `/admin/games/1/screen?view=logs`
- **Then** 页面渲染全屏自适应的日志滚动视图，无滚动条
- **When** 用户访问 `/admin/games/1/screen`（无参数）
- **Then** 页面渲染现有的单页多面板布局

### Requirement: 现有大屏 header 新增视图切换入口

在现有大屏的 header 控制区域必须新增视图切换按钮：
- "图表屏"按钮：导航到 `?view=charts`
- "日志屏"按钮：导航到 `?view=logs`
- 按钮样式与现有"返回"、"复制"、"全屏"按钮保持一致

#### Scenario: 用户在现有大屏点击视图切换按钮

- **Given** 用户在默认大屏页面
- **When** 点击"图表屏"按钮
- **Then** 浏览器导航至 `/admin/games/:id/screen?view=charts`
- **When** 点击"日志屏"按钮
- **Then** 浏览器导航至 `/admin/games/:id/screen?view=logs`

---

## ADDED Requirements

### Requirement: 图表全屏视图（Charts View）

图表全屏视图必须满足：
1. 页面背景与现有大屏主题一致（深色渐变 + 网格 + 扫描线效果）
2. 顶部仅保留精简 header（赛事标题 + 倒计时 + 当前时间），去除操作按钮
3. 主区域采用 2×2 网格布局展示四个图表面板：
   - 左上：雷达图（攻击流向图）
   - 右上：得分趋势图
   - 左下：排行榜（前 N 名，自适应数量）
   - 右下：各方向解题进度
4. 所有面板无滚动条，内容自适应面板高度
5. 排行榜和进度列表的条目数量必须根据屏幕高度动态计算，确保不溢出
6. ECharts 图表必须在容器尺寸变化时自动 resize
7. 全屏模式（Fullscreen API）激活时，内容自适应新的窗口尺寸

#### Scenario: 图表屏展示统计图表

- **Given** 赛事正在进行或有演示数据
- **When** 用户访问图表屏 URL
- **Then** 页面渲染 2×2 网格，包含雷达图、趋势图、排行榜、进度四个面板
- **And** 页面 `overflow: hidden`，不出现滚动条
- **And** 所有图表铺满各自面板，不溢出

#### Scenario: 图表屏在全屏模式下自适应

- **Given** 用户在图表屏按下浏览器全屏或 F11
- **When** 窗口尺寸变化
- **Then** 所有 ECharts 图表调用 `resize()`
- **And** 排行榜和进度条目数量重新计算
- **And** 内容始终铺满屏幕，不出现滚动条

### Requirement: 日志全屏视图（Logs View）

日志全屏视图必须满足：
1. 页面背景与现有大屏主题一致
2. 顶部仅保留精简 header（赛事标题 + 当前时间 + 统计摘要）
3. 主区域为单列日志流，自动向下滚动展示最新日志
4. 日志条目采用无缝滚动（auto-scroll）模式：
   - 新日志从底部推入
   - 旧日志从顶部移出（保留最大可见条目数）
   - 用户鼠标悬停时暂停自动滚动
   - 用户鼠标离开时恢复自动滚动
5. 不显示滚动条（`overflow: hidden` + `ScrollArea` type="never"）
6. 日志条目必须根据屏幕高度动态计算可见数量
7. 每个日志条目显示：时间戳、战队名、题目名、提交结果（成功/失败/异常）、颜色标记
8. 数据源与现有大屏一致：SignalR 实时推送 + 初始历史数据 + 演示模式

#### Scenario: 日志屏自动滚动展示新日志

- **Given** 赛事正在进行或有演示数据
- **When** 新提交通过 SignalR 推送到客户端
- **Then** 新日志条目出现在列表底部
- **And** 列表自动向下滚动以显示新条目
- **And** 不出现滚动条

#### Scenario: 日志屏全屏自适应

- **Given** 用户在日志屏按下 F11 进入全屏
- **When** 窗口尺寸变化
- **Then** 日志条目重新计算可见数量
- **And** 内容铺满全屏，不出现滚动条
- **And** 自动滚动继续

### Requirement: 视图间数据共享

图表屏和日志屏必须共享同一数据源机制：
- 使用现有的 `useDemoScreenData` hook（测试模式）
- 使用现有的 SignalR connection（正式模式）
- 使用现有的 SWR API hooks（初始数据加载）
- 每个视图独立创建 connection，互不影响

#### Scenario: 两个屏幕独立运行

- **Given** 在浏览器中打开两个标签页，分别是图表屏和日志屏
- **When** 新提交产生
- **Then** 两个屏幕各自收到 SignalR 推送
- **And** 图表屏更新对应图表数据
- **And** 日志屏追加新日志条目

---

## REMOVED Requirements

（本次无移除需求）

---

## MODIFIED (Follow-up) — No-Scroll Enforcement for Charts View

### Requirement: 图表屏排行榜和进度条目动态数量（替代固定上限）

排行榜（左下）和解题进度（右下）面板的条目数量 MUST 根据面板可用高度动态计算，而非使用固定上限。确保在任何屏幕分辨率下内容不溢出、不出现滚动条。

#### Scenario: 小屏幕下排行榜条目自动缩减
- **Given** 排行榜数据充足但面板高度有限
- **When** 面板可用高度只能容纳 5 个排行榜条目
- **Then** 仅展示前 5 个条目
- **And** 面板 header 始终可见
- **And** 不出现滚动条

#### Scenario: 窗口 resize 后重新计算
- **Given** 用户调整浏览器窗口大小
- **When** 面板高度变化
- **Then** 排行榜和进度条目数量根据新高度重新计算
