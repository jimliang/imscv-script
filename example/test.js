/**
 * Created by jimliang on 2017/2/23.
 */
var fs = require('fs')
var path = require('path')
var co = require('co')
var Imscv = require('./../lib')
var heweather = require('./heweather')


var tasks = [
    {
        flag: 'TASK_USER_CHECKIN', // 每日签到
        exec: imscv => imscv.addUserCheckIn()
    },
    {
        flag: 'TASK_CLUB_MESSAGE_DAILY', // 每日群聊
        exec: imscv => imscv.addClubMessage({
            clubId: '361',
            messageContent: '签到'
        })
    },
    {
        flag: 'TASK_MILEAGE_DAILY', // 每日1km
        exec: imscv => imscv.getCarList().then(carList => {
            var car = carList[0], mileage = car.mileage
            return imscv.addCarStatistics({
                sn: '1031025CBCE3004F',
                mileageTotal: (mileage + range(2, 15)).toFixed(3)
            })
        })
    },
    {
        flag: 'TASK_SHARE_ARTICLE_LIKE', // 每日点赞
        exec: imscv => getLastArticle(imscv).then(article => imscv.addShareArticleLike({
            shareArticleId: article.shareArticleId,
            shareArticleType: article.shareArticleType
        }))
    },
    {
        flag: 'TASK_SHARE_ARTICLE_COMMENT', // 每日评论
        exec: imscv => getLastArticle(imscv).then(article => imscv.addShareArticleComment({
            content: '签到签到~~',
            shareArticleId: article.shareArticleId
        }))
    },
    {
        flag: 'TASK_SHARE_ARTICLE_DAY', // 每日动态
        exec: imscv => Promise
            .all([
                heweather.now('shenzhen'),
                imscv.addAttachment(fs.createReadStream(path.join(__dirname, 'pic.jpg')))
            ])
            .then(([data, id]) => {

                var item = data.HeWeather5[0]
                var infos = [
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

                var shareContent = (`天气预报： \n` + infos.map(a => `${a[0]}： ${a[1](item)}`).join('\n'))
                return imscv.addShareArticle({
                    shareContent, attachmentList: [id]
                })
            })
    }
]

function run() {
    var imscv = new Imscv(loginToken)

    co(function *() {

        var taskList = yield imscv.getUserTaskList()
        var isFinisheds = taskList.reduce((a, b) => (a[b.flag] = b.isFinished, a), {})

        for(let task of tasks) {
            if (!isFinisheds[task.flag]) {
                log(`${task.flag}...`)
               try {
                   task.exec(imscv)
                   log(`${task.flag} complete!`)
               } catch (e) {
                    log(`${task.flag} error! ${e.message}`)
               }
            }
        }
    })
}

function getLastArticle(imscv) {
    return imscv._lastArticle || (imscv._lastArticle = imscv.getLatestShareArticleList().then(data => data.data[[0]]))
}

function log(str) {
    console.log(now(), str);
}
function now() {
    return new Date().format('yyyy/MM/dd mm:hh:ss')
}

function range(min, max) {
    return Math.random() * (max - min) + min
}

run()