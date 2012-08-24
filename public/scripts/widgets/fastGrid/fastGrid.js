/**
 * User: meimeibw
 * Date: 12-8-9
 * Time: 下午2:03
 */

!function(){
    var FastGrid = function(element, options){
        var $el = $(element);
        this.opts = options;

        this.initLayout($el);
        this.initEvents();
        this.initHead();
        this.initOption();
        if(this.opts.autoLoad){
            this.load();
        }else{
            this.calcLayout();
        }
    };

    FastGrid.prototype = {
        isInit: false,
        initLayout: function($el){
            var $elParent = $el.parent();
            var elIndex = $el.index();
            $el.detach();
            var fastGrid = [
                '<div class="fastGrid">',
                    '<div class="headWrapper">',
                        '<table class="head">',
                        '</table>',
                        '<div class="resizePosition"></div>',
                    '</div>',
                    '<div class="optWrapper"></div>',
                    '<div class="bodyWrapper">',

                    '</div>',
                    '<div class="mask transparent">',
                    '</div>',
                    '<div class="loadingWrapper">',
                        '<div class="loading"></div>',
                        '<p>'+ this.opts.loadingText +'</p>',
                    '</div>',
                    '<span class="noData">'+ this.opts.noDataText +'</span>',
                '</div>'
            ];

            //cached object
            var $fastGrid = $(fastGrid.join(''));
            this.$fastGrid = $fastGrid;
            this.$headWrapper = $fastGrid.find('.headWrapper');
            this.$head = $fastGrid.find('.head');
            this.$optWrapper = $fastGrid.find('.optWrapper');
            this.$bodyWrapper = $fastGrid.find('.bodyWrapper');
            this.$body = $el.addClass('body').empty().html('<tbody></tbody>').appendTo(this.$bodyWrapper);

            //放回原位置
            if(elIndex === 0 && $elParent.children().length == 0){
                $elParent.append(this.$fastGrid);
            }else{
                $elParent.children().eq(elIndex).before(this.$fastGrid);
            }
        },


        initEvents: function(){
            var $thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;
            var $optWrapper = this.$optWrapper;
            var $ths = this.$ths;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;

            if((typeof opts.width === 'string' && opts.width.indexOf('%') === opts.width.length-1) ||
                typeof opts.height === 'string' && opts.height.indexOf('%') === opts.height.length-1){
                $(window).on('resize', function(){
                    $thisObject.calcLayout();
                });
            }

            //滚动条事件
            $bodyWrapper.on('scroll', function(e){
                $head.css('left',- $(this).scrollLeft());
            });

            //选中事件
            var $body = this.$body;
            $body.on('click','td',function(e){
                var $this = $(this);
                if(!$this.parent().hasClass('selected')){
                    $thisObject.select($this.parent().index());
                }else{
                    $thisObject.deselect($this.parent().index());
                }
                opts.onSelected($.data($this.parent()[0], 'item'), $this.parent().index(), $this.index());
            });
            //IE6不支持hover
            if ($.browser.msie) {
                if ($.browser.version == "6.0"){
                    $body.find('tbody').on('hover','tr', function (e) {
                        $(this).toggleClass('hover', e.type === 'mouseenter');
                    });
                };
            }

            //绑定排序事件
            $head.on('click','span.title', function(e){
                e.preventDefault();
                var $this = $(this);
                var $titles = $head.find('span.title');
                var colIndex = $titles.index($this);
                if(!opts.cols[colIndex].sortable){
                    return;
                }

                $.each($titles,function(index, item){
                    if(index != colIndex){
                        $.removeData(this,'sortStatus');
                    }
                });

                $thisObject.prepareWrapper();

                $head.find('.sortStatus').removeClass('asc').removeClass('desc');
                var $sorter = $this.siblings('.sortStatus');
                var sortStatus = $.data(this, 'sortStatus') === 'asc' ? 'desc' : 'asc';
                $.data(this, 'sortStatus', sortStatus);
                $sorter.addClass(sortStatus);

                if(opts.remoteSort){
                    //服务器端排序
                    $thisObject.remoteSorter(colIndex, sortStatus);
                }else{
                    //本地排序
                    $thisObject.nativeSorter(colIndex, sortStatus);
                }


                $thisObject.alignColumn(colIndex);
                $thisObject.setStyle();
                $thisObject.calcLayout();
            }).on('mousedown', 'div.resize', function(e){
                //绑定调整列宽事件
                var $resize = $(this);
                var start = e.pageX;;
                var $resizePosition = $headWrapper.find('div.resizePosition')
                    .css('left', e.pageX - $headWrapper.offset().left).show();
                document.body.onselectstart = function(){
                    return false;//取消文字选择
                }
                $headWrapper.css('-moz-user-select','none');
                $headWrapper.on('mousemove', function(e){
                    $resizePosition.css('left', e.pageX - $headWrapper.offset().left);
                }).on('mouseup', function(e){
                        //改变宽度
                        $thisObject.prepareWrapper();
                        $resize.parent().parent().width($resize.parent().width() + e.pageX - start);
                        $thisObject.alignColumn($resize.parent().parent().index());
                        $thisObject.calcLayout();

                        $headWrapper.mouseleave();
                    }).on('mouseleave',function(e){
                        $headWrapper.off('mouseup').off('mouseleave').off('mousemove');
                        $resizePosition.hide();
                        document.body.onselectstart = function(){
                            return true;//开启文字选择
                        }
                        $headWrapper.css('-moz-user-select','text');
                    });
            });


        },

        initHead: function(){
            var opts = this.opts;
            var $head = this.$head;

            var $tr = $('<tr></tr>');
            if(opts.cols){
                $.each(opts.cols, function(colIndex, col){
                    var $th = $('<th><div class="content"><span class="title"></span><div class="resize"></div></div></th>').width(col.width);

                    if(col.hidden === true) $th.hide();
                    if(col.align) $th.find('div.content').css('text-align', col.align);
                    if(col.title) $th.find('span.title').html(col.title);
                    if(col.sortable){
                        $th.find('div.content').append($('<div class="sortStatus"></div>'));
                        $th.find('span.title').css({
                            'cursor':'pointer',
                            'text-decoration': 'underline'
                        });
                        //设置初始化排序状态
                        if(opts.sortName && col.name === opts.sortName){
                            $th.find('span.title').data('sortStatus',opts.sortStatus);
                            $th.find('div.sortStatus').addClass(opts.sortStatus);
                        }
                    }

                    $tr.append($th);
                });
            }
            this.$ths = $tr.find('th');
            $head.append($('<thead></thead>').append($tr));
        },

        initOption: function(){
            var $thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;
            var $optWrapper = this.$optWrapper;
            var $ths = this.$ths;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;
            var $noData = $fastGrid.find('.noData');

            $optWrapper.detach();
            //向下按钮
            var $optDnButton = $('<a class="optDnButton"></a>').on('click', function(e){
                e.preventDefault();
                $noData.hide();
                $(this).slideUp('fast');
                $optWrapper.css({
                    width:$bodyWrapper.outerWidth(true),
                    height:$bodyWrapper.outerHeight(true)
                }).slideDown();
            }).on('mouseleave', function(){
                    $optDnButton.slideUp('fast');
                }).css({
                    'top': $headWrapper.outerHeight(true),
                    'right': 20
                }).appendTo($fastGrid);

            $bodyWrapper.on('mouseenter', function(){
                $optDnButton.slideUp('fast');
            });
            $fastGrid.on('mouseleave', function(){
                $optDnButton.slideUp('fast');
            });
            $headWrapper.on('mouseenter',function(){
                if($optWrapper.is(':hidden')){
                    $optDnButton.slideDown('fast');
                }
            });

            //向上按钮
            var $optUpButton = $('<a class="optUpButton"></a>').on('click', function(e){
                e.preventDefault();
                $optWrapper.slideUp().queue(function(next){
                    if(!$noData.data('hasData')){
                        $noData.show();
                    }
                    next();
                });
            }).appendTo($optWrapper);

            if(opts.cols){
                var $h1 = $('<h1></h1>').text('显示列').appendTo($optWrapper);
                $.each(opts.cols, function(index, col){
                    var $checkBox = $('<input type="checkbox" />');
                    if(!col.hidden || col.hidden === false){
                        $checkBox.prop("checked", true);
                    }
                    $optWrapper.append(
                        $('<label></label>').append($checkBox)
                            .append($('<span></span>').text(col.title))
                    );
                });
            }

            $optWrapper.on('click', ':checkbox', function(e){
                $thisObject.prepareWrapper();
                var index = $optWrapper.find('label').index($(this).parent());
                if(this.checked){
                    var $th = $ths.eq(index).show();
                    $body.find('tr > td:nth-child('+(index+1)+')').show();
                    $thisObject.alignColumn(index);
                }else{
                    $ths.eq(index).hide();
                    $body.find('tr > td:nth-child('+(index+1)+')').hide();
                }
                $thisObject.calcLayout();
            });
            //放到headWrapper之后
            $headWrapper.after($optWrapper);

        },

        load: function(args){
            var $thisObject = this;
            var opts = this.opts;

            var items = args;
            if($.isPlainObject(args) && $.isArray(args[opts.root])){
                items = args[opts.root];
            }
            if(opts.url && !$.isArray(items)){
                $thisObject.loadAjax(args);
            }else{
                if(!items){
                    items = opts.items;
                }
                $thisObject.loadNative(items);
                if(opts.onSuccess){
                    opts.onSuccess($thisObject, args);
                }
            }
        },
        loadAjax: function(args){
            var $thisObject = this;
            var opts = this.opts;

            var $fastGrid = this.$fastGrid;
            $fastGrid.find('.mask').show();
            $fastGrid.find('.loadingWrapper').show();
            var params = {};
            if(opts.remoteSort){
                //获得当前排序状态
                var $ths = this.$ths;
                var sortName = '';
                var sortStatus = '';
                $ths.find('.title').each(function(index, item){
                    var status = $.data(item, 'sortStatus');
                    if(status){
                        sortName = opts.cols[index].name;
                        sortStatus = status;
                    }
                });

                params = {
                    sortName: sortName,
                    sortStatus: sortStatus
                };
            }
            //
            if($.isFunction(opts.params)){
                params = $.extend(params, opts.params());
            }else if($.isPlainObject()){
                params = $.extend(params, opts.params);
            }
            params = $.extend(params, args);
            $.ajax({
                type: opts.method,
                url: opts.url,
                data: params,
                dataType: 'json',
                cache: false
            }).done(function(data){
                    var items = data;
                    if($.isArray(data[opts.root])){
                        items = data[opts.root];
                    }
                    if(opts.remoteSort){
                        $thisObject.populate(items);
                    }else{
                        $thisObject.loadNative(items);
                    }
                    if(opts.onSuccess){
                        opts.onSuccess($thisObject, data);
                    }
                }).fail(function(data){
                    if(opts.onError){
                        opts.onError($thisObject, data);
                    }
                    $fastGrid.find('.mask').hide();
                    $fastGrid.find('.loadingWrapper').hide();
                });
        },

        loadNative: function(items){
            var $thisObject = this;
            var opts = this.opts;


            $thisObject.populate(items);
            //排序滞后是因为排序的是显示值
            var $ths = this.$ths;
            var sortColIndex = -1;
            var sortStatus = '';
            $ths.find('.title').each(function(index, item){
                var status = $.data(item, 'sortStatus');
                if(status){
                    sortColIndex = index;
                    sortStatus = status;
                }
            });
            var sortStatus = sortStatus === 'desc' ? 'asc' : 'desc';
            if(sortColIndex >=0){
                $ths.eq(sortColIndex).find('.title').data('sortStatus',sortStatus).click();
            }
        },

        nativeSorter: function(colIndex, sortStatus){
            var col = this.opts.cols[colIndex];
            this.$body.find('tr > td:nth-child('+(colIndex+1)+')')
                .sortElements(function(a, b){
                    var av = $.text($(a));
                    var bv = $.text($(b));
                    //排序前转换
                    if(col.type === 'float'){
                        av = parseFloat(av);
                        bv = parseFloat(bv);
                    }else if(col.type === 'int'){
                        av = parseInt(av, 10);
                        bv = parseInt(bv, 10)
                    }
                    return av > bv ? (sortStatus === 'desc' ? -1 : 1) : (sortStatus === 'desc' ? 1 : -1);
                }, function(){
                    return this.parentNode;
                });
        },

        remoteSorter: function(colIndex, sortStatus){
            this.load();
        },

        populate: function(items){
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $head = this.$head;
            var $ths = this.$ths;
            var $body = this.$body;
            var $tbody = $body.find('tbody').detach().empty();

            $fastGrid.find('.mask').show();
            $fastGrid.find('.loadingWrapper').show();
            this.prepareWrapper();

            if(items  && items.length != 0 && opts.cols){
                $.data($fastGrid.find('.noData').hide()[0], 'hasData', true);
                $.each(items, function(rowIndex, item){

                    var $tr = $('<tr></tr>');
                    $.data($tr[0], 'item',item);
                    $.each(opts.cols, function(colIndex, col){

                        var $td = $('<td></td>').width($ths.eq(colIndex).width());
                        if($ths.eq(colIndex).is(':hidden')){
                            $td.hide();
                        }
                        if(col.align){
                            $td.css('text-align', col.align);
                        }
                        var $textWrap = $('<span></span>');
                        if(col.renderer){
                            var result = col.renderer(item[col.name], item, items, rowIndex, $tr[0]);
                            if(result instanceof jQuery){
                                $textWrap.append(result);
                            }else{
                                $textWrap[0].innerHTML = result;
                            }
                        }else{
                            $textWrap[0].innerHTML = item[col.name];
                        }

                        $tr.append($td.append($textWrap));

                    });
                    $tbody.append($tr);
                });
                if(opts.nowrap){
                    $tbody.find('td').addClass('nowrap').find('> span').addClass('nowrap');
                }
            }else{
                $.data($fastGrid.find('.noData').show()[0], 'hasData', false);

                var $td = $('<td></td>').css({
                    'border':'0px',
                    'background': 'none'
                }).html('&nbsp;');
                $tbody.append($('<tr></tr>').append($td));
            }
            $body.append($tbody);

            this.setStyle();
            if((opts.scroll === 'hidden' || opts.scroll === 'vertical') && !this.isInit){

            }else{
                this.alignColumn();
            }

            this.calcLayout();
            $fastGrid.find('.mask').hide();
            $fastGrid.find('.loadingWrapper').hide();
        },



        setStyle: function(){
            var opts = this.opts;
            var $head = this.$head;
            var $ths = this.$ths;
            var $body = this.$body;
            var $tbody = $body.find('tbody');

            //head
            $ths.eq(0).addClass('first');
            $ths.eq(-1).addClass('last');
            //body
            $tbody.find('tr,td').removeClass('even')
                .removeClass('colSelected').removeClass('colSelectedEven');

            $tbody.find('tr:odd').addClass('even');

            var sortIndex = $head.find('span.title').index($head.find('span.title').filter(function(){
                return $.data(this,'sortStatus') === 'asc' || $(this).data('sortStatus') === 'desc';
            }));

            $tbody.find('tr > td:nth-child('+(sortIndex+1)+')').addClass('colSelected')
                .filter(':odd').addClass('colSelectedEven');

        },

        prepareWrapper: function(){
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;

            $headWrapper.width(9999);
            $bodyWrapper.width(9999);
            $head.width('auto');//使其可以自由伸展
            $body.width('auto');

        },

        alignColumn: function(colIndex){
            var $ths = this.$ths;
            var $body = this.$body;
            var $tbody = $body.find('tbody');

            if(colIndex >= 0){
                var $th = $ths.eq(colIndex);
                $tbody.find('tr > td:nth-child('+(colIndex+1)+')').width($th.width()).css('max-width',$th.width());

            }else{
                $.each($ths, function(index){
                    var $th = $ths.eq(index);
                    $tbody.find('tr > td:nth-child('+(index+1)+')').width($th.width()).css('max-width',$th.width());

                });
            }
        },

        calcLayout: function(){
            var $thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;
            var $optWrapper = this.$optWrapper;
            var $ths = this.$ths;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;

            //设置高宽
            $fastGrid.width(opts.width);
            $fastGrid.height(opts.height);

            if(!opts.frame){
                //计算边距
                var fgWBP = parseInt($fastGrid.css('border-left-width'),10)
                    + parseInt($fastGrid.css('border-right-width'),10)
                    + parseInt($fastGrid.css('padding-left'),10)
                    + parseInt($fastGrid.css('padding-right'),10);
                $fastGrid.width($fastGrid.width() - fgWBP);

                var fgHBP = parseInt($fastGrid.css('border-top-width'),10)
                    + parseInt($fastGrid.css('border-bottom-width'),10)
                    + parseInt($fastGrid.css('padding-top'),10)
                    + parseInt($fastGrid.css('padding-bottom'),10);
                $fastGrid.height($fastGrid.height() - fgHBP);
            }

            //表内容高
            if(opts.scroll === 'hidden' || opts.scroll === 'horizontal'){
                $fastGrid.height('auto');
                $bodyWrapper.height('auto');
            }else{
                $bodyWrapper.height($fastGrid.height() - $headWrapper.outerHeight(true));
            }


            //表头

            $head.width($head.width());
            $headWrapper.width($fastGrid.width());
            if((opts.scroll === 'hidden' || opts.scroll === 'vertical') && !this.isInit){
                var ua = navigator.userAgent.toLowerCase();
                var scrollW = 0;
                if(/windows nt/.test(ua)){
                    scrollW = 17;
                }

                if($body.height() <= $bodyWrapper.height()){
                    scrollW = 0;
                }

                var hww = $fastGrid.width() - scrollW;
                var hw = $head.width();
                var w = (hww - hw) /  $head.find('th:visible').length;
                this.prepareWrapper();
                $head.find('th:visible').each(function(i,item){
                    $(item).width($(item).width() + w);
                });
                var lastW = $fastGrid.width() - $head.width() - scrollW;
                console.log(lastW);
                $head.find('th:visible').eq(-1).width($head.find('th:visible').eq(-1).width() + lastW);
                $thisObject.alignColumn();
                $head.width($head.width());
                $headWrapper.width($fastGrid.width());
            }


            //表内容
            $body.width(0);
            $bodyWrapper.width($fastGrid.width());


            //调整滚动条
            $bodyWrapper.scrollLeft(-parseInt($head.css('left'),10));
            if($bodyWrapper.scrollLeft() === 0){
                $head.css('left', 0);
            }

            //IE8 bug
            $bodyWrapper.append($body);

            //遮罩
            $fastGrid.find('.mask').width($fastGrid.width())
                .height($fastGrid.height());

            //加载包装器位置
            var $loadingWrapper = $fastGrid.find('.loadingWrapper');
            $loadingWrapper.css({
                'left': ($fastGrid.width() - $loadingWrapper.width()) / 2,
                'top': ($fastGrid.height() - $loadingWrapper.height()) / 2
            });

            //无数据文字位置
            var $noData = $fastGrid.find('.noData');
            $noData.css({
                'left': ($fastGrid.width() - $noData.width()) / 2,
                'top': ($fastGrid.height() - $noData.height()) / 2
            });

            //选项包装器
            $optWrapper.css({
                width:$bodyWrapper.outerWidth(true),
                height:$bodyWrapper.outerHeight(true)
            });
            this.isInit = true;
        },


        //选中
        select: function(args){
            var opts = this.opts;
            var $body = this.$body;

            if(typeof args === 'number'){
                var $tr = $body.find('tr').eq(args);
                if(!opts.multiSelect){
                    $body.find('tr.selected').removeClass('selected');
                }
                if(!$tr.hasClass('selected')){
                    $tr.addClass('selected');
                }
            }else if(typeof args === 'function'){
                $.each($body.find('tr'), function(index, tr){
                    if(args($.data(this, 'item'))){
                        var $this = $(this);
                        if(!$this.hasClass('selected')){
                            $this.addClass('selected');
                        }
                    }
                });
            }else if(typeof args === 'string' && args === 'all'){
                $body.find('tr.selected').removeClass('selected');
                $body.find('tr').addClass('selected');
            }
        },
        //取消选中
        deselect: function(args){
            var opts = this.opts;
            var $body = this.$body;
            if(typeof args === 'number'){
                $body.find('tr').eq(args).removeClass('selected');
            }else if(typeof args === 'function'){
                $.each($body.find('tr'), function(index, tr){
                    if(args($.data(this, 'item'))){
                        $(this).removeClass('selected');
                    }
                });
            }else if(typeof args === 'string' && args === 'all'){
                $body.find('tr.selected').removeClass('selected');
            }
        },

        selected: function(){
            var $body = this.$body;
            var selected = [];
            $.each($body.find('tr.selected'), function(index ,item){
                selected.push($.data(this,'item'));
            });
            return selected;
        }

    };



    $.fn.fastGrid = function(option , val){
        if(typeof option === 'string'){
            return $(this).data('fastGrid')[option](val);
        }
        return this.each(function(){
            var $this = $(this)
                , data = $this.data('fastGrid')
                , options = $.extend({}, $.fn.fastGrid.defaults, typeof option == 'object' && option);
            if (!data) $this.data('fastGrid', (data = new FastGrid(this, options)))
        });
    };

    $.fn.fastGrid.defaults = {
        frame: false,
        width: '100%',
        height: '100%',
        url: false,
        params: {}, //可以是object也可以是function
        method: 'POST',
        items: [],
        root: '',
        scroll: 'both', //hidden, horizontal,vertical
        nowrap: false,
        multiSelect: false,
        loadingText: '正在载入...',
        noDataText: '没有数据',
        cols: [],
        sortName: '',
        sortStatus: 'asc',
        remoteSort: false,
        autoLoad: true,
        onSuccess: function(fastGrid, data){},
        onError: function(fastGrid, data){},
        onSelected: function(fastGrid, item, rowIndex, colIndex){}

    };

    $.fn.fastGrid.Constructor = FastGrid;


// Thanks for James Padolsey
// see: http://james.padolsey.com/javascript/sorting-elements-with-jquery/
    $.fn.sortElements = (function(){

        var sort = [].sort;

        return function(comparator, getSortable) {

            getSortable = getSortable || function(){return this;};

            var placements = this.map(function(){

                var sortElement = getSortable.call(this),
                    parentNode = sortElement.parentNode,

                // Since the element itself will change position, we have
                // to have some way of storing its original position in
                // the DOM. The easiest way is to have a 'flag' node:
                    nextSibling = parentNode.insertBefore(
                        document.createTextNode(''),
                        sortElement.nextSibling
                    );

                return function() {

                    if (parentNode === this) {
                        throw new Error(
                            "You can't sort elements if any one is a descendant of another."
                        );
                    }

                    // Insert before flag:
                    parentNode.insertBefore(this, nextSibling);
                    // Remove flag:
                    parentNode.removeChild(nextSibling);

                };

            });

            return sort.call(this, comparator).each(function(i){
                placements[i].call(getSortable.call(this));
            });

        };

    })();
}(window.jQuery);