/**
 * Created by jimliang on 2017/2/23.
 */
const fs = require('fs')
const path = require('path')
const schedule = require('node-schedule')
const Imscv = require('./../lib')
const joke = require('./joke')
const fetch = require('node-fetch')

const tasks = [
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
                mileageTotal: (mileage + range(10, 40)).toFixed(3)
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
            const [jokeItem] = await joke()
            const file = await writeFile(jokeItem.thumburl)
            const id = await imscv.addAttachment(fs.createReadStream(file))
            const shareContent = `笑话： \n${jokeItem.title}`
            await imscv.addShareArticle({
                shareContent,
                attachmentList: [id]
            })
            fs.unlink(file)
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

async function writeFile (url) {
    const res = await fetch(url)
    const file = path.join(__dirname, path.basename(url))
    const dest = fs.createWriteStream(file)
    res.body.pipe(dest)
    return new Promise((resolve, reject) => {
        res.body.on('end', () => resolve(file))
        res.body.on('error', reject)
    })
}

async function main () {
    const imscv = await getImscv()
    const daily = () => dailyTask(imscv)
    schedule.scheduleJob('0 0 8 * * *', daily)
    schedule.scheduleJob('0 0 10 * * *', daily)
    // setInterval(() => catchRedPacket(imscv), 5000)
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
            err ? reject(err) : resolve(data.trim())
        })
    })
}

function log (str) {
    console.log(new Date().format('yyyy/MM/dd mm:hh:ss'), str)
}

function range (min, max) {
    return Math.random() * (max - min) + min
}

main()