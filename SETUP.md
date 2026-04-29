# 相册应用 - 设置指南

## 项目结构

```
photo-gallery/
├── src/
│   ├── app/
│   │   ├── page.tsx          # 登录页面
│   │   ├── gallery/
│   │   │   └── page.tsx      # 照片画廊页面
│   │   ├── layout.tsx        # 布局文件
│   │   └── globals.css       # 全局样式
│   └── lib/
│       └── supabase.ts       # Supabase客户端配置
├── import_users.sql          # 用户数据SQL
├── package.json
└── .env.local                # 环境变量（已配置）
```

## Supabase 设置步骤

### 1. 创建数据库表

在 Supabase 控制台的 **SQL Editor** 中执行以下SQL：

```sql
-- 创建 users 表
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 photos 表
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取 users 表（用于登录验证）
CREATE POLICY "Allow public read users" ON users
  FOR SELECT USING (true);

-- 允许所有人读取 photos 表
CREATE POLICY "Allow public read photos" ON photos
  FOR SELECT USING (true);

-- 允许认证用户插入 photos
CREATE POLICY "Allow insert photos" ON photos
  FOR INSERT WITH CHECK (true);
```

### 2. 导入用户数据

在 SQL Editor 中执行 `import_users.sql` 文件的内容。

### 3. 创建存储桶

1. 进入 **Storage** 页面
2. 点击 **New Bucket**
3. 名称输入: `photos`
4. 勾选 **Public bucket**（公开访问）
5. 点击 **Create bucket**

### 4. 配置存储策略

在存储桶的 **Policies** 标签中添加：

- **Policy name**: `Allow public uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `public`

- **Policy name**: `Allow public reads`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`

## 本地运行

```bash
# 安装 Node.js: https://nodejs.org/

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 部署完成
