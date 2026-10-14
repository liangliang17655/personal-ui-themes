---
name: personal-ui-themes
license: MIT (see LICENSE.txt)
description: Use when the user asks for their personal reference-image UI style, theme switching, 自己的风格样式, 个人主题库, or the ten reference-inspired styles in this library; also use when adding new visual styles to this personal library. Not for unrelated UI work without this preference or project authorization.
---

# 个人 UI 主题风格库

将用户喜欢的参考视觉转成可切换的软件主题，保留每种风格的身份。它是前端代码设计 Skill，不是图片模板或已完成的软件主题功能。

## 使用
1. 读取 [主题索引](references/catalog.md)。按用户指定主题加载对应文档，主题示意可选查看仓库根目录 index.html 或 https://liangliang17655.github.io/personal-ui-themes/；仅下载 Skill 时按本地规范实施即可；没有指定时，沿用项目当前主题，新项目以植物鼠尾草作为可撤销的建议起点。展示其余主题的选择，不替用户永久淘汰任何风格。
2. 核对产品平台、已授权页面和现有样式入口。保持业务结构、文字与状态。手机参考的视觉语言适配桌面侧栏、表单、表格和弹窗；不用手机展板布局代替产品 UI。
3. 读取 [主题实现契约](references/theme-contract.md)；具体令牌见 [主题注册表](references/themes.json)，示例 CSS 见 [tokens.css](assets/tokens.css)。变量是建议值，不是精确取色。
4. 对已授权的样式改动复用组件并实施。已有项目新增主题切换系统、持久化或跨模块重设计，应先按项目规范提交范围和计划；安装本 Skill 不授予这些业务修改权限。
5. 在真实界面核对正常/悬停/焦点/禁用/错误、长中文、小窗口与图表。主题切换不得丢失输入、导航、选中项或弹窗状态。报告已测试与未验证内容。

## 视觉底线
留白、字重、材质与插画共同构成风格，不能只换主色。淡背景允许低饱和，正文不能照搬参考中的低对比小字。自然插画作为局部装饰，桌面数据页以可读性为先。公开版不包含原始参考图，风格描述与 CSS 变量是设计建议，不代表原图精确还原。输出使用原创/有权使用的素材，不引入其他 App 商标或素材。主题标题与产品名使用本项目文字。

## 动画与扩展
静态图没有动画证据；动效是可选建议。用现有 CSS 或已安装库，遵守 prefers-reduced-motion，不擅自安装动画依赖。新增参考按 [扩展规则](references/theme-contract.md#新增风格) 保留旧 ID、原图索引和全部主题；只在用户请求维护此 Skill 时写入技能库。没有新增维护请求时，仅在当前项目使用。

示例：使用 $personal-ui-themes，为当前软件设计主题切换方案，保留 10 个主题；先列范围，不修改业务功能。
