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
            pageSize: options.pageSize
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

                if(item === opts.pageSize){
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
            if( params.pageNo && params.totalCount &&  params.pageSize){
                $sizeList.one('change',function(){
                    opts.onLoad(params.pageNo,$sizeList.val());
                });
            }
            $numList.empty();
            if(opts.style === 'plain'){
                this.plain(params.pageNo, params.totalCount, $sizeList.val());
            }else if(opts.style === 'search'){
                this.search(params.pageNo, params.totalCount, $sizeList.val());
            }
        },

        search: function(pageNo, totalCount, pageSize){
            var $thisObject = this;
            var opts = this.opts;
            var $numList = this.$numList;

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
                    opts.onLoad(1,pageSize);
                });
            }
            $numList.append($head);

            var $prev = $('<li><a title="上一页">&nbsp</a></li>');
            if(pageNo<=1){
                $prev.find('a').addClass('grayprev');
            }else{
                $prev.find('a').addClass('prev').on('click', function(e){
                    e.preventDefault();
                    opts.onLoad(pageNo-1,pageSize);
                });
            }
            $numList.append($prev);
            //计算总页数

            var $input = $('<li>第<input><div class="pageNo"></div></li>');
            $input.find('input').val(pageNo).on('keydown',function(e){
                if(e.keyCode === 13){
                    if(/^[0-9]*[1-9][0-9]*$/.exec($(this).val())){
                        var val = parseInt($(this).val(),10);
                        if(val<= totalPage ){
                            opts.onLoad(val,pageSize);
                        }
                    }
                }
            });

            $input.find('.pageNo').html($thisObject.formatString('页/共{0}页',['<strong>'+totalPage+'</strong>']));
            $numList.append($input);

            var $next = $('<li><a title="下一页">&nbsp</a></li>');
            if(pageNo>=totalPage){
                $next.find('a').addClass('graynext');
            }else{
                $next.find('a').addClass('next').on('click', function(e){
                    e.preventDefault();
                    opts.onLoad(pageNo+1,pageSize);
                });
            }
            $numList.append($next);

            var $tail = $('<li><a title="尾页">&nbsp</a></li>');
            if(pageNo>=totalPage){
                $tail.find('a').addClass('graytail');
            }else{
                $tail.find('a').addClass('tail').on('click', function(e){
                    e.preventDefault();
                    opts.onLoad(totalPage,pageSize);
                });;
            }
            $numList.append($tail);
        },

        plain: function(pageNo, totalCount, pageSize){
            var $thisObject = this;
            var opts = this.opts;
            var $numList = this.$numList;

            var totalPage = totalCount % pageSize === 0 ? parseInt(totalCount/pageSize) : parseInt(totalCount/pageSize) + 1;
            totalPage = totalPage ? totalPage : 0;
            if(totalPage === 0){
                pageNo = 0;
            }else if(pageNo > totalPage){
                pageNo = totalPage;
            }else if(pageNo < 1 && totalPage != 0){
                pageNo = 1;
            }

            var $prev = $('<li><a title="上一页">&nbsp</a></li>');
            if(pageNo<=1){
                $prev.find('a').addClass('grayprev');
            }else{
                $prev.find('a').addClass('prev').on('click', function(e){
                    e.preventDefault();
                    opts.onLoad(pageNo-1,pageSize);
                });
            }
            $numList.append($prev);

            var list = [1];
            var left = pageNo-2;
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
                        opts.onLoad(item, pageSize);
                    });
                }
                $numList.append($li);
            });

            var $next = $('<li><a title="下一页">&nbsp</a></li>');
            if(pageNo>=totalPage){
                $next.find('a').addClass('graynext');
            }else{
                $next.find('a').addClass('next').on('click', function(e){
                    e.preventDefault();
                    opts.onLoad(pageNo+1,pageSize);
                });
            }
            $numList.append($next);
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
        sizeText: '每页{0}条',
        totalCountText: '共{0}条记录',
        style: 'plain',// and search
        pageSize: 15,
        totalCount: 0,
        pageNo: 0,
        sizeList: [15, 30, 50],
        onLoad: function(pageNo, pageSize){
            console.log('pageNo: %s', pageNo);
            console.log('size: %s', pageSize);
        }

    };

    $.fn.paginator.Constructor = Paginator;
}(window.jQuery);