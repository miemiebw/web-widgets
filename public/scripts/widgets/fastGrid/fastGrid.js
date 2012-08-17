/**
 * User: meimeibw
 * Date: 12-8-9
 * Time: 下午2:03
 */

!function(){
    var FastGrid = function(element, options){
        var $el = $(element);
        this.opts = options;

        this.init($el);
        this.initHead();
        this.initOptBoard();
        if(this.opts.autoLoad){
            this.load();
        }
    };

    FastGrid.prototype = {

        init: function($el){
            var $elParent = $el.parent();
            var itemIndex = $el.index();
            $el.detach();
            var fastGrid = [
                '<div class="fastGrid">',
                    '<div class="headWrapper">',
                        '<table class="tableHead">',
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
                    '<span class="noRecord"></span>',
                '</div>'
            ];

            //cached object
            var $fastGrid = $(fastGrid.join(''));
            this.$fastGrid = $fastGrid;
            this.$headWrapper = $fastGrid.find('.headWrapper');
            this.$head = $fastGrid.find('.tableHead');
            this.$optWrapper = $fastGrid.find('.optWrapper');
            this.$bodyWrapper = $fastGrid.find('.bodyWrapper');
            this.$body = $el.addClass('tableBody').empty().html('<tbody></tbody>').appendTo(this.$bodyWrapper);

            //设置高宽
            if(this.opts.width === '100%'){
                this.$fastGrid.css('width' , '100%');
            }else{
                this.$fastGrid.width(this.opts.width)
            }
            if(this.opts.height === '100%'){
                this.$fastGrid.css('height' , '100%');
            }else{
                this.$fastGrid.height(this.opts.height)
            }



            //
            $elParent.children().eq(itemIndex).before(this.$fastGrid);

            //loading
            $fastGrid.find('.mask').width($fastGrid.width())
                .height($fastGrid.height());

            var $loadingWrapper = $fastGrid.find('.loadingWrapper');
            $loadingWrapper.css({
                'left': ($fastGrid.width() - $loadingWrapper.width()) / 2,
                'top': ($fastGrid.height() - $loadingWrapper.height()) / 2
            });

            //没数据
            var $noRecord = $fastGrid.find('.noRecord').html(this.opts.noRecordText)
            $noRecord.css({
                'left': ($fastGrid.width() - $noRecord.width()) / 2,
                'top': ($fastGrid.height() - $noRecord.height()) / 2
            });

            //滚动条事件
            var $head = this.$head;
            this.$bodyWrapper.on('scroll', function(e){
                $head.css('left',- $(this).scrollLeft());
            });
        },

        initHead: function(){
            var $thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;

            var $tr = $('<tr></tr>');
            if(opts.cols){
                $.each(opts.cols, function(colIndex, col){

                    var $th = $('<th><div class="resize"></div><div class="content"><span class="title"></span></div></th>').width(col.width);
                    if(col.hidden === true){
                        $th.hide();
                    }

                    if(col.align){
                        $th.find('div.content').css('text-align', col.align);
                    }

                    if(col.title){
                        $th.find('span.title').html(col.title);
                    }

                    if(col.sortable){
                        $th.find('div.content').append($('<div class="sortStatus"></div>'));
                        $th.find('span.title').css({
                            'cursor':'pointer',
                            'text-decoration': 'underline'
                        });
                    }
                    //调整列宽
                    $th.append($('<div class="resize"></div>'));

                    $tr.append($th);
                });
            }
            this.$ths = $tr.find('th');
            $head.append($('<thead></thead>').append($tr));

            //绑定排序事件
            $tr.on('click','span.title', function(e){
                e.preventDefault();
                var $this = $(this);
                var $titles = $tr.find('span.title');
                var colIndex = $titles.index($this);
                if(!opts.cols[colIndex].sortable){
                    return;
                }

                $.each($titles,function(index, item){
                    if(index != colIndex){
                        $.removeData(this,'sortStatus');
                    }
                });

                $thisObject.startLayout(true);

                $tr.find('.sortStatus').removeClass('asc').removeClass('desc');
                var $sorter = $this.siblings('.sortStatus');
                var sortStatus = $.data(this, 'sortStatus') === 'asc' ? 'desc' : 'asc';
                $.data(this, 'sortStatus', sortStatus);
                $sorter.addClass(sortStatus);

                if(opts.remoteSort){
                    //服务器端排序
                    $thisObject.remoteSorter(colIndex, sortStatus);
                }else{
                    //本地排序
                    $fastGrid.find('.mask').show();
                    $fastGrid.find('.loadingWrapper').show();
                    $thisObject.nativeSorter(colIndex, sortStatus);
                    $fastGrid.find('.mask').hide();
                    $fastGrid.find('.loadingWrapper').hide();
                }


                $thisObject.fixLayout(colIndex);
                $thisObject.setStyle();
                $thisObject.endLayout(true);
            }).on('mousedown', 'div.resize', function(e){
                //绑定调整列宽事件
                var $resize = $(this);
                var start = e.pageX;;
                var $resizePosition = $headWrapper.find('div.resizePosition')
                    .css('left', e.pageX - $headWrapper.offset().left).show();
                document.body.onselectstart = function(){
                    return false;//取消文字选择
                }
                $headWrapper.on('mousemove', function(e){
                    $resizePosition.css('left', e.pageX - $headWrapper.offset().left);
                }).on('mouseup', function(e){
                    //改变宽度
                    $thisObject.startLayout();
                    $resize.parent().width($resize.parent().width() + e.pageX - start);
                    $thisObject.fixLayout($resize.parent().index());
                    $thisObject.endLayout();

                    $headWrapper.mouseleave();
                }).on('mouseleave',function(e){
                    $headWrapper.off('mouseup').off('mouseleave').off('mousemove');
                    $resizePosition.hide();
                    document.body.onselectstart = function(){
                        return true;//开启文字选择
                    }
                });
            });

        },

        initOptBoard: function(){
            var $thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;
            var $optWrapper = this.$optWrapper;
            var $ths = this.$ths;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;
            var $noRecord = $fastGrid.find('.noRecord');

            $optWrapper.detach();
            //向下按钮
            var $optDnButton = $('<a class="optDnButton"></a>').on('click', function(e){
                e.preventDefault();
                $noRecord.hide();
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
                    if(!$noRecord.data('hasData')){
                        $noRecord.show();
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
                $thisObject.startLayout(true);
                var index = $optWrapper.find('label').index($(this).parent());
                if(this.checked){
                    var $th = $ths.eq(index).width(opts.cols[index].width).show();
                    var contentWidth =  $th.find('.content').width();
                    $body.find('tr > td:nth-child('+(index+1)+')')
                        .width(opts.cols[index].width).show()
                        .find('.content').width(contentWidth);
                }else{
                    $ths.eq(index).hide();
                    $body.find('tr > td:nth-child('+(index+1)+')').hide();
                }
                $thisObject.endLayout(true);
            });
            //放到headWrapper之后
            $headWrapper.after($optWrapper);


        },

        load: function(args){
            var $thisObject = this;
            var opts = this.opts;

            var $fastGrid = this.$fastGrid;
            $fastGrid.find('.mask').show();
            $fastGrid.find('.loadingWrapper').show();


            if(opts.url && !$.isArray(args)){
                var params = {
                    sortName: opts.sortName,
                    sortStatus: opts.sortStatus
                };
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
                    $thisObject.populate(data);
                }).fail(function(data){
                    if(opts.onError){
                        opts.onError();
                    }
                });
            }else{
                if(args){
                    opts.items = args;
                }
                $thisObject.populate(opts.items);
                //排序滞后目的是刷新数据的时候保留之前的排序状态
                var $ths = this.$ths;
                var sortColIndex = 0;
                var sortStatus = opts.sortStatus;
                $.each(opts.cols, function(index, col){
                    if(col.name === opts.sortName){
                        sortColIndex = index;
                    }
                });
                $ths.find('.title').each(function(index, item){
                    var status = $.data(item, 'sortStatus');
                    if(status){
                        sortColIndex = index;
                        sortStatus = status;
                    }
                });
                var sortStatus = sortStatus === 'desc' ? 'asc' : 'desc';
                $ths.eq(sortColIndex).find('.title').data('sortStatus',sortStatus).click();
            }

            $fastGrid.find('.mask').hide();
            $fastGrid.find('.loadingWrapper').hide();
        },

        populate: function(items){
            var $thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;
            var $ths = this.$ths;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;
            var $tbody = $body.find('tbody').detach().empty();

            if(items && items.length != 0 && opts.cols){
                $.data($fastGrid.find('.noRecord').hide()[0], 'hasData', true);
                $.each(items, function(rowIndex, item){

                    var $tr = $('<tr></tr>');
                    $.each(opts.cols, function(colIndex, col){

                        var $td = $('<td><div class="content"></div></td>').width($ths.eq(colIndex).width());
                        if($ths.eq(colIndex).is(':hidden')){
                            $td.hide();
                        }
                        var $content = $td.find('div.content');
                        if(col.align){
                            $content.css('text-align', col.align);
                        }
                        if(col.renderer){
                            var result = col.renderer(item[col.name], item, items, rowIndex, $tr);
                            if(result instanceof jQuery){
                                $content.append(result);
                            }else{
                                $content[0].innerHTML = result;
                            }
                        }else{
                            $content[0].innerHTML = item[col.name];
                        }
                        $tr.append($td);

                    });
                    $tbody.append($tr);
                });
                //其实只有IE6不支持hover，这里需要改一下
                if ($.browser.msie) {
                    if ($.browser.version == "6.0"){
                        $tbody.on('hover','tr', function (e) {
                            $('td',this).toggleClass('hover', e.type === 'mouseenter');
                        });
                    };
                }
            }else{
                $.data($fastGrid.find('.noRecord').show()[0], 'hasData', false);

                var $td = $('<td></td>').css({
                    'border':'0px',
                    'background': 'none'
                }).html('&nbsp;');
                $tbody.append($('<tr></tr>').append($td));
            }
            $body.append($tbody);

            this.startLayout();
            this.fixLayout();
            this.setStyle();
            this.endLayout();

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
            var opts = this.opts;
            var params = {
                sortName: opts.cols[index].name,
                sortStatus: status
            };
            this.load(params);
        },


        setStyle: function(){
            var $head = this.$head;
            var $ths = this.$ths;
            var $body = this.$body;
            var $tbody = $body.find('tbody').detach();

            //head
            $ths.eq(0).addClass('first');
            $ths.eq(-1).addClass('last');
            //body
            $tbody.find('tr,td').removeClass();
            $tbody.find('tr:odd').addClass('even');
            $tbody.find('tr > td:first-child').addClass('first');
            $tbody.find('tr > td:last-child').addClass('last');

            var sortIndex = $head.find('span.title').index($head.find('span.title').filter(function(){
                return $.data(this,'sortStatus') === 'asc' || $(this).data('sortStatus') === 'desc';
            }));

            $tbody.find('tr > td:nth-child('+(sortIndex+1)+')').addClass('colSelected')
                .filter(':even').addClass('colSelectedEven');

            $body.append($tbody);
        },

        startLayout: function(detach){
            var $headWrapper = this.$headWrapper;
            var $bodyWrapper = this.$bodyWrapper;

            $headWrapper.width(9999);
            if(detach){
                $bodyWrapper.detach();
            }
            $bodyWrapper.width(9999);


        },

        fixLayout: function(colIndex){
            var opts = this.opts;
            var $ths = this.$ths;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;
            var $tbody = $body.find('tbody');

            if(colIndex >= 0){
                var $th = $ths.eq(colIndex);
                $th.width($th.width());
                $tbody.find('tr > td:nth-child('+(colIndex+1)+')').width($th.width())
                    .find('div.content').width($th.find('div.content').width());
            }else{
                //尽量不要用全部调整,这里的实现现在只满足刚执行populate之后
                var $firstRowTds = $tbody.find('tr:first > td');
                $.each($ths, function(index){
                    var $th = $ths.eq(index);
                    if(opts.textEllipsis){
                        //与head对齐
                        $firstRowTds.eq(index).width($th.width());
                        $tbody.find('tr > td:nth-child('+(index+1)+')').find('div.content')
                            .width($th.find('div.content').width());
                    }else{
                        //谁宽和谁对齐
                        var $td = $firstRowTds.eq(index);
                        if($th.width() > $td.width()){
                            $td.width($th.width);
                        }else{
                            $th.width($td.width());
                        }
                    }
                });
            }
        },

        endLayout: function(detach){
            var $thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;
            var $ths = this.$ths;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;


            var hwWidth = $head.outerWidth(true) > $fastGrid.width()
                ? $head.outerWidth(true) : $fastGrid.width();
            $headWrapper.width(hwWidth);
            $body.width($head.width());
            $bodyWrapper.width($fastGrid.width())
                .height($fastGrid.height() - $headWrapper.outerHeight(true));
            if(detach){
                $fastGrid.append($bodyWrapper);
            }
            //调整滚动条
            $bodyWrapper.scroll();
        }
    };



    $.fn.fastGrid = function(option , val){
        return this.each(function(){
            var $this = $(this)
                , data = $this.data('fastGrid')
                , options = $.extend({}, $.fn.fastGrid.defaults, typeof option == 'object' && option);
            if (!data) $this.data('fastGrid', (data = new FastGrid(this, options)))
            if(typeof option === 'string'){
                data[option](val);
            }
        });
    };

    $.fn.fastGrid.defaults = {
        width: '100%',
        height: '100%',
        url: false,
        params: {}, //可以是object也可以是function
        method: 'POST',
        items: [],
        loadingText: '正在载入...',
        noRecordText: '没有数据',
        cols: [],
        sortName: false,
        sortStatus: 'asc',
        remoteSort: false,
        autoLoad: true,
        textEllipsis: false,
        onSuccess: function(){},
        onError: function(){}

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