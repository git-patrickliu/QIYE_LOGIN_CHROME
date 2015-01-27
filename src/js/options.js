/**
 * Created by apple on 5/24/14.
 */
var autoLoginHelper = {

    accounts: '',

    getAccount: function () {
        var trTplFun = function (obj) {
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
                            '<td>$account</td>',
                            '<td>$name</td>',
                            '<td class="modify-pwd" data-env="$env" data-url="$url" data-account="$account" data-pwd="$pwd">$pwd</td>',
                            '<td class="add-comment"  data-env="$env" data-url="$url" data-account="$account" data-pwd="$pwd">$comment</td>',
                            '<td><a class="delete" href="javascript:"  data-account="$account" data-env="$env">&times;</a></td>',
                            '</tr>'].join('')
                            .replace(/\$env/g, env)
                            .replace(/\$url/g, url)
                            .replace(/\$account/g, subIndex)
                            .replace(/\$pwd/g, accountPwdHash[subIndex] || defaultPwd)
                            .replace(/\$name/g, subItem.name)
                            .replace(/\$comment/g, subItem.comment || '<a href="javascript:">添加</a>');
                    } else {

                        str += [
                            '<tr>',
                            '<td>$account</td>',
                            '<td>$name</td>',
                            '<td class="modify-pwd" data-env="$env" data-url="$url" data-account="$account" data-pwd="$pwd">$pwd</td>',
                            '<td class="add-comment" data-env="$env" data-url="$url" data-account="$account" data-pwd="$pwd">$comment</td>',
                            '<td><a class="delete" href="javascript:" data-account="$account" data-env="$env">&times;</a></td>',
                            '</tr>'].join('')
                            .replace(/\$env/g, env)
                            .replace(/\$url/g, url)
                            .replace(/\$account/g, subIndex)
                            .replace(/\$pwd/g, accountPwdHash[subIndex] || defaultPwd)
                            .replace(/\$name/g, subItem.name)
                            .replace(/\$comment/g, subItem.comment || '<a href="javascript:">添加</a>');
                    }
                    start++;
                });
                return str;
            },
            template = trTplFun;


        //从localstorage获取数据
        chrome.storage.sync.get('accounts', function (obj) {
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
            $('#defaultPwd').val(defaultPwd);

            var genTpl = template({
                env: 'dev',
                url: 'https://dev.qiye.qq.com/login',
                accounts: dev,
                accountPwdHash: accountPwdHash,
                defaultPwd: defaultPwd
            });
            if (genTpl === '') {
                $('#dev').addClass('dn');
                totalHide++;
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
            if (genTpl === '') {
                $('#oa').addClass('dn');
                totalHide++;
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
            if (genTpl === '') {
                $('#ol').addClass('dn');
                totalHide++;
            } else {
                $olTable.find('tbody').html(genTpl);
            }

            if (totalHide === 3) {
                $('#test').html('<p style="width: 350px;">ooops, 你还没有登陆过任何一个营销QQ账号。</p><p>赶紧登录吧 <a href="https://dev.qiye.qq.com" target="_blank">开发环境</a> <a href="https://oa.qiye.qq.com" target="_blank">测试环境</a> <a href="https://qiye.qq.com" target="_blank">线上环境</a></p>')
            }
        });
    },
    bindEvent: function () {
        var $accountWrapper = $('.account-wrapper');
        //监听storage change事件
        $accountWrapper.delegate('.clickAccount', 'click', function () {
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

        $accountWrapper.delegate('.delete', 'click', function () {
            var $this = $(this),
                account = $this.data('account'),
                env = $this.data('env'),
                accountPwdHash = autoLoginHelper.accounts['accountPwdHash'],
                accountEnvHash = autoLoginHelper.accounts['accountEnvHash'],
                envData = autoLoginHelper.accounts[env];


            //envData 删除账号
            envData && envData[account] && (delete envData[account]);

            //删除密码
            accountPwdHash && accountPwdHash[account] && ( delete accountPwdHash[account] );

            //删除环境对应
            accountEnvHash && accountEnvHash[account] && ( delete accountEnvHash[account] );

            //删除账号

            chrome.storage.sync.set({
                accounts: autoLoginHelper.accounts
            }, function () {
                window.location.reload();
            });

        });

        $accountWrapper.delegate('.modify-pwd', 'click', function () {
            var $this = $(this),
                innerText = $this.text(),
                account = $this.data('account'),
                env = $this.data('env');

            $this.replaceWith($('<td data-account="' + account + '" data-env="' + env + '"><input class="pwd-input" value="' + innerText + '"></td>'));
            $('.pwd-input')[0].focus();
        });

        $accountWrapper.delegate('.pwd-input', 'blur', function () {
            var $this = $(this),
                value = $.trim($this.val()),
                $parentTd = $this.parent(),
                account = $parentTd.data('account'),
                env = $parentTd.data('env'),
                accountPwdHash = autoLoginHelper.accounts.accountPwdHash;

            accountPwdHash[account] = value;

            $parentTd.replaceWith($('<td class="modify-pwd" data-account="' + account + '" data-env="' + env + '">' + value + '</td>'));

            //同步到chrome.storage
            chrome.storage.sync.set({
                accounts: autoLoginHelper.accounts
            });
        });

        $accountWrapper.delegate('.pwd-input', 'keyup', function (e) {
            if (e.keyCode == 13) {
                $(this).trigger('blur');
            }
        });


        $accountWrapper.delegate('.add-comment', 'click', function () {
            var $this = $(this),
                innerText = $this.find('a').length > 0 ? '' : $this.text(),
                account = $this.data('account'),
                env = $this.data('env');

            $this.replaceWith($('<td data-account="' + account + '" data-env="' + env + '"><input class="comment-input" value="' + innerText + '"></td>'));
            $('.comment-input')[0].focus();
        });


        $accountWrapper.delegate('.comment-input', 'blur', function () {
            var $this = $(this),
                value = $.trim($this.val()),
                showValue = value === '' ? '<a href="javascript:">添加</a>' : value,
                $parentTd = $this.parent(),
                account = $parentTd.data('account'),
                env = $parentTd.data('env'),
                envData = autoLoginHelper.accounts[env];

            envData && envData[account] && (envData[account]['comment'] = value);

            $parentTd.replaceWith($('<td class="add-comment"  data-account="' + account + '" data-env="' + env + '">' + showValue + '</td>'));

            //同步到chrome.storage
            chrome.storage.sync.set({
                accounts: autoLoginHelper.accounts
            });
        });

        $accountWrapper.delegate('.comment-input', 'keyup', function (e) {
            if (e.keyCode == 13) {
                $(this).trigger('blur');
            }
        });

        $('#defaultPwd').blur(function() {
            var $this = $(this);

            autoLoginHelper.accounts.defaultPwd = $this.val();

            chrome.storage.sync.set({
                accounts: autoLoginHelper.accounts
            }, function() {
                $this.addClass('green-border');
                setTimeout(function() {
                    $this.removeClass('green-border');
                }, 500);
            });

        }).keyup(function(e) {
                if(e.keyCode === 13) {
                    $(this).trigger('blur');
                }
            });

        $('#reset').click(function() {
            if(confirm('您确认要重置小助手吗？所有的数据将会被删除。')) {
                chrome.storage.sync.remove('accounts');
                window.location.reload();
            }
        });
    },

    init: function () {
        this.getAccount();
        this.bindEvent();
    }
};
$(function () {
    autoLoginHelper.init();
});

