/**
 * User: meimeibw
 * Date: 12-8-9
 * Time: 下午2:03
 */

!function(){
    var FastGrid = function(element, options){
        var $el = $(element);
        this.opts = options;
        this.rnum = Math.floor(Math.random()*11);

        this.initLayout($el);
        this.initEvents();
        this.initHead();
        this.populate(options.items);
        this.calcLayout();
    };

    FastGrid.prototype = {

        initLayout: function($el){
            var $elParent = $el.parent();
            var elIndex = $el.index();

            var fastGrid = [
                '<div class="fastGrid">',
                    '<style></style>',
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
            this.$style = $fastGrid.find('style');
            this.$headWrapper = $fastGrid.find('.headWrapper');
            this.$head = $fastGrid.find('.head');
            this.$optWrapper = $fastGrid.find('.optWrapper');
            this.$bodyWrapper = $fastGrid.find('.bodyWrapper');
            this.$body = $el.addClass('body').empty().html('<tbody></tbody>').appendTo(this.$bodyWrapper);

            //初始化表格
            $.data($fastGrid.find('.noData').show()[0], 'hasData', false);
            var $td = $('<td></td>').css({
                'border':'0px',
                'background': 'none'
            }).html('&nbsp;');
            this.$body.find('tbody').append($('<tr></tr>').append($td));

            //放回原位置
            if(elIndex === 0 && $elParent.children().length == 0){
                $elParent.append(this.$fastGrid);
            }else{
                $elParent.children().eq(elIndex).before(this.$fastGrid);
            }

        },

        initHead: function(){
            var $thisObject = this;
            var opts = this.opts;
            var $head = this.$head;

            var $tr = $('<tr></tr>');
            if(opts.cols){
                $.each(opts.cols, function(colIndex, col){
                    var $th = $('<th><div class="content"><span class="title"></span><div class="resize"></div></div></th>');

                    $th.addClass('fg-col'+colIndex+'-'+$thisObject.rnum);
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

            var colsw = [];
            for(var i=0; i< opts.cols.length; i++){
                colsw[i] = opts.cols[i].width;
            }
            this.alignColumn(colsw);
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


                $thisObject.alignColumn();
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
                            var colw = [];
                            colw[$resize.parent().parent().index()] = $resize.parent().width() + e.pageX - start;
                            $thisObject.alignColumn(colw);
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

            //注册分页事件
            if(opts.paginator && opts.paginator.paginator){
                var $pg = opts.paginator;
                $pg.paginator('option',{
                    onLoad: function($pg, pageNo, pageSize){
                        $thisObject.load();
                    }
                });
            }
        },

        populate: function(items){
            var $thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $head = this.$head;
            var $ths = this.$ths;
            var $body = this.$body;

            $fastGrid.find('.mask').show();
            $fastGrid.find('.loadingWrapper').show();

            if(items  && items.length != 0 && opts.cols){
                $.data($fastGrid.find('.noData').hide()[0], 'hasData', true);

                var trs = [];
                trs.push('<tbody>');
                for(var rowIndex=0; rowIndex < items.length; rowIndex++){
                    var item = items[rowIndex];

                    trs.push('<tr ');
                    trs.push(' fg-index="');
                    trs.push(rowIndex);
                    trs.push('">');
                    for(var colIndex=0; colIndex < opts.cols.length; colIndex++){
                        var col = opts.cols[colIndex];
                        trs.push('<td ');
                        trs.push('class="');
                        trs.push('fg-col'+colIndex+'-'+$thisObject.rnum);
                        if(opts.nowrap){
                            trs.push(' nowrap');
                        }
                        trs.push('" style="');
                        if($ths.eq(colIndex).is(':hidden')){
                            trs.push('display: none;');
                        }
                        if(col.align){
                            trs.push('text-align: '+col.align+';');
                        }
                        trs.push('" ><span ');

                        trs.push('class="');
                        if(opts.nowrap){
                            trs.push('nowrap');
                        }
                        trs.push('">');
                        if(col.renderer){
                            trs.push(col.renderer(item[col.name],item,items,rowIndex));
                        }else{
                            trs.push(item[col.name]);
                        }

                        trs.push('</span></td>');
                    };
                    trs.push('</tr>');
                };
                trs.push('</tbody>');
                $body.empty().html(trs.join(''));
            }else{
                $.data($fastGrid.find('.noData').show()[0], 'hasData', false);

                var $td = $('<td></td>').css({
                    'border':'0px',
                    'background': 'none'
                }).html('&nbsp;');
                $body.empty().append($('<tbody></tbody>').append($('<tr></tr>').append($td)));
            }
            this.setStyle();
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

        alignColumn: function(colw){
            var $thisObject = this;
            var opts = this.opts;
            var $style = this.$style;
            var $ths = this.$ths;

            var style = [];
            $.each($ths, function(index){

                style.push('.fg-col'+index+'-'+$thisObject.rnum+' {');
                if(colw[index]){
                    style.push('width: '+colw[index] +'px;');
                    style.push('max-width: '+colw[index] +'px;');
                }else{
                    style.push('width: '+ $ths.eq(index).width() +'px;');
                    style.push('max-width: '+ $ths.eq(index).width() +'px;');
                }
                style.push(' }');
            });

            try{
                $style.text(style.join(''));
            }catch(error){
                //IE fix
                $style[0].styleSheet.cssText = style.join('');

            }

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
            var opts = this.opts;
            $fastGrid.width(opts.width);
            $fastGrid.height(opts.height);


            $bodyWrapper.height('100%');

            //表内容
            $body.width($head.width());
            $bodyWrapper.width('100%');



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
        paginator: false,
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