# 棱镜首屏点击欲望优化执行方案

## 目标

让用户进入 `http://localhost:3000/` 后，在 3 秒内明确知道：

- 这是一个“抽身份看世界”的互动产品。
- 点击主按钮会立刻获得一张有趣身份卡。
- 抽卡结果可以继续使用、重抽或五连抽。

本轮只聚焦三件事：

1. 首屏露出卡牌。
2. CTA 文案更奖励化。
3. 按钮和卡牌增加轻动效。

## 当前问题

首屏报纸质感完整，但真正有点击欲望的“身份卡牌”被放在点击之后。用户第一眼看到的是世界观和文学化介绍，而不是互动奖励。

当前主按钮“翻开报纸 · 开始破茧”有氛围，但奖励不够直观。用户需要先理解“破茧”是什么意思，才知道为什么要点。

## 改造原则

- 保留报纸封面作为品牌记忆点。
- 把卡牌作为首屏最强视觉诱因。
- 主按钮文案直接告诉用户点击后获得什么。
- 动效要克制，不能变成游戏大厅式强刺激。
- 首屏只保留一个最强主行动，不增加多个同级按钮。

## 首屏结构调整

### 调整前

首屏主要结构：

```text
顶部导航
破茧日报标题
副标题
编者按
主 CTA：翻开报纸 · 开始破茧
说明小字
报纸底部信息
```

### 调整后

建议结构：

```text
顶部导航
破茧日报标题
一句核心价值
卡牌预览区
主 CTA：抽取我的今日身份
奖励说明
报纸底部信息
```

## 模块一：首屏露出卡牌

### 设计目标

让用户在未点击前就看到“点完会得到一张身份卡”，降低理解成本，提高点击冲动。

### 视觉方案

在首屏标题和主 CTA 之间加入 `HeroCardTeaser` 模块。

推荐展示 3 张卡：

- 左侧：唐代诗人李白，露出约 70%，轻微左旋。
- 中间：神秘卡背，完整展示，作为主视觉。
- 右侧：外星观察者，露出约 70%，轻微右旋。

中间卡背比两侧卡大 8%-12%，形成焦点。

### 参考布局

```text
        [李白卡]
              [神秘卡背]
                        [外星观察者卡]
```

### 推荐尺寸

桌面端：

- 卡牌宽度：120-150px。
- 中间卡牌宽度：150-180px。
- 卡牌区域高度：190-230px。
- 卡牌之间重叠：24-40px。

移动端：

- 卡牌宽度：88-110px。
- 中间卡牌宽度：112-128px。
- 卡牌区域高度：150-180px。
- 保证不横向溢出。

### 交互状态

卡牌预览区整体可点击，点击行为等同于主 CTA。

鼠标悬停时：

- 中间卡牌上浮 4px。
- 两侧卡牌轻微展开 6-10px。
- 中间卡牌外发光增强。

### 实现建议

新增或复用组件：

```text
HeroCardTeaser
```

组件职责：

- 接收 2 张角色预览卡和 1 张卡背。
- 点击时调用当前“开始破茧”逻辑。
- 不负责抽卡，只负责制造首屏期待。

## 模块二：CTA 文案奖励化

### 主按钮文案

把：

```text
翻开报纸 · 开始破茧
```

改为：

```text
抽取我的今日身份
```

备选文案：

```text
看看我会用谁的眼睛看世界
立即抽一张身份卡
开启今日视角
```

推荐优先使用：

```text
抽取我的今日身份
```

原因：最短、最直观、最像奖励行为。

### 主按钮下方说明

把当前偏解释型文案改成奖励型文案。

推荐：

```text
3 秒获得一个全新视角，可重抽、可五连抽
```

备选：

```text
抽到谁，就用谁的眼睛看今天的世界
```

### 首屏核心价值句

当前编者按较长，建议首屏只保留一句强表达：

```text
同一条新闻，换一个身份，看到完全不同的世界。
```

如果还想保留诗意，可以放到第二行小字：

```text
打工人看到压力，诗人看到浪漫，外星人看到文明样本。
```

### CTA 层级

首屏主按钮应是唯一高饱和按钮。

导航里的“思维殿堂”“辩论室”保持低饱和描边样式，避免抢主 CTA。

## 模块三：按钮轻动效

### 默认状态

主按钮保持当前红色报纸印章风格，但增加更明显的可点击感。

建议样式：

```css
.hero-primary-cta {
  position: relative;
  box-shadow:
    0 8px 0 rgba(40, 16, 16, 0.85),
    0 18px 36px rgba(150, 34, 48, 0.22);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}
```

### 呼吸动效

按钮使用非常轻的呼吸光，不要缩放整颗按钮，避免廉价感。

```css
.hero-primary-cta::after {
  content: "";
  position: absolute;
  inset: -8px;
  border-radius: inherit;
  background: radial-gradient(
    circle,
    rgba(158, 35, 49, 0.22),
    transparent 68%
  );
  opacity: 0;
  pointer-events: none;
  animation: ctaGlowPulse 2.8s ease-in-out infinite;
}

@keyframes ctaGlowPulse {
  0%, 100% {
    opacity: 0.18;
    transform: scale(0.98);
  }
  50% {
    opacity: 0.42;
    transform: scale(1.04);
  }
}
```

### Hover 状态

```css
.hero-primary-cta:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 0 rgba(40, 16, 16, 0.85),
    0 24px 44px rgba(150, 34, 48, 0.3);
  filter: brightness(1.03);
}
```

### Active 状态

