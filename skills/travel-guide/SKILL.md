---
name: travel-guide
description: 生成或改版多日旅游攻略 / 自驾路书，交付离线单文件 HTML + A4 打印级 PDF + 预订执行清单。适用于为某个城市、环线或景区排逐日行程、算门票住宿预算、写天气与降级预案，或修改既有版本。
metadata:
  short-description: 生成多日旅游路书与预订清单
---

# 旅游攻略生成

产出用户能直接打印、转发、照着订酒店的三件套，而不是聊天里的一段行程建议。

## 依赖

- **Node.js 18+**：只为渲染 PDF，只用内置模块，不需要 `npm install`。
- **Chromium 内核浏览器**（Chrome / Edge / Brave 任一）：scripts/render_pdf.mjs 自动探测常见安装路径，也可用环境变量 `BROWSER_BIN` 指定。
- 只产出 HTML / Markdown、不渲染 PDF 时不需要任何依赖。

## 产出物

放进用户指定的工作目录（没指定就建 `<目的地>计划<年份>/`）：

| 文件 | 说明 |
| --- | --- |
| `<目的地>攻略_<版本>.html` | 单文件、无外链、无 JS，A4 分页由 CSS 控制 |
| 同名 `.pdf` | 用 `scripts/render_pdf.mjs` 渲染 |
| `预订执行清单_<日期>.md` | 倒排清单：哪天订什么、先锁哪家、出发前复核哪些政策 |

改版时**保留旧版文件**，新版另存（版本号写进文件名与封面：B 版 / C 版 / D 版…），并在封面用 `.note` 说明"本版相对上一版的变化"。

## 工作流

1. **锁骨架**：人数、日期天数、交通方式、住宿档次、必去与明确不去、体力强度、预算。能从对话或项目文件里读到的不要再问；只有会改变结构的缺口（例如"某地要不要住一晚"）才问一句。
2. **采集事实**：按 [references/research.md](references/research.md) 逐项查证。
3. **写内容**：按 [references/structure.md](references/structure.md) 的章节骨架与文风组织。
4. **套样式**：以 [assets/guide-template.html](assets/guide-template.html) 为模板，CSS 原样保留，正文全部换成目标目的地的真实内容。
5. **渲染 PDF**：`node scripts/render_pdf.mjs <input.html> [output.pdf]`。
6. **自检**：页数合理（与旧版对照）、尾部 `%%EOF`、抽查 3–5 处关键段落文本确实写进去了。
7. **出清单**：套 [assets/checklist-template.md](assets/checklist-template.md)，把"什么时候必须做什么"落成独立 md——倒排时间表 + 住宿优先级 + 门票预约 + 出发前复核 + 行程红线；用不上的段落整段删掉，别留空占位。

## 渲染 PDF

```
node scripts/render_pdf.mjs "<输入.html>" ["<输出.pdf>"]
```

- 输出默认与输入同名的 `.pdf`，第二个参数可指定路径。
- 需要启动一个浏览器进程；在沙箱 / 受管环境里若被拦截（GPU 进程、临时用户目录写入被拒），用提权方式重跑同一条命令，不要改用手工另存。
- 脚本自己校验：文件存在、体积非零、尾部 `%%EOF`、`/Count` 页数，并打印结果。
- 长文档首次渲染后**看一眼页数**：比上一版明显变少通常意味着分页或内容丢失。

## 硬约定

- **离线单文件**：不引 CDN、外链字体、外链图片；地图与示意图用内联 SVG，`<img>` 尽量为 0——打印和离线打开都不能掉样式。
- **编码**：产出物一律 UTF-8 **无 BOM**、**LF** 换行。最省事的是用 Node 写（`fs.writeFileSync(p, text)` 默认就是无 BOM UTF-8）；写完抽验文件首三字节不是 `EF BB BF`，避免转发或打印时首行乱码。
  - Windows 附注：PowerShell 的 `>` 默认写 UTF-16LE，`Set-Content -Encoding UTF8` 会加 BOM；必须走 .NET API 时显式传 `UTF8Encoding($false)`。
- **不编数字**：门票价、发车时刻、预约规则、边防 / 限流政策以官方或当日购票页为准。查不到就写"以现场 / 当日公告为准"，并把它变成清单里的一条复核动作——**不要为了好看编一个具体数字**。
- **数字要具体**：里程给 km 与车程区间，价格给区间，时刻给到分钟（"14:00 前上马"远胜"下午早点出发"）。
- **每日卡片必须带"宿"与"天气"**：用户一眼要知道今天睡哪、要不要为光线留时间。
- **给取舍答案**：每一章末尾用 `.note` / `.warn` / `.opt` 回答"为什么这么排""代价是什么""不这样行不行"。
- 改行程就出新版本并同步更新清单；别只改正文忘了清单。
- 不改用户没让改的文件；不把 API key、订单号、证件号写进产出物——清单里涉及证件、订单的地方只写动作（"出发前复核电子证件有效期"），不抄号码。

## 参考

- [references/research.md](references/research.md)：每个目的地都要查证的事实清单（交通 / 门票 / 时刻 / 许可 / 光线 / 餐饮 / 风险）。
- [references/structure.md](references/structure.md)：八章骨架、每章要回答的问题、文风约定。
- [assets/guide-template.html](assets/guide-template.html)：A4 打印样式模板。
- [assets/checklist-template.md](assets/checklist-template.md)：预订执行清单模板（倒排时间表 / 住宿 / 门票 / 复核 / 红线）。
