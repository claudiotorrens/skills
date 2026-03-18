---
name: vidu-generation
description: "Vidu AI视频/图像/音频生成平台集成。支持：(1) 文生视频、图生视频、参考生视频、首尾帧视频，(2) 图片生成、参考生图，(3) 场景特效模板，(4) 语音合成TTS、声音复刻、文生音频，(5) 社交媒体搜索分析。触发：生成视频、生成图片、AI配音、声音克隆、场景特效、参考生视频等请求。"
---

# Vidu Generation

Vidu AI生成平台完整集成，支持视频、图像、音频生成及社交媒体搜索。

## Prerequisites

用户需设置以下环境变量：

```bash
# Vidu API Key (必需)
export VIDU_API_KEY="your-vidu-api-key"

# Tavily API Key (搜索功能必需)
export TAVILY_API_KEY="your-tavily-api-key"
```

获取API Key:
- Vidu: https://platform.vidu.cn
- Tavily: https://tavily.com (免费)

**Base URL**: `https://api.vidu.cn/ent/v2`

## Quick Start

使用Python CLI工具（推荐）：

```bash
# 文生视频（自动推荐模型）
python3 {baseDir}/scripts/vidu_cli.py text2video --prompt "一只猫咪在阳光下打哈欠" --model viduq3-pro

# 图生视频
python3 {baseDir}/scripts/vidu_cli.py img2video --image photo.jpg --prompt "人物缓缓转头微笑"

# 生成图片（新接口，默认q3-fast）
python3 {baseDir}/scripts/vidu_cli.py nano-image --prompt "一只可爱的橘猫" --resolution 2K

# 查询任务状态
python3 {baseDir}/scripts/vidu_cli.py status <task_id> --wait --download ~/Desktop
```

## API Capabilities

### 视频生成

#### 1. 文生视频 (text2video)

从文本描述生成视频。

```bash
python3 {baseDir}/scripts/vidu_cli.py text2video \
  --prompt "视频描述文本" \
  --model viduq3-pro \
  --duration 5 \
  --aspect-ratio 16:9 \
  --resolution 720p \
  --audio true
```

**模型选项**：
- `viduq3-pro`: 最新模型，质量高，支持音视频直出（推荐）
- `viduq3-turbo`: 速度快，支持音视频直出
- `viduq2`: 文生视频/参考生视频，细节丰富
- `viduq1`: 基础模型

**关键参数**：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| duration | int | 5 | 时长(秒)：q3系列1-16，q2系列1-10，q1固定5 |
| aspect_ratio | str | 16:9 | 16:9, 9:16, 4:3, 3:4, 1:1 |
| resolution | str | 720p | 540p, 720p, 1080p |
| audio | bool | true | 音视频直出（仅q3系列） |
| off_peak | bool | false | 错峰模式更便宜 |

#### 2. 图生视频 (img2video)

从图片生成视频，图片作为首帧。

```bash
python3 {baseDir}/scripts/vidu_cli.py img2video \
  --image photo.jpg \
  --prompt "人物挥手，镜头上移" \
  --model viduq3-pro \
  --duration 5 \
  --audio true
```

**模型选项**：
- `viduq3-pro`, `viduq3-turbo`: 推荐，支持音视频直出
- `viduq2-pro-fast`: 速度快，性价比高
- `viduq2-pro`, `viduq2-turbo`: 高质量
- `viduq1`, `viduq1-classic`: 基础模型
- `vidu2.0`: 最快速度

