const { KiviPlugin } = require('@kivibot/core')
const { Configuration, OpenAIApi } = require('openai')

const { version } = require('./package.json')
const plugin = new KiviPlugin('ChatGPT', version)

const config = {
  // OpenAI apiKey
  apiKey: '',
  // 是否开启 at 触发
  enableAt: true,
  // 触发命令前缀
  cmdPrefix: '%'
}

// session map
const sessionMap = new Map()

const msgs = {
  needConfig: `ChatGPT: 请先配置 apiKey，格式：/chatgpt setkey <apikey>`,
  apiError: 'ChatGPT: API 请求异常，可能是 apiKey 错误，请查看日志'
}

plugin.onMounted(async bot => {
  plugin.saveConfig(Object.assign(config, plugin.loadConfig()))

  if (!config.apiKey) {
    bot.sendPrivateMsg(plugin.mainAdmin, msgs.needConfig)
    plugin.throwPluginError(msgs.needConfig)
    return
  }

  const configuration = new Configuration({ apiKey: config.apiKey })
  const openai = new OpenAIApi(configuration)

  plugin.onAdminCmd('/chatgpt', (e, params, options) => {
    const [cmd, value] = params

    if (cmd === 'setkey' && value) {
      config.apiKey = value
      plugin.saveConfig(config)

      return e.reply('apiKey 配置完成，重载插件生效', true)
    }

    if (cmd === 'at' && ['on', 'off'].includes(value)) {
      config.enableAt = value === 'on'
      plugin.saveConfig(config)

      return e.reply(`已${config.enableAt ? '开启' : '关闭'} at 触发，重载插件生效`, true)
    }

    if (cmd === 'prefix' && value) {
      config.cmdPrefix = value
      plugin.saveConfig(config)

      return e.reply('已修改命令触发前缀，重载插件生效', true)
    }

    const cmds = ['/chatgpt setkey <apiKey>', '/chatgpt at on/off', '/chatgpt prefix <触发前缀>']

    return e.reply(cmds.join('\n'), true)
  })

  plugin.onMessage(async event => {
    const { message, raw_message } = event

    // 消息符合命令前缀
    const isCmd = raw_message.trim().startsWith(config.cmdPrefix)
    // Bot 被艾特
    const isAt = message.some(e => e.type === 'at' && e.qq === bot.uin)

    // 触发条件（符合命令前缀，或者在启用艾特触发时，Bot 被艾特）
    const isHit = isCmd || (config.enableAt && isAt)

    // 过滤不触发的消息
    if (!isHit) {
      return
    }

    const reg = /((换个?话题)|([说讲聊]点?(别|(其他))的))/
    const shouldChangeContext = raw_message.match(reg)

    // 过滤更新会话消息
    if (shouldChangeContext) {
      sessionMap.delete(getSessionId(event))
      return event.reply('好的，让我们重新开始。', true)
    }

    try {
      const session = getSession(event)

      const question = raw_message
        .replace(new RegExp(`^\\s*${config.cmdPrefix}`), '')
        .replace(new RegExp(`@${bot.nickname}`, 'g'), '')
        .trim()

      plugin.debug(question)

      const prompt = session.context ? `${session.context}\nHuman:${question}\nAI:` : question

      const { data, status } = await openai.createCompletion({
        prompt,
        model: 'text-davinci-003',
        temperature: 0.5,
        max_tokens: 2048
      })

      if (status !== 200) {
        return e.reply(msgs.apiError, true)
      }

      const res = data.choices[0]?.text.replace(/^\s*[?？]?\n*/, '').trim() ?? ''

      session.context = prompt + res

      event.reply(res ?? '这个 OpenAI 不知道哦', true)
    } catch (err) {
      plugin.throwPluginError(err?.message ?? err)

      return e.reply(msgs.apiError, true)
    }
  })
})

function getSessionId(event) {
  switch (event.message_type) {
    case 'private':
      return event.sender.user_id
    case 'group':
      return event.group_id
    case 'discuss':
      return event.discuss_id
  }
}

function getSession(event) {
  const id = getSessionId(event)
  const now = Date.now()

  let session = sessionMap.get(id)

  if (session) {
    const tenMinutesMs = 1000 * 60 * 10
    const isTimeout = now - session.time >= tenMinutesMs
    const isTextTooLong = session.context.length >= 10000

    if (isTimeout || isTextTooLong) {
      // 超过十分钟没有回复，或者聊天记录大于 1w 字，清空会话记录
      session.context = ''
    } else {
      // 没超过十分钟，刷新当前会话时间
      session.time = now
    }
  } else {
    session = { context: '', time: now }
    sessionMap.set(id, session)
  }

  return session
}

module.exports = { plugin }
