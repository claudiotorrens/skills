/**
 * 账号数据分析模块
 * 计算发布规律、互动率等指标
 */

/**
 * 计算互动率
 */
function calculateEngagementRate(likes, comments, shares, followers) {
  if (!followers || followers === 0) return 0;

  const totalEngagement = (likes || 0) + (comments || 0) + (shares || 0);
  return ((totalEngagement / followers) * 100).toFixed(2);
}

/**
 * 分析发布时间规律
 */
function analyzePublishingPattern(videos) {
  if (!videos || videos.length === 0) {
    return {
      averageFrequency: 0,
      peakHours: [],
      averageDuration: 0
    };
  }

  // 计算发布频率
  const sortedVideos = videos.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));
  const oldestVideo = sortedVideos[sortedVideos.length - 1];
  const newestVideo = sortedVideos[0];

  const daysDiff = Math.max(1, (new Date(newestVideo.publishTime) - new Date(oldestVideo.publishTime)) / (1000 * 60 * 60 * 24));
  const averageFrequency = (videos.length / daysDiff).toFixed(2);

  // 分析发布时段
  const hourCounts = {};
  videos.forEach(video => {
    const hour = new Date(video.publishTime).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => `${hour}:00 (${count}个视频)`);

  // 计算平均时长
  const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
  const averageDuration = Math.round(totalDuration / videos.length);

  return {
    averageFrequency,
    peakHours,
    averageDuration
  };
}

/**
 * 识别爆款内容
 */
function identifyViralVideos(videos, topN = 5) {
  if (!videos || videos.length === 0) return [];

  return videos
    .map(video => ({
      ...video,
      engagementRate: calculateEngagementRate(
        video.stats?.likes,
        video.stats?.comments,
        video.stats?.shares,
        video.stats?.plays
      )
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, topN);
}

/**
 * 生成账号分析报告
 */
function generateReport(accountData, videos, viralVideos, pattern) {
  let report = '=== 抖音账号分析报告 ===\n\n';

  // 基础数据
  report += '📊 基础数据\n';
  report += `• 账号: ${accountData.nickname || '未知'}\n`;
  report += `• 粉丝: ${formatNumber(accountData.stats?.followers)}\n`;
  report += `• 获赞: ${formatNumber(accountData.stats?.likes)}\n`;
  report += `• 作品: ${accountData.stats?.videos || 0}个\n\n`;

  // 发布规律
  report += '📈 发布规律\n';
  report += `• 平均发布: 每天 ${pattern.averageFrequency} 个视频\n`;
  report += `• 高峰时段: ${pattern.peakHours.join(', ') || '无'}\n`;
  report += `• 平均时长: ${pattern.averageDuration} 秒\n\n`;

  // 爆款内容
  if (viralVideos && viralVideos.length > 0) {
    report += '🔥 爆款内容 TOP ' + viralVideos.length + '\n';
    viralVideos.forEach((video, index) => {
      report += `${index + 1}. ${video.title}\n`;
      report += `   互动率: ${video.engagementRate}%\n`;
      if (video.stats) {
        report += `   播放: ${formatNumber(video.stats.plays)} | `;
        report += `点赞: ${formatNumber(video.stats.likes)}\n`;
      }
    });
    report += '\n';
  }

  return report;
}

/**
 * 格式化数字
 */
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

module.exports = {
  calculateEngagementRate,
  analyzePublishingPattern,
  identifyViralVideos,
  generateReport,
  formatNumber
};
