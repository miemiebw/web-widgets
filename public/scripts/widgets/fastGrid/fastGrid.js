/**
 * User: meimeibw
 * Date: 12-8-9
 * Time: 下午2:03
 */

!function(){
    var FastGrid = function(element, options){
        var $el = $(element);
        this.opts = options;

        var $elParent = $el.parent();
        $el.detach();
        this.$fastGrid = $('<div class="fastGrid"></div>');
        this.$headWrapper = $('<div class="headWrapper"></div>').appendTo(this.$fastGrid);
        this.$thead = $('<thead></thead>').wrap('<table class="tableHead"></table>');
        this.$thead.parent().appendTo(this.$headWrapper);
        this.$bodyWrapper = $('<div class="bodyWrapper"></div>').appendTo(this.$fastGrid);
        this.$tbody = $('<tbody></tbody>').appendTo($el);
        $el.addClass('tableBody').appendTo(this.$bodyWrapper);
        $elParent.append(this.$fastGrid);

        this.init();
        this.populate(options.items);
    };

    FastGrid.prototype = {

        init: function(){
            var thisObject = this;
            var $thead = this.$thead;
            var opts = this.opts;
            //设置高宽
            this.$fastGrid.width(opts.width).height(opts.height);

            var $tr = $('<tr></tr>');
            if(opts.cols.length != 0){
                var contentWidth = 0;
                $.each(opts.cols, function(index, col){
                    var $th = $('<th></th>');
                    if(index === 0){
                        $th.addClass('first');
                    }
                    if(index === opts.cols.length-1){
                        $th.addClass('last');
                    }
                    if(col.title){
                        $th.html(col.title);
                    }
                    if(col.width){
                        if(index === 0){
                            contentWidth += col.width+2;
                        }else{
                            contentWidth += col.width+1;
                        }
                        $th.width(col.width);
                    }
                    if(opts.sort){
                        thisObject.bindSort($th);
                    }

                    $tr.append($th);
                });
                this.$thead.parent().width(contentWidth);
            }
            $thead.append($tr);

            var $headWrapper = this.$headWrapper;
            var $bodyWrapper = this.$bodyWrapper;
            var $headTable = this.$thead.parent();
            $bodyWrapper.width(opts.width)
                .height(this.$fastGrid.height() - $headWrapper.outerHeight(true))
                .on('scroll', function(e){
                    $headTable.css('left',- $bodyWrapper.scrollLeft());
                });

        },

        populate: function(items){
            var $tbody = this.$tbody.empty();//这里最好是先detach,以提高性能
            var opts = this.opts;

            if(items.length != 0){
                var $thArr = $('th', this.$thead);
                $.each(items, function(rowIndex, row){
                    var $tr = $('<tr></tr>').hover(function (e) {
                        $('td',this).toggleClass('hover', e.type === 'mouseenter');
                    });
                    $.each(opts.cols, function(colIndex, col){
                        var $div = $('<div></div>');

                        var $td = $('<td></td>');

                        var $th = $thArr.eq(colIndex);
                        if($th.data('sort')){
                            if(even){
                                $td.addClass('colSelectedEven');
                            }else{
                                $td.addClass('colSelected');
                            }
                        }

                        $td.width(col.width).append($div);
                        if(col.renderer){
                            var result = col.renderer(row[col.name], row, items, $tr, rowIndex);
                            if( result instanceof jQuery){
                                $div.append(result);
                            }else{
                                $div.html(result);
                            }
                        }else{
                            $div.html(row[col.name]);
                        }
                        $tr.append($td);
                    });
                    $tbody.append($tr);
                });

            }
            $tbody.parent().width( this.$thead.parent().width()+1);

            //fix:IE8没有下方滚动条，不知道为什么,但是y滚动条的时候要算滚动条宽度才行
            if($tbody.parent().width() > this.$bodyWrapper.width()){
                this.$bodyWrapper.css('overflow-x', 'scroll');
            }

            this.setupStyle();
        },

        setupStyle: function(){
            var $tbody = this.$tbody;

            $('tr,td', this.$tbody).removeClass();

            $('tr:odd', $tbody).addClass('even');
            $('tr > td:first-child', $tbody).addClass('first');
            $('tr > td:last-child', $tbody).addClass('last');
            $('tr:first > td', $tbody).addClass('topRow');


            var sortIndex = $('th',this.$thead).index($('th',this.$thead).filter(function(){
                return $(this).data('sort') === 'asc' || $(this).data('sort') === 'desc';
            }));
            console.log('sortIndex: ',sortIndex);
            $('tr > td:nth-child('+(sortIndex+1)+')', $tbody).addClass('colSelected').filter(':even').addClass('colSelectedEven');
        },

        //绑定排序功能
        bindSort: function($th){
            var thisObject = this;
            var opts = this.opts;

            $th.append($('<div class="sort"></div>'));
            $th.on('click', function(){
                thisObject.clearSortStatus($('th',$th.parent()).index($th));
                var $this = $(this);
                if(!$this.data('sort') || $this.data('sort') === 'desc'){
                    $this.data('sort','asc');
                }else if($this.data('sort') === 'asc'){
                    $this.data('sort','desc');
                }
                $this.mouseenter();
                //thisObject.populate(opts.items);
                thisObject.processSort($('th',$th.parent()).index($th), $this.data('sort'));

            }).on('mouseenter', function(){
                var $this = $(this);
                $('.sort', $this).removeClass('up').removeClass('dn');
                if(!$this.data('sort') || $this.data('sort') === 'desc'){
                    $('.sort', $this).addClass('up').css('left',($this.width()-7)/2);
                }else if($this.data('sort') === 'asc'){
                    $('.sort', $this).addClass('dn').css('left',($this.width()-7)/2);
                }
            }).on('mouseleave', function(){
                var $this = $(this);
                $('.sort', $this).removeClass('up').removeClass('dn');
                if($this.data('sort') === 'asc'){
                    $('.sort', $this).addClass('up').css('left',($this.width()-7)/2);
                }else if($this.data('sort') === 'desc'){
                    $('.sort', $this).addClass('dn').css('left',($this.width()-7)/2);
                }
            });
        },
        //处理排序
        processSort: function(index, status){
            var opts = this.opts;
            console.log('name: ',opts.cols[index].name);
            console.log('status: ', status);



            this.$tbody.find('td').filter(function(){
                return $(this).index() === index;
            }).sortElements(function(a, b){
                return $(a).text() > $(b).text() ? (status === 'asc' ? -1 : 1) : (status === 'asc' ? 1 : -1);
            }, function(){
                return this.parentNode;
            });

            this.setupStyle();

        },
        //清除排序状态
        clearSortStatus: function(colIndex){
            $('.sort', this.$thead).removeClass('up').removeClass('dn').each(function(index,item){
                if(colIndex != index){
                    $(item).parent().data('sort',null);
                }
            });
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
        width: 'auto',
        height: '256px',
        url: false,
        params: false, //可以是object也可以是function
        items: [],
        cols: [],
        sort: true,
        sortName: false,
        sortStatus: 'asc',
        remoteSort: false,
        autoLoad: true
    };

    $.fn.fastGrid.Constructor = FastGrid;

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