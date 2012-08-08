/**
 * Created with JetBrains WebStorm.
 * User: meimeibw
 * Date: 12-8-8
 * Time: 上午11:08
 * To change this template use File | Settings | File Templates.
 */

module.exports = function(app){
  app.get('/examples/textProposal', function(req, res){
      res.render('examples/textProposal',{
          title: 'textProposal'
      });
  });
};