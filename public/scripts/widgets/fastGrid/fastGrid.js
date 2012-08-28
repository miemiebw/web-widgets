/**
 * User: meimeibw
 * Date: 12-8-9
 * Time: 下午2:03
 */

!function(){
    var FastGrid = function(element, options){
        var $el = $(element);
        this.opts = options;

        this._initLayout($el);
        this._initHead();
        this._initEvents();
        this._populate(options.items);
    };

    FastGrid.prototype = {

        _initLayout: function($el){
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
                '</div>'
            ];

            //cached object
            var $fastGrid = $(fastGrid.join(''));
            this.$fastGrid = $fastGrid;
            this.$style = $fastGrid.find('style');
            this.$headWrapper = $fastGrid.find('.headWrapper');
            this.$head = $fastGrid.find('.head');
            this.$bodyWrapper = $fastGrid.find('.bodyWrapper');
            this.$body = $el.addClass('body').empty()
                .html('<tbody><td style="border: 0px;background: none;">&nbsp;</td></tbody>')
                .appendTo(this.$bodyWrapper);

            //放回原位置
            if(elIndex === 0 && $elParent.children().length == 0){
                $elParent.append(this.$fastGrid);
            }else{
                $elParent.children().eq(elIndex).before(this.$fastGrid);
            }

            //设置尺寸
            var opts = this.opts;
            $fastGrid.width(opts.width);
            $fastGrid.height(opts.height);
        },

        _initHead: function(){
            var opts = this.opts;
            var $head = this.$head;

            if(opts.cols){
                var theadHtmls = ['<thead>'];
                for(var colIndex=0; colIndex< opts.cols.length; colIndex++){
                    var col = opts.cols[colIndex];
                    theadHtmls.push('<th class="');
                    theadHtmls.push(this._genColClass(colIndex));
                    theadHtmls.push(' nowrap">');
                    theadHtmls.push('<div class="content" >');
                    theadHtmls.push('<span class="title ');
                    if(col.sortable) theadHtmls.push('canSort ');
                    theadHtmls.push('">');
                    theadHtmls.push(col.title);
                    theadHtmls.push('</span><div class="sortStatus"></div><div class="resize"></div></div>');
                    theadHtmls.push('</th>');
                }

                theadHtmls.push('</thead>');
                $head.html(theadHtmls.join(''));
                this.$ths = $head.find('th');//cached
                $.each(this.$ths,function(index){
                    $.data(this,'col-width',opts.cols[index].width);
                });
                this._colsWidth();

                var $fastGrid = this.$fastGrid;
                var $headWrapper = this.$headWrapper;
                var $bodyWrapper = this.$bodyWrapper;
                $bodyWrapper.height($fastGrid.height() - $headWrapper.outerHeight(true));

                //初始化排序状态
                if(opts.sortName){
                    for(var colIndex=0; colIndex< opts.cols.length; colIndex++){
                        var col = opts.cols[colIndex];
                        if(col.name === opts.sortName){
                            var $th= this.$ths.eq(colIndex);
                            $.data($th.find('span.title')[0],'sortStatus',opts.sortStatus);
                            $th.find('div.sortStatus').addClass(opts.sortStatus);
                        }
                    }
                }
            }
        },

        _initEvents: function(){
            var $thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;
            var $bodyWrapper = this.$bodyWrapper;

            if((typeof opts.width === 'string' && opts.width.indexOf('%') === opts.width.length-1) ||
                typeof opts.height === 'string' && opts.height.indexOf('%') === opts.height.length-1){
                $(window).on('resize', function(){
                    $bodyWrapper.height($fastGrid.height() - $headWrapper.outerHeight(true));
                });
            }

            //滚动条事件
            $bodyWrapper.on('scroll', function(e){
                $head.css('left',- $(this).scrollLeft());
            });

            //排序事件
            $head.on('click','span.title', function(e){
                e.preventDefault();
                var $this = $(this);
                var $titles = $head.find('span.title');
                if(!opts.cols[$titles.index($this)].sortable){
                    return;
                }
                //取得当前列下一个排序状态
                var sortStatus = $.data(this, 'sortStatus') === 'asc' ? 'desc' : 'asc';
                //清除排序状态
                $.each($titles, function(index){
                    $.removeData(this,'sortStatus');
                });
                $head.find('.sortStatus').removeClass('asc').removeClass('desc');
                //设置当前列排序状态
                $.data(this, 'sortStatus', sortStatus);
                $this.siblings('.sortStatus').addClass(sortStatus);

                if(opts.remoteSort){
                    $thisObject.load()
                }else{
                    $thisObject._nativeSorter($titles.index($this), sortStatus);
                    $thisObject._setStyle();
                }
            }).on('mousedown', 'div.resize', function(e){
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
                    $.data($resize.parent().parent()[0],'col-width',$resize.parent().width() + e.pageX - start);
                    $thisObject._colsWidth($resize.parent().parent().index());
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

        _populate: function(items){
            var opts = this.opts;
            var $ths = this.$ths;
            var $body = this.$body;

            if(items  && items.length != 0 && opts.cols){
                var tbodyHtmls = [];
                tbodyHtmls.push('<tbody>');
                for(var rowIndex=0; rowIndex < items.length; rowIndex++){
                    var item = items[rowIndex];

                    tbodyHtmls.push('<tr data-rowIndex="');
                    tbodyHtmls.push(rowIndex);
                    tbodyHtmls.push('">');
                    for(var colIndex=0; colIndex < opts.cols.length; colIndex++){
                        var col = opts.cols[colIndex];
                        tbodyHtmls.push('<td class="');
                        tbodyHtmls.push(this._genColClass(colIndex));;
                        if(opts.nowrap){
                            tbodyHtmls.push(' nowrap');
                        }
                        tbodyHtmls.push('"><span class="');
                        if(opts.nowrap){
                            tbodyHtmls.push('nowrap');
                        }
                        tbodyHtmls.push('">');
                        if(col.renderer){
                            tbodyHtmls.push(col.renderer(item[col.name],item,items,rowIndex));
                        }else{
                            tbodyHtmls.push(item[col.name]);
                        }

                        tbodyHtmls.push('</span></td>');
                    };
                    tbodyHtmls.push('</tr>');
                };
                tbodyHtmls.push('</tbody>');
                $body.empty().html(tbodyHtmls.join(''));
            }else{
                $body.empty().html('<tbody><td style="border: 0px;background: none;">&nbsp;</td></tbody>');
            }
            this._setStyle();
        },

        _setStyle: function(){
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

        _colsWidth: function(index){
            var opts = this.opts;
            var $style = this.$style;
            var $head = this.$head;
            var $ths = this.$ths;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;

            $bodyWrapper.width(9999);
            $body.width('auto');

            var style = [];
            for(var colIndex=0; colIndex<$ths.length; colIndex++){
                var $th = $ths.eq(colIndex);
                style.push('.'+this._genColClass(colIndex) + ' {');
                var width = $.data($th[0],'col-width');
                if((!width || width <$th.width()) && (index < 0 || width < 10) ){
                    $.data($th[0],'col-width' ,$th.width());
                    width = $.data($th[0],'col-width');
                }
                style.push('width: '+ width +'px;');
                style.push('max-width: '+ width +'px;');
                if(opts.cols[colIndex].align){
                    style.push('text-align: '+opts.cols[colIndex].align+';');
                }
                if(opts.cols[colIndex].hidden){
                    style.push('display: none; ');
                }
                style.push(' }');
            }
            try{
                $style.text(style.join(''));
            }catch(error){
                $style[0].styleSheet.cssText = style.join('');//IE fix
            }
            $body.width($head.width());
            $bodyWrapper.width('100%');
        },

        _genColClass: function(colIndex){
            if(!this.rnum){
                this.rnum = Math.floor(Math.random()*11);
            }
            return 'fg-col'+colIndex+'-'+this.rnum;
        },

        _nativeSorter: function(colIndex, sortStatus){
            console.log(sortStatus);
            var col = this.opts.cols[colIndex];
            this.$body.find('tr > td:nth-child('+(colIndex+1)+')')
                .sortElements(function(a, b){
                    var av = $.text($(a));
                    var bv = $.text($(b));
                    //排序前转换
                    if(col.type === 'number'){
                        av = parseFloat(av);
                        bv = parseFloat(bv);
                    }else{
                        //各个浏览器localeCompare的结果不一致
                        //return sortStatus === 'desc' ? -av.localeCompare(bv)  : av.localeCompare(bv);
                    }
                    return av > bv ? (sortStatus === 'desc' ? -1 : 1) : (sortStatus === 'desc' ? 1 : -1);
                }, function(){
                    return this.parentNode;
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
                    parentNode.insertBefore(this, nextSibling);
                    parentNode.removeChild(nextSibling);
                };
            });
            return sort.call(this, comparator).each(function(i){
                placements[i].call(getSortable.call(this));
            });
        };
    })();
}(window.jQuery);