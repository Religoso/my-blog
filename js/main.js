/* ===== 工具函数 ===== */

/** 从 URL hash 获取文章 ID */
function getPostId() {
    const hash = window.location.hash;
    return hash ? hash.replace('#', '') : null;
}

/** 格式化日期为友好的中文格式 */
function formatDate(dateStr) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}年${month}月${day}日`;
}

/** 高亮当前页面的导航链接 */
function highlightNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (path.endsWith(href) || (href === 'index.html' && (path.endsWith('/') || path.endsWith('index.html')))) {
            link.classList.add('active');
        }
    });
}

/* ===== 多彩标签 ===== */

/** 为每个标签名生成一个稳定的颜色索引 */
function getTagColorIndex(tagName) {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
        hash = ((hash << 5) - hash) + tagName.charCodeAt(i);
        hash |= 0; // 转为 32 位整数
    }
    return Math.abs(hash) % 8; // 8 种颜色
}

/** 渲染标签 HTML，带彩色样式 */
function renderTagHtml(tagName) {
    const idx = getTagColorIndex(tagName);
    return `<span class="post-tag" style="background: var(--tag-bg-${idx}); color: var(--tag-color-${idx});">${escapeHtml(tagName)}</span>`;
}

/** 渲染分类徽章 HTML */
function renderCategoryHtml(category) {
    // 分类使用暖色渐变
    return `<span class="post-category">${escapeHtml(category)}</span>`;
}

/* ===== 数据加载 ===== */

let postsIndex = [];

/** 加载文章索引 */
async function loadPostsIndex() {
    try {
        const resp = await fetch('posts.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        postsIndex = await resp.json();
        // 按日期降序排列
        postsIndex.sort((a, b) => new Date(b.date) - new Date(a.date));
        return postsIndex;
    } catch (err) {
        console.error('加载文章索引失败:', err);
        return [];
    }
}

/** 提取所有分类和标签 */
function extractFilters(posts) {
    const categories = new Set();
    const tags = new Set();
    posts.forEach(p => {
        if (p.category) categories.add(p.category);
        if (p.tags) p.tags.forEach(t => tags.add(t));
    });
    return {
        categories: [...categories].sort(),
        tags: [...tags].sort()
    };
}

/* ===== 首页渲染 ===== */

/** 渲染筛选按钮 */
function renderFilterBar(posts) {
    const filterBar = document.getElementById('filter-bar');
    if (!filterBar) return;

    const { categories, tags } = extractFilters(posts);

    let html = `<button class="filter-btn active" data-filter="all">✨ 全部</button>`;

    categories.forEach(cat => {
        html += `<button class="filter-btn" data-filter="category:${cat}">📁 ${cat}</button>`;
    });

    tags.forEach(tag => {
        html += `<button class="filter-btn" data-filter="tag:${tag}">🏷 ${tag}</button>`;
    });

    filterBar.innerHTML = html;

    // 绑定筛选事件
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            renderPostList(filter === 'all' ? posts : filterPosts(posts, filter));
        });
    });
}

/** 根据筛选条件过滤文章 */
function filterPosts(posts, filter) {
    if (filter.startsWith('category:')) {
        const cat = filter.replace('category:', '');
        return posts.filter(p => p.category === cat);
    }
    if (filter.startsWith('tag:')) {
        const tag = filter.replace('tag:', '');
        return posts.filter(p => p.tags && p.tags.includes(tag));
    }
    return posts;
}

/** 渲染文章列表 */
function renderPostList(posts) {
    const postList = document.getElementById('post-list');
    if (!postList) return;

    if (posts.length === 0) {
        postList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>暂无文章</p>
            </div>`;
        return;
    }

    postList.innerHTML = posts.map(post => `
        <a href="post.html#${post.id}" class="post-card">
            <h2>${escapeHtml(post.title)}</h2>
            <div class="post-meta">
                <span>📅 ${formatDate(post.date)}</span>
                ${post.category ? renderCategoryHtml(post.category) : ''}
            </div>
            <p class="post-summary">${escapeHtml(post.summary)}</p>
            <div class="post-tags">
                ${(post.tags || []).map(t => renderTagHtml(t)).join('')}
            </div>
        </a>
    `).join('');
}

/** HTML 转义 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ===== 文章详情渲染 ===== */

/** 加载并渲染文章详情 */
async function renderPostDetail() {
    const postId = getPostId();
    if (!postId) {
        document.getElementById('post-container').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>未指定文章 ID</p>
            </div>`;
        return;
    }

    // 加载文章索引获取元数据
    await loadPostsIndex();
    const meta = postsIndex.find(p => p.id === postId);

    // 更新页面标题
    if (meta) {
        document.title = `${meta.title} - 个人博客`;
    }

    // 加载 Markdown 内容
    try {
        const resp = await fetch(`posts/${postId}.md`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const mdText = await resp.text();
        const htmlContent = marked.parse(mdText);

        // 渲染文章头部
        const articleHeader = document.getElementById('article-header');
        if (meta && articleHeader) {
            articleHeader.innerHTML = `
                <h1>${escapeHtml(meta.title)}</h1>
                <div class="article-meta">
                    <span>📅 ${formatDate(meta.date)}</span>
                    ${meta.category ? renderCategoryHtml(meta.category) : ''}
                    ${(meta.tags || []).map(t => renderTagHtml(t)).join('')}
                </div>`;
        }

        // 渲染文章内容
        const articleContent = document.getElementById('article-content');
        if (articleContent) {
            articleContent.innerHTML = htmlContent;
        }
    } catch (err) {
        console.error('加载文章失败:', err);
        document.getElementById('post-container').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">😞</div>
                <p>文章加载失败：${err.message}</p>
            </div>`;
    }
}

/* ===== 页面入口 ===== */

/** 首页初始化 */
async function initHomePage() {
    const posts = await loadPostsIndex();
    renderFilterBar(posts);
    renderPostList(posts);
}

/** 通用初始化 */
function init() {
    highlightNav();

    // 根据页面类型初始化
    if (document.getElementById('post-list')) {
        initHomePage();
    } else if (document.getElementById('article-content')) {
        renderPostDetail();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
