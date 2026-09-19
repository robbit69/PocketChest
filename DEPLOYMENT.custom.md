# 当前 Cloudflare 部署

- 地址：https://p.justfr.org 和 https://p.yanrrd.com
- 两个域名连接同一个 Worker `pocket-chest`，共用 D1 数据库和私有 R2 桶。
- 前端静态文件由 Workers Static Assets 托管，`/api/*` 由后端处理。
- `REQUIRE_TOTP=false`：任何人可以上传，取件需要取件码。
- 每小时自动清理过期文件。JWT_SECRET 仅存储于 Cloudflare Worker Secrets。

## 更新部署

首次使用本机时先运行 `npx wrangler login`，之后从仓库根目录执行：

```sh
npm ci --prefix pocket-chest-frontend
npm ci --prefix pocket-chest-backend
npm run build:cloudflare --prefix pocket-chest-frontend
cd pocket-chest-backend
npm run deploy
```

已有数据库已初始化，正常更新无需重新创建数据库、存储桶或密钥。不要将 JWT_SECRET 或 Cloudflare 登录凭据提交到 GitHub。

构建时将 NEXT_PUBLIC_API_URL 设置为空字符串，以便每个访问域名请求自己的 /api 路径。
