const { KiviPlugin } = require('@kivibot/core')

const plugin = new KiviPlugin('ChatGPT', '1.2.1')

const config = {
  sessionToken: '',
  cmdPrefix: '%'
}

const map = new Map()

plugin.onMounted(async bot => {
  Object.assign(config, plugin.loadConfig())
  plugin.saveConfig(config)

  if (!config.sessionToken) {
    bot.sendPrivateMsg(plugin.mainAdmin, 'ChatGPT: 请先配置 sessionToken，完成后重载插件')
    plugin.throwPluginError('请先配置 sessionToken，完成后重载插件')
    return
  }

  const { ChatGPTAPI } = await import('chatgpt')
  const api = new ChatGPTAPI({ sessionToken: config.sessionToken })
  await api.ensureAuth()

  plugin.onMessage(async event => {
    const { raw_message } = event

    if (!raw_message.startsWith(config.cmdPrefix)) return

    let session

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

    const msg = raw_message.replace('%', '')

    try {
      const res = await session.sendMessage(msg, { timeoutMs: 2 * 60 * 1000 })
      event.reply(res, true)
    } catch {
      event.reply('加载超时，稍后再试试吧', true)
    }
  })
})

module.exports = { plugin }