```css
.hero-primary-cta:active {
  transform: translateY(4px);
  box-shadow:
    0 4px 0 rgba(40, 16, 16, 0.85),
    0 12px 28px rgba(150, 34, 48, 0.22);
}
```

### 动效降级

必须兼容用户的减少动画设置。

```css
@media (prefers-reduced-motion: reduce) {
  .hero-primary-cta,
  .hero-primary-cta::after,
  .hero-card-teaser-card {
    animation: none;
    transition: none;
  }
}
```

## 模块四：卡牌轻动效

### 默认动效

首屏卡牌预览区使用轻微漂浮，重点在中间卡背。

```css
.hero-card-teaser-card.is-center {
  animation: cardFloat 3.6s ease-in-out infinite;
}

@keyframes cardFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-6px) rotate(0.5deg);
  }
}
```

### 卡牌闪光

中间卡背可以加一道斜向扫光，每 4-5 秒一次。

```css
.hero-card-teaser-card.is-center::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 0%,
    transparent 42%,
    rgba(255, 235, 180, 0.38) 50%,
    transparent 58%,
    transparent 100%
  );
  transform: translateX(-120%);
  animation: cardShine 4.6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes cardShine {
  0%, 68% {
    transform: translateX(-120%);
  }
  82%, 100% {
    transform: translateX(120%);
  }
}
```

### Hover 状态

```css
.hero-card-teaser:hover .hero-card-teaser-card.is-left {
  transform: translateX(-8px) rotate(-7deg);
}

.hero-card-teaser:hover .hero-card-teaser-card.is-center {
  transform: translateY(-8px) scale(1.03);
}

.hero-card-teaser:hover .hero-card-teaser-card.is-right {
  transform: translateX(8px) rotate(7deg);
}
```

注意：如果元素已经使用 `animation` 改变 `transform`，需要用内部包裹层拆分 transform，避免 hover 和 animation 互相覆盖。

推荐结构：

```html
<button class="hero-card-teaser">
  <span class="hero-card-slot is-left">
    <span class="hero-card-float">
      <img />
    </span>
  </span>
</button>
```

`hero-card-slot` 负责布局和 hover，`hero-card-float` 负责漂浮动画。

## 模块五：点击后的衔接

用户点击首屏 CTA 后，进入抽卡区时建议做两件事：

1. 自动滚动到身份卡池。
2. 卡背立即播放一次短暂翻动或发光动效。

### 行为建议

点击首屏 CTA：

```text
setIntroHidden(true)
scrollToCardPool()
playCardAttentionAnimation()
```

### 动效时长

- 首屏退场：220-320ms。
- 滚动到卡池：400-600ms。
- 卡牌提示动效：600-900ms。

不要超过 1 秒，否则用户会觉得慢。

## 模块六：抽卡后按钮文案

抽卡结果出现后，把：

```text
就用这个视角
```

改成动态文案：

```text
用「外星观察者」看世界
```

或：

```text
进入外星观察者视角
```

这样用户明确知道下一步不是结束，而是进入内容体验。

其他按钮保留：

```text
再来一张
五连抽
```

## 推荐实施顺序

### 第 1 步：改文案

优先改首屏主按钮、按钮下说明、核心价值句。

验收：

- 首屏 3 秒内能看懂“抽身份卡”。
- 不读完整编者按也知道点按钮会发生什么。

### 第 2 步：加卡牌预览

加入 `HeroCardTeaser`，使用现有角色卡素材和卡背素材。

验收：

- 首屏第一眼能看到卡牌。
- 卡牌预览区点击后与主 CTA 行为一致。
- 桌面端不遮挡标题和按钮。

### 第 3 步：加按钮动效

加入 CTA hover、active、呼吸光。

验收：

- 按钮静止时有轻微吸引力。
- hover 时明显可点击。
- active 时有按下反馈。

### 第 4 步：加卡牌动效

加入卡牌漂浮、扫光、hover 展开。

验收：

- 动效轻，不影响阅读。
- 不造成布局抖动。
- `prefers-reduced-motion` 下可以关闭。

### 第 5 步：优化点击衔接

点击首屏后滚动到卡池，并触发卡背提示动画。

验收：

- 点击后用户不会迷失。
- 页面焦点自然落到“抽一张 / 五连抽”。

## 验收清单

- 首屏能看到至少 2-3 张身份卡或卡背。
- 首屏只有一个最强主 CTA。
- 主 CTA 文案包含“抽取 / 身份 / 今日”等明确奖励词。
- 主 CTA 下方有一句短说明，长度不超过 18 个中文字符为佳。
- 卡牌预览区可点击。
- 按钮 hover、active 状态清晰。
- 卡牌有轻微漂浮或扫光动效。
- 动效不会导致文字、按钮、卡牌位置跳动。
- 移动端首屏不横向滚动。
- 低性能设备下动效不明显掉帧。
- 控制台无新增 error。

## A/B 测试建议

如果后续要验证点击率，可以做两个版本：

### A 版：抽卡直白型

主按钮：

```text
抽取我的今日身份
```

说明：

```text
3 秒获得一个全新视角
```

### B 版：好奇心型

主按钮：

```text
看看我会抽到谁
```

说明：

```text
可能是李白，也可能是外星人
```

推荐先上线 A 版。A 版更清楚，适合作为基础版本。

## 预期效果

完成后，首屏会从“读一份精致报纸”变成“看到一叠神秘身份卡，忍不住想抽一下”。

用户动线会更短：

```text
看到卡牌奖励 -> 理解点击结果 -> 点击抽身份 -> 获得角色 -> 继续进入内容
```

这比单纯加强文案更有效，因为它同时解决了理解成本、奖励预期和点击反馈。
