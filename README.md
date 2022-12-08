# ChatGPT Plugin for KiviBot

`KiviBot` 的 [`ChatGPT`](https://chat.openai.com) 插件。

**安装**

使用框架消息指令安装并启用 `ChatGPT`。

```shell
/plugin add chatgpt # 等待安装完成
```

**配置**

然后编辑 `data/plugins/ChatGPT/config.json` 文件，修改后保存，重载插件（`/plugin reload chatgpt`）即可生效。

`token` 获取方式参考：[chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api#session-tokens)

> 注意：配置中不能带有注释，此处注释仅用作解释说明。

```jsonc
{
  // api token
  "sessionToken": ""
}
```

**启用**

通过消息命令启用 `ChatGPT` 插件。

```shell
/plugin on chatgpt # 安装完成，并配置好了 token 后启用
```
