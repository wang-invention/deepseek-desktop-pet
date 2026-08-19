# DeepSeek 余额桌宠

一个住在 Windows 桌面上的 Q 版鲸鱼少女桌宠，负责帮你盯着 DeepSeek API 余额。

![桌宠角色](src/renderer/assets/character/whale-girl.svg)

## 功能

- 透明、无边框、始终置顶的桌宠窗口，可鼠标拖动
- Q 版鲸鱼少女角色，带待机浮动、眨眼、思考、开心和委屈状态
- 调用 DeepSeek 官方余额接口：`GET https://api.deepseek.com/user/balance`
- 显示总余额，并区分充值余额和赠送余额
- 手动刷新、定时自动刷新
- 设置窗口配置 API Key、刷新间隔、启动查询和开机启动
- API Key 使用 Windows 系统加密存储，不硬编码、不写入日志、不上传 Git
- 友好处理 401 / 403 / 429 / 500 / 超时 / 断网等错误
- 右键菜单、托盘图标、隐藏/显示、退出

## 环境要求

- Windows 10 / Windows 11
- Node.js 18 或更高版本（开发时需要）
- npm

## 安装依赖

```bash
npm install
```

## 开发启动

```bash
npm start
```

桌宠启动后：

- 第一次使用请在设置中填入 DeepSeek API Key
- 点击“测试连接”可以确认 Key 是否可用
- 保存后桌宠会自动查询余额

## API Key 配置

不要在任何源码或 Git 提交中写入真实 API Key。

应用内配置流程：

1. 右键桌宠 → “设置”
2. 粘贴 DeepSeek API Key
3. 点击“保存”

API Key 会被 Electron `safeStorage` 加密后写入本机用户数据目录：

```text
%APPDATA%/DeepSeekDesktopPet/config.json
```

Git 仓库不会包含该文件，`.gitignore` 已忽略本地配置。

## DeepSeek 余额接口

本项目按照 DeepSeek 官方文档实现：

```text
GET https://api.deepseek.com/user/balance
Authorization: Bearer <DEEPSEEK_API_KEY>
```

响应示例：

```json
{
  "is_available": true,
  "balance_infos": [
    {
      "currency": "CNY",
      "total_balance": "110.00",
      "granted_balance": "10.00",
      "topped_up_balance": "100.00"
    }
  ]
}
```

余额字段含义：

- `total_balance`：当前可用总余额
- `granted_balance`：未过期的赠送余额
- `topped_up_balance`：充值余额
- `currency`：币种，官方目前为 CNY 或 USD

## 打包 Windows 应用

生成便携版：

```bash
npm run pack
```

生成安装包：

```bash
npm run dist
```

产物输出到 `dist/`。

## Windows 安装

- 便携版：直接运行 `dist/*.exe`，无需安装
- 安装版：运行 NSIS 安装包，按提示安装
- 如需开机启动，在桌宠设置中勾选“开机启动”

## 项目结构

```text
deepseek-desktop-pet/
├── src/
│   ├── main/
│   │   ├── index.js            # 窗口、托盘、IPC
│   │   ├── deepseek-service.js # DeepSeek 余额 API
│   │   ├── config-store.js     # 加密配置存储
│   │   └── scheduler.js        # 自动刷新调度
│   ├── preload.js              # 安全桥接
│   └── renderer/
│       ├── pet.html            # 桌宠窗口
│       ├── pet.css
│       ├── app.js
│       ├── settings.html       # 设置窗口
│       ├── settings.css
│       ├── settings.js
│       ├── components/         # UI 组件拆分
│       └── assets/character/   # 角色资源
├── assets/icons/               # 托盘和打包图标
├── package.json
└── .gitignore
```

## 常见问题

### 显示“API Key 好像不对哦～”

检查 Key 是否正确、是否过期，或去 DeepSeek 控制台重新生成。

### 显示“请求太频繁啦”

DeepSeek 对余额接口有限流，请等待一段时间后再刷新，或调大自动刷新间隔。

### 显示“网络好像断掉啦～”

检查本机网络、代理设置以及 DeepSeek 服务状态。

### 桌宠不见了

桌宠关闭按钮默认只是隐藏，点击系统托盘图标可以重新显示；托盘菜单里有“退出”。

### 角色图片可以替换吗

可以。把新图片放到 `src/renderer/assets/character/`，并修改 `pet.html` 中 `pet-sprite` 的 `src` 即可。建议使用透明背景 PNG。

## 安全说明

- API Key 不硬编码
- API Key 不出现在日志和异常信息中
- 本地配置使用系统加密存储
- 真实配置和 `.env` 文件已被 Git 忽略
