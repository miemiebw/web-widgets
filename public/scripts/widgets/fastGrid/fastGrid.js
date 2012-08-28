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
        this.initHead();
        this.alignColumn();
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

                    trs.push('<tr>');
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

        alignColumn: function(){
            var $thisObject = this;
            var opts = this.opts;
            var $style = this.$style;
            var $ths = this.$ths;

            var style = [];
            $.each($ths, function(index){

                style.push('.fg-col'+index+'-'+$thisObject.rnum+' {');
                if(opts.cols[index].width){
                    style.push('width: '+opts.cols[index].width +'px;');
                    style.push('max-width: '+opts.cols[index].width +'px;');
                }else{
                    style.push('width: '+ $(this).width() +'px;');
                    style.push('max-width: '+ $(this).width() +'px;');
                }
                style.push(' }');

            });

            try{
                $style.text(style.join(''));
            }
                //IE fix
            catch(error){
                $style[0].styleSheet.cssText = style.join('');

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
                if(opts.scroll != 'horizontal' && opts.scroll != 'hidden'){
                    $fastGrid.height($fastGrid.height() - fgHBP);
                }

            }

            $bodyWrapper.height($fastGrid.height() - $headWrapper.outerHeight(true));




            //表头
            $head.width($head.width());
            $headWrapper.width($fastGrid.width());


            //表内容
            $body.width($head.width());
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