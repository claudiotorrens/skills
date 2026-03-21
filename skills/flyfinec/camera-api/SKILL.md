---
name: camera-api
description: 摄像头设备管理和事件查询API文档。用于控制APP中的摄像头设备，包括查询设备列表、查询自动抓拍事件、主动触发截图抓拍等。当用户要求查询设备列表、查询事件列表、查询事件详情或触发截图时使用。
metadata: {"openclaw":{"requires":{"env":["TIVS_API_KEY","TIVS_APP_ID"]},"primaryEnv":"TIVS_API_KEY"}}
---


# Camera API

查看和管理我的摄像头设备，查询设备上报的事件详情列表，支持主动触发截图抓拍以获取最新画面。

## 必读约束

Base URL （重要：所有API共用）
`https://openapi-cn01.tange365.com/`
所有 API 请求必须使用此 Base URL，不要使用其它地址。

认证请求头Header (所有请求必须包含):
Authorization: Bearer $TIVS_API_KEY
X-Tg-App-Id: $TIVS_APP_ID

固定请求头 (所有请求必须包含):
Accept-Language: zh-CN
X-Tg-Platform: pc
Content-Type: application/json
X-Tg-SDK-VERSION: 216

注意：主动触发截图指令后，有约3-5s执行延迟，需等待设备上报事件后，通过查询事件列表获取截图URL。

注意：
- 请不要发送URL给用户，直接提取URL中的图片内容并展示给用户。
- 图片URL必须有签名参数才可访问，获取图片内容时请确保使用完整URL。


## 功能列表：
基于Base URL: `https://openapi-cn01.tange365.com`

### 查询设备列表 /v2/device/list

意图：
- 用户要求查询设备列表时，调用此接口获取用户绑定的设备信息，包括设备名称、绑定时间、联网方式等。
- 当需要得到指定设备的ID时，调用此接口获取设备列表，再查找对应的设备ID，即其中的`device_id`字段。

请求内容：
```
POST /v2/device/list
Authorization: Bearer $TIVS_API_KEY
X-Tg-App-Id: $TIVS_APP_ID
Accept-Language: zh-CN
X-Tg-Platform: pc
Content-Type: application/json
X-Tg-SDK-VERSION: 216

{
    "offset": 0,
    "limit": 10
}
```

响应内容：
- device_id: 设备ID，字符串类型，唯一标识一个设备。
- device_name: 设备名称，字符串类型，用户给设备起的名称。
- is_owner: 是否是设备的主人，布尔类型，true表示主人，false表示分享人。
- bind_time: 设备绑定时间，字符串类型，格式为"YYYY-MM-DD HH:mm:ss"。
- connect_way: 设备连网方式，字符串类型，例如"wifi"表示WiFi网络、"sim"表示SIM卡网络等。

```
{
  "code": 200,
  "data": {
    "items": [
      {
        "device_id": "678A7QP6Q5WD",
        "device_name": "我的门铃",
        "extend": {
          "bind_time": "2026-02-04 22:24:16"
        },
        "is_owner": true
      },
      {
        "connect_way": "sim",
        "device_id": "633CWFWMJ83M",
        "device_name": "老家院子里",
        "extend": {
          "bind_time": "2025-06-26 08:18:06"
        },
        "is_owner": true,
      }
    ]
  }
}
```


### 向设备发送截图指令 /v2/msg/directive/device/{device_id}

意图：
- 用户要求查看某个设备的实时画面时，调用此接口向设备发送截图指令。该指令使用 directive=save_video 参数触发设备抓拍一张图片并上报，默认分辨率640*480。如需高清图，可在 data 字段传 {"res":"high"}。
- 指令执行有约3-5s延迟，完成后设备会上报事件，后续需调用查询事件列表接口获取事件详情，从中提取截图URL。

