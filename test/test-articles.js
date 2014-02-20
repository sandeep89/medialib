
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , should = require('should')
  , request = require('supertest')
  , app = require('../server')
  , context = describe
  , User = mongoose.model('User')
  , media = mongoose.model('media')
  , agent = request.agent(app)

var count

/**
 * medias tests
 */

describe('medias', function () {
  before(function (done) {
    // create a user
    var user = new User({
      email: 'foobar@example.com',
      name: 'Foo bar',
      username: 'foobar',
      password: 'foobar'
    })
    user.save(done)
  })

  describe('GET /medias', function () {
    it('should respond with Content-Type text/html', function (done) {
      agent
      .get('/medias')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(/medias/)
      .end(done)
    })
  })

  describe('GET /medias/new', function () {
    context('When not logged in', function () {
      it('should redirect to /login', function (done) {
        agent
        .get('/medias/new')
        .expect('Content-Type', /plain/)
        .expect(302)
        .expect('Location', '/login')
        .expect(/Moved Temporarily/)
        .end(done)
      })
    })

    context('When logged in', function () {
      before(function (done) {
        // login the user
        agent
        .post('/users/session')
        .field('email', 'foobar@example.com')
        .field('password', 'foobar')
        .end(done)
      })

      it('should respond with Content-Type text/html', function (done) {
        agent
        .get('/medias/new')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(/New media/)
        .end(done)
      })
    })
  })

  describe('POST /medias', function () {
    context('When not logged in', function () {
      it('should redirect to /login', function (done) {
        request(app)
        .get('/medias/new')
        .expect('Content-Type', /plain/)
        .expect(302)
        .expect('Location', '/login')
        .expect(/Moved Temporarily/)
        .end(done)
      })
    })

    context('When logged in', function () {
      before(function (done) {
        // login the user
        agent
        .post('/users/session')
        .field('email', 'foobar@example.com')
        .field('password', 'foobar')
        .end(done)
      })

      describe('Invalid parameters', function () {
        before(function (done) {
          media.count(function (err, cnt) {
            count = cnt
            done()
          })
        })

        it('should respond with error', function (done) {
          agent
          .post('/medias')
          .field('title', '')
          .field('body', 'foo')
          .expect('Content-Type', /html/)
          .expect(200)
          .expect(/media title cannot be blank/)
          .end(done)
        })

        it('should not save to the database', function (done) {
          media.count(function (err, cnt) {
            count.should.equal(cnt)
            done()
          })
        })
      })

      describe('Valid parameters', function () {
        before(function (done) {
          media.count(function (err, cnt) {
            count = cnt
            done()
          })
        })

        it('should redirect to the new media page', function (done) {
          agent
          .post('/medias')
          .field('title', 'foo')
          .field('body', 'bar')
          .expect('Content-Type', /plain/)
          .expect('Location', /\/medias\//)
          .expect(302)
          .expect(/Moved Temporarily/)
          .end(done)
        })

        it('should insert a record to the database', function (done) {
          media.count(function (err, cnt) {
            cnt.should.equal(count + 1)
            done()
          })
        })

        it('should save the media to the database', function (done) {
          media
          .findOne({ title: 'foo'})
          .populate('user')
          .exec(function (err, media) {
            should.not.exist(err)
            media.should.be.an.instanceOf(media)
            media.title.should.equal('foo')
            media.body.should.equal('bar')
            media.user.email.should.equal('foobar@example.com')
            media.user.name.should.equal('Foo bar')
            done()
          })
        })
      })
    })
  })

  after(function (done) {
    require('./helper').clearDb(done)
  })
})
