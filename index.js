const { KiviPlugin } = require('@kivibot/core')

const { version } = require('./package.json')
const plugin = new KiviPlugin('ChatGPT', version)

const config = {
  // OpenAI 邮箱账号
  email: '',
  // OpenAI 账号密码
  password: '',
  // 触发命令前缀
  cmdPrefix: '%'
}

const map = new Map()

const msgs = {
  needConfig: `ChatGPT: 第一次使用请先在 Bot 目录下的 data/plugin/${plugin.name}/config.json 中配置 OpenAI 账号密码，OpenAI 官网：https://openai.com/`,
  error: 'ChatGPT: 验证失败，可能是 OpenAI 账号密码错误',
  timeout: 'ChatGPT: 加载超时，请稍后再试试吧'
}

plugin.onMounted(async bot => {
  Object.assign(config, plugin.loadConfig())
  plugin.saveConfig(config)

  if (!config.email || !config.password) {
    bot.sendPrivateMsg(plugin.mainAdmin, msgs.needConfig)
    plugin.throwPluginError(msgs.needConfig)
    return
  }

  const { ChatGPTAPI, getOpenAIAuth } = await import('chatgpt')

  const openAIAuth = await getOpenAIAuth({
    email: config.email,
    password: config.password
  })

  const api = new ChatGPTAPI({
    ...openAIAuth,
    markdown: true
  })

  // 确保 token 有效
  await api.ensureAuth()

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
    } else if (event.message_type === 'private') {
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
        // token 过期时，打印日志并私聊通知主管理进行更新
        if (event.sender.user_id !== plugin.mainAdmin) {
          bot.pickFriend(plugin.mainAdmin).sendMsg(msgs.error)
        }

        event.reply(msgs.error, true)
        plugin.throwPluginError(msgs.error)

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
})

module.exports = { plugin }
