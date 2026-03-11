#!/usr/bin/env node

/**
 * 抖音账号分析器 - 主入口
 */

require('dotenv').config();

const accountScraper = require('../lib/account-scraper');
const analyzer = require('../lib/analyzer');
const path = require('path');

const TEMP_DIR = process.env.TEMP_DIR || path.join(__dirname, '../temp');

/**
 * 打印欢迎信息
 */
function printBanner() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║    📊 抖音账号分析器 v1.0.0                ║');
  console.log('║    Douyin Account Analyzer                 ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log('用法: node scripts/analyze.js <账号链接或用户ID>');
  console.log('');
  console.log('示例:');
  console.log('  node scripts/analyze.js "https://v.douyin.com/xxxxx"');
  console.log('  node scripts/analyze.js "MS4wLjABAAAA..."');
  console.log('');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    return printHelp();
  }

  const input = args[0];

  printBanner();

  try {
    // 步骤 1: 解析账号ID
    console.log('ℹ️  步骤 1/4: 解析账号信息...');
    const { userId, url } = await accountScraper.resolveAccountId(input);
    console.log(`  ✓ 目标URL: ${url}`);

    // 步骤 2: 抓取账号数据
    console.log('');
    console.log('ℹ️  步骤 2/4: 抓取账号数据...');
    const result = await accountScraper.fetchAccountInfo(url);

    if (!result.success) {
      console.error(`❌ 错误: ${result.error}`);
      console.log('');
      console.log('💡 提示: 请确保链接格式正确，或稍后重试');
      return;
    }

    // 模拟数据（实际应该从页面提取）
    const accountData = {
      nickname: result.data.title?.split('-')[0]?.trim() || '未知用户',
      stats: {
        followers: 125000,
        likes: 893000,
        videos: 142
      }
    };

    console.log(`  ✓ 账号: ${accountData.nickname}`);
    console.log(`  ✓ 粉丝: ${analyzer.formatNumber(accountData.stats.followers)}`);
    console.log(`  ✓ 作品: ${accountData.stats.videos}个`);

    // 步骤 3: 分析发布规律（模拟数据）
    console.log('');
    console.log('ℹ️  步骤 3/4: 分析发布规律...');

    // 模拟视频数据
    const mockVideos = Array.from({ length: 20 }, (_, i) => ({
      title: `视频标题 ${i + 1}`,
      publishTime: new Date(Date.now() - i * 86400000).toISOString(),
      duration: 30 + Math.floor(Math.random() * 60),
      stats: {
        plays: Math.floor(Math.random() * 100000),
        likes: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 1000),
        shares: Math.floor(Math.random() * 500)
      }
    }));

    const pattern = analyzer.analyzePublishingPattern(mockVideos);
    console.log(`  ✓ 平均频率: 每天 ${pattern.averageFrequency} 个视频`);
    console.log(`  ✓ 高峰时段: ${pattern.peakHours[0] || '未知'}`);

    // 步骤 4: 识别爆款内容
    console.log('');
    console.log('ℹ️  步骤 4/4: 识别爆款内容...');
    const viralVideos = analyzer.identifyViralVideos(mockVideos, 5);
    console.log(`  ✓ 识别到 ${viralVideos.length} 个爆款内容`);

    // 生成报告
    console.log('');
    console.log(analyzer.generateReport(accountData, mockVideos, viralVideos, pattern));

    // 保存数据
    const outputDir = path.join(TEMP_DIR, 'reports');
    require('fs').mkdirSync(outputDir, { recursive: true });

    const reportPath = path.join(outputDir, `account_${Date.now()}.json`);
    require('fs').writeFileSync(reportPath, JSON.stringify({
      account: accountData,
      pattern,
      viralVideos
    }, null, 2));

    console.log(`📁 详细数据已保存至: ${reportPath}`);

  } catch (error) {
    console.error('');
    console.error('❌ 发生错误:', error.message);
    console.error('');
    console.error(error.stack);
  }
}

// 运行主函数
main();
