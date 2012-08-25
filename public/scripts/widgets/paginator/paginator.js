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

        var params = {};
        params[options.totalCountName] = 0;
        params[options.pageNoName] = 0;
        this.render(params);
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
            this.$pageNoList =$pg.find('.numList');
            this.$pageSizeList = $pg.find('.pageSize select');

            var $pageSizeList = this.$pageSizeList;
            $.each(opts.pageSizeList, function(index, item){
                var $option = $('<option></option>')
                    .prop('value',item)
                    .text($thisObject.formatString(opts.pageSizeText,[item]));
                $pageSizeList.append($option);
            });
            $pageSizeList.on('change', function(){
                $thisObject.onLoad();
            });
        },

        render: function(params){
            var $thisObject = this;
            var opts = this.opts;
            var $pg = this.$pg;
            var $totalCountText = this.$totalCountText;
            var $pageNoList = this.$pageNoList;
            var $pageSizeList = this.$pageSizeList;

            if(params[opts.totalCountName] >= 0){
                $pg.data('totalCount', params[opts.totalCountName]);
            }


            if(params[opts.pageNoName]){
                $pg.data('pageNo', params[opts.pageNoName]);
            }
            if(params[opts.pageSizeName]){
                $pg.data('pageSize', params[opts.pageSizeName]);
            }
            $totalCountText.text($thisObject.formatString(opts.totalCountText, [$pg.data('totalCount')]));
            $pageSizeList.val($pg.data('pageSize'));
            $pageNoList.empty();

            if(opts.style === 'plain'){
                this.plain($pg.data('pageNo'), $pg.data('totalCount'), $pageSizeList.val());
            }else if(opts.style === 'search'){
                this.search($pg.data('pageNo'), $pg.data('totalCount'), $pageSizeList.val());
            }
        },

        onLoad: function(){
            var opts = this.opts;
            var $pg = this.$pg;
            var $pageSizeList = this.$pageSizeList;
            opts.onLoad(this,$pg.data('pageNo'),$pageSizeList.val());
        },

        search: function(pageNo, totalCount, pageSize){
            var $thisObject = this;
            var opts = this.opts;
            var $pg = this.$pg;
            var $pageNoList = this.$pageNoList;

            var totalPage = totalCount % pageSize === 0 ? parseInt(totalCount/pageSize) : parseInt(totalCount/pageSize) + 1;
            totalPage = totalPage ? totalPage : 0;
            if(totalPage === 0){
                pageNo = 0;
            }else if(pageNo > totalPage){
                pageNo = totalPage;
            }

            var $head = $('<li><a title="首页">&nbsp</a></li>');
            if(pageNo<=1){
                $head.find('a').addClass('grayhead');
            }else{
                $head.find('a').addClass('head').on('click', function(e){
                    e.preventDefault();
                    $pg.data('pageNo', 1);
                    $thisObject.onLoad();
                });
            }
            $pageNoList.append($head);


            var $prev = $('<li><a title="上一页">&nbsp</a></li>');
            if(pageNo<=1){
                $prev.find('a').addClass('grayprev');
            }else{
                $prev.find('a').addClass('prev').on('click', function(e){
                    e.preventDefault();
                    $pg.data('pageNo', pageNo-1);
                    $thisObject.onLoad();
                });
            }
            $pageNoList.append($prev);

            var $input = $('<li>第<input><div class="pageNo"></div></li>');
            $input.find('input').val(pageNo).on('keydown',function(e){
                if(e.keyCode === 13){
                    if(/^[0-9]*[1-9][0-9]*$/.exec($(this).val())){
                        var val = parseInt($(this).val(),10);
                        if(val<= totalPage ){
                            $pg.data('pageNo', val);
                            $thisObject.onLoad();
                        }
                    }
                }
            });
            $input.find('.pageNo').html($thisObject.formatString('页/共{0}页',['<strong>'+totalPage+'</strong>']));
            $pageNoList.append($input);

            var $next = $('<li><a title="下一页">&nbsp</a></li>');
            if(pageNo>=totalPage){
                $next.find('a').addClass('graynext');
            }else{
                $next.find('a').addClass('next').on('click', function(e){
                    e.preventDefault();
                    $pg.data('pageNo', pageNo+1);
                    $thisObject.onLoad();
                });
            }
            $pageNoList.append($next);

            var $tail = $('<li><a title="尾页">&nbsp</a></li>');
            if(pageNo>=totalPage){
                $tail.find('a').addClass('graytail');
            }else{
                $tail.find('a').addClass('tail').on('click', function(e){
                    e.preventDefault();
                    $pg.data('pageNo', totalPage);
                    $thisObject.onLoad();
                });
            }
            $pageNoList.append($tail);
        },

        plain: function(pageNo, totalCount, pageSize){
            var $thisObject = this;
            var opts = this.opts;
            var $pg = this.$pg;
            var $pageNoList = this.$pageNoList;

            var totalPage = totalCount % pageSize === 0 ? parseInt(totalCount/pageSize) : parseInt(totalCount/pageSize) + 1;
            totalPage = totalPage ? totalPage : 0;
            if(totalPage === 0){
                pageNo = 0;
            }else if(pageNo > totalPage){
                pageNo = totalPage;
            }else if(pageNo < 1 && totalPage != 0){
                pageNo = 1;
            }
            //
            var $prev = $('<li><a title="上一页">&nbsp</a></li>');
            if(pageNo<=1){
                $prev.find('a').addClass('grayprev');
            }else{
                $prev.find('a').addClass('prev').on('click', function(e){
                    e.preventDefault();
                    $pg.data('pageNo', pageNo-1);
                    $thisObject.onLoad();
                });
            }
            $pageNoList.append($prev);
            /////
            var list = [1];
            for(var i= 0; i < 5; i++){
                var no = pageNo - 2 + i;

                if(i==0 && no > 3){
                    list.push('...');
                }
                if(no > 1 && no <= totalPage-1){
                    list.push(no);
                }
            }

            if(pageNo+2 < totalPage-1){
                list.push('...');
            }
            if(totalPage>1){
                list.push(totalPage);
            }

            $.each(list, function(index, item){
                var $li = $('<li><a></a></li>');
                if(item === '...'){
                    $li.find('a').addClass('skip').text('...');
                }else if(item === pageNo){
                    $li.find('a').addClass('current').text(item);
                }else{
                    $li.find('a').text(item).prop('title','第'+item+'页').on('click', function(e){
                        e.preventDefault();
                        $pg.data('pageNo', item);
                        $thisObject.onLoad();
                    });
                }
                $pageNoList.append($li);
            });

            //
            var $next = $('<li><a title="下一页">&nbsp</a></li>');
            if(pageNo>=totalPage){
                $next.find('a').addClass('graynext');
            }else{
                $next.find('a').addClass('next').on('click', function(e){
                    e.preventDefault();
                    $pg.data('pageNo', pageNo+1);
                    $thisObject.onLoad();
                });
            }
            $pageNoList.append($next);


        },

        formatString:function(text,args){
            return text.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined'
                    ? args[number]
                    : match
                    ;
            });
        },

        option: function(options){
            if(options){
                this.opts = $.extend(this.opts, options);
            }else{
                return this.opts;
            }

        },

        pageNo: function(){
            return this.$pg.data('pageNo')
        },
        pageSize: function(){
            return this.$pageSizeList.val();
        }
    };

    $.fn.paginator = function (option, val) {
        if(typeof option === 'string'){
            return $(this).data('paginator')[option](val);
        }
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('paginator')
                , options = $.extend({}, $.fn.paginator.defaults, typeof option == 'object' && option);
            if (!data) $this.data('paginator', (data = new Paginator(this, options)))
        });
    };
    $.fn.paginator.defaults = {
        style: 'plain',// and search
        totalCountName: 'totalCount',
        pageNoName: 'pageNo',
        pageSizeName: 'pageSize',
        pageSizeText: '每页{0}条',
        totalCountText: '共{0}条记录',
        pageSizeList: [15, 30, 50],
        onLoad: function($pg, pageNo, pageSize){
            console.log('pageNo: %s', pageNo);
            console.log('size: %s', pageSize);
        }

    };

    $.fn.paginator.Constructor = Paginator;
}(window.jQuery);