var config = {};
config['last'] = {
    set 'url'(c) {
        app['storage']['write']('lasturl', c);
    },
    get 'url'() {
        return app['storage']['read']('lasturl') !== undefined ? app['storage']['read']('lasturl') : 0;
    }
}, config['welcome'] = {
    set 'lastupdate'(c) {
        app['storage']['write']('lastupdate', c);
    },
    get 'lastupdate'() {
        return app['storage']['read']('lastupdate') !== undefined ? app['storage']['read']('lastupdate') : 0;
    }
}, config['regx'] = {
    'useragent': /Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/,
    'url': /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[\/#?]|$)/
}, config['version'] = {
    'final': null,
    'current': null,
    'browser': function () {
        let c = navigator['userAgent']['match'](config['regx']['useragent']);
        if (c === null || c['length'] !== 5)
            return undefined;
        return c = c['map'](d => parseInt(d, 10)), {
            'major': c[1],
            'minor': c[2],
            'build': c[3],
            'patch': c[4]
        };
    }
}, config['convert'] = {
    'to': {
        'zip': function (c, d) {
            if (c) {
                let e, f = new Uint8Array(c);
                if (f[4] === 2) {
                    let g = 16, h = 0 + f[8] + (f[9] << 8) + (f[10] << 16) + (f[11] << 24), i = 0 + f[12] + (f[13] << 8) + (f[14] << 16) + (f[15] << 24);
                    e = g + h + i;
                } else {
                    let j = 0 + f[8] + (f[9] << 8) + (f[10] << 16) + (f[11] << 24 >>> 0);
                    e = 12 + j;
                }
                if (e) {
                    let k = new Blob([new Uint8Array(c, e)], { 'type': 'application/zip' });
                    k && d(k);
                }
            }
        }
    }
}, config['download'] = {
    'base': 'https://clients2.google.com/service/update2/crx',
    'as': {
        'crx': function (c, d, e) {
            c ? (app['popup']['post']('progress', { 'message': 'Preparing to download as CRX, please wait...' }), app['downloads']['start']({
                'url': c,
                'filename': d ? d + '.crx' : 'result.crx'
            }, e)) : core['action']['error']();
        },
        'zip': function (c, d, e) {
            if (c) {
                app['popup']['post']('progress', { 'message': 'Preparing to download as ZIP, please wait...' });
                let f = new FileReader();
                f['onload'] = function (g) {
                    if (g) {
                        let h = g['target']['result'];
                        h && app['downloads']['start']({
                            'url': h,
                            'filename': d ? d + '.zip' : 'result.zip'
                        }, e);
                    } else
                        core['action']['error']();
                }, f['readAsDataURL'](c);
            } else
                core['action']['error']();
        }
    }
}, config['extension'] = {
    'id': undefined,
    'progress': ![],
    'fetch': async function (c, d) {
        if (config['extension']['progress'] === ![]) {
            config['extension']['progress'] = !![];
            try {
                app['popup']['post']('progress', { 'message': 'Fetching data from the webstore, please wait...' });
                let f = await fetch(c, { 'responseType': 'blob' });
                if (f) {
                    if (f['ok']) {
                        if (f['body']) {
                            let g = 0, h = [], i = f['body']['getReader'](), j = parseInt(f['headers']['get']('Content-Length') || '0', 10);
                            if (i) {
                                while (!![]) {
                                    let k = await i['read']();
                                    if (k['done'])
                                        break;
                                    h['push'](k['value']), g += k['value']['length'], app['popup']['post']('progress', {
                                        'total': j,
                                        'loaded': g
                                    });
                                }
                                if (h['length']) {
                                    let l = new Blob(h, { 'type': 'application/zip' }), m = await l['arrayBuffer']();
                                    config['convert']['to']['zip'](m, d), app['popup']['post']('progress', { 'message': 'Converting to ZIP, please wait...' });
                                }
                            } else
                                core['action']['error']();
                        } else
                            core['action']['error']();
                    } else
                        core['action']['error']();
                } else
                    core['action']['error']();
            } catch (n) {
                core['action']['error']();
            }
        }
    }
};
var app = {};
app['error'] = function () {
    return chrome['runtime']['lastError'];
}, app['downloads'] = {
    'start': function (c, d) {
        chrome['downloads'] && chrome['downloads']['download'](c, function (f) {
            if (d)
                d(f);
        });
    }
}, app['popup'] = {
    'port': null,
    'message': {},
    'receive': function (c, d) {
        c && (app['popup']['message'][c] = d);
    },
    'send': function (c, d) {
        c && chrome['runtime']['sendMessage']({
            'data': d,
            'method': c,
            'path': 'background-to-popup'
        }, app['error']);
    },
    'post': function (c, d) {
        c && (app['popup']['port'] && app['popup']['port']['postMessage']({
            'data': d,
            'method': c,
            'path': 'background-to-popup'
        }));
    }
}, app['storage'] = {
    'local': {},
    'read': function (c) {
        return app['storage']['local'][c];
    },
    'update': function (c) {
        if (app['session'])
            app['session']['load']();
        chrome['storage']['local']['get'](null, function (d) {
            app['storage']['local'] = d, c && c('update');
        });
    },
    'write': function (c, d, e) {
        let f = {};
        f[c] = d, app['storage']['local'][c] = d, chrome['storage']['local']['set'](f, function (g) {
            e && e(g);
        });
    },
    'load': function (c) {
        const d = Object['keys'](app['storage']['local']);
        d && d['length'] ? c && c('cache') : app['storage']['update'](function () {
            if (c)
                c('disk');
        });
    }
}, app['on'] = {
    'management': function (c) {
        chrome['management']['getSelf'](c);
    },
    'uninstalled': function (c) {
        chrome['runtime']['setUninstallURL'](c, function () {
        });
    },
    'installed': function (c) {
        chrome['runtime']['onInstalled']['addListener'](function (d) {
            app['storage']['load'](function () {
                c(d);
            });
        });
    },
    'startup': function (c) {
        chrome['runtime']['onStartup']['addListener'](function (d) {
            app['storage']['load'](function () {
                c(d);
            });
        });
    },
    'connect': function (c) {
        chrome['runtime']['onConnect']['addListener'](function (d) {
            app['storage']['load'](function () {
                if (c)
                    c(d);
            });
        });
    },
    'storage': function (c) {
        chrome['storage']['onChanged']['addListener'](function (d, e) {
            app['storage']['update'](function () {
                c && c(d, e);
            });
        });
    },
    'message': function (c) {
        chrome['runtime']['onMessage']['addListener'](function (d, e, f) {
            return app['storage']['load'](function () {
                c(d, e, f);
            }), !![];
        });
    }
}, app['tab'] = {
    'open': function (c, d, e, f) {
        var g = {
            'url': c,
            'active': e !== undefined ? e : !![]
        };
        d !== undefined && (typeof d === 'number' && (g['index'] = d + 1)), chrome['tabs']['create'](g, function (h) {
            if (f)
                f(h);
        });
    },
    'query': {
        'index': function (c) {
            chrome['tabs']['query']({
                'active': !![],
                'currentWindow': !![]
            }, function (d) {
                var e = chrome['runtime']['lastError'];
                if (d && d['length'])
                    c(d[0]['index']);
                else
                    c(undefined);
            });
        },
        'active': function (c) {
            chrome['tabs']['query']({
                'active': !![],
                'currentWindow': !![]
            }, function (d) {
                var e = chrome['runtime']['lastError'];
                if (d && d['length'])
                    c(d[0]);
                else
                    c(undefined);
            });
        }
    },
    'reload': function (c, d, e) {
        c ? d && typeof d === 'object' ? chrome['tabs']['reload'](c['id'], d, function (f) {
            if (e)
                e(f);
        }) : chrome['tabs']['reload'](c['id'], { 'bypassCache': d !== undefined ? d : ![] }, function (f) {
            if (e)
                e(f);
        }) : chrome['tabs']['query']({
            'active': !![],
            'currentWindow': !![]
        }, function (f) {
            var g = chrome['runtime']['lastError'];
            f && f['length'] && (d && typeof d === 'object' ? chrome['tabs']['reload'](f[0]['id'], d, function (h) {
                if (e)
                    e(h);
            }) : chrome['tabs']['reload'](f[0]['id'], { 'bypassCache': d !== undefined ? d : ![] }, function (h) {
                if (e)
                    e(h);
            }));
        });
    }
};
app['version'] = function () {
    return chrome['runtime']['getManifest']()['version'];
}, app['homepage'] = function () {
    return chrome['runtime']['getManifest']()['homepage_url'];
};
!navigator['webdriver'] && (app['on']['uninstalled'](app['homepage']() + '#uninstall'), app['on']['installed'](function (c) {
    app['on']['management'](function (d) {
        d['installType'] === 'normal' && app['tab']['query']['index'](function (f) {
            var g = c['previousVersion'] !== undefined && c['previousVersion'] !== app['version'](), h = g && parseInt((Date['now']() - config['welcome']['lastupdate']) / (24 * 3600 * 1000)) > 45;
            if (c['reason'] === 'install' || c['reason'] === 'update' && h) {
                var i = app['homepage']();
                app['tab']['open'](i, f, c['reason'] === 'install'), config['welcome']['lastupdate'] = Date['now']();
            }
        });
    });
}));
app['on']['message'](function (c) {
    if (c) {
        if (c['path'] === 'popup-to-background')
            for (var d in app['popup']['message']) {
                app['popup']['message'][d] && (typeof app['popup']['message'][d] === 'function' && (d === c['method'] && app['popup']['message'][d](c['data'])));
            }
    }
}), app['on']['connect'](function (c) {
    c && (c['name'] && (c['name'] in app && (app[c['name']]['port'] = c), c['sender'] && (c['sender']['tab'] && (app['interface']['port'] = c))), c['onDisconnect']['addListener'](function (d) {
        app['storage']['load'](function () {
            d && (d['name'] && (d['name'] in app && (app[d['name']]['port'] = null), d['sender'] && (d['sender']['tab'] && (app['interface']['port'] = null))));
        });
    }), c['onMessage']['addListener'](function (d) {
        app['storage']['load'](function () {
            if (d) {
                if (d['path']) {
                    if (d['port']) {
                        if (d['port'] in app) {
                            if (d['path'] === d['port'] + '-to-background')
                                for (var f in app[d['port']]['message']) {
                                    app[d['port']]['message'][f] && (typeof app[d['port']]['message'][f] === 'function' && (f === d['method'] && app[d['port']]['message'][f](d['data'])));
                                }
                        }
                    }
                }
            }
        });
    }));
});
var config = {};
config['last'] = {
    set 'url'(c) {
        app['storage']['write']('lasturl', c);
    },
    get 'url'() {
        return app['storage']['read']('lasturl') !== undefined ? app['storage']['read']('lasturl') : 0;
    }
}, config['welcome'] = {
    set 'lastupdate'(c) {
        app['storage']['write']('lastupdate', c);
    },
    get 'lastupdate'() {
        return app['storage']['read']('lastupdate') !== undefined ? app['storage']['read']('lastupdate') : 0;
    }
}, config['regx'] = {
    'useragent': /Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/,
    'url': /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[\/#?]|$)/
}, config['version'] = {
    'final': null,
    'current': null,
    'browser': function () {
        let c = navigator['userAgent']['match'](config['regx']['useragent']);
        if (c === null || c['length'] !== 5)
            return undefined;
        return c = c['map'](d => parseInt(d, 10)), {
            'major': c[1],
            'minor': c[2],
            'build': c[3],
            'patch': c[4]
        };
    }
}, config['convert'] = {
    'to': {
        'zip': function (c, d) {
            if (c) {
                let e, f = new Uint8Array(c);
                if (f[4] === 2) {
                    let g = 16, h = 0 + f[8] + (f[9] << 8) + (f[10] << 16) + (f[11] << 24), i = 0 + f[12] + (f[13] << 8) + (f[14] << 16) + (f[15] << 24);
                    e = g + h + i;
                } else {
                    let j = 0 + f[8] + (f[9] << 8) + (f[10] << 16) + (f[11] << 24 >>> 0);
                    e = 12 + j;
                }
                if (e) {
                    let k = new Blob([new Uint8Array(c, e)], { 'type': 'application/zip' });
                    k && d(k);
                }
            }
        }
    }
}, config['download'] = {
    'base': 'https://clients2.google.com/service/update2/crx',
    'as': {
        'crx': function (c, d, e) {
            c ? (app['popup']['post']('progress', { 'message': 'Preparing to download as CRX, please wait...' }), app['downloads']['start']({
                'url': c,
                'filename': d ? d + '.crx' : 'result.crx'
            }, e)) : core['action']['error']();
        },
        'zip': function (c, d, e) {
            if (c) {
                app['popup']['post']('progress', { 'message': 'Preparing to download as ZIP, please wait...' });
                let f = new FileReader();
                f['onload'] = function (g) {
                    if (g) {
                        let h = g['target']['result'];
                        h && app['downloads']['start']({
                            'url': h,
                            'filename': d ? d + '.zip' : 'result.zip'
                        }, e);
                    } else
                        core['action']['error']();
                }, f['readAsDataURL'](c);
            } else
                core['action']['error']();
        }
    }
}, config['extension'] = {
    'id': undefined,
    'progress': ![],
    'fetch': async function (c, d) {
        if (config['extension']['progress'] === ![]) {
            config['extension']['progress'] = !![];
            try {
                app['popup']['post']('progress', { 'message': 'Fetching data from the webstore, please wait...' });
                let f = await fetch(c, { 'responseType': 'blob' });
                if (f) {
                    if (f['ok']) {
                        if (f['body']) {
                            let g = 0, h = [], i = f['body']['getReader'](), j = parseInt(f['headers']['get']('Content-Length') || '0', 10);
                            if (i) {
                                while (!![]) {
                                    let k = await i['read']();
                                    if (k['done'])
                                        break;
                                    h['push'](k['value']), g += k['value']['length'], app['popup']['post']('progress', {
                                        'total': j,
                                        'loaded': g
                                    });
                                }
                                if (h['length']) {
                                    let l = new Blob(h, { 'type': 'application/zip' }), m = await l['arrayBuffer']();
                                    config['convert']['to']['zip'](m, d), app['popup']['post']('progress', { 'message': 'Converting to ZIP, please wait...' });
                                }
                            } else
                                core['action']['error']();
                        } else
                            core['action']['error']();
                    } else
                        core['action']['error']();
                } else
                    core['action']['error']();
            } catch (n) {
                core['action']['error']();
            }
        }
    }
};
function b(c, d) {
    const e = a();
    return b = function (f, g) {
        f = f - 0;
        let h = e[f];
        return h;
    }, b(c, d);
}
function a() {
    const o = [
        'load',
        'version'
    ];
    a = function () {
        return o;
    };
    return a();
}
var core = {
    'start': function () {
        function m(c, d) {
            return b(d - -908, c);
        }
        core[m(-909, -908)]();
    },
    'install': function () {
        core['load']();
    },
    'load': function () {
    },
    'extract': {
        'id': function (c) {
            if (c) {
                if (c['indexOf']('http') === 0) {
                    let d = config['regx']['url']['exec'](c);
                    if (d && d['length']) {
                        if (d[1]) {
                            let e = d[1];
                            if (e)
                                return e;
                        }
                    }
                }
            }
            return null;
        }
    },
    'action': {
        'storage': function (c, d) {
        },
        'error': function () {
            app['popup']['send']('error'), config['extension']['progress'] = ![];
        },
        'success': function () {
            app['popup']['send']('success'), config['extension']['progress'] = ![], app['popup']['post']('progress', { 'message': 'Download complete! ZIP file is ready.' });
        },
        'process': function (c) {
            let d = core['extract']['id'](c);
            d ? app['popup']['send']('render', {
                'id': d,
                'url': c
            }) : app['popup']['send']('render', {
                'id': 'N/A',
                'url': ''
            });
        }
    },
    'download': function (d, e) {
        config['extension']['id'] = core['extract']['id'](d);
        function n(c, d) {
            return b(c - -436, d);
        }
        if (config['extension']['id']) {
            app['popup']['post']('progress', { 'message': 'Preparing to download, please wait...' }), config[n(-435, -434)]['current'] = config['version']['browser']();
            if (config['version']['current']) {
                config['version']['final'] = config['version']['current']['major'] + '.' + config['version']['current']['minor'] + '.' + config['version']['current']['build'] + '.' + config['version']['current']['patch'];
                if (config['version']['final']) {
                    if (e === 'crx') {
                        let f = '%26uc&acceptformat=crx2,crx3', g = config['download']['base'] + '?response=redirect&prodversion=', h = config['version']['final'] + '&acceptformat=crx2,crx3&x=id%3D' + config['extension']['id'];
                        config['download']['as']['crx'](g + h + f, config['extension']['id'], core['action']['success']);
                    } else {
                        if (e === 'zip') {
                            let i = config['version']['final'] + '&x=id%3D' + config['extension']['id'], j = config['download']['base'] + '?response=redirect&prodversion=', k = '%26installsource%3Dondemand%26uc&acceptformat=crx2,crx3';
                            config['extension']['fetch'](j + i + k, function (l) {
                                config['download']['as']['zip'](l, config['extension']['id'], core['action']['success']);
                            });
                        }
                    }
                    return;
                }
            }
        }
        core['action']['error']();
    }
};
app['popup']['receive']('download', function (c) {
    core['download'](c['url'], c['format']);
}), app['popup']['receive']('reload', function () {
    app['tab']['query']['active'](function (c) {
        app['tab']['reload'](c);
    });
}), app['popup']['receive']('load', function () {
    app['tab']['query']['active'](function (c) {
        if (c) {
            if (c['url']) {
                let d = core['extract']['id'](c['url']);
                if (d)
                    config['last']['url'] = c['url'];
                core['action']['process'](d ? c['url'] : config['last']['url']);
            }
        }
    });
}), app['popup']['receive']('extract', function (c) {
    let d = '';
    c['url'] ? (d = core['extract']['id'](c['url']), d && (config['last']['url'] = c['url'])) : config['last']['url'] = '', app['popup']['send']('id', { 'id': d ? d : 'N/A' });
}), app['popup']['receive']('support', function () {
    app['tab']['open'](app['homepage']());
}), app['popup']['receive']('donation', function () {
    app['tab']['open'](app['homepage']() + '?reason=support');
}), app['on']['startup'](core['start']), app['on']['installed'](core['install']), app['on']['storage'](core['action']['storage']);
