/**
 * User: meimeibw
 * Date: 12-8-9
 * Time: 下午2:03
 */

!function(){
    var FastGrid = function(element, options){

    };

    FastGrid.prototype = {
        populate: function(){

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
        height: 256,
        url: false,
        params: false, //可以是object也可以是function
        colModule: [],
        autoLoad: true
    };

    $.fn.fastGrid.Constructor = FastGrid;
}(window.jQuery);