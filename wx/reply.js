'use strict';
const config = require('../config');
const Wechat = require('../server/wechat');
const path = require('path');
const menu = require('./menu');
const wechatApi = new Wechat(config.wechat);

exports.reply = function *(next) {
    let message = this.weixin;
    wechatApi.deleteMenu().then(() => {
            return wechatApi.createMenu(menu)
        }
    ).then((msg) => {
        console.log(msg)
    })


    if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            if (message.EventKey) {
                console.log('扫描二维码')
            }
            this.body = '恭喜你走上正道'
        } else if (message.Event === 'unsubscribe') {
            console.log('无情取关');
            this.body = '你还会回来的'
        } else if (message.Event === 'LOCATION') {
            this.body = `你在${message.Latitude}/${message.Longitude}-${message.Precision}`
        } else if (message.Event === 'CLICK') {
            this.body = `点击了菜单君${message.EventKey}`
        } else if (message.Event === 'SCAN') {
            this.body = `扫我干嘛`
        } else if (message.Event === 'VIEW') {
            this.body = `点击了链接君${message.EventKey}`
        } else if (message.Event === 'scancode_push') {
            console.log(123, message.ScanCodeInfo.ScanType)
            console.log(1234, message.ScanResult)
            this.body = `点击了链接君${message.EventKey}`
        } else if (message.Event === 'scancode_waitmsg') {
            console.log(123, message.ScanCodeInfo.ScanType)
            console.log(1234, message.ScanResult)
            this.body = `点击了链接君${message.EventKey}`
        } else if (message.Event === 'pic_sysphoto') {
            console.log(123, message.SendPicsInfo);
            console.log(1234, message.PicList);
            this.body = `点击了链接君${message.EventKey}`
        } else if (message.Event === 'pic_photo_or_album') {
            console.log(123, message.SendPicsInfo);
            console.log(1234, message.PicList);
            this.body = `点击了链接君${message.EventKey}`
        } else if (message.Event === 'pic_weixin') {
            console.log(123, message.SendPicsInfo);
            console.log(1234, message.PicList);
            this.body = `点击了链接君${message.EventKey}`
        } else if (message.Event === 'location_select') {
            console.log(123, message.SendLocationInfo.Location_X);
            console.log(123, message.Location_Y);
            this.body = `点击了链接君${message.EventKey}`
        }

    } else if (message.MsgType === 'text') {
        let content = message.Content;
        let reply = `你说啥？${content}是什么鬼`;
        if (content === '1') {
            wechatApi.deleteMenu();
            reply = `老一叮叮当`
        } else if (content === '2') {
            reply = `老er喝shi汤`
        } else if (content === '3') {
            reply = `老3骑白马`
        } else if (content === '4') {
            reply = [/*{
             title: '看脸的社会',
             description: '注重个人形象',
             picUrl: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1502969195500&di=f6dee4db4283505f947164d2b16c55b4&imgtype=0&src=http%3A%2F%2F58pic.ooopic.com%2F58pic%2F13%2F01%2F28%2F41V58PICi7C.jpg',
             url: 'https://www.baidu.com/',
             },*/{
                title: '音乐世界',
                description: '美妙的声音',
                picUrl: 'https://timgsa.baidu.com/timg?image&quality=80&size=b10000_10000&sec=1502959126&di=600469f343b29792b8560bf870e030e6&src=http://img.taopic.com/uploads/allimg/130613/318760-13061302495357.jpg',
                url: 'http://music.163.com/',
            }
            ]
        } else if (content === '5') {
            console.log()
            let data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'));
            console.log(data);
            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        } else if (content === '6') {
            let data = yield wechatApi.uploadMaterial('video', path.join(__dirname + '../6.mp4'));
            reply = {
                type: 'video',
                mediaId: data.media_id,
                title: '视频',
                description: '打个篮球'
            }
        } else if (content === '7') {
            let data = yield wechatApi.uploadMaterial('image', path.join(__dirname + '/2.jpg'));
            reply = {
                type: 'music',
                title: '音乐',
                description: '放松一下',
                musicUrl: 'http://mpge.5nd.com/2015/2015-9-12/66325/1.mp3',
                thumbMediaId: data.media_id
            }
        } else if (content === '8') {
            let data = yield wechatApi.uploadMaterial('image', path.join(__dirname + '/2.jpg'), {type: 'image'});
            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        } else if (content === '9') {
            let data = yield wechatApi.uploadMaterial('image', path.join(__dirname + '/6.mp4'), {
                type: 'video',
                description: '{"title":"really a nine place","introduction":"Never forget"}'
            });
            reply = {
                type: 'video',
                mediaId: data.media_id,
                title: '视频',
                description: '打个篮球'
            }
        } else if (content === '10') {
            let picData = yield wechatApi.uploadMaterial('image', path.join(__dirname + '/2.jpg'), {});
            console.log(999, picData)

            let media = {
                articles: [{
                    "title": '卫宁宁',
                    "thumb_media_id": picData.media_id,
                    "author": 'wnn',
                    "digest": 'none',
                    "show_cover_pic": 1,
                    "content": 'meiyou',
                    "content_source_url": 'https://www.baidu.com/'
                }]
            };
            let data = yield wechatApi.uploadMaterial('news', media, {});
            console.log(2211, data);

            data = yield wechatApi.fetchMaterial(data.media_id, 'news', {})
            let items = data.news_item;
            let news = [];
            items.forEach((item) => {
                news.push({
                    title: item.title,
                    description: item.digest,
                    picUrl: picData.url,
                    url: item.url
                })
            });
            reply = news;
        } else if (content === '11') {
            let counts = yield wechatApi.countMaterial();
            console.log(counts);
            let results = yield [
                wechatApi.batchMaterial({
                    type: 'image',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'video',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'voice',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'news',
                    offset: 0,
                    count: 10
                })
            ];
            console.log(JSON.stringify(results));
            reply = 'hahaha';
        } else if (content === '12') {
            /*let group = yield wechatApi.createTag('蒙古人');
             console.log(111, group);*/
            // let id = group.tag.id;
            /*let groups = yield wechatApi.getTag();
             console.log(222, groups);

             let updateRes = yield wechatApi.updateTag(id, '山西人');
             console.log(333, updateRes);*/
            let checkRes = yield wechatApi.checkTag(103, '');
            console.log(555, checkRes);
            let deleteRes = yield wechatApi.deleteTag(103);
            console.log(444, deleteRes);
            reply = '12成功'
        } else if (content === '13') {
            let remarkUserRes = yield wechatApi.getUserInfo(message.FromUserName);

            console.log(111, remarkUserRes);
            let options = [
                {
                    "openid": message.FromUserName,
                    "lang": "en"
                }
            ];
            remarkUserRes = yield wechatApi.getUserInfo(options);
            console.log(222, remarkUserRes);

            reply = '13成功'

        } else if (content === '14') {
            let getUserListRes = yield wechatApi.getUserList(message.FromUserName);
            console.log(111, getUserListRes);
            reply = '14成功'

        } else if (content === '15') {
            let mpnews = {
                "media_id": "Tg6A03XZyytElEIwnRYifJQPB7GQ-7c0k4qRoXBarDU"
            };
            let msgData = yield wechatApi.sendAllMass('mpnews', mpnews);
            console.log(15, msgData);
            reply = '15成功'

        } else if (content === '16') {
            let mpnews = {
                "media_id": "Tg6A03XZyytElEIwnRYifJQPB7GQ-7c0k4qRoXBarDU"
            };
            let msgData = yield wechatApi.previewMass('mpnews', mpnews, message.FromUserName);
            console.log(16, msgData);
            reply = '16成功'

        } else if (content === '17') {
            let tempQr = {
                "expire_seconds": 604800,
                "action_name": "QR_SCENE",
                "action_info": {"scene": {"scene_id": 123}}
            };
            let tempStrQr = {
                "expire_seconds": 604800,
                "action_name": "QR_STR_SCENE",
                "action_info": {"scene": {"scene_str": "test"}}
            };

            let permQr = {
                "action_name": "QR_LIMIT_SCENE",
                "action_info": {"scene": {"scene_id": 123}}
            };
            let permStrQr = {
                "action_name": "QR_LIMIT_STR_SCENE",
                "action_info": {"scene": {"scene_str": "test"}}
            };
            let qr1 = yield wechatApi.createQrCode(tempQr);
            let qr2 = yield wechatApi.createQrCode(tempStrQr);
            let qr3 = yield wechatApi.createQrCode(permQr);
            let qr4 = yield wechatApi.createQrCode(permStrQr);
        } else if (content === '18') {
            let longUrl='http://www.imooc.com';
            let shortData=yield wechatApi.shortQrCode(null,longUrl);
            reply=shortData.short_url;

        }


            this.body = reply;
    }
    yield next
}
/*此模块作为handler函数*/
