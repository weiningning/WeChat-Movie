'use strict';
const xml2js = require('xml2js');
const Promise = require('bluebird');
const tpl = require('./tpl');
exports.parseXMLAsync = function (xml) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, {trim: true}, (err, content) => {
            if (err) reject(err)
            else resolve(content)
        })
    })
}
function formatMessage(result) {
    var message = {};
    if (typeof result === 'object') {
        let keys = Object.keys(result);
        for (let i = 0; i < keys.length; i++) {
            let item = result[keys[i]];
            let key = keys[i];
            if (!(item instanceof Array) || item.length === 0) {
                continue
            }
            if (item.length === 1) {
                let val = item[0];
                if (typeof val === 'object') {
                    message[key] = formatMessage(val)
                } else {
                    message[key] = (val || '').trim();
                }
            } else {
                message[key] = [];
                for (let j = 0; j < item.length; j++) {
                    message[key].push(formatMessage(item[j]))
                }
            }
        }
    }
    return message
}
exports.formatXMLAsync = formatMessage;
exports.tpl = function (content, message) {
    let info = {};
    let type = 'text';
    let FromUserName = message.FromUserName;
    let ToUserName = message.ToUserName;
    if (Array.isArray(content)) {
        type = 'news'
    }
    type = content.type || type;
    info.content=content;
    info.createTime=new Date().getTime();
    info.msgType=type;
    info.ToUserName=FromUserName;
    info.FromUserName=ToUserName;
    return tpl.compiled(info);
};
/*此模块被wechat引入*/