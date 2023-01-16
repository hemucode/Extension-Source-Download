domReady(() => {
  linkButton()
})

function domReady (callback) {
  if (document.readyState === 'complete') {
    callback()
  } else {
    window.addEventListener('load', callback, false);
  }
}

function linkButton() {
  document.querySelector('.teaser').href = `https://chrome.google.com/webstore/detail/${chrome.runtime.id}/reviews`;
  document.querySelector('.youtube').href = `https://youtube.com/c/HemantaGayen`;
  document.querySelector('.facebook').href = `https://www.facebook.com/codehemu/`;
  document.querySelector('.website').href = `https://www.downloadhub.cloud/`;
}
var background = {
        'port': null,
        'message': {},
        'receive': function (c, d) {
            c && (background['message'][c] = d);
        },
        'send': function (c, d) {
            c && chrome['runtime']['sendMessage']({
                'method': c,
                'data': d,
                'path': 'popup-to-background'
            }, function () {
                return chrome['runtime']['lastError'];
            });
        },
        'connect': function (c) {
            chrome['runtime']['onMessage']['addListener'](background['listener']), c && (background['port'] = c, background['port']['onMessage']['addListener'](background['listener']), background['port']['onDisconnect']['addListener'](function () {
                background['port'] = null;
            }));
        },
        'post': function (c, d) {
            c && (background['port'] && background['port']['postMessage']({
                'method': c,
                'data': d,
                'path': 'popup-to-background',
                'port': background['port']['name']
            }));
        },
        'listener': function (c) {
            if (c)
                for (let d in background['message']) {
                    background['message'][d] && (typeof background['message'][d] === 'function' && (c['path'] === 'background-to-popup' && (c['method'] === d && background['message'][d](c['data']))));
                }
        }
    }, config = {
        'id': function (c) {
            let d = document['getElementById']('extension');
            d['textContent'] = c['id'];
        },
        'render': function (c) {
            let d = document['getElementById']('url'), f = document['getElementById']('extension');
            d['value'] = c['url'], f['textContent'] = c['id'];
        },
        'success': function () {
            let c = document['querySelector']('.progress');
            c['value'] = 100, window['setTimeout'](function () {
                c['value'] = 0;
            }, 300);
        },
        'listener': {
            'download': function (c) {
                let d = document['getElementById']('url');
                background['send']('download', {
                    'url': d['value'],
                    'format': c['target']['id']
                });
            }
        },
        'file': {
            'size': function (c) {
                if (c) {
                    if (c >= Math['pow'](2, 30))
                        return (c / Math['pow'](2, 30))['toFixed'](1) + ' GB';
                    ;
                    if (c >= Math['pow'](2, 20))
                        return (c / Math['pow'](2, 20))['toFixed'](1) + ' MB';
                    ;
                    if (c >= Math['pow'](2, 10))
                        return (c / Math['pow'](2, 10))['toFixed'](1) + ' KB';
                    ;
                    return c + ' B';
                } else
                    return '';
            }
        },
        'error': function () {
            let c = document['getElementById']('crx'), d = document['getElementById']('zip');
            c['setAttribute']('error', ''), d['setAttribute']('error', ''), window['setTimeout'](function () {
                c['removeAttribute']('error', ''), d['removeAttribute']('error', '');
            }, 300);
        },
        'progress': function (c) {
            let d = document['querySelector']('.status'), f = document['querySelector']('.progress');
            'message' in c && (d['textContent'] = c['message']);
            if ('total' in c && 'loaded' in c) {
                let g = {};
                g['total'] = config['file']['size'](c['total']), g['loaded'] = config['file']['size'](c['loaded']);
                let h = c['total'] ? c['loaded'] / c['total'] : c['loaded'] / 1000000;
                f['value'] = Math['floor'](h * 100), d['textContent'] = (c['total'] ? g['loaded'] + ' out of ' + g['total'] : g['loaded']) + ' is downloaded, please wait...';
            }
        },
        'load': function () {
            let c = document['getElementById']('url'), d = document['getElementById']('zip'), e = document['getElementById']('crx'), f = document['getElementById']('reload'), g = document['getElementById']('support'), h = document['getElementById']('donation');
            d['addEventListener']('click', config['listener']['download']), e['addEventListener']('click', config['listener']['download']), f['addEventListener']('click', function () {
                background['send']('reload');
            }), g['addEventListener']('click', function () {
                background['send']('support');
            }), h['addEventListener']('click', function () {
                background['send']('donation');
            }), c['addEventListener']('change', function (i) {
                background['send']('extract', { 'url': i['target']['value'] });
            }), background['send']('load'), window['removeEventListener']('load', config['load'], ![]);
        }
    };
background['receive']('id', config['id']), background['receive']('error', config['error']), background['receive']('render', config['render']), background['receive']('success', config['success']), background['receive']('progress', config['progress']), window['addEventListener']('load', config['load'], ![]), background['connect'](chrome['runtime']['connect']({ 'name': 'popup' }));