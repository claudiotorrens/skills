# 抖音账号分析器 (Douyin Account Analyzer)

> 📊 深度分析抖音账号的整体表现，找出爆款内容和运营策略

## 功能特性

- ✅ **账号数据抓取**: 自动获取粉丝数、获赞数、作品数等基础数据
- ✅ **内容风格分析**: AI 分析视频视觉风格、主题、制作水平
- ✅ **发布规律分析**: 分析发布时间、频率、时长分布
- ✅ **互动率分析**: 计算平均点赞、评论、分享数据
- ✅ **爆款内容识别**: 自动识别高互动率视频并分析其特征

## 安装

```bash
npm install
```

## 配置

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
ZHIPU_API_KEY=your_zhipu_api_key_here
GLM_MODEL=glm-4.6v
TEMP_DIR=./temp
```

## 使用

### 分析账号

```bash
# 使用账号链接
node scripts/analyze.js "https://v.douyin.com/xxxxx"

# 使用用户ID
node scripts/analyze.js "MS4wLjABAAAA..."
```

### 输出示例

```
=== 抖音账号分析报告 ===

📊 基础数据
• 账号: 晓辉博士
• 粉丝: 12.5万
• 获赞: 89.3万
• 作品: 142个

📈 发布规律
• 平均发布: 每天 1.2 个视频
• 高峰时段: 18:00 (8个视频)
• 平均时长: 58 秒

🔥 爆款内容 TOP 5
1. 视频标题 5
   互动率: 8.52%
   播放: 9.8万 | 点赞: 8234

2. 视频标题 12
   互动率: 7.21%
   播放: 7.2万 | 点赞: 5187

...
```

## 技术实现

- **Playwright**: 绕过抖音反爬机制，动态渲染页面
- **数据分析**: 统计发布规律和互动率
- **AI 集成**: 可选集成 GLM-4.6V 进行视觉风格分析

## 项目结构

```
douyin-account-analyzer/
├── lib/
│   ├── account-scraper.js    # 账号数据抓取
│   └── analyzer.js           # 数据分析模块
├── scripts/
│   └── analyze.js            # 主分析脚本
├── temp/                     # 临时数据
└── package.json
```

## 作者

Leo & Neo (Startup Partners)

## 许可证

MIT
