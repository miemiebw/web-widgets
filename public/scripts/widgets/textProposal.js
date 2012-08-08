/* Author:
 miemeibw
 */

!function () {

    var TextProposal = function (element, options) {
        var textProposal = this;
        var $el = $(element);
        textProposal.$element = $el;
        textProposal.options = options;
        $el.wrap('<div class="textProposal"></div>');
        textProposal.$list = $('<dl class="list"></dl>')
            .appendTo($el.parent());

        textProposal.showHolder(true);
        $el.focus(function () {
            textProposal.hideHolder();
        });
        $el.blur(function () {
            textProposal.showHolder(false);
        });
        $el.keypress(function(e){
            if(e.keyCode==13|| e.which==13){
                return false;
            }
        });
        $el.keyup(function (e) {
            if(e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 13){
                textProposal._keyboardAction(e.keyCode);
                if(e.keyCode === 13 && textProposal.$list.is(':visible')){
                    return false;
                }
            }else{
                textProposal.showProposals($el.val());
            }

        });
        $('body').on('click',function(){
            textProposal.$list.hide();
        });
    };

    TextProposal.prototype = {
        showHolder:function (loading) {
            var $input = this.$element;
            if ($input.val() === '' || loading) {
                $input.addClass('showHolder').val(this.options.placeHolder);
            }
        },
        hideHolder:function () {
            var $input = this.$element;
            if ($input.val() === this.options.placeHolder) {
                $input.removeClass('showHolder').val('');
            }
        },

        showProposals:function (text) {
            console.dir(text);
            var $list = this.$list;
            var $input = this.$element;
            var opts = this.options;
            var $this = this;

            console.dir($input.css('margin-left'));
            //设置下拉位置
            $list.width($input.outerWidth(false))
                .css('top', $input.outerHeight(true))
                .css('left', $input.css('margin-left'));
            if (opts.items) {
                $this._prcessProposals(opts.items);
            } else if (opts.url) {
                var params = {
                    t: new Date()
                };
                params[opts.paramName] = $input.val();
                $.ajax({
                    url: opts.url,
                    data:params,
                    dataType: 'json',
                    type: 'post'
                }).done(function (items) {
                        $this._prcessProposals(items);
                    });
            }
        },
        _prcessProposals:function (items) {
            var $list = this.$list;
            var $input = this.$element;
            var opts = this.options;
            $list.empty().show();
            $.each(items, function (index, item) {
                var $li = $('<li></li>');
                var $a = $('<a></a>').data('item', item)
                    .text(opts.process(item))
                    .on('click', function (e) {
                        e.preventDefault();
                        var $this = $(this);
                        var item = $this.data('item');
                        $input.val(opts.process(item));
                        $list.hide();
                    })
                    .hover( function (e) {
                        $(this).toggleClass('selected', e.type === 'mouseenter');
                    });
                $li.append($a).appendTo($list);
            });
            if(opts.pageCount > 0){
                var count = opts.pageCount;
                if($('li',$list).length < opts.pageCount){
                    count = $('li',$list).length;
                }
                var ulminH = $('li',$list).eq(0).height() * count;
                $list.height(ulminH);
            }
        },
        //键盘操作列表
        _keyboardAction: function(key){
            var $list = this.$list;
            var $alist = $('a',$list);
            var index = $alist.index($('.selected',$list));
            $alist.removeClass('selected');
            if(key === 40){
                if(index < $alist.length -1){
                    index = index + 1;
                }
            }
            if(key === 38){
                if(index > 0){
                    index = index - 1;
                }
            }
            if(key === 13 && index>=0){
                $alist.eq(index).click();
            }
            $alist.eq(index).addClass('selected');
        }
    };

    $.fn.textProposal = function (option) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('textProposal')
                , options = $.extend({}, $.fn.textProposal.defaults, typeof option == 'object' && option);
            if (!data) $this.data('textProposal', (data = new TextProposal(this, options)))
        });
    };
    $.fn.textProposal.defaults = {
        placeHolder:'请输入...',
        url:null,
        paramName: 'p',
        items:null,
        startCharLength: 0,
        pageCount: 10,
        process:function (item) {
            return item;
        }
    };

    $.fn.textProposal.Constructor = TextProposal;
}(window.jQuery);