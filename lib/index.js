/**
 * Created by jimliang on 2017/2/22.
 */
var http = require('./http')
var {encrypt, decrypt, md5} = require('./crypto')

var host = 'http://app.imscv.com/api/cn/'

if (!Date.prototype.format) {
    Date.prototype.format = function (fmt) {
        var o = {
            'M+': this.getMonth() + 1, //月份
            'd+': this.getDate(), //日
            'h+': this.getHours(), //小时
            'm+': this.getMinutes(), //分
            's+': this.getSeconds(), //秒
            'q+': Math.floor((this.getMonth() + 3) / 3), //季度
            'S': this.getMilliseconds() //毫秒
        }
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
        for (var k in o)
            if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
        return fmt
    }
}

var Imscv = module.exports = function (loginToken) {
    this.loginToken = loginToken
}

Imscv.prototype = {

    constructor: Imscv,

    _token() {
        return encrypt(this.loginToken + '@' + (+new Date() / 1000).toFixed(6))
    },
    _invoke(name, params = {}, hasFile) {
        params.token = this._token()
        return http.post(`${host}${name}`, params, hasFile)
    },
    /**
     * 签到
     */
    addUserCheckIn() {
        return this._invoke('addUserCheckIn')
    },

    getUnReadCount() {
        return this._invoke('getUnReadCount')
    },
    /**
     * 获取动态
     */
    getLatestShareArticleList(pageIndex = 1, pageSize = 30) {
        return this._invoke('getLatestShareArticleList', {data: {pageIndex, pageSize}})
    },

    /**
     * 点赞
     */
    addShareArticleLike({shareArticleId, shareArticleType}) {
        return this._invoke('addShareArticleLike', {
            data: {
                'contentHeight': 0,
                'shareType': 0,
                'contentState': 0,
                'attachmentArray': [],
                'compressCount': 0,
                'fullTextHeight': 0,
                'userModel': {
                    'money': '0',
                    'userType': 0,
                    'approve': false,
                    'userDefaults': {},
                    'location': {
                        'speed': 0,
                        'time': 0,
                        'longitude': 0,
                        'mapType': 0,
                        'latitude': 0,
                        'direction': 0,
                        'accuracy': 0,
                        'altitude': 0
                    },
                    'userLevel': '0',
                    'userName': 'Guest',
                    'checkinMoney': '0',
                    'shareArticleCommentCount': 0,
                    'registerTime': 0,
                    'isUserCheckin': false,
                    'shareArticleLikeCount': 0,
                    'messageCount': 0,
                    'isCrown': false
                },
                'isLiked': false,
                'attachmentList': '',
                'shareArticleType': shareArticleType,
                'shareArticleId': shareArticleId,
                'isHead': false,
                'imageHeight': 0,
                'totalHeight': 65
            }
        })
    },

    /**
     * 评论
     */
    addShareArticleComment({content, shareArticleId}) {
        return this._invoke('addShareArticleComment', {
            data: {
                'pageIndex': 0,
                'userModel': {
                    'money': '0',
                    'userType': 2,
                    'approve': false,
                    'userDefaults': {},
                    'location': {
                        'speed': 0,
                        'time': 0,
                        'longitude': 0,
                        'mapType': 0,
                        'latitude': 0,
                        'direction': 0,
                        'accuracy': 0,
                        'altitude': 0
                    },
                    'userLevel': '0',
                    'userName': 'Guest',
                    'checkinMoney': '0',
                    'shareArticleCommentCount': 0,
                    'registerTime': 0,
                    'isUserCheckin': false,
                    'shareArticleLikeCount': 0,
                    'messageCount': 0,
                    'isCrown': false
                },
                'totalHeight': 70,
                'content': content,
                'commentContent': content,
                'contentHeight': 20,
                'createTime': new Date().format('MM-dd hh:mm'),
                'shareArticleId': shareArticleId
            }
        })
    },

    /**
     * 发文
     */
    addShareArticle({shareContent, attachmentList}) {
        var data = {
            'shareArticleType': 2,
            'shareContent': shareContent,
        }
        if (attachmentList && attachmentList.length) {
            data.attachmentList = attachmentList.join(',') + ','
        }
        return this._invoke('addShareArticle', {data})
    },

    getMyShareArticleList({pageIndex = 1} = {}) {
        return this._invoke('getMyShareArticleList', {data: {
            pageIndex
        }})
    },

    deleteShareArticle({shareArticleId, shareArticleType = 1}) {
        return this._invoke('deleteShareArticle', {
            data: {
                'contentHeight': 0,
                'shareType': 0,
                'contentState': 0,
                'attachmentArray': [],
                'compressCount': 0,
                'fullTextHeight': 0,
                'userModel': {
                    'money': '0',
                    'userType': 0,
                    'approve': false,
                    'userDefaults': {},
                    'location': {
                        'speed': 0,
                        'time': 0,
                        'longitude': 0,
                        'mapType': 0,
                        'latitude': 0,
                        'direction': 0,
                        'accuracy': 0,
                        'altitude': 0
                    },
                    'userLevel': '0',
                    'userName': 'Guest',
                    'checkinMoney': '0',
                    'shareArticleCommentCount': 0,
                    'registerTime': 0,
                    'isUserCheckin': false,
                    'shareArticleLikeCount': 0,
                    'messageCount': 0,
                    'isCrown': false
                },
                'isLiked': false,
                'attachmentList': '',
                shareArticleType,
                shareArticleId,
                'isHead': false,
                'imageHeight': 0,
                'totalHeight': 65
            }
        })

    },

    getMyClubList() {
        return this._invoke('getMyClubList')
    },

    getBatchClubUnReadMessageCount() {
        return this._invoke('getBatchClubUnReadMessageCount')
    },

    getPageClubMessage({clubId, lastClubMessageId, pageSize = 10, isNew = 1}) {
        return this._invoke('getPageClubMessage', {
            data: {clubId, lastClubMessageId, pageSize, isNew}
        })
    },
    /**
     * 群聊
     */
    addClubMessage({clubId, messageContent, messageType = 1, responseType = 1}) {
        return this._invoke('addClubMessage', {
            data: {clubId, messageContent, messageType, responseType}
        })
    },

    addRedPacket({money, packetCount, clubId, description}) {
        return this._invoke('addRedPacket', {
            data: {money, packetCount, clubId, description}
        })
    },

    getRedPacket(redPacketId) {
        return this._invoke('getRedPacket', {
            data: {redPacketId}
        })
    },

    openRedPacket(redPacketId) {
        return this._invoke('openRedPacket', {
            data: { redPacketId }
        })
    },
    /**
     * 上传文件
     */
    addAttachment(attachment) {
        return this._invoke('addAttachment', {attachment}, true)
    },

    getUserTaskList() {
        return this._invoke('getUserTaskList')
    },

    getUserInfo() {
        return this._invoke('getUserInfo')
    },

    getCarList() {
        return this._invoke('getCarList')
    },

    getCarRankingList() {
        return this._invoke('getCarRankingList')
    },

    addCarStatistics({sn, mileageTotal}) {
        return this._invoke('addCarStatistics', {
            data: {sn, mileageTotal}
        })
    }
}

Imscv.login = function ({userName, password}) {
    var data = {
        'isCrown': false,
        'money': '0',
        'userType': 0,
        'deviceToken': '',
        'approve': false,
        'deviceType': '1',
        'userDefaults': {},
        'location': {'speed': 0, 'time': 0, 'longitude': 0, 'mapType': 0, 'latitude': 0, 'direction': 0, 'accuracy': 0, 'altitude': 0},
        'password': md5(md5(password)),
        'userName': userName,
        'userLevel': '0',
        'isUserCheckin': false,
        'registerTime': 0,
        'shareArticleCommentCount': 0,
        'messageCount': 0,
        'shareArticleLikeCount': 0,
        'checkinMoney': '0'
    }
    return http.post(`${host}login`, {data}).then(data => new Imscv(decrypt(data.loginToken)))
}