/**
 * Created with JetBrains WebStorm.
 * User: meimeibw
 * Date: 12-8-8
 * Time: 上午11:08
 * To change this template use File | Settings | File Templates.
 */

module.exports = function(app){
    app.get('/examples/fastGrid-native-multiSelect', function(req, res){
        res.render('examples/fastGrid-native-multiSelect',{
            title: 'fastGrid-native-multiSelect'
        });
    });
    app.get('/examples/fastGrid-ajax-nowrap', function(req, res){
        res.render('examples/fastGrid-ajax-nowrap',{
            title: 'fastGrid-ajax-nowrap'
        });
    });
    app.get('/examples/fastGrid-options', function(req, res){
        res.render('examples/fastGrid-options',{
            title: 'fastGrid-options'
        });
    });
};