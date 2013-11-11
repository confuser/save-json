var idProperty = 'testId'
  , save = require('../json-engine')('test.json', { idProperty: idProperty })
  , fixtures = require('./fixtures')
  , should = require('should')
  , fs = require('fs')
  , _ = require('lodash')


describe('#init', function () {
  it('should setup save correctly', function () {
    save.should.not.equal(false)
    save.idProperty.should.equal(idProperty)
  })
})

describe('#create', function() {
  it('should create a new object', function (done) {
    save.create(fixtures[0], function (error, object) {
      should.not.exist(error)
      should.exist(object)

      object.should.have.property(idProperty)
      object[idProperty].should.equal(1)

      done()
    })
  })

  it('should auto increment the id', function (done) {
    save.create(fixtures[1], function (error, object) {
      should.not.exist(error)
      should.exist(object)

      object.should.have.property(idProperty)
      object[idProperty].should.equal(2)

      done()
    })
  })
})

describe('#read', function () {
  it('should find an object', function (done) {
    save.read(1, function (error, object) {
      should.not.exist(error)
      should.exist(object)

      object.should.have.property(idProperty)
      object[idProperty].should.equal(1)

      done()
    })
  })
})

describe('#update', function () {
  it('should update an object', function (done) {
    save.read(1, function (error, object) {
      should.not.exist(error)
      should.exist(object)

      object.should.have.property(idProperty)
      object[idProperty].should.equal(1)

      object['test'] = 'asd'
      object[idProperty]++

      save.update(object, function (err, updatedObject) {
        should.not.exist(err)
        should.exist(updatedObject)

        updatedObject.should.have.property('test')

        // Ensure we aren't being passed a reference
        updatedObject.should.not.equal(object)

        done()
      })


    })
  })
})

describe('#updateMany', function () {
  it('should throw an error', function () {
    try {
      save.updateMany(fixtures[0])
    } catch(e) {
      e.message.should.equal('updateMany is not implemented for the json save engine')
    }
  })
})

describe('#deleteMany', function () {
  it('should throw an error', function () {
    try {
      save.deleteMany(fixtures[0])
    } catch(e) {
      e.message.should.equal('deleteMany is not implemented for the json save engine')
    }
  })
})

describe('#count', function () {
  it('should return the number of objects found', function (done) {
    save.count({ foo: 'bar' }, function (error, count) {
      should.not.exist(error)
      count.should.equal(2)

      done()
    })
  })
})

describe('#find', function () {
  it('should find objects', function (done) {
    save.find({ foo: 'bar' }, function (error, objects) {
      should.not.exist(error)

      objects.length.should.equal(2)

      _.each(objects, function (object) {
        object.foo.should.equal('bar')
      })

      done()
    })
  })

  it('should find all objects', function (done) {
    save.find({}, function (error, objects) {
      should.not.exist(error)

      objects.length.should.equal(2)

      _.each(objects, function (object) {
        object.foo.should.equal('bar')
      })

      done()
    })
  })
})

describe('#findOne', function () {
  it('should find objects', function (done) {
    save.findOne({ foo: 'bar' }, function (error, object) {
      should.not.exist(error)

      _.isArray(object).should.equal(false)
      _.isObject(object).should.equal(true)

      object.foo.should.equal('bar')

      done()
    })
  })
})

describe('#createOrUpdate', function() {
  it('should create a new object', function (done) {
    save.createOrUpdate(fixtures[1], function (error, object) {
      should.not.exist(error)
      should.exist(object)

      object.should.have.property(idProperty)
      object[idProperty].should.equal(3)

      done()
    })
  })

  it('should update an object', function (done) {
    save.read(3, function (error, object) {
      object['foo'] = 'nobar'
      save.createOrUpdate(object, function (error, updatedObject) {
        should.not.exist(error)
        should.exist(updatedObject)

        updatedObject.should.have.property('foo')
        updatedObject.foo.should.equal('nobar')
        updatedObject[idProperty].should.equal(3)
        updatedObject.should.not.equal(object)

        done()
      })
    })
  })
})

describe('#delete', function () {
  it('should delete an object', function (done) {
    save.delete(2, function (error, id) {
      should.not.exist(error)
      should.exist(id)
      id.should.equal(2)


      save.read(2, function (err, object) {
        err.message.should.equal('No object found with \'' + idProperty + '\' = \'2\'')
        should.strictEqual(object, undefined)

        done()
      })

    })
  })
})

after(function() {
  fs.unlinkSync('test.json')
})