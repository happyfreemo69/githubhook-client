const {URL} = require('url');
const https = require('https');
const http = require('http');
const githubhookEndpoint = 'https://githubhook-dev.citylity.com/pushes';
const jenkinsEndpoint = 'http://reg.citylity.com';

/**
 * payload of a githubhook with an added field
 * githubhook:{
 *   url:url
 * }
 * @param  {[type]} push [description]
 * @return {[type]}      [description]
 */
function processPush(push){
    return post(push).then(_=>{
        return deletePush(push);
    }).then(_=>{
        console.log('ok');
    })
}
function fetch(url){
    const myURL = new URL(url);
    return new Promise(function(resolve, reject){
        var req = https.request({
            method:'GET',
            path: myURL.pathname,
            hostname:myURL.hostname,
        }, function(res){
            var buf = '';
            res.on('data', function(chunk){
                buf += chunk.toString();
            });
            res.on('end', function(){
                if(res.statusCode != 200){
                    return reject('fail get');
                }
                try{
                    res = JSON.parse(buf);
                    return resolve(res);
                }catch(e){//do not hangout forever
                    console.log('e : ', e)
                    return reject(e);
                }
            })
        });
        req.on('error', reject);
        req.end();
    });
}
function deletePush(push){
    const myURL = new URL(githubhookEndpoint);
    return new Promise(function(resolve, reject){
        var req = https.request({
            method:'DELETE',
            path: myURL.pathname+'/'+push._id,
            hostname:myURL.hostname,
        }, function(res){
            var called = false;
            res.on('data', function(){
                if(!called){
                    called = true;
                    if(res.statusCode != 200){
                        return reject('fail get');
                    }
                    return resolve();
                }
            })
        });
        req.on('error', reject);
        req.end();
    });
}

function post(data){
    const myURL = new URL(jenkinsEndpoint+data.githubhook.url);
    var m = {
        'http:':http,
        'https:':https
    };
    var prot = m[myURL.protocol];
    if(!prot){return Promise.reject('invalid protocol for url ', jenkinsEndpoint)}
    return new Promise(function(resolve, reject){
        var req = prot.request({
            method:'POST',
            path:myURL.pathname+myURL.search,
            hostname: myURL.hostname,
        }, function(res){
            var called = false;
            res.on('data', function(){
                if(!called){
                    called = true;
                    return resolve();
                }
            })
        });
        req.on('error', reject);
        var jsonData = JSON.stringify(data);
        req.write(jsonData);
        req.end();
    });

}


function dequeue(){
    return fetch(githubhookEndpoint).then(pushes=>{
        return pushes.reduce((acc,push)=>{
            return acc.then(_=>{
                return processPush(push);
            })
        }, Promise.resolve())
    }).catch(e=>{
        console.log('e :' , e)
    })
}

setInterval(dequeue, 60*1000); //fetch every minute


const WebSocket = require('ws');
const hostname = ((new URL(githubhookEndpoint)).hostname);
const ws = new WebSocket('wss://'+hostname);
ws.on('message', function incoming(data){
    if(data == 'push'){
        return dequeue().catch(e=>{
            console.log('e : ', e);
        })
    }
});