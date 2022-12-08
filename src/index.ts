import { KiviPlugin } from '@kivibot/core'
import { ChatGPTAPI } from 'chatgpt'

import type { ChatGPTConversation } from 'chatgpt'

const plugin = new KiviPlugin('ChatGPT', '1.0.0')

const config = {
  sessionToken: ''
}

const map: Map<number, ChatGPTConversation> = new Map()

plugin.onMounted(async bot => {
  Object.assign(config, plugin.loadConfig())
  plugin.saveConfig(config)

  if (!config.sessionToken) {
    bot.sendPrivateMsg(plugin.mainAdmin, 'ChatGPT: 请先配置 sessionToken')
    plugin.throwPluginError('请先配置 sessionToken')
    return
  }

  const api = new ChatGPTAPI({
    ...config,
    markdown: false
  })

  await api.ensureAuth()

  plugin.onMessage(async event => {
    const { raw_message } = event

    if (!raw_message.startsWith('%')) return

    let session: ChatGPTConversation | undefined

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
    const res = await session!.sendMessage(msg, { timeoutMs: 6 * 1000 })

    event.reply(res)
  })
})

export { plugin }
