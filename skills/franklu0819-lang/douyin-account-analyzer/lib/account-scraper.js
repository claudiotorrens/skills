/**
 * 抖音账号信息抓取模块
 * 使用 Playwright 绕过反爬，获取账号基础数据和视频列表
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * 从抖音分享链接中提取用户ID
 */
function extractUserId(url) {
  // 匹配用户主页链接
  const userMatch = url.match(/user\/([^/?]+)/);
  if (userMatch) return userMatch[1];

  // 匹配短链接 - 需要通过解析获取
  return null;
}

/**
 * 使用 Playwright 抓取账号信息
 */
async function fetchAccountInfo(url) {
  console.log(`  🌐 启动浏览器抓取账号信息: ${url}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // 等待网络空闲后再继续
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 提取页面数据
    const accountData = await page.evaluate(() => {
      // 尝试从页面中提取账号信息
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : null;
      };

      // 尝试多种选择器
      const title = document.title;
      const metaDesc = document.querySelector('meta[name="description"]')?.content;

      return {
        title,
        metaDescription: metaDesc,
        pageUrl: window.location.href
      };
    });

    console.log(`  ✅ 页面数据提取成功`);

    return {
      success: true,
      data: accountData
    };

  } catch (error) {
    console.error(`  ❌ 抓取失败: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

/**
 * 解析账号ID从各种格式的链接
 */
async function resolveAccountId(url) {
  // 如果是用户ID格式，直接返回
  if (url.startsWith('MS4wLjAB')) {
    return { userId: url, url: `https://www.douyin.com/user/${url}` };
  }

  // 如果是完整链接，提取用户ID
  const match = url.match(/user\/([^/?]+)/);
  if (match) {
    return { userId: match[1], url: `https://www.douyin.com/user/${match[1]}` };
  }

  // 短链接需要通过浏览器重定向获取
  return { userId: null, url };
}

module.exports = {
  extractUserId,
  fetchAccountInfo,
  resolveAccountId
};
