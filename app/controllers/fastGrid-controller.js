/**
 * Created with JetBrains WebStorm.
 * User: meimeibw
 * Date: 12-8-8
 * Time: 上午11:08
 * To change this template use File | Settings | File Templates.
 */

module.exports = function(app){
    app.get('/examples/fastGrid', function(req, res){
        res.render('examples/fastGrid',{
            title: 'fastGrid'
        });
    });
    app.get('/examples/fastGrid-nowrap', function(req, res){
        res.render('examples/fastGrid-nowrap',{
            title: 'fastGrid-nowrap'
        });
    });
    app.get('/examples/fastGrid-options', function(req, res){
        res.render('examples/fastGrid-options',{
            title: 'fastGrid-options'
        });
    });
};