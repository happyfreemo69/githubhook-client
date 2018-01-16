const {URL} = require('url');
const https = require('https');
const http = require('http');
var config = require('./config');
var urlToModule = function(url){
    const myURL = new URL(url);
    var m = {
        'http:':http,
        'https:':https
    };
    var prot = m[myURL.protocol];
    if(!prot){return Promise.reject('invalid protocol for url ', config.jenkinsEndpoint)}
    return prot;
}
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
        console.log(new Date()+' ok');
    })
}
function fetch(url){
    const myURL = new URL(url);
    var prot = urlToModule(url);
    return new Promise(function(resolve, reject){
        var req = prot.request({
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
    var url = config.githubhookEndpoint;
    const myURL = new URL(url);
    var prot = urlToModule(url);
    return new Promise(function(resolve, reject){
        var req = prot.request({
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
    var url = config.jenkinsEndpoint+data.githubhook.url;
    const myURL = new URL(url);
    var prot = urlToModule(url);
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
    return fetch(config.githubhookEndpoint).then(pushes=>{
        return pushes.reduce((acc,push)=>{
            return acc.then(_=>{
                return processPush(push);
            })
        }, Promise.resolve())
    }).catch(e=>{
        console.log(new Date()+' e :' , e)
    })
}

setInterval(dequeue, 60*1000); //fetch every minute


const WebSocket = require('ws');
function reloadWs(){
    const ws = new WebSocket(config.wsEndpoint);
    ws.on('open', function(){
        console.log('connected');
    })
    ws.on('message', function incoming(data){
        if(data == 'push'){
            return dequeue().catch(e=>{
                console.log('e : ', e);
            })
        }
    });
    ws.on('close', function(){
        console.log(new Date()+' close');
        delete ws;
        setTimeout(function(){
            reloadWs();//timeout so we dont force the connection if deploying e.g
        }, 3000)
    })

    ws.on('error', function(e){
        console.log('error conn');//silent
    })
}
reloadWs();