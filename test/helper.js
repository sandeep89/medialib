
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , async = require('async')
  , media = mongoose.model('media')
  , User = mongoose.model('User')

/**
 * Clear database
 *
 * @param {Function} done
 * @api public
 */

exports.clearDb = function (done) {
  async.parallel([
    function (cb) {
      User.collection.remove(cb)
    },
    function (cb) {
      media.collection.remove(cb)
    }
  ], done)
}
