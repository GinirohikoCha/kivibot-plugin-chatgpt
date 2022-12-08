# ChatGPT Plugin for KiviBot

![npm (scoped)](https://img.shields.io/npm/v/kivibot-plugin-chatgpt?color=527dec&label=kivibot-plugin-chatgpt&style=flat-square)

`KiviBot` 的 [`ChatGPT`](https://chat.openai.com) 插件。

**安装**

使用框架消息指令安装 `ChatGPT`。

```shell
/plugin add chatgpt
```

**配置**

编辑 `data/plugins/ChatGPT/config.json` 文件，配置 `token`。

`token` 获取方式参考：[chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api#session-tokens)。

```jsonc
{
  "sessionToken": "此处填入 token",
  "cmdPrefix": "此处填入自定义指令前缀，默认 %"
}
```

**启用**

通过消息命令启用 `ChatGPT` 插件。

```shell
/plugin on chatgpt
```
