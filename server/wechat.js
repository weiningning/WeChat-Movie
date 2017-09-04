'use strict';
const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const util = require('./utils');
const fs = require('fs');
const _ = require('lodash');

let prefix = 'https://api.weixin.qq.com/cgi-bin/';
let mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/';
let api = {
    accessToken: `${prefix}token?grant_type=client_credential`,
    temporary: {
        upload: `${prefix}media/upload?`,
        fetch: `${prefix}media/get?`
    },
    permanent: {
        upload: `${prefix}material/add_material?`,
        uploadNews: `${prefix}material/add_news?`,
        uploadNewsPic: `${prefix}media/uploadimg?`,
        fetch: `${prefix}material/get_material?`,
        del: `${prefix}material/del_material?`,
        update: `${prefix}material/update_news?`,
        count: `${prefix}material/get_materialcount?`,
        batch: `${prefix}material/batchget_material?`
    },
    tag: {
        create: `${prefix}tags/create?`,
        get: `${prefix}tags/get?`,
        check: `${prefix}user/tag/get?`,
        update: `${prefix}tags/update?`,
        move: `${prefix}tags/members/batchuntagging?`,
        batchupdate: `${prefix}tags/members/batchtagging?`,
        batchuntag: `${prefix}tags/members/batchuntagging?`,
        del: `${prefix}tags/delete?`,
        getidlist: `${prefix}tags/getidlist?`
    },
    user: {
        remark: `${prefix}/user/info/updateremark?`,
        userinfo: `${prefix}user/info?`,
        batchgetuserinfo: `${prefix}user/info/batchget?`,
        list: `${prefix}user/get?`
    },
    mass: {
        sendall: `${prefix}message/mass/sendall?`,
        preview: `${prefix}message/mass/preview?`
    },
    menu: {
        create: `${prefix}menu/create?`,
        get: `${prefix}menu/get?`,
        delete: `${prefix}menu/delete?`,
        current: `${prefix}get_current_selfmenu_info?`
    },
    qrcode: {
        create: `${prefix}qrcode/create?`,
        show: `${mpPrefix}showqrcode?`,
        shorturl: `${prefix}shorturl?`
    },
    ticket:{
        get:`${prefix}ticket/getticket?`
    }
}

function Wechat(opts) {
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.saveAccessToken = opts.saveAccessToken;
    this.getTicket = opts.getTicket;
    this.saveTicket = opts.saveTicket;
    this.fetchAccessToken();

}

Wechat.prototype.isValidAccessToken = function (data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false
    }
    const expires_in = data.expires_in;
    const now = (new Date().getTime());
    return now < expires_in ? true : false
}
Wechat.prototype.updateAccessToken = function () {
    const appID = this.appID;
    const appSecret = this.appSecret;
    const url = `${api.accessToken}&appid=${appID}&secret=${appSecret}`;

    return new Promise(function (resolve, reject) {
        request({
            url: url,
            json: true
        }).then(function (response) {
            let data = response.body;
            let now = (new Date().getTime());
            let expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;
            resolve(data);
        })
    })
}
Wechat.prototype.reply = function () {
    let content = this.body;
    let message = this.weixin;
    let xml = util.tpl(content, message);
    this.status = 200;
    this.type = 'application/xml';
    this.body = xml;
    console.log(xml)
}
Wechat.prototype.fetchAccessToken = function () {
    let that = this;

    return this.getAccessToken().then(function (data) {
        try {
            data = JSON.parse(data);

        } catch (e) {
            return that.updateAccessToken()
        }
        if (that.isValidAccessToken(data)) {
            return Promise.resolve(data)
        } else {
            return that.updateAccessToken()
        }
    }).then(function (data) {

        that.saveAccessToken(data);
        return Promise.resolve(data)
    })
}
Wechat.prototype.fetchTicket = function (access_token) {
    let that = this;

    return this.getTicket().then(function (data) {
        try {
            data = JSON.parse(data);
        } catch (e) {
            return that.updateTicket(access_token)
        }
        if (that.isValidTicket(data)) {
            return Promise.resolve(data)
        } else {
            return that.updateTicket(access_token)
        }
    }).then(function (data) {
        that.saveTicket(data);
        return Promise.resolve(data)
    })
}
Wechat.prototype.updateTicket = function (access_token) {
    const url = `${api.ticket.get}&access_token=${access_token}&type=jsapi`;
    return new Promise(function (resolve, reject) {
        request({
            url: url,
            json: true
        }).then(function (response) {
            let data = response.body;
            let now = (new Date().getTime());
            let expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;
            resolve(data);
        })
    })
}
Wechat.prototype.isValidTicket = function (data)  {
    if (!data || !data.ticket || !data.expires_in) {
        return false
    }
    const expires_in = data.expires_in;
    const now = (new Date().getTime());
    return now < expires_in ? true : false
}

