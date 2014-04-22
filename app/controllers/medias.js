/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , media = mongoose.model('media')
  , utils = require('../../lib/utils')
  , extend = require('util')._extend

/**
 * Load
 */


exports.load = function(req, res, next, id){
  var User = mongoose.model('User')

  media.load(id, function (err, media) {
    if (err) return next(err)
    if (!media) return next(new Error('not found'))
    req.media = media
    next()
  })
}

/**
 * List
 */

exports.index = function(req, res){
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 30
  var options = {
    perPage: perPage,
    page: page
  }

  media.list(options, function(err, medias) {
    if (err) return res.render('500')
    media.count().exec(function (err, count) {
      res.render('medias/index', {
        title: 'medias',
        medias: medias,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}

/**
 * New media
 */

exports.new = function(req, res){
  res.render('medias/new', {
    title: 'New media',
    media: new media({})
  })
}

/**
 * Create an media
 */

exports.create = function (req, res) {
  var Media = new media(req.body)
  Media.user = req.user

  Media.uploadAndSave(req.files.image, function (err) {
    console.log(media._id);
    if (!err) {
      req.flash('success', 'Successfully created media!')
      return res.redirect('/medias/'+Media._id)
    }

    res.render('medias/new', {
      title: 'New media',
      media: Media,
      error: utils.errors(err.errors || err)
    })
  })
}

/**
 * Edit an media
 */

exports.edit = function (req, res) {
  res.render('medias/edit', {
    title: 'Edit ' + req.media.title,
    media: req.media
  })
}

/**
 * Update media
 */

exports.update = function(req, res){
  var media = req.media
  media = extend(media, req.body)

  media.uploadAndSave(req.files.image, function(err) {
    if (!err) {
      return res.redirect('/medias/' + media._id)
    }

    res.render('medias/edit', {
      title: 'Edit media',
      media: media,
      error: utils.errors(err.errors || err)
    })
  })
}

/**
 * Show
 */

exports.show = function(req, res){
  res.render('medias/show', {
    title: req.media.title,
    media: req.media
  })
}

/**
 * Delete an media
 */

exports.destroy = function(req, res){
  var media = req.media
  media.remove(function(err){
    req.flash('info', 'Deleted successfully')
    res.redirect('/medias')
  })
}
