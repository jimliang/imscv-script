/**
 * Created by jimliang on 2017/2/23.
 */
var fs = require('fs')
var path = require('path')
var schedule = require('node-schedule');
var Imscv = require('./../lib')
var heweather = require('./heweather')


var tasks = [
    {
        flag: 'TASK_USER_CHECKIN', // 每日签到
        async exec (imscv) {
            return await imscv.addUserCheckIn()
        }
    },
    {
        flag: 'TASK_CLUB_MESSAGE_DAILY', // 每日群聊
        async exec (imscv) {
            return await imscv.addClubMessage({
                clubId: '361',
                messageContent: '签到'
            })
        }
    },
    {
        flag: 'TASK_MILEAGE_DAILY', // 每日1km
        async exec (imscv) {
            const [car] = await imscv.getCarList()
            const mileage = car.mileage
            return await imscv.addCarStatistics({
                sn: '1031025CBCE3004F',
                mileageTotal: (mileage + range(5, 30)).toFixed(3)
            })
        }
    },
    {
        flag: 'TASK_SHARE_ARTICLE_LIKE', // 每日点赞
        async exec (imscv, context) {
            const article = await getLastArticle(imscv, context)
            return await imscv.addShareArticleLike({
                shareArticleId: article.shareArticleId,
                shareArticleType: article.shareArticleType
            })
        }
    },
    {
        flag: 'TASK_SHARE_ARTICLE_COMMENT', // 每日评论
        async exec (imscv, context) {
            const article = await getLastArticle(imscv, context)
            return await imscv.addShareArticleComment({
                content: '签到签到~~',
                shareArticleId: article.shareArticleId
            })
        }
    },
    {
        flag: 'TASK_SHARE_ARTICLE_DAY', // 每日动态
        async exec (imscv) {
            const [data, id] = await Promise.all([
                heweather.now('shenzhen'),
                imscv.addAttachment(fs.createReadStream(path.join(__dirname, 'pic.jpg')))
            ])
            const item = data.HeWeather5[0]
            const infos = [
                ['城市', item => item.basic.city],
                ['更新时间', item => item.basic.update.loc],
                ['天气状况描述', item => item.now.cond.txt],
                ['体感温度', item => item.now.fl],
                ['相对湿度（%）', item => item.now.hum],
                ['降水量（mm）', item => item.now.pcpn],
                ['气压', item => item.now.pres],
                ['温度', item => item.now.tmp],
                ['能见度（km）', item => item.now.vis],
                ['风力风向', item => `风向（360度）- ${item.now.wind.deg} 风向 - ${item.now.wind.dir} 风力 - ${item.now.wind.sc} 风速（kmph）- ${item.now.wind.spd}`],
            ]

            const shareContent = (`天气预报： \n` + infos.map(a => `${a[0]}： ${a[1](item)}`).join('\n'))
            return await imscv.addShareArticle({
                shareContent,
                attachmentList: [id]
            })
        }
    }
]

async function dailyTask (imscv) {
    const taskList = await imscv.getUserTaskList()
    const isFinisheds = taskList.reduce((a, b) => (a[b.flag] = b.isFinished, a), {})

    const context = {}
    for (let task of tasks) {
        if (isFinisheds.hasOwnProperty(task.flag) && !isFinisheds[task.flag]) {
            log(`${task.flag}...`)
            try {
                await task.exec(imscv, context)
                log(`${task.flag} complete!`)
            } catch (e) {
                log(`${task.flag} error! ${e.message}`)
            }
        }
    }
}

async function catchRedPacket (imscv) {
    let data = await imscv.getBatchClubUnReadMessageCount()
    for (let { clubId, clubName } of data) {
        let { data: messages } = await imscv.getPageClubMessage({ clubId })
        log(`get ${messages.length} messages from '${clubName}'`)
        for (let { messageType, messageContent } of messages) {
            if (messageType == 4) {
                let packet = JSON.parse(messageContent)
                log(`find redpacket(${packet.redPacketId}) - '${packet.description}'`)
                let redPacket = await imscv.getRedPacket(packet.redPacketId)
                log(`fetch redpacket(${redPacket.redPacketId}) - isReceive(${redPacket.isReceive}) - ${redPacket.receiveCount}/${redPacket.packetCount}`)
                if (!redPacket.isReceive && redPacket.receiveCount < redPacket.packetCount) {
                    try {
                        let result = await imscv.openRedPacket(redPacket.redPacketId)
                        log(`open redpacket success: receiveMoney(${result.receiveMoney})`)
                    } catch (e) {
                        log(e)
                    }
                }
            }
        }
    }
}

async function deleteArticles (imscv) {
    let articles, i = 0
    while ((articles = await getDayArticle(imscv)).length) {
        for (let article of articles) {
            await imscv.deleteShareArticle({
                shareArticleId: article.shareArticleId
            })
            i++
            log(`删除 ${article.shareArticleId}`)
        }

    }
    log(`共删除 ${i}条`)
}

async function getDayArticle (imscv) {
    const { data } = await imscv.getMyShareArticleList()
    return data.filter(article => article.shareContent.indexOf('天气预报：') !== -1)
}

async function main () {
    const imscv = await getImscv()
    const daily = () => dailyTask(imscv)
    schedule.scheduleJob('0 0 8 * * *', daily)
    schedule.scheduleJob('0 0 10 * * *', daily)
    setInterval(() => catchRedPacket(imscv), 5000)
}

async function getImscv () {
    const loginToken = await readLoginToken()
    return new Imscv(loginToken)
}

function getLastArticle (imscv, context) {
    return context._lastArticle || (context._lastArticle = imscv.getLatestShareArticleList(1, 4).then(data => data.data.filter(item => !item.isHead)[[0]]))
}

function readLoginToken () {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '.imscv.txt'), 'utf8', function (err, data) {
            if (err) {
                return reject(err)
            }
            resolve(data.trim())
        })
    })
}

function log (str) {
    console.log(new Date().format('yyyy/MM/dd mm:hh:ss'), str);
}

function range (min, max) {
    return Math.random() * (max - min) + min
}

main()