**关键参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| images | array | 首帧图片URL或base64，支持png/jpeg/jpg/webp |
| audio | bool | 音视频直出 |
| audio_type | str | all(音效+人声), speech_only, sound_effect_only |
| voice_id | str | 音色ID，参考[音色列表](https://shengshu.feishu.cn/sheets/EgFvs6DShhiEBStmjzccr5gonOg) |
| is_rec | bool | 使用推荐提示词(+10积分) |

#### 3. 参考生视频 (reference2video)

支持两种模式：**主体调用**（音视频直出）和**非主体调用**（视频生成）。

**非主体调用**（推荐，使用viduq2-pro模型）：

```bash
python3 {baseDir}/scripts/vidu_cli.py ref2video \
  --images img1.jpg img2.jpg img3.jpg \
  --prompt "圣诞老人和熊在湖边拥抱" \
  --model viduq2-pro \
  --duration 5 \
  --bgm true
```

**主体调用**（支持多角色对话）：

```bash
python3 {baseDir}/scripts/vidu_cli.py ref2video-subject \
  --subjects '[{"id":"角色1","images":["img1.jpg"],"voice_id":"host_male"},{"id":"角色2","images":["img2.jpg"]}]' \
  --prompt "@角色1 和 @角色2 在一起吃火锅，并且旁白音说火锅大家都爱吃" \
  --audio true
```

**关键参数**：
| 参数 | 说明 |
|------|------|
| images | 1-7张参考图片 |
| videos | 1-2个参考视频（仅viduq2-pro） |
| subjects | 主体信息列表，每个主体最多3张图 |
| bgm | 添加背景音乐 |

#### 4. 首尾帧视频 (start-end2video)

提供首帧和尾帧图片，生成过渡视频。

```bash
python3 {baseDir}/scripts/vidu_cli.py start-end2video \
  --start-frame start.jpg \
  --end-frame end.jpg \
  --prompt "镜头推进，鸟儿飞向天空" \
  --model viduq3-pro \
  --duration 5
```

**注意**：首尾帧图片分辨率需相近（比例在0.8-1.25之间）

#### 5. 场景特效模板 (template)

预设特效模板，快速生成创意视频。

```bash
python3 {baseDir}/scripts/vidu_cli.py template \
  --template hugging \
  --image photo.jpg \
  --prompt "画面中的两个主体转向彼此，并开始拥抱"
```

**智能模板推荐**：当用户描述场景时，自动推荐合适的模板：

```bash
# 自动推荐模板
python3 {baseDir}/scripts/vidu_cli.py template-recommend \
  --image photo.jpg \
  --description "我想让照片里的人拥抱"
```

**热门模板**：
- `hugging`: 拥抱特效
- `exotic_princess`: 异域公主
- `beast_companion`: 与兽同行
- `subject_3`: 主体特效
- 更多模板见 [references/template_knowledge.json](references/template_knowledge.json)

### 图像生成

#### 6. 新图片生成接口 (推荐)

**新接口**: `/reference2image/nano` - 支持最新模型

```bash
# 文生图（默认使用q3-fast）
python3 {baseDir}/scripts/vidu_cli.py nano-image \
  --prompt "一只可爱的橘猫坐在窗台上" \
  --model q3-fast \
  --aspect-ratio 16:9 \
  --resolution 2K

# 参考生图（上传参考图片）
python3 {baseDir}/scripts/vidu_cli.py nano-image \
  --prompt "类似风格的猫咪插画" \
  --images ref1.jpg ref2.jpg \
  --model q3-fast
```

**模型选项**：
| 模型 | 分辨率 | 特点 | 积分消耗 |
|------|--------|------|----------|
| `q3-fast` | 1K, 2K, 4K | 最新模型，默认使用 | 15/25/35 |
| `q2-fast` | 1K | 速度快，价格低 | 9 |
| `q2-pro` | 1K, 2K, 4K | 效果最好，价格高 | 30/30/55 |

**关键参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | String | 是 | `q3-fast`(推荐), `q2-fast`, `q2-pro` |
| prompt | String | 是 | 文本描述（最多2000字符） |
| images | Array | 否 | 参考图片（0-14张），不传即为文生图 |
| aspect_ratio | String | 否 | 9:16, 2:3, 3:4, 4:5, 1:1, 5:4, 4:3, 3:2, 16:9, 21:9 |
| resolution | String | 否 | 1K, 2K, 4K（视模型而定） |

#### 7. 旧图片生成接口 (兼容)

```bash
python3 {baseDir}/scripts/vidu_cli.py text2image \
  --prompt "一只可爱的橘猫坐在窗台上" \
  --model viduq2 \
  --aspect-ratio 16:9 \
  --resolution 1080p
```

**旧模型选项**：
- `viduq2`: 支持文生图、图片编辑、参考生图
- `viduq1`: 仅支持参考生图

### 音频生成

#### 7. 语音合成 TTS

**自动推荐逻辑**：根据内容场景自动选择合适的音色，无需用户手动选择。

```bash
python3 {baseDir}/scripts/vidu_cli.py tts \
  --text "配音文本" \
  --voice-id "自动推荐" \
  --speed 1.0
```

**自动推荐规则**：

| 内容场景 | 推荐Voice ID | 说明 |
|----------|-------------|------|
| 小红书/短视频（女性向） | female-shaonv | 少女音色，活泼亲切 |
| 小红书/短视频（男性向） | male-qn-jingying | 精英青年，专业感 |
| 教程/知识科普 | Chinese (Mandarin)_Male_Announcer | 播报男声，清晰专业 |
| 情感/故事类 | female-yujie | 御姐音色，有感染力 |
| 商务/产品介绍 | Chinese (Mandarin)_Reliable_Executive | 沉稳高管，专业可信 |
| 可爱/萌系内容 | lovely_girl | 萌萌女童，活泼可爱 |
| 搞笑/轻松内容 | Chinese (Mandarin)_Humorous_Elder | 搞笑大爷，幽默感 |
| 温馨/治愈内容 | Chinese (Mandarin)_Warm_Girl | 温暖少女，温柔治愈 |
| 甜美风格 | Chinese (Mandarin)_Sweet_Lady | 甜美女声 |
| 专业主持 | Chinese (Mandarin)_News_Anchor | 新闻女声 |
| 英文内容 | English_Trustworthy_Man | 英文男声（男）/ English_Graceful_Lady（女） |
| 日文内容 | Japanese_GentleButler | 日文男声（男）/ Japanese_KindLady（女） |
| 韩文内容 | Korean_SweetGirl | 韩文女声（女）/ Korean_CheerfulBoyfriend（男） |

**推荐决策流程**：
```
1. 检测语言 → 选择对应语言的音色池
2. 分析内容类型 → 
   - 产品推广/营销 → 沉稳专业音色
   - 情感故事 → 有感染力音色
   - 教程科普 → 清晰播报音色
   - 轻松娱乐 → 活泼幽默音色
   - 温馨治愈 → 温柔音色
3. 默认 → 根据平台特征选择（小红书用少女/青年音色）
```

**关键参数**：
| 参数 | 说明 |
|------|------|
| voice_id | 音色ID，见 references/voice_id_list.md（自动推荐时无需指定） |
| speed | 语速 [0.5, 2]，默认1.0 |
| volume | 音量 0-10，默认0 |
| pitch | 语调 [-12, 12]，默认0 |
| emotion | 情绪：happy, sad, angry, fearful, disgusted, surprised, calm |

**停顿控制**：使用 `<#x#>` 标记，x为秒数
```
你好<#2#>我是vidu<#2#>很高兴见到你
```

**注意**：如果用户明确指定了voice_id或声音类型（如"用少女音"、"用男声"），则按用户要求使用。

#### 8. 声音复刻

复刻任意音色，用于后续语音合成。

```bash
python3 {baseDir}/scripts/vidu_cli.py voice-clone \
  --audio-url sample.mp3 \
  --voice-id my_voice_001 \
  --text "你好，这是我的复刻声音" \
  --prompt-audio-url reference.mp3 \
  --prompt-text "参考音频对应的文本"
```

**注意**：
- 原音频时长：10秒-5分钟
- 复刻音色为临时音色，7天内需在TTS接口中调用才能永久保留

#### 9. 文生音频

生成背景音乐和音效。

```bash
python3 {baseDir}/scripts/vidu_cli.py text2audio \
  --prompt "清晨的鸟叫声" \
  --duration 10
```

### 任务管理

```bash
# 查询任务状态
python3 {baseDir}/scripts/vidu_cli.py status <task_id>

# 等待任务完成并下载
python3 {baseDir}/scripts/vidu_cli.py status <task_id> --wait --download ~/Desktop

# 取消任务
python3 {baseDir}/scripts/vidu_cli.py cancel <task_id>
```

## 社交媒体搜索

集成Tavily API，支持多平台搜索（小红书、抖音、微博、微信公众号、X等）。

**前置要求**:
```bash
export TAVILY_API_KEY="your-tavily-api-key"
```

获取API Key: https://tavily.com

### CLI使用

```bash
# 搜索所有平台
python3 {baseDir}/scripts/vidu_cli.py social-search --query "AI绘画教程"

# 搜索特定平台
python3 {baseDir}/scripts/vidu_cli.py social-search --query "产品营销视频" --platform xiaohongshu

# 搜索多个平台
python3 {baseDir}/scripts/vidu_cli.py social-search --query "短视频制作" --platform xiaohongshu douyin

# 限制结果数量和时间范围
python3 {baseDir}/scripts/vidu_cli.py social-search --query "AI视频" --limit 10 --days 7

# 深度搜索（更全面，但更慢）
python3 {baseDir}/scripts/vidu_cli.py social-search --query "视频生成" --deep
```

**支持平台**：
| 平台 | 参数名 | 搜索范围 |
|------|--------|----------|
| 小红书 | `xiaohongshu` | xiaohongshu.com + 中文关键词 |
| 抖音 | `douyin` | douyin.com + 中文关键词 |
| 微博 | `weibo` | weibo.com + 中文关键词 |
| 微信公众号 | `wechat` | mp.weixin.qq.com + 中文关键词 |
| X (Twitter) | `x` | twitter.com, x.com |

### 直接调用Node脚本

```bash
# 社交媒体搜索
node {baseDir}/scripts/social_search.mjs "AI视频生成" --platform xiaohongshu -n 10

# 通用网络搜索
node {baseDir}/scripts/search.mjs "video generation AI tools" -n 10 --deep
```

### 通用网络搜索

```bash
# 搜索新闻
python3 {baseDir}/scripts/vidu_cli.py web-search --query "AI video generation news" --topic news --days 7

# 深度研究搜索
python3 {baseDir}/scripts/vidu_cli.py web-search --query "best AI video tools 2025" --deep
```

## 智能模板推荐

当用户请求场景特效时，自动分析图片和文字内容推荐最佳模板：

```python
# 自动推荐逻辑
def recommend_template(user_input, image_content):
    # 1. 分析用户意图关键词
    # 2. 匹配模板描述
    # 3. 返回最合适的模板ID和参数
```

推荐规则见 [references/template_recommendation.md](references/template_recommendation.md)

## References

完整API文档和模板知识库：

- [API参考文档](references/api_reference.md) - 所有API详细参数
- [模板知识库](references/template_knowledge.json) - 场景特效模板列表
- [社交媒体搜索](references/social_search.md) - 搜索API使用指南
- [音色列表](https://shengshu.feishu.cn/sheets/EgFvs6DShhiEBStmjzccr5gonOg) - 可用音色

## Model Recommendation (智能模型推荐)

根据用户场景自动推荐最佳模型。

### 视频生成模型选择

| 场景 | 推荐模型 | 理由 |
|------|----------|------|
| 需要音视频 | `viduq3-pro` | 音视频场景首选，质量最高 |
| 快速生成音视频 | `viduq3-turbo` | 速度快，支持音频 |
| 用户输入视频 | `viduq2-pro` | 参考生视频，支持视频输入 |
| 文生视频(无音频) | `viduq2` | 动态效果好，细节丰富 |
| 图生视频(快速) | `viduq2-pro-fast` | 速度快，细节丰富 |
| 图生视频(性价比) | `viduq2-turbo` | 速度快，价格低 |

### 图片生成模型选择

| 场景 | 推荐模型 | 理由 |
|------|----------|------|
| 所有生图场景 | `q3-fast` | 最新模型，默认使用 |
| 追求速度 | `q2-fast` | 速度快，价格低 |
| 追求画质 | `q2-pro` | 效果最好，价格高 |

### 决策流程

**视频生成**:
1. 用户有视频输入？ → `viduq2-pro` (参考生视频)
2. 需要音频？ → `viduq3-pro` (首选) 或 `viduq3-turbo` (次选)
3. 文生视频且无音频需求？ → `viduq2`
4. 图生视频追求速度？ → `viduq2-pro-fast`

**图片生成**:
- 默认使用 `q3-fast` (最新模型)
- 用户强调速度 → `q2-fast`
- 用户强调画质 → `q2-pro`

详细推荐规则见 [references/model_recommendation.md](references/model_recommendation.md)

## Best Practices

### 视频生成

1. **模型选择**：参考上方推荐表
2. **Prompt优化**：
   - 主体 + 动作 + 环境 + 镜头运动
   - 例："一只橘猫（主体）缓缓伸懒腰（动作），阳光洒在窗台上（环境），镜头缓慢推进（镜头运动）"

3. **图片要求**：
   - 格式：png, jpeg, jpg, webp
   - 大小：不超过50MB
   - 比例：小于1:4或4:1
   - 分辨率相近（首尾帧）

### 音频生成

1. **声音复刻**：提供清晰、无背景噪音的音频
2. **TTS**：使用停顿标记控制节奏
3. **文生音频**：描述要具体，包含场景和情绪

## Error Handling

常见错误及解决方案：

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| Invalid API key | API密钥错误 | 检查VIDU_API_KEY环境变量 |
| Image size exceeds | 图片过大 | 压缩至50MB以下 |
| Invalid aspect ratio | 比例不支持 | 检查模型支持的比例 |
| Voice ID not found | 音色不存在 | 检查音色列表或重新复刻 |

## Rules

1. **API Key检查**：调用前确认 `VIDU_API_KEY` 已设置
2. **异步任务**：视频生成是异步的，需要轮询状态或设置回调
3. **下载时效**：生成的URL 24小时内有效，需及时下载
4. **积分消耗**：关注积分消耗，错峰模式更便宜
5. **音色保留**：复刻音色7天内需使用否则删除
