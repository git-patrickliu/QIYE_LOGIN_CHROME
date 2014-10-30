/**
 * Created with JetBrains PhpStorm.
 * User: patrickliu
 * Date: 13-12-17
 * Time: 下午7:29
 * To change this template use File | Settings | File Templates.
 */
var autoLoginHelper = {

    accounts: '',

    getAccount: function() {
        var trTpl = [
            '<% $.each(accounts, function(index, item) {%>',
            '<% var length = 0;%>',
                '<% $.each(item, function(subIndex, subItem) {%> length++;<% }%>',
                '<% var start = 0;%>',
                '<% $.each(item, function(subIndex, subItem) {%>',
                    '<% if(start == 0) {%>',
                        '<tr><td rowspan="<%=length%>"><%=subItem.mainAccount%></td><td data-env="<%=env%>" data-url="<%=url%>" data-account="<%=subIndex%>" data-pwd="<%=subItem.pwd%>"><a href="javascript:" class="clickAccount"><%=subIndex%></a></td><td><%=subItem.name%></td><td class="modify-pwd"><%=subItem.pwd%></td><td><%=subItem.role%></td><td><%=subItem.comment || ""%></td></tr>',
                    '<% } else {%>',
                        '<tr><td data-env="<%=env%>" data-url="<%=url%>" data-account="<%=subIndex%>" data-pwd="<%=subItem.pwd%>"><a href="javascript:" class="clickAccount"><%=subIndex%></a></td><td><%=subItem.name%></td><td class="modify-pwd"><%=subItem.pwd%></td><td><%=subItem.role%></td><td><%=subItem.comment || ""%></td></tr>',
                    '<% }%>',
                    '<% start++;%>',
                '<% }%>',
            '<% }%>'
        ].join(''),
            trTplFun = function(obj) {
                var str = '',
                    env = obj.env,
                    url = obj.url,
                    accounts = obj.accounts,
                    accountPwdHash = obj.accountPwdHash,
                    defaultPwd = obj.defaultPwd;

                var start = 0;
                $.each(accounts, function (subIndex, subItem) {
                    if (start === 0) {
                        str += [
                            '<tr>',
                            '<td data-env="$env" data-url="$url" data-account="$account" data-pwd="$pwd"><a href="javascript:" class="clickAccount">$account</a></td>',
                            '<td>$name</td>',
                            '<td data-env="$env" data-url="$url" data-account="$account" data-pwd="$pwd">$comment</td>',
                            '</tr>'].join('')
                            .replace(/\$env/g, env)
                            .replace(/\$url/g, url)
                            .replace(/\$account/g, subIndex)
                            .replace(/\$pwd/g, accountPwdHash[subIndex] || defaultPwd)
                            .replace(/\$name/g, subItem.name)
                            .replace(/\$comment/g, subItem.comment || '');
                    } else {

                        str += [
                            '<tr>',
                            '<td data-env="$env" data-url="$url" data-account="$account" data-pwd="$pwd"><a href="javascript:" class="clickAccount">$account</a></td>',
                            '<td>$name</td>',
                            '<td data-env="$env" data-url="$url" data-account="$account" data-pwd="$pwd">$comment</td>',
                            '</tr>'].join('')
                            .replace(/\$env/g, env)
                            .replace(/\$url/g, url)
                            .replace(/\$account/g, subIndex)
                            .replace(/\$pwd/g, accountPwdHash[subIndex] || defaultPwd)
                            .replace(/\$name/g, subItem.name)
                            .replace(/\$comment/g, subItem.comment || '');
                    }
                    start++;
                });
                return str;
            },
            template = trTplFun;

        //从localstorage获取数据
        chrome.storage.local.get('accounts', function(obj) {
            var accounts = obj['accounts'],
                dev = accounts['dev'],
                oa = accounts['oa'],
                ol = accounts['ol'],
                defaultPwd = accounts['defaultPwd'],
                accountPwdHash = accounts['accountPwdHash'],
                $devTable = $('#devTable'),
                $oaTable = $('#oaTable'),
                $olTable = $('#olTable'),
                totalHide = 0;

            autoLoginHelper.accounts = accounts;

            var genTpl = template({
                env: 'dev',
                url: 'https://dev.qiye.qq.com/login',
                accounts: dev,
                accountPwdHash: accountPwdHash,
                defaultPwd: defaultPwd
            });
            if(genTpl === '') {
                $('#dev').addClass('dn');
                totalHide ++;
            } else {
                $devTable.find('tbody').html(genTpl);
            }

            genTpl = template({
                env: 'oa',
                url: 'https://oa.qiye.qq.com/login',
                accounts: oa,
                accountPwdHash: accountPwdHash,
                defaultPwd: defaultPwd
            });
            if(genTpl === '') {
                $('#oa').addClass('dn');
                totalHide ++;
            } else {
                $oaTable.find('tbody').html(genTpl);
            }

            genTpl = template({
                env: 'ol',
                url: 'https://qiye.qq.com/login',
                accounts: ol,
                accountPwdHash: accountPwdHash,
                defaultPwd: defaultPwd
            });
            if(genTpl === '') {
                $('#ol').addClass('dn');
                totalHide ++;
            } else {
                $olTable.find('tbody').html(genTpl);
            }

            if(totalHide === 3) {
                $('#test').html('<p style="width: 350px;">ooops, 你还没有登陆过任何一个营销QQ账号。</p><p>赶紧登录吧 <a href="https://dev.qiye.qq.com" target="_blank">开发环境</a> <a href="https://oa.qiye.qq.com" target="_blank">测试环境</a> <a href="https://qiye.qq.com" target="_blank">线上环境</a></p>')
            }
        });
    },
    bindEvent: function() {
        var $accountWrapper = $('.account-wrapper');
        //监听storage change事件
        $accountWrapper.delegate('.clickAccount', 'click', function() {
            var $this = $(this).parent(),
                account = $this.data('account'),
                pwd = $this.data('pwd'),
                jumpToUrl = $this.data('url'),
                env = $this.data('env');

            chrome.runtime.sendMessage({
                account: account,
                pwd: pwd,
                from: 'popup',
                url: jumpToUrl,
                env: env
            });
        });

        $accountWrapper.delegate('.delete', 'click', function() {
            var $this = $(this),
                account = $this.data('account'),
                env = $this.data('env'),
                envData = autoLoginHelper.accounts[env];

            envData && envData[account] && delete envData[account];

            chrome.storage.local.set({
                accounts: autoLoginHelper.accounts
            }, function() {
                window.location.reload();
            });

        });

        $accountWrapper.delegate('.modify-pwd', 'click', function() {
            var $this = $(this),
                innerText = $this.text(),
                account = $this.data('account'),
                env = $this.data('env');

            $this.replaceWith($('<td data-account="' + account +'" data-env="' + env +'"><input class="pwd-input" value="' + innerText + '"></td>'));
            $('.pwd-input')[0].focus();
        });

        $accountWrapper.delegate('.pwd-input', 'blur', function() {
            var $this = $(this),
                value = $this.val(),
                $parentTd = $this.parent(),
                account = $parentTd.data('account'),
                env = $parentTd.data('env'),
                envData = autoLoginHelper.accounts[env];

            envData && envData[account] && envData[account] && (envData[account]['pwd'] = value);

            $parentTd.replaceWith($('<td class="modify-pwd" data-account="' + account +'" data-env="' + env +'">' + value + '</td>'));

            //同步到chrome.storage
            chrome.storage.local.set({
                accounts: autoLoginHelper.accounts
            });
        });

        $accountWrapper.delegate('.pwd-input', 'keyup', function(e) {
            if(e.keyCode == 13) {
                $(this).trigger('blur');
            }
        });
    },

    init: function() {
        this.getAccount();
        this.bindEvent();
    }
};
$(function() {
    autoLoginHelper.init();
});


