# codex-skills

自用的一组 [Codex Skill](https://github.com/openai/skills) 合集：每个 skill 一个目录，拷进 `$CODEX_HOME/skills/`（默认 `~/.codex/skills/`）即可使用。

## 包含的 Skill

| Skill | 说明 |
| --- | --- |
| [`travel-guide`](skills/travel-guide) | 生成或改版多日旅游攻略 / 自驾路书：离线单文件 HTML + A4 打印级 PDF + 预订执行清单。适用于排逐日行程、算门票住宿预算、写天气与降级预案，或修改既有版本。 |

## 安装

### 方式一：用 skill-installer（推荐）

Codex 自带 skill-installer，可以直接从 GitHub 仓库安装：

```bash
python ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo Maomaoyu620/codex-skills --path skills/travel-guide
```

Windows PowerShell：

```powershell
python $env:USERPROFILE/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo Maomaoyu620/codex-skills --path skills/travel-guide
```

也可以直接让 Codex 代劳：「从 Maomaoyu620/codex-skills 的 skills/travel-guide 安装这个 skill」。装完在**下一轮对话**生效。

### 方式二：手动安装

```bash
git clone https://github.com/Maomaoyu620/codex-skills.git
cp -r codex-skills/skills/travel-guide ~/.codex/skills/
```

```powershell
git clone https://github.com/Maomaoyu620/codex-skills.git
Copy-Item -Recurse codex-skills/skills/travel-guide $env:USERPROFILE/.codex/skills/
```

## 依赖

| 依赖 | 用途 | 说明 |
| --- | --- | --- |
| Node.js 18+ | `travel-guide` 渲染 PDF | 只用 Node 内置模块，不需要 `npm install` |
| Chromium 内核浏览器 | 同上 | Chrome / Edge / Brave 任一；脚本自动探测常见安装路径，也可用环境变量 `BROWSER_BIN` 指定可执行文件 |

只产出 HTML / Markdown、不渲染 PDF 的话，不需要任何依赖。

## 用法

```
用 $travel-guide 帮我做一份 <目的地> <天数> 天的旅游攻略
```

产出三件套：

- `<目的地>攻略_<版本>.html`：单文件、无外链、无 JS，A4 分页由 CSS 控制，可离线打开、直接打印。
- 同名 `.pdf`：A4 打印级。
- `预订执行清单_<日期>.md`：倒排时间表 + 住宿优先级 + 门票预约 + 出发前复核 + 行程红线。

## 目录结构

```
codex-skills/
├── README.md
├── LICENSE
└── skills/
    └── travel-guide/
        ├── SKILL.md                   # 主流程与硬约定
        ├── agents/openai.yaml         # 展示名与默认提示词
        ├── assets/
        │   ├── guide-template.html    # A4 打印样式模板
        │   └── checklist-template.md  # 预订执行清单模板
        ├── references/
        │   ├── research.md            # 每个目的地要查证的事实清单
        │   └── structure.md           # 攻略章节骨架与文风约定
        └── scripts/
            └── render_pdf.mjs         # HTML → PDF（headless Chromium）
```

## 说明

- 仓库只放 skill 本体，不含任何真实行程数据、订单或个人信息。
- 攻略里的门票、时刻、预约规则以官方或当日购票页为准；skill 明确要求「查不到就不编数字」。

## License

[MIT](LICENSE)
