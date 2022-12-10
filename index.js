const { KiviPlugin } = require('@kivibot/core')

const plugin = new KiviPlugin('ChatGPT', '1.3.0')

const config = {
  // sessionToken
  sessionToken: '',
  // 命令前缀
  cmdPrefix: '%'
}

const map = new Map()

const msgs = {
  needConfig: `ChatGPT: 第一次使用请先在 Bot 目录下的 data/plugin/${plugin.name}/config.json 中配置 sessionToken，抓取方式参考：https://github.com/KiviBotLab/kivibot-plugin-chatgpt，完成后重载插件`,
  expired: 'ChatGPT: sessionToken 可能已失效，请重新抓取并配置后重载插件',
  timeout: 'ChatGPT: 加载超时，请稍后再试试吧'
}

const ChromeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'

plugin.onMounted(async bot => {
  Object.assign(config, plugin.loadConfig())
  plugin.saveConfig(config)

  if (!config.sessionToken) {
    bot.sendPrivateMsg(plugin.mainAdmin, msgs.needConfig)
    plugin.throwPluginError(msgs.needConfig)
    return
  }

  const { ChatGPTAPI } = await import('chatgpt')

  const api = new ChatGPTAPI({
    markdown: true,
    sessionToken: config.sessionToken,
    userAgent: ChromeUA,
    accessTokenTTL: 60 * 1000
  })

  try {
    // 确保 token 有效
    await api.ensureAuth()
  } catch {
    plugin.throwPluginError(msgs.expired)
    await bot.pickFriend(plugin.mainAdmin).sendMsg(msgs.expired)
    return
  }

  plugin.onMessage(async event => {
    const { raw_message } = event

    if (!raw_message.startsWith(config.cmdPrefix)) {
      return
    }

    let session

    // 针对不同的群、私聊进行单独会话创建和复用
    if (event.message_type === 'group') {
      if (map.has(event.group_id)) {
        session = map.get(event.group_id)
      } else {
        session = api.getConversation()
        map.set(event.group_id, session)
      }
    } else if (event.message_type === 'discuss') {
      if (map.has(event.discuss_id)) {
        session = map.get(event.discuss_id)
      } else {
        session = api.getConversation()
        map.set(event.discuss_id, session)
      }
    } else {
      if (map.has(event.sender.user_id)) {
        session = map.get(event.sender.user_id)
      } else {
        session = api.getConversation()
        map.set(event.sender.user_id, session)
      }
    }

    const msg = raw_message.replace(config.cmdPrefix, '')

    try {
      const res = await session.sendMessage(msg, { timeoutMs: 2 * 60 * 1000 })
      event.reply(res, true)
    } catch {
      try {
        // 如果请求失败，尝试刷新 sessionToken 后重新请求，还是刷新失败则可能 token 过期
        await api.refreshAccessToken()
      } catch {
        event.reply(msgs.expired, true)

        // token 过期时，打印日志并私聊通知主管理进行更新
        bot.pickFriend(plugin.mainAdmin).sendMsg(msgs.expired)
        plugin.throwPluginError(msgs.expired)

        return
      }

      try {
        // token 刷新成功后再次尝试请求
        const res = await session.sendMessage(msg, { timeoutMs: 2 * 60 * 1000 })
        event.reply(res, true)
      } catch (e) {
        plugin.throwPluginError(e)
        event.reply(msgs.timeout, true)
      }
    }
  })

  /**
   * 凌晨四点刷新一次 sessionToken
   * @from https://github.com/easydu2002/chat_gpt_oicq/blob/dev/src/main.ts#L23-L28
   */
  const refreshTask = plugin.cron('0 0 4 * * *', async bot => {
    try {
      await api.refreshAccessToken()
    } catch {
      await bot.pickFriend(plugin.mainAdmin).sendMsg(msgs.expired)
      plugin.throwPluginError(msgs.expired)

      refreshTask.stop()
    }
  })
})

module.exports = { plugin }
