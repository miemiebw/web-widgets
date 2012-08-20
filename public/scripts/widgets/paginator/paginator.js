/**
 * User: miemiebw
 * Date: 12-8-19
 * Time: 下午3:25
 */
!function () {

    var Paginator = function (element, options) {
        var $thisObject = this;
        var $pg = $(element);
        $thisObject.$pg = $pg;
        $thisObject.opts = options;

        this.init();
        this.render({
            pageNo: options.pageNo,
            totalCount: options.totalCount,
            size: options.size
        });
    };

    Paginator.prototype = {

        init: function(){
            var $thisObject = this;
            var $pg = this.$pg;
            var opts = this.opts;

            $pg.addClass('paginator');

            var $content = $('<span class="totalCountText"></span>' +
                '<ul class="numList"></ul>' +
                '<div class="pageSize"><select></select></div>'
            );
            $pg.append($content);

            this.$totalCountText = $pg.find('.totalCountText');
            this.$numList =$pg.find('.numList');
            this.$sizeList = $pg.find('.pageSize select');

            var $sizeList = this.$sizeList;
            $.each(opts.sizeList, function(index, item){
                var $option = $('<option></option>')
                    .prop('value',item)
                    .text($thisObject.formatString(opts.sizeText,[item]));

                if(item === opts.size){
                    $option.prop('selected','selected');
                }

                $sizeList.append($option);
            });
        },

        render: function(params){
            var $thisObject = this;
            var opts = this.opts;
            var $totalCountText = this.$totalCountText;
            var $numList = this.$numList;
            var $sizeList = this.$sizeList;

            $totalCountText.text($thisObject.formatString(opts.totalCountText,[params.totalCount]));
            $sizeList.val(params.size);

            if(opts.style === 'plain'){
                this.plain(params.pageNo, params.totalCount, params.size);
            }else if(opts.style === 'search'){
                this.search(params.pageNo, params.totalCount, params.size);
            }
        },

        plain: function(pageNo, totalCount, size){
            var $thisObject = this;
            var $numList = this.$numList;
            var $head = $('<li><a>&nbsp</a></li>');
            if(pageNo<=1){
                $head.find('a').addClass('grayhead');
            }else{
                $head.find('a').addClass('head');
            }
            $numList.append($head);

            var $prev = $('<li><a>&nbsp</a></li>');
            if(pageNo<=1){
                $prev.find('a').addClass('grayprev');
            }else{
                $prev.find('a').addClass('prev');
            }
            $numList.append($prev);

            var $input = $('<li>第<input><div class="pageNo"></div></li>');
            $input.find('input').val(pageNo);
            var totalPage = totalCount % size === 0 ? parseInt(totalCount/size) : parseInt(totalCount/size) + 1;
            $input.find('.pageNo').html($thisObject.formatString('页/共{0}页',['<strong>'+totalPage+'</strong>']));
            $numList.append($input);

            var $next = $('<li><a>&nbsp</a></li>');
            if(pageNo>=totalPage){
                $next.find('a').addClass('graynext');
            }else{
                $next.find('a').addClass('next');
            }
            $numList.append($next);

            var $tail = $('<li><a>&nbsp</a></li>');
            if(pageNo>=totalPage){
                $tail.find('a').addClass('graytail');
            }else{
                $tail.find('a').addClass('tail');
            }
            $numList.append($tail);
        },

        search: function(pageNo, totalCount, size){
            if(!pageNo || !totalCount || !size){
                return;
            }
        },

        formatString:function(text,args){
            return text.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined'
                    ? args[number]
                    : match
                    ;
            });
        }
    };

    $.fn.paginator = function (option) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('paginator')
                , options = $.extend({}, $.fn.paginator.defaults, typeof option == 'object' && option);
            if (!data) $this.data('paginator', (data = new Paginator(this, options)))
        });
    };
    $.fn.paginator.defaults = {
        sizeText: '每页{0}条',
        totalCountText: '共{0}条记录',
        style: 'plain',// and search
        size: 15,
        totalCount: 0,
        pageNo: 0,
        sizeList: [15, 30, 50],
        onLoad: function(pageNo, size){}

    };

    $.fn.paginator.Constructor = Paginator;
}(window.jQuery);