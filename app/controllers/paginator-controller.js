/**
 * Created with JetBrains WebStorm.
 * User: meimeibw
 * Date: 12-8-19
 * Time: 下午15:31
 */

module.exports = function(app){
  app.get('/examples/paginator', function(req, res){
      res.render('examples/paginator',{
          title: 'paginator'
      });
  });
};