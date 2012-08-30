/**
 * User: meimeibw
 * Date: 12-8-9
 * Time: 下午2:03
 */

!function(){
    var FastGrid = function(element, options){
        var $el = $(element);
        this.opts = options;
        this.opts.id = (((1 + Math.random()) * 0x10000) | 0).toString(16);
        this._initLayout($el);
        this._initHead();
        this._initOption();
        this._initEvents();
        this.load();
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
                    '<a class="optDnButton"></a>',
                    '<div class="mask transparent">',
                    '</div>',
                    '<div class="loadingWrapper">',
                        '<div class="loading"></div>',
                        '<p>'+ this.opts.loadingText +'</p>',
                    '</div>',
                    '<span class="noData" data-nodata="true">'+ this.opts.noDataText +'</span>',
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
            if(opts.scroll != 'horizontal' && opts.scroll != 'hidden'){
            $fastGrid.height(opts.height);
            }
            this._refreshNoData();
            $.data(this.$body[0],'loadCount',0);
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
                if(opts.scroll != 'horizontal' && opts.scroll != 'hidden'){
                $bodyWrapper.height($fastGrid.height() - $headWrapper.outerHeight(true));
                }
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

        _initOption: function(){
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $optWrapper = this.$optWrapper;
            var $headWrapper = this.$headWrapper;

            $fastGrid.find('a.optDnButton').css({
                'top': $headWrapper.outerHeight(true),
                'right': 20
            });

            if(opts.cols){
                var optHtml = ['<a class="optUpButton"></a>'];
                optHtml.push('<h1>显示列</h1>');
                for(var colIndex=0; colIndex<opts.cols.length; colIndex++){
                    var col = opts.cols[colIndex];
                    optHtml.push('<label><input type="checkbox"  ');
                    if(!col.hidden) optHtml.push('checked="checked"');
                    optHtml.push('/><span>');
                    optHtml.push(col.title);
                    optHtml.push('</span></label>');
                }
                $optWrapper.html(optHtml.join(''));
            }

            $optWrapper.width('100%').height($fastGrid.height() - $headWrapper.outerHeight(true));
        },

        _initEvents: function(){
            var thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $head = this.$head;
            var $optWrapper = this.$optWrapper;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;

            if((typeof opts.width === 'string' && opts.width.indexOf('%') === opts.width.length-1) ||
                typeof opts.height === 'string' && opts.height.indexOf('%') === opts.height.length-1){
                $(window).on('resize', function(){
                    if(opts.scroll != 'horizontal' && opts.scroll != 'hidden'){
                        $bodyWrapper.height($fastGrid.height() - $headWrapper.outerHeight(true));
                    }
                    //调整option
                    if($optWrapper.is(':visible')){
                        $optWrapper.height($fastGrid.height() - $headWrapper.outerHeight(true));
                    }
                    //调整noData
                    var $noData = $fastGrid.find('.noData');
                    if($noData.is(':visible')){
                        $noData.css({
                            'left': ($fastGrid.width() - $noData.width()) / 2,
                            'top': ($fastGrid.height() - $noData.height()) / 2
                        });
                    }
                    //调整loading
                    var $mask = $fastGrid.find('.mask');
                    if($mask.is(':visible')){
                        $mask.width($fastGrid.width()).height($fastGrid.height());
                        var $loadingWrapper = $fastGrid.find('.loadingWrapper');
                        $loadingWrapper.css({
                            'left': ($fastGrid.width() - $loadingWrapper.width()) / 2,
                            'top': ($fastGrid.height() - $loadingWrapper.height()) / 2
                        })
                    }
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
                    thisObject.load()
                }else{
                    thisObject._nativeSorter($titles.index($this), sortStatus);
                    thisObject._setStyle();
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
                    thisObject._colsWidth($resize.parent().parent().index());
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

            //向下按钮
            var $optDnButton = $fastGrid.find('a.optDnButton').on('click', function(e){
                e.preventDefault();
                thisObject._hideNoData();
                $optWrapper.height($fastGrid.height() - $headWrapper.outerHeight(true));
                $(this).slideUp('fast');
                if(opts.scroll === 'horizontal' || opts.scroll === 'hidden'){
                    $fastGrid.height($fastGrid.height());
                }
                $optWrapper.slideDown();
            }).on('mouseleave', function(){
                $(this).slideUp('fast');
            });
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
            $fastGrid.find('a.optUpButton').on('click', function(e){
                e.preventDefault();
                $optWrapper.slideUp().queue(function(next){
                    thisObject._refreshNoData();
                    if(opts.scroll === 'horizontal' || opts.scroll === 'hidden'){
                        $fastGrid.height('auto');
                    }
                    next();
                });
            });

            //隐藏列
            $optWrapper.on('click', ':checkbox', function(e){
                var index = $optWrapper.find('label').index($(this).parent());
                if(this.checked){
                    opts.cols[index].hidden = false;
                    thisObject._colsWidth();
                }else{
                    opts.cols[index].hidden = true;
                    thisObject._colsWidth();
                }
            });

            //选中事件
            var $body = this.$body;
            $body.on('click','td',function(e){
                var $this = $(this);
                if(!$this.parent().hasClass('selected')){
                    thisObject.select($this.parent().index());
                }else{
                    thisObject.deselect($this.parent().index());
                }
                opts.onSelected(thisObject,$.data($this.parent()[0], 'item'), $this.parent().index(), $this.index());
            });

            //IE6不支持hover
            if ($.browser.msie) {
                if ($.browser.version == "6.0"){
                    $body.find('tbody').on('hover','tr', function (e) {
                        $(this).toggleClass('hover', e.type === 'mouseenter');
                    });
                };
            }

            //注册分页事件
            if(opts.paginator && opts.paginator.paginator){
                var $pg = opts.paginator;
                $pg.paginator('option',{
                    onLoad: function($pg, pageNo, pageSize){
                        thisObject.load();
                    }
                });
            }
        },

        _populate: function(items){
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $body = this.$body;

            if(items  && items.length != 0 && opts.cols){
                $fastGrid.find('.noData').data('nodata',false);
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
                var $trs = $body.find('tr');
                for(var rowIndex=0; rowIndex < items.length; rowIndex++){
                    $.data($trs.eq(rowIndex)[0],'item',items[rowIndex]);
                }
                $.data($body[0],'loadCount', $.data($body[0],'loadCount') + 1);
            }else{
                $fastGrid.find('.noData').data('nodata',true);
                $body.empty().html('<tbody><td style="border: 0px;background: none;">&nbsp;</td></tbody>');
            }
            this._setStyle();
            this._hideLoading();
            this._refreshNoData();
            if((opts.scroll === 'hidden' || opts.scroll === 'vertical') && $.data($body[0],'loadCount') === 1){
                this._expandCols();
            }
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
                if(!width || width < $th.find('span.title').width() + 10 ){
                    $.data($th[0],'col-width' ,$th.find('span.title').width() + 10);
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
            $body.detach();
            try{
                $style.text(style.join(''));
            }catch(error){
                $style[0].styleSheet.cssText = style.join('');//IE fix
            }

            $body.width($head.width());
            $bodyWrapper.width('100%');
            $bodyWrapper.append($body);

            //调整滚动条
            $bodyWrapper.scrollLeft(-parseInt($head.css('left'),10));
            if($bodyWrapper.scrollLeft() === 0){
                $head.css('left', 0);
            }
        },

        _expandCols: function(){
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $style = this.$style;
            var $head = this.$head;
            var $ths = this.$ths;
            var $bodyWrapper = this.$bodyWrapper;
            var $body = this.$body;
            //滚动条宽度
            var ua = navigator.userAgent.toLowerCase();
            var scrollWidth = 0;
            if(/windows nt/.test(ua)){
                scrollWidth = 17;
            }
            if($body.height() <= $bodyWrapper.height() || opts.scroll === 'horizontal' || opts.scroll === 'hidden'){
                scrollWidth = 0;
            }
            var offsize = Math.floor(( $fastGrid.width() - $head.width() - scrollWidth) / $head.find('th:visible').length);
            var wt = 0;
            var fix = 0
            $head.find('th:visible').each(function(i,item){
                var width = $.data(this,'col-width');
                wt = wt + width;
                width = (width + offsize) <10 ? 10 : width + offsize;
                fix = fix + width;
                $.data(this,'col-width' ,width);
            });
            var lastOffsize = ($fastGrid.width() - scrollWidth) - (($head.width() - wt) + (fix));
            var last = $head.find('th:visible').eq(-1);
            $.data(last[0],'col-width' ,$.data(last[0],'col-width') + lastOffsize);
            this._colsWidth();
        },

        _genColClass: function(colIndex){
            return 'fg-col'+colIndex+'-'+this.opts.id;
        },

        _nativeSorter: function(colIndex, sortStatus){
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
        },

        _showLoading: function(){
            var $fastGrid = this.$fastGrid;
            //遮罩
            $fastGrid.find('.mask').width($fastGrid.width())
                .height($fastGrid.height()).show();
            //加载包装器位置
            var $loadingWrapper = $fastGrid.find('.loadingWrapper');
            $loadingWrapper.css({
                'left': ($fastGrid.width() - $loadingWrapper.width()) / 2,
                'top': ($fastGrid.height() - $loadingWrapper.height()) / 2
            }).show();
        },
        _hideLoading: function(){
            var $fastGrid = this.$fastGrid;
            $fastGrid.find('.mask').hide();
            $fastGrid.find('.loadingWrapper').hide();
        },

        _refreshNoData: function(){
            var $fastGrid = this.$fastGrid;
            //无数据文字位置
            var $noData = $fastGrid.find('.noData');

            if($noData.data('nodata')){
                $noData.css({
                    'left': ($fastGrid.width() - $noData.width()) / 2,
                    'top': ($fastGrid.height() - $noData.height()) / 2
                }).show();
            }else{
                $noData.hide();
            }
        },
        _hideNoData: function(){
            this.$fastGrid.find('.noData').hide();
        },

        _loadAjax: function(args){
            var thisObject = this;
            var opts = this.opts;
            var params = {};
            //获得远程排序参数
            if(opts.remoteSort){
                var sortName = '';
                var sortStatus = '';
                var $titles = this.$ths.find('.title');
                for(var colIndex=0; colIndex<$titles.length; colIndex++){
                    var status = $.data($titles[colIndex], 'sortStatus');
                    if(status){
                        sortName = opts.cols[colIndex].name;
                        sortStatus = status;
                    }
                }
                params.sortName = sortName;
                params.sortStatus = sortStatus;
            }

            //分页参数
            if(opts.paginator && opts.paginator.paginator){
                var $pg = opts.paginator;
                params[$pg.paginator('option').pageNoName] = $pg.paginator('pageNo') ? $pg.paginator('pageNo') : 1;
                params[$pg.paginator('option').pageSizeName] = $pg.paginator('pageSize');
            }

            //opt的params可以使函数，例如收集过滤的参数
            if($.isFunction(opts.params)){
                params = $.extend(params, opts.params());
            }else if($.isPlainObject()){
                params = $.extend(params, opts.params);
            }
            //合并load的参数
            params = $.extend(params, args);
            $.ajax({
                type: opts.method,
                url: opts.url,
                data: params,
                dataType: 'json',
                cache: false
            }).done(function(data){
                //获得root对象
                var items = data;
                if($.isArray(data[opts.root])){
                    items = data[opts.root];
                }
                if(opts.remoteSort){
                    thisObject._populate(items);
                }else{
                    thisObject._loadNative(items);
                }
                if(opts.onSuccess){
                    opts.onSuccess(thisObject, data);
                }
                if(opts.paginator && opts.paginator.paginator){
                    var $pg = opts.paginator;
                    $pg.paginator('render',data);
                }
            }).fail(function(data){
                if(opts.onError){
                    opts.onError(thisObject, data);
                }
            });
        },

        _loadNative: function(items){
            this._populate(items);
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

        load: function(args){
            this._hideNoData();
            this._showLoading();
            var opts = this.opts;
            var items = args;
            if($.isPlainObject(args) && $.isArray(args[opts.root])){
                items = args[opts.root];
            }
            if(opts.url && !$.isArray(items)){
                this._loadAjax(args);
            }else{
                if(!items){
                    items = opts.items;
                }
                this._loadNative(items);
                if(opts.onSuccess){
                    opts.onSuccess(this, args);
                }

                if(opts.paginator && opts.paginator.paginator){
                    var $pg = opts.paginator;
                    $pg.paginator('render',args);
                }
            }
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