/*上传临时和永久素材*/
Wechat.prototype.uploadMaterial = function (type, material, permanent) {
    /*material是图文的话传进来的是个数组，是图片或视频传进来是个字符串的路径*/
    let form = {};
    let uploadUrl = api.temporary.upload;
    if (permanent) {
        uploadUrl = api.permanent.upload;
        /*继承permanent的对象*/
        _.extend(form, permanent)
    }

    if (type === 'pic') {
        uploadUrl = api.permanent.uploadNewsPic
    }
    if (type === 'news') {
        uploadUrl = api.permanent.uploadNews;
        form = material
    } else {
        form.media = fs.createReadStream(material)
    }
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            console.log(6789, data)
            let url = `${uploadUrl}&access_token=${data.access_token}`;
            if (!permanent) {
                url += `&type=${type}`
            } else {
                form.access_token = data.access_token;
            }
            let options = {
                method: 'POST',
                url: url,
                json: true
            };
            if (type === 'news') {
                options.body = form;
            } else {
                options.formData = form;
            }
            request(options).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('Upload material fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.fetchMaterial = function (mediaId, type, permanent) {
    /*material是图文的话传进来的是个数组，是图片或视频传进来是个字符串的路径*/
    let form = {};
    let fetchUrl = api.temporary.fetch;
    if (permanent) {
        fetchUrl = api.permanent.fetch;
    }
    return new Promise((resolve, reject) => {
            this.fetchAccessToken().then((data) => {
                let url = `${fetchUrl}&access_token=${data.access_token}`;
                let options = {
                    method: 'POST',
                    url: url,
                    json: true
                };
                if (permanent) {
                    form.media_id = mediaId;
                    form.access_token = data.access_token;
                    options.body = form;
                } else {
                    if (type === 'video') {
                        url = url.replace('https://', 'http://');
                    }
                    url += `&media_id=${mediaId}`
                }
                if (type === 'news' || type === 'video') {
                    request(options).then(function (response) {
                        let _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw Error('Upload material fails')
                        }
                    }).catch((err) => {
                        return reject(err)
                    })
                } else {
                    resolve(url);
                }


            })
        }
    )
}
Wechat.prototype.deleteMaterial = function (mediaId) {
    /*material是图文的话传进来的是个数组，是图片或视频传进来是个字符串的路径*/
    let form = {
        media_id: mediaId
    };

    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.permanent.del}&access_token=${data.access_token}&media_id=${mediaId}`;


            request({
                method: 'POST',
                url: url,
                body: form,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('Upload material fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.updateMaterial = function (mediaId, news) {
    /*material是图文的话传进来的是个数组，是图片或视频传进来是个字符串的路径*/
    let form = {
        media_id: mediaId
    };
    _.extend(form, news);
    /*让form继承传进来的news*/
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.permanent.update}&access_token=${data.access_token}&media_id=${mediaId}`;


            request({
                method: 'POST',
                url: url,
                body: form,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('Upload material fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.countMaterial = function () {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.permanent.count}&access_token=${data.access_token}`;
            request({
                method: 'GET',
                url: url,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('count material fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.batchMaterial = function (options) {
    return new Promise((resolve, reject) => {
        options.type = options.type || 'image';
        options.offset = options.offset || 0;
        options.count = options.count || 1;
        this.fetchAccessToken().then((data) => {
            let url = `${api.permanent.batch}access_token=${data.access_token}`;
            request({
                method: 'POST',
                url: url,
                body: options,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('batch material fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.createTag = function (name) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.tag.create}access_token=${data.access_token}`;
            let options = {
                "tag": {
                    "name": name
                }
            };
            request({
                method: 'POST',
                url: url,
                body: options,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('batch material fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.getTag = function () {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.tag.get}access_token=${data.access_token}`;
            request({
                method: 'GET',
                url: url,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('batch material fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.updateTag = function (id, name) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.tag.update}access_token=${data.access_token}`;
            let options = {
                "tag": {
                    "id": id,
                    "name": name
                }
            };
            request({
                method: 'POST',
                url: url,
                body: options,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('checkTag fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.deleteTag = function (id) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.tag.del}access_token=${data.access_token}`;
            let options = {
                "tag": {
                    "id": id
                }
            }
            request({
                method: 'POST',
                url: url,
                body: options,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('batch material fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.checkTag = function (tagid, next_openid) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.tag.check}access_token=${data.access_token}`;
            let options = {
                "tagid": tagid,
                "next_openid": next_openid//第一个拉取的OPENID，不填默认从头开始拉取
            }
            request({
                method: 'POST',
                url: url,
                body: options,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('checkTag fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.batchupdateTag = function (openid_list, tagid) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.tag.batchupdate}access_token=${data.access_token}`;
            let options = {
                "openid_list": openid_list,
                "tagid": tagid
            }
            request({
                method: 'POST',
                url: url,
                body: options,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('batchupdateTag fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.batchunTag = function (openid_list, tagid) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.tag.batchupdate}access_token=${data.access_token}`;
            let options = {
                "openid_list": openid_list,
                "tagid": tagid
            }
            request({
                method: 'POST',
                url: url,
                body: options,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('batchunTag fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.getidlistTag = function (openid) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.tag.getidlist}access_token=${data.access_token}`;
            let options = {
                openid: openid
            }
            request({
                method: 'POST',
                url: url,
                body: options,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('getidlistTag fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.remarkUser = function (openid, remark) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.user.remark}access_token=${data.access_token}`;
            let options = {
                "openid": openid,
                "remark": remark
            }
            request({
                method: 'POST',
                url: url,
                body: options,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('remarkUser fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}

/*单个获取和批量获取user信息*/
Wechat.prototype.getUserInfo = function (openid, lang) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            lang = lang || 'zh_CN';
            let options = {
                json: true
            };

            if (Array.isArray(openid)) {
                options.url = `${api.user.batchgetuserinfo}access_token=${data.access_token}`;
                options.method = 'POST';
                options.body = {"user_list": openid};


            } else {
                options.url = `${api.user.userinfo}access_token=${data.access_token}&openid=${openid}&lang=${lang}`;
                options.method = 'GET';
            }


            request(options).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('getUserInfo fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.getUserList = function (openid) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.user.list}access_token=${data.access_token}&next_openid=${openid}`;
            request({
                method: 'GET',
                url: url,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('getUserList fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.sendAllMass = function (type, message, tagId) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.mass.sendall}access_token=${data.access_token}`;
            let msg = {
                filter: {}
            };
            if (!tagId) {
                msg.filter.is_to_all = true;
            } else {
                msg.filter = {
                    "is_to_all": false,
                    "tag_id": tagId
                }

            }
            msg[type] = message;
            msg.msgtype = type;
            msg.send_ignore_reprint = 0;
            console.log(555, msg)
            request({
                method: 'POST',
                url: url,
                body: msg,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('sendAllMass fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.previewMass = function (type, message, openId) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.mass.preview}access_token=${data.access_token}`;
            let msg = {
                "touser": openId,
            };
            msg[type] = message;
            msg.msgtype = type;
            msg.send_ignore_reprint = 0;
            console.log(555, msg)
            request({
                method: 'POST',
                url: url,
                body: msg,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('previewMass fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.createMenu = function (menu) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.menu.create}access_token=${data.access_token}`;

            request({
                method: 'POST',
                url: url,
                body: menu,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('createMenu fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.getMenu = function () {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.menu.get}access_token=${data.access_token}`;

            request({
                method: 'GET',
                url: url,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('getMenu fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.deleteMenu = function () {
    return new Promise((resolve, reject) => {
        console.log(3333333, this.fetchAccessToken)

        this.fetchAccessToken().then((data) => {
            let url = `${api.menu.delete}access_token=${data.access_token}`;

            request({
                method: 'GET',
                url: url,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('deleteMenu fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.currentMenu = function () {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.menu.current}access_token=${data.access_token}`;

            request({
                method: 'GET',
                url: url,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('currentMenu fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.createQrCode = function (qr) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.qrcode.create}access_token=${data.access_token}`;

            request({
                method: 'POST',
                url: url,
                body: qr,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('createMenu fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}
Wechat.prototype.showQrCode = function (ticket) {
    return `${api.qrcode.show}ticket=${ticket}`
}
Wechat.prototype.shortQrCode = function (action, url) {
    action = action || 'long2short';
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => {
            let url = `${api.qrcode.shorturl}access_token=${data.access_token}`;

            request({
                method: 'POST',
                url: url,
                body: url,
                json: true
            }).then(function (response) {
                let _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw Error('createMenu fails')
                }
            }).catch((err) => {
                return reject(err)
            })
        })
    })
}

module.exports = Wechat;


