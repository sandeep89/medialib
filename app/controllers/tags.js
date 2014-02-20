/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Media = mongoose.model('media')

/**
 * List items tagged with a tag
 */

exports.index = function (req, res) {
  var criteria = { tags: req.param('tag') }
  var perPage = 5
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var options = {
    perPage: perPage,
    page: page,
    criteria: criteria
  }

  Media.list(options, function(err, medias) {
    if (err) return res.render('500')
    Media.count(criteria).exec(function (err, count) {
      res.render('medias/index', {
        title: 'Medias tagged ' + req.param('tag'),
        medias: medias,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}
