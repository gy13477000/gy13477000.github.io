# gy13477000.github.io

个人主页 + 常用在线工具集合，部署在 GitHub Pages。

## 技术栈

- Vue 3 + TypeScript + Vite
- Vue Router（路由）
- Pinia（主题状态）
- lucide-vue-next（图标）
- 纯 CSS Variables 实现亮/暗主题

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:5173

## 构建

```bash
npm run build
```

产物输出到 `dist/`。

## 部署

推送到 `main` 分支，GitHub Actions 自动构建并部署到 GitHub Pages。

Settings → Pages → Source 选择 `GitHub Actions`。

## 工具列表

- **JSON 格式化**：美化 / 压缩 / 转义 / 校验
- **RSA 加解密**：浏览器侧密钥生成 + 长文本分段加解密（RSA-OAEP + AES-GCM）

## 新增工具

1. 在 `src/views/tools/` 下新建视图组件
2. 在 `src/tools/tools.ts` 注册工具元信息
3. 在 `src/router/index.ts` 添加路由

## 目录结构

```
src/
├── components/    # 通用组件
├── views/         # 页面视图
├── tools/         # 工具核心逻辑（与 UI 解耦）
├── stores/        # Pinia 状态
├── router/        # 路由
├── styles/        # 全局样式
└── utils/         # 工具函数
```