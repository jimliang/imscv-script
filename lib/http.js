/**
 * Created by jimliang on 2017/2/22.
 */

var fetch = require('node-fetch')
var FormData = require('form-data');

function _post(url, data = {}, hasFile) {

    var body, headers = {
        'User-Agent': 'INMOTION/5.2.1 (iPhone; iOS 9.3.5; Scale/3.00)',
        //'User-Agent': '乐行 5.2.1 rv:105 (iPhone; iPhone OS 9.3.5; zh_CN)',
    }

    if (hasFile) {
        body = new FormData();
        Object.keys(data).forEach(key => void body.append(key, data[key]));
        headers = body.getHeaders(headers);
    } else {
        headers ['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
        body = data;
        body = Object.keys(body).map(key => {
            var value = (typeof body[key] == 'object') ? JSON.stringify(body[key]) : encodeURIComponent(body[key]);
            return `${key}=${value}`;
        }).join('&');
    }

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
    }).then(res => res.json()).then(json => {
        if (json.code == 'N00000') return json.data;
        // { code: 'E03000', message: '权限验证失败', data: '' }
        var e = new Error(json.message);
        e.code = json.code;
        return Promise.reject(e);
    })
}

module.exports = {

    post(url, data, hasFile) {
        return _post(url, data, hasFile)
    }
}