# OpenAI ChatGPT Plugin for KiviBot

[![npm-version](https://img.shields.io/npm/v/kivibot-plugin-chatgpt?color=527dec&label=kivibot-plugin-chatgpt&style=flat-square)](https://npm.im/kivibot-plugin-chatgpt)
[![dm](https://shields.io/npm/dm/kivibot-plugin-chatgpt?style=flat-square)](https://npm.im/kivibot-plugin-chatgpt)

[`KiviBot`](https://beta.kivibot.com) 的 [OpenAI](https://openai.com) ChatGPT 插件。

**特征**

- 可选配置触发指令前缀，默认为 `%`
- 可选开启 at 触发（艾特机器人）
- 上下文会话模式，超过十分钟没有回复，自动释放
- 根据群聊、私聊进行会话隔离，互不干扰
- 全消息进行配置，无需手动改配置

**安装**

```shell
/plugin add chatgpt
```

**启用**

```shell
/plugin on chatgpt
```

**配置**

申请 [OpenAI](https://openai.com/api/) 的 apiKey，然后使用以下命令自动配置

```shell
/chatgpt setkey <apiKey>
```

配置是否艾特触发

```shell
/chatgpt at <on/off>
```

配置触发前缀

```shell
/chatgpt prefix <prefix>
```

配置完成后，通过消息命令重载 ChatGPT 插件生效。

```shell
/plugin reload chatgpt
```

**使用**

```shell
%背诵故事静夜思
%换个话题吧
```
