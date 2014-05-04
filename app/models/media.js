
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Imager = require('imager')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , imagerConfig = require(config.root + '/config/imager.js')
  , Schema = mongoose.Schema
  , utils = require('../../lib/utils')
  , rootDirectory = process.env.ROOT 

/**
 * Getters
 */

var getTags = function (tags) {
  return tags.join(',')
}

/**
 * Setters
 */

var setTags = function (tags) {
  return tags.split(',')
}

/**
 * media Schema
 */

var MediaSchema = new Schema({
  title: {type : String, default : '', trim : true},
  body: {type : String, default : '', trim : true},
  user: {type : Schema.ObjectId, ref : 'User'},
  comments: [{
    body: { type : String, default : '' },
    user: { type : Schema.ObjectId, ref : 'User' },
    createdAt: { type : Date, default : Date.now }
  }],
  tags: {type: [], get: getTags, set: setTags},
  image: {
    cdnUri: String,
    files: []
  },
  borrowedBy:{ type : String, default : '' },
  createdAt  : {type : Date, default : Date.now}
})

/**
 * Validations
 */

MediaSchema.path('title').required(true, 'media title cannot be blank');
MediaSchema.path('body').required(true, 'media body cannot be blank');

/**
 * Pre-remove hook
 */

MediaSchema.pre('remove', function (next) {
  var imager = new Imager(imagerConfig, 'S3')
  var files = this.image.files

  // if there are files associated with the item, remove from the cloud too
  imager.remove(files, function (err) {
    if (err) return next(err)
  }, 'media')

  next()
})

/**
 * Methods
 */

MediaSchema.methods = {

  /**
   * Save media and upload image
   *
   * @param {Object} images
   * @param {Function} cb
   * @api private
   */

  uploadAndSave: function (images, cb) {
    if (!images || !images.length) return this.save(cb)
    var self = this

    var serverPath = '/public/images/' + images[0].name;
    var filePath = '/images/' + images[0].name;
  
	this.validate(function(err) {
	
		if (err)
			return cb(err); 
		if(images[0].name == ''){
			self.save(cb);
		}else{
			require('fs').rename(images[0].path, rootDirectory + serverPath, function(error) {
				if (error) {
					console.log(error)
					return cb(error);
				}
				self.image = filePath;
				self.save(cb);
			});
		}
	}); 
  },


  /**
   * Add comment
   *
   * @param {User} user
   * @param {Object} comment
   * @param {Function} cb
   * @api private
   */

  addComment: function (user, comment, cb) {
    var notify = require('../mailer')

    this.comments.push({
      body: comment.body,
      user: user._id
    })

    if (!this.user.email) this.user.email = 'email@product.com'
    notify.comment({
      media: this,
      currentUser: user,
      comment: comment.body
    })

    this.save(cb)
  },

  /**
   * Remove comment
   *
   * @param {commentId} String
   * @param {Function} cb
   * @api private
   */

  removeComment: function (commentId, cb) {
    var index = utils.indexof(this.comments, { id: commentId })
    if (~index) this.comments.splice(index, 1)
    else return cb('not found')
    this.save(cb)
  }
}

/**
 * Statics
 */

MediaSchema.statics = {

  /**
   * Find media by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('user', 'name email username')
      .populate('comments.user')
      .exec(cb)
  },

  /**
   * List medias
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .populate('user', 'name username')
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb)
  }

}

mongoose.model('media', MediaSchema)
