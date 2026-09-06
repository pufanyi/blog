# 站点配置

常用站点设置集中在这里。文章仍放在 `content/posts/`，简历内容仍放在
`content/cv.yaml`。

| 文件 | 可调整的内容 |
| --- | --- |
| [blog.yaml](./blog.yaml) | 每页文章数、博客描述、列表摘要/封面/日期的显示、文末 BibTeX 卡片 |
| [site.yaml](./site.yaml) | 站点地址和名称、默认描述和分享图片、页面元数据中的作者、引用作者和键名前缀、页脚 |
| [comments.yaml](./comments.yaml) | 评论开关、Giscus 仓库和分类、语言、表情回应、输入框位置 |
| [redirects.yaml](./redirects.yaml) | 旧路径的跳转目标与标题（原 `content/redirects.yaml`） |

## 修改每页文章数

编辑 `blog.yaml`：

```yaml
postsPerPage: 10
```

必须是正整数。文章按发布日期倒序排列，第一页是 `/blog`，后续页是
`/blog/page/2`、`/blog/page/3` 等；`/blog/page/1` 会跳回 `/blog`。
每页都有独立的静态 HTML、标题和 canonical 链接。修改篇数后，构建会重新计算
所有页；无效或超出范围的页码显示 404。搜索始终覆盖全部已发布文章。

`showDescriptions`、`showCoverImages`、`showDates` 只影响列表中的显示；
`showCitation` 控制文章末尾的 BibTeX 卡片，不影响文章内部的参考文献。

## 其他设置

- `site.url` 使用站点根地址，例如 `https://pufanyi.com`，不要带子路径、查询参数或片段。
  它用于 canonical、分享链接、文章引用链接和评论主题样式地址。
- `site.defaultImage` 可以是 `/me.avif` 这样的站内路径，也可以是完整的 HTTP(S) 地址。
- `site.author.name` 用于页面标题和元数据；`citationName` 使用 BibTeX 的姓名格式，
  例如 `Pu, Fanyi`；`citationKeyPrefix` 是引用键前缀，例如 `pu`。
  个人介绍和简历中的正文仍按各自的内容文件编辑。
- 关闭评论时，把 `comments.enabled` 改为 `false`，保留其余字段。页面不会加载 Giscus。
- `redirects.yaml` 的 `from` 是站内路径，`to` 是完整的 HTTP(S) 目标地址。
  没有重定向时写 `[]`。

## 让修改生效

这些 YAML 在构建时读取，并校验字段名、值类型和页码范围。
布尔值写 `true` / `false`，不要加引号；不认识的字段会报错，提示文件和字段位置。

开发服务器已经运行时，执行：

```bash
pnpm generate:data
```

等待开发服务器编译完成后刷新页面。`pnpm start`、`pnpm check`、`pnpm test` 和
`pnpm build` 也会自动生成数据。部署前重新执行 `pnpm build`。
生成文件位于 `src/app/data/*-config.ts`，不需要手动编辑。
