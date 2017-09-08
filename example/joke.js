
const fetch = require('node-fetch')

module.exports = async () => {
    const res = await fetch('http://api.laifudao.com/open/tupian.json')
    return eval(`(${res.text()})`)
}