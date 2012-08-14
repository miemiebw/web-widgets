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
        this.initOptBoard();
        this.initHeader();
        if(this.opts.autoLoad){
            this.load();
        }
    };

    FastGrid.prototype = {

        init: function($el){
            var $elParent = $el.parent();
            $el.detach();
            this.$fastGrid = $('<div class="fastGrid"></div>');
            this.$headWrapper = $('<div class="headWrapper"></div>').appendTo(this.$fastGrid);
            this.$thead = $('<thead></thead>').wrap('<table class="tableHead"></table>');
            this.$thead.parent().appendTo(this.$headWrapper);
            this.$optWrapper = $('<div class="optWrapper"></div>').appendTo(this.$fastGrid);
            this.$bodyWrapper = $('<div class="bodyWrapper"></div>').appendTo(this.$fastGrid);
            this.$tbody = $('<tbody></tbody>').appendTo($el);
            $el.addClass('tableBody').appendTo(this.$bodyWrapper);
            $elParent.append(this.$fastGrid);

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

            //noRecord
            this.$noRecord = $('<span></span>').html(this.opts.noRecord).addClass('noRecord').appendTo(this.$fastGrid);
            //
            this.$resizePosition = $('<div class="resizePosition"></div>').appendTo(this.$headWrapper);
        },

        initOptBoard: function(){
            var thisObject = this;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $thead = this.$thead;
            var $optWrapper = this.$optWrapper;
            var $bodyWrapper = this.$bodyWrapper;
            var $tbody = this.$tbody;
            var opts = this.opts;
            var $noRecord = this.$noRecord;
            this.$optButton = $('<a class="optDnButton"></a>').on('click', function(e){
                e.preventDefault();
                $noRecord.hide();
                $(this).slideUp('fast');
                $optWrapper.css({
                    width:$bodyWrapper.outerWidth(true),
                    height:$bodyWrapper.outerHeight(true)
                }).slideDown();
            }).appendTo(this.$fastGrid);
            var $optUpButton = $('<a class="optUpButton"></a>').on('click', function(e){
                e.preventDefault();
                $optWrapper.slideUp().queue(function(next){
                    if(!$noRecord.data('hasData')){
                        $noRecord.show();
                    }
                    next();
                });
            }).appendTo(this.$optWrapper);

            if(opts.cols){
                var $h1 = $('<h1></h1>').text('显示列').appendTo($optWrapper);
                $.each(opts.cols, function(index, col){
                    var $label = $('<label></label>')
                    var $checkBox = $('<input type="checkbox" />')
                        .on('click', function(){
                            $headWrapper.width(9999);
                            $bodyWrapper.detach().width(9999);
                            if(this.checked){
                                $('tr > th:nth-child('+(index+1)+')', $thead).width(col.width).show();
                                $('tr > td:nth-child('+(index+1)+')', $tbody).width(col.width).show();
                            }else{
                                $('tr > th:nth-child('+(index+1)+')', $thead).hide();
                                $('tr > td:nth-child('+(index+1)+')', $tbody).hide();
                            }
                            var hwWidth = $thead.parent().outerWidth(true) > $fastGrid.width() ? $thead.parent().outerWidth(true) : $fastGrid.width();
                            $headWrapper.width(hwWidth);//收缩包装器
                            $bodyWrapper.find('table').width($thead.parent().width());
                            $bodyWrapper.width($fastGrid.width())
                                .height($fastGrid.height() - $headWrapper.outerHeight(true)).appendTo($fastGrid);
                            $bodyWrapper.scrollLeft(-parseInt($thead.parent().css('left'),10));
                            $bodyWrapper.scroll();//Fix in IE6
                            thisObject.setRowStyle();
                        });
                    if(!col.hidden || col.hidden === false){
                        $checkBox.prop("checked", true);
                    }
                    var $span = $('<span></span>').text(col.title);
                    $optWrapper.append($label.append($checkBox).append($span));
                });
            }
        },

        initHeader: function(){
            var thisObject = this;
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $thead = this.$thead;
            var $bodyWrapper = this.$bodyWrapper;
            var $tbody = this.$tbody;
            var $noRecord = this.$noRecord;
            var $resizePosition = this.$resizePosition;
            var $tr = $('<tr></tr>');
            if(opts.cols){
                $.each(opts.cols, function(index, col){
                    var $th = $('<th></th>');
                    if(index === 0){
                        $th.addClass('first');
                    }
                    if(index === opts.cols.length-1){
                        $th.addClass('last');
                    }
                    if(col.hidden === true){
                        $th.hide();
                    }
                    if(col.width){
                        $th.width(col.width);
                    }

                    var $resize = $('<div class="resize"></div>').on('mousedown', function(e){
                        var start = 0;
                        $headWrapper.on('mousedown', function(e){
                            $resizePosition.show();
                            $resizePosition.css('left', e.pageX - $headWrapper.offset().left);

                            start = e.pageX;
                            document.body.onselectstart = function(){
                                return false;
                            }
                        }).on('mouseup', function(e){
                            $headWrapper.width(9999);
                            $bodyWrapper.width(9999);
                            $resize.parent().width($resize.parent().width() + e.pageX - start);

                            thisObject.adjustLayout(index);
                            $headWrapper.off('mousedown').off('mouseup').off('mouseleave').off('mousemove');
                            $resizePosition.hide();
                            document.body.onselectstart = function(){
                                return true;
                            }
                        }).on('mouseleave',function(e){
                            $headWrapper.off('mousedown').off('mouseup').off('mouseleave').off('mousemove');
                            $resizePosition.hide();
                            document.body.onselectstart = function(){
                                return true;
                            }
                        }).on('mousemove', function(e){
                            console.dir(e.pageX - $headWrapper.offset().left);
                            $resizePosition.css('left', e.pageX - $headWrapper.offset().left);
                        });
                    });

                    $th.append($resize);

                    //设置一个文字包装器
                    var $content = $('<div class="content"></div>').appendTo($th);
                    if(col.align){
                        $content.css('text-align', col.align);
                    }
                    if(col.title){
                        $('<span class="title"></span>')
                            .html(col.title).appendTo($content);

                    }
                    //如果可以排序
                    if(col.sortable){
                        thisObject.bindSorter(index, $th);
                    }
                    $tr.append($th);
                });
            }
            $thead.append($tr);

            $bodyWrapper.on('scroll', function(e){
                $thead.parent().css('left',- $bodyWrapper.scrollLeft());
            });

            $noRecord.css({
                'left': ($fastGrid.width() - $noRecord.width()) / 2,
                'top': ($fastGrid.height() - $noRecord.height()) / 2
            });

            var $optButton = this.$optButton;
            var $optWrapper = this.$optWrapper;
            $optButton.on('mouseleave', function(){
                $optButton.slideUp('fast');
            });
            $bodyWrapper.on('mouseenter', function(){
                $optButton.slideUp('fast');
            });
            $fastGrid.on('mouseleave', function(){
                $optButton.slideUp('fast');
            });
            $headWrapper.on('mouseenter',function(){
                if($optWrapper.is(':hidden')){
                    $optButton.slideDown('fast');
                }
            });

        },

        load: function(newParams){
            var thisObject = this;
            var opts = this.opts;
            var params = {
                sortName: opts.sortName,
                sortStatus: opts.sortStatus
            };
            //参数可以是个函数
            if(typeof opts.params === 'function'){
                params = $.extend(params, opts.params());
            }else{
                params = $.extend(params, opts.params);
            }
            params = $.extend(params, newParams);
            if(opts.url){
                $.ajax({
                    type: opts.method,
                    url: opts.url,
                    data: params,
                    dataType: 'json',
                    cache: false//不缓存
                }).done(function(data){
                    thisObject.populate(data);
                });
            }else{
                thisObject.populate(opts.items);
                //开始时排序
                $('.title', thisObject.$thead).each(function(index, item){
                    if(opts.cols[index].sortable && opts.cols[index].name === opts.sortName){
                        var status = opts.sortStatus === 'desc' ? 'asc' : 'desc';
                        $(item).data('sort',status).click();
                    }
                });
            }
        },

        populate: function(items){
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $thead = this.$thead;
            var $bodyWrapper = this.$bodyWrapper;
            var $tbody = this.$tbody;
            var $tbodyParent = $tbody.parent();
            $tbody.detach().empty();//这里最好是先detach,以提高性能

            if(items && items.length != 0){
                this.$noRecord.hide();
                this.$noRecord.data('hasData',true);
                var $thArr = $('th', $thead);
                $.each(items, function(rowIndex, item){
                    var $tr = $('<tr></tr>').hover(function (e) {
                        $('td',this).toggleClass('hover', e.type === 'mouseenter');
                    });
                    $.each(opts.cols, function(colIndex, col){
                        var $td = $('<td></td>').width($thArr.eq(colIndex).width());
                        if(col.hidden === true){
                            $td.hide();
                        }
                        var $content = $('<div class="content"></div>');
                        if(col.align){
                            $content.css('text-align', col.align);
                        }

                        if(col.renderer){
                            var result = col.renderer(item[col.name], item, items, rowIndex, $tr);
                            if(result instanceof jQuery){
                                $content.append(result);
                            }else{
                                $content.html(result);
                            }
                        }else{
                            $content.html(item[col.name]);
                        }

                        $tr.append($td.append($content));
                    });
                    $tbody.append($tr);
                });
                this.setRowStyle();
                this.adjustLayout();
            }else{
                var $tr = $('<tr></tr>');
                var $td = $('<td></td>').css({
                    'border':'0px',
                    'background': 'none'
                }).html('&nbsp;').appendTo($tr);
                $tbody.append($tr);
                this.$noRecord.show().data('hasData',false);
            }
            $tbodyParent.append($tbody);
        },

        setRowStyle: function(){
            var $tbody = this.$tbody;
            var $thead = this.$thead;

            var $tbodyParent = $tbody.parent();
            //$tbody.detach();

            $('tr,td', $tbody).removeClass();

            $('tr:odd', $tbody).addClass('even');
            $('tr > td:first-child', $tbody).addClass('first');
            $('tr > td:last-child', $tbody).addClass('last');
            $('tr:first > td', $tbody).addClass('topRow');

            var sortIndex = $('.title',$thead).index($('.title',$thead).filter(function(){
                return $(this).data('sort') === 'asc' || $(this).data('sort') === 'desc';
            }));
            $('tr > td:nth-child('+(sortIndex+1)+')', $tbody).addClass('colSelected')
                .filter(':even').addClass('colSelectedEven');
            //$tbodyParent.append($tbody);
        },

        bindSorter: function(colIndex, $th){
            var thisObject = this;
            var opts = this.opts;
            var $thead = this.$thead;
            $th.find('.content').append($('<div class="sort"></div>'));
            $th.find('.title').css({
                'cursor':'pointer',
                'text-decoration': 'underline'
            }).on('click',function(e){
                e.preventDefault();
                $('.title', $thead).each(function(index, item){
                    if(index != colIndex){
                        $(item).data('sort',null);
                    }
                });
                $('.sort', $thead).removeClass('asc').removeClass('desc');

                var $title = $(this);
                var $sort = $('.sort', $th).removeClass('asc').removeClass('desc');

                var status = $title.data('sort')==='asc' ? 'desc' : 'asc';
                $title.data('sort',status);
                $sort.addClass(status);

                if(opts.remoteSort){

                }else{
                    thisObject.nativeSort(colIndex,status)
                }

            });

        },

        nativeSort: function(index, status){
            var opts = this.opts;
            console.log('name: ',opts.cols[index].name);
            console.log('status: ', status);

            var col = opts.cols[index];
            this.$tbody.find('td').filter(function(){
                return $(this).index() === index;
            }).sortElements(function(a, b){
                var av = $(a).text();
                var bv = $(b).text();
                //排序前转换
                if(col.type === 'float'){
                    av = parseFloat(av);
                    bv = parseFloat(bv);
                }else if(col.type === 'int'){
                    av = parseInt(av, 10);
                    bv = parseInt(bv, 10)
                }

                return av > bv ? (status === 'desc' ? -1 : 1) : (status === 'desc' ? 1 : -1);
            }, function(){
                return this.parentNode;
            });
            this.setRowStyle();
            this.adjustLayout();

        },

        remoteSort: function(index, status){
            var opts = this.opts;
            var params = {
                sortName: opts.cols[index].name,
                sortStatus: status
            };
            this.load(params);
        },

        adjustLayout: function(colIndex){
            var opts = this.opts;
            var $fastGrid = this.$fastGrid;
            var $headWrapper = this.$headWrapper;
            var $thead = this.$thead;
            var $bodyWrapper = this.$bodyWrapper;
            var $tbody = this.$tbody;
            var $noRecord = this.$noRecord;

            $headWrapper.width(9999);
            $bodyWrapper.detach().width(9999);

            var thArr = $('th', this.$thead);
            var tdArr = $('tr:first > td', this.$tbody);
            if(colIndex >= 0){
                $('tr > td:nth-child('+(colIndex+1)+')', $tbody).width(thArr.eq(colIndex).width());
                $('tr > td:nth-child('+(colIndex+1)+') .content', $tbody).width(thArr.eq(colIndex).find('.content').width());

            }else{
                $.each(thArr, function(index, th){
                    var $th = $(th);
                    if(opts.textEllipsis){
                        tdArr.eq(index).width($th.width());
                        $('tr > td:nth-child('+(index+1)+') .content', $tbody).width($th.find('.content').width());
                    }else{
                        if($th.width() > tdArr.eq(index).width()){
                            tdArr.eq(index).width($th.width());
                        }else{
                            $th.width(tdArr.eq(index).width());
                        }
                    }

                });
            }



            var hwWidth = $thead.parent().outerWidth(true) > $fastGrid.width() ? $thead.parent().outerWidth(true) : $fastGrid.width();
            $headWrapper.width(hwWidth);//收缩包装器
            $bodyWrapper.find('table').width($thead.parent().width());
            $bodyWrapper.width($fastGrid.width())
                .height($fastGrid.height() - $headWrapper.outerHeight(true)).appendTo($fastGrid);
            $bodyWrapper.scrollLeft(-parseInt($thead.parent().css('left'),10));
            var $optButton = this.$optButton;
            $optButton.css({
                'top': $headWrapper.outerHeight(true),
                'left': $bodyWrapper.width() - $optButton.width() - 20
            });
        },

        bindAdjustColumn: function(){

        },

        bindDragColumn: function(){

        }
    };



    $.fn.fastGrid = function(option){
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
        noRecord: '没有数据',
        cols: [],
        sortName: false,
        sortStatus: 'asc',
        remoteSort: false,
        autoLoad: true,
        textEllipsis: false

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