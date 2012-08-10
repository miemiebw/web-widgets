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
            var $tbody = this.$tbody;//这里最好是先detach,以提高性能
            var opts = this.opts;

            if(items.length != 0){
                $.each(items, function(rowIndex, row){
                    var $tr = $('<tr></tr>').hover(function (e) {
                        $(this).toggleClass('selected', e.type === 'mouseenter');
                    });

                    if(rowIndex % 2 === 1 ){
                        $tr.addClass('even');
                    }

                    $.each(opts.cols, function(colIndex, col){
                        var $div = $('<div></div>');


                        var $td = $('<td></td>');

                        if(colIndex === 0){
                            $td.addClass('first');
                        }
                        if(colIndex === opts.cols.length-1){
                            $td.addClass('last');
                        }
                        if(rowIndex === 0){
                            $td.addClass('topLine');
                        }

                        $td.width(col.width)
                            .append($div);
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
        autoLoad: true
    };

    $.fn.fastGrid.Constructor = FastGrid;
}(window.jQuery);