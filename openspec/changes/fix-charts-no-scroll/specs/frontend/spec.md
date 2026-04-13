# Frontend Spec — Charts View No-Scroll Enforcement

## Overview

确保图表屏（Charts View）在任何屏幕尺寸下都不出现滚动条，所有内容严格限制在 100vh 视口内，元素自适应布局。

---

## MODIFIED Requirements

### Requirement: 图表屏禁止滚动、内容全屏自适应

图表屏必须确保：
1. 页面根容器设置 `overflow: hidden`，宽高严格为 `100vw` × `100vh`
2. header 和 board 区域使用 flex 布局，禁止固定高度导致溢出
3. 排行榜和解题进度条目的数量必须根据可用面板高度动态计算，而非固定上限
4. 所有面板内容必须使用 `overflow: hidden`，溢出内容自动截断
5. 在任何常见分辨率下（1920×1080, 2560×1440, 3840×2160）均不出现滚动条

#### Scenario: 标准 1080p 屏幕下图表屏无滚动

- **Given** 用户在 1920×1080 屏幕上打开图表屏 URL
- **When** 页面加载完成
- **Then** `document.documentElement.scrollHeight <= document.documentElement.clientHeight`
- **And** 页面不出现任何滚动条
- **And** 四个图表面板完整可见，不溢出

#### Scenario: 小屏幕下排行榜和进度条目自动缩减

- **Given** 排行榜数据和解题进度数据充足（超过面板可容纳数量）
- **When** 面板高度不足以展示默认数量的条目
- **Then** 排行榜和进度条目数量自动缩减至面板可容纳的最大值
- **And** 不出现滚动条
- **And** 面板头部标题始终可见

#### Scenario: 窗口 resize 后重新计算可见条目

- **Given** 用户在图表屏
- **When** 浏览器窗口尺寸变化（包括进入/退出全屏）
- **Then** 排行榜和进度条目数量根据新面板高度重新计算
- **And** 内容始终不溢出
