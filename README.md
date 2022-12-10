# ChatGPT Plugin for KiviBot

![npm (scoped)](https://img.shields.io/npm/v/kivibot-plugin-chatgpt?color=527dec&label=kivibot-plugin-chatgpt&style=flat-square)

`KiviBot` 的 [ChatGPT](https://chat.openai.com) 插件。

**特征**

- 可选配置触发指令前缀，默认为 `%`
- 默认开启上下文会话模式
- 根据群聊、私聊进行会话隔离，互不干扰
- 每天四点以及请求失败时，尝试自动刷新 `sessionToken`

**安装**

使用框架消息指令进行安装

```shell
/plugin add chatgpt
```

启用插件，生成初始配置文件

```shell
/plugin on chatgpt
```

**配置**

编辑 Bot 目录下的 `data/plugins/ChatGPT/config.json` 文件，配置 `sessionToken` 字段。

`sessionToken` 获取方式：

1. 打开 https://chat.openai.com/chat 进行登录/注册。
2. 打开开发者工具（桌面端浏览器按 `F12` 可以打开）。
3. 切换到 Application（应用）选项卡 > Cookie 子选项卡。
4. 找到 `__Secure-next-auth.session-token` 的值，这个就是 `sessionToken`，双击并复制。

如图所示：

![dev tools](./docs/devtool.png)

> derived from: [chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api#session-tokens)

```jsonc
{
  // 此处填入 sessionToken
  "sessionToken": "",
  // 此处填入自定义指令前缀，默认 %
  "cmdPrefix": "%"
}
```

**应用**

配置完成后，通过消息命令重载 ChatGPT 插件。

```shell
/plugin reload chatgpt
```

**使用截图**

![h1](docs/chat_history_1.jpg)
![h2](docs/chat_history_2.jpg)
![h3](docs/chat_history_3.jpg)
