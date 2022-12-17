const { KiviPlugin } = require('@kivibot/core')

const { version } = require('./package.json')
const plugin = new KiviPlugin('ChatGPTv2', version)

const config = {
  // OpenAI apiKey
  apiKey: '',
  // 触发命令前缀
  cmdPrefix: '%'
}

const map = new Map()

const msgs = {
  needConfig: `ChatGPT: 第一次使用请先在 Bot 目录下的 data/plugin/${plugin.name}/config.json 中配置 apiKey，OpenAI 官网：https://openai.com/`,
  error: 'ChatGPT: 验证失败，可能是 OpenAI apiKey错误',
  timeout: 'ChatGPT: 加载超时，请稍后再试试吧'
}

plugin.onMounted(async bot => {
  Object.assign(config, plugin.loadConfig())
  plugin.saveConfig(config)

  if (!config.apiKey) {
    bot.sendPrivateMsg(plugin.mainAdmin, msgs.needConfig)
    plugin.throwPluginError(msgs.needConfig)
    return
  }

  const { Configuration, OpenAIApi } = await import('openai')

  const configuration = new Configuration({
    apiKey: config.apiKey,
  });

  const openai = new OpenAIApi(configuration);

  plugin.onMessage(async event => {
    const { raw_message } = event

    if (!raw_message.startsWith(config.cmdPrefix)) {
      return
    }

    if (raw_message === '%换一个话题') {
      switch (event.message_type) {
        case 'private':
          map.delete(event.sender.user_id)
          return
        case 'group':
          map.delete(event.group_id)
          return
        case 'discuss':
          map.delete(event.discuss_id)
          return
      }
    }

    try {
      let session

      switch (event.message_type) {
        case 'private':
          session = getSession(event.sender.user_id)
          break
        case 'group':
          session = getSession(event.group_id)
          break
        case 'discuss':
          session = getSession(event.discuss_id)
          break
      }

      const requestMsg = (session.context ? session.context + '\n' : '') +
          'Human:' + raw_message.replace(config.cmdPrefix, '') + '\nAI:'

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: requestMsg,
        temperature: 0.5,
        max_tokens: 2048,
      });

      // TODO 访问失败处理
      const responseMsg = response.data.choices[0].text.replace('\n', '')

      session.context = requestMsg + responseMsg
      session.time = new Date().getTime()

      console.debug(map)
      await event.reply(responseMsg, true)
    } catch {
      // TODO
    }
  })
})

// 获取对应上下文
function getSession (id) {
  let session
  if (map.has(id)) {
    session = map.get(id)
    // 大于一小时则重置上下文
    if (new Date().getTime() - session.time > 1000 * 60 * 60) {
      session.context = ''
    }
  } else {
    session = { context: '', time: new Date() }
    map.set(id, session)
  }
  return session
}

module.exports = { plugin }
