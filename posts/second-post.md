# 纯静态博客的搭建思路

## 背景

市面上有很多博客方案：WordPress、Hexo、Hugo、Next.js 博客模板……它们各有优劣，但有时候我们只需要一个**足够简单**的东西。

## 技术选型

### 为什么选择纯静态？

| 方案 | 优点 | 缺点 |
|------|------|------|
| WordPress | 功能强大 | 需要服务器、数据库 |
| Hexo/Hugo | 静态生成、速度快 | 需要安装 Node/Go 环境 |
| 纯静态 HTML/JS | 零依赖、直接部署 | 功能相对有限 |

对于个人博客来说，**纯静态方案**足够了。

### 核心技术

1. **marked.js**：轻量级 Markdown 解析库，通过 CDN 引入即可
2. **fetch API**：加载 `.md` 文件和 `posts.json` 索引
3. **CSS Grid/Flexbox**：实现响应式布局
4. **URL 参数**：通过 `?id=xxx` 传递文章标识

## 项目结构

```text
blog/
├── index.html      # 首页文章列表
├── post.html       # 文章详情页
├── about.html      # 关于我
├── css/style.css   # 全局样式
├── js/main.js      # 核心逻辑
├── posts.json      # 文章索引
└── posts/*.md      # 文章内容
```

## 发布新文章

只需要三步：

1. 在 `posts/` 下新建一个 `.md` 文件
2. 在 `posts.json` 中添加一行元数据
3. 所有页面自动更新 ✨

## 部署

因为是纯静态文件，可以部署到任何地方：

- **GitHub Pages**：免费、自带 HTTPS
- **Vercel / Netlify**：自动部署
- **任意静态服务器**：Nginx、Apache 等

## 总结

简单不代表不好。对于个人博客这个场景，**够用就好**。把所有精力放在内容上，而不是折腾工具链。