请求内容：
```
POST /v2/msg/directive/device/{device_id}
Authorization: Bearer $TIVS_API_KEY
X-Tg-App-Id: $TIVS_APP_ID
Accept-Language: zh-CN
X-Tg-Platform: pc
Content-Type: application/json
X-Tg-SDK-VERSION: 216

{
    "directive": "save_video",
    "reactive": false,
    "data": ""
}
```

响应内容：
- code: 响应状态码，整数类型，0表示成功，非0表示失败。
- msg: 响应消息，字符串类型。

```
{
    "code": 0,
    "msg": "指令发送成功",
    "data": {}
}
```



### 查询设备上报的事件详情列表 /v2/cloud/event

意图：
- 用户要求查看今天的事件列表时，使用该接口查询当天的事件详情列表。事件详情中包含一个字段`date`，表示事件发生的日期，可以根据该字段过滤出当天的事件列表。
- 用户要求总结某一天的事件详情时，使用该接口查询当天的事件详情列表。然后根据事件详情中的`tag`和`summary`字段获取事件信息。最后再对所有事件信息进行总结，得到当天的事件总结信息。
- 发送截图指令后，使用该接口查询最新事件，过滤 tag.tag="screenshot" 获取截图URL（在 image 字段）。

注意：
- 请不要发送URL给用户，直接提取URL中的图片内容并展示给用户。
- 图片URL必须有签名参数才可访问，获取图片内容时请确保使用完整URL。

请求内容：
```
POST /v2/cloud/event
Authorization: Bearer $TIVS_API_KEY
X-Tg-App-Id: $TIVS_APP_ID
Accept-Language: zh-CN
X-Tg-Platform: pc
Content-Type: application/json
X-Tg-SDK-VERSION: 216

{
    "device_id": "${device_id}",
    "date": "2026-03-20",
    "tag": [],
    "offset": 0,
    "limit": 10
}
```

响应内容：
- code: 响应状态码，整数类型，0表示成功，非0表示失败。
- total: 总事件数，整数类型。
- items: 事件列表数组，每个事件包含：
  - id: 事件ID。
  - time: 事件时间戳。
  - image: 事件图片URL（截图指令结果在此字段）。
  - thumbnail: 缩略图URL。
  - tag: 事件标签对象，包含 name（事件类型，如"screenshot"表示截图，"motion"表示移动侦测，"summary"表示AI分析总结）、msg 等。
  - summary: 事件摘要，包含 title、detail_description 等。

```
{
    "code": 0,
    "msg": "查询成功",
    "data": {
        "total": 5,
        "items": [
            {
                "id": "event123",
                "time": 1640995200,
                "image": "https://example.com/screenshot.jpg",
                "thumbnail": "https://example.com/thumb.jpg",
                "tag": {
                    "name": "screenshot",
                    "msg": "设备截图"
                },
                "summary": {
                    "title": "设备截图事件",
                    "detail_description": "用户触发截图"
                }
            }
        ]
    }
}
```

### 按ID查询云事件 /v2/cloud/event/{event_id}

意图：
- 用户要求查询特定事件的详情时，使用该接口通过事件ID获取单个事件的详细信息，包括图片URL、标签和摘要。

注意：
- 请不要发送URL给用户，直接提取URL中的图片内容并展示给用户。
- 图片URL必须有签名参数才可访问，获取图片内容时请确保使用完整URL。


请求内容：
```
GET /v2/cloud/event/{event_id}
Authorization: Bearer $TIVS_API_KEY
X-Tg-App-Id: $TIVS_APP_ID
Accept-Language: zh-CN
X-Tg-Platform: pc
Content-Type: application/json
X-Tg-SDK-VERSION: 216
```

响应内容：
- 同查询事件列表的单个事件结构。

```
{
    "code": 0,
    "msg": "查询成功",
    "data": {
        "id": "event123",
        "time": 1640995200,
        "image": "https://example.com/screenshot.jpg",
        "tag": {
            "name": "screenshot"
        },
        "summary": {
            "title": "设备截图事件"
        }
    }
}
```

