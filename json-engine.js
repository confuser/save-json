var _ = require('lodash')
  , emptyFn = function () {}
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs')

// Note, initial require will cause a block due to file setup (create/read)

module.exports = function (file, engineOptions) {
  var self = new EventEmitter()
    , options = _.extend({ idProperty: 'id' }, engineOptions)
    , data = []
    , idIndexData = {}

  try {
    // Check if the file exists, if not, create it
    if (!fs.existsSync(file)) {
      fs.openSync(file, 'w')
    } else {
      var fileData = fs.readFileSync(file)

      if (fileData.length !== 0) data = JSON.parse(fileData)
    }
  } catch (e) {
    self.emit('error', e)
    return false
  }

  // Build id index
  data.forEach(function (object) {
    idIndexData[object[options.idProperty]] = object
  })

  // Handle id increment
  function getNextId() {
    var dataIds = Object.keys(idIndexData)

    dataIds.sort(function (a, b) {
      return b - a
    })

    if (dataIds && dataIds[0]) {
      var id = _.parseInt(dataIds[0]) + 1
      return id
    } else {
      return 1
    }
  }

  function saveFile(emit, object, callback) {
    fs.writeFile(file, JSON.stringify(data, null, 2), function (error) {
      if (error) return callback(error)

      if (emit) self.emit(emit, object)

      callback(error, _.clone(object))
    })
  }


  function create(object, callback) {
    var createdObject = _.clone(object)

    callback = callback || emptyFn
    // if id is any falsy consider it empty
    if (!createdObject[options.idProperty]) {
      delete object[options.idProperty]
    }
    self.emit('create', createdObject)

    var id = getNextId()

    createdObject[options.idProperty] = id

    idIndexData[id] = createdObject
    data.push(createdObject)

    saveFile('afterCreate', createdObject, callback)
  }

  function createOrUpdate(object, callback) {
    if (typeof object[options.idProperty] === 'undefined') {
      // Create a new object
      self.create(object, callback)
    } else {
      // Try and find the object first to update
      self.read(object[options.idProperty], function(err, entity) {
        if (err) {
          return callback(err)
        }
        if (entity) {
          // We found the object so update
          self.update(object, callback)
        } else {
          // We didn't find the object so create
          self.create(object, callback)
        }
      })
    }
  }

  function read(id, callback) {
    self.emit('read', id)

    callback = callback || emptyFn
    var error = null

    if (!idIndexData[id]) {
      error = new Error('No object found with \'' + options.idProperty +
          '\' = \'' + id + '\'')
    }

    callback(error, _.clone(idIndexData[id]))
  }

  function update(object, overwrite, callback) {
    /* jshint maxcomplexity: 7 */
    if (typeof overwrite === 'function') {
      callback = overwrite
      overwrite = false
    }

    self.emit('update', object, overwrite)
    callback = callback || emptyFn
    var updateObject = _.extend({}, object)
      , id = object[options.idProperty]

    if (id === undefined || id === null) {
      return callback(new Error('Object has no \''
        + options.idProperty + '\' property'))
    }

    if (!idIndexData[id]) {
      return callback(new Error('No object found with \'' + options.idProperty +
          '\' = \'' + id + '\''))
    }

    var updateData = overwrite ? updateObject : _.extend(idIndexData[id], updateObject)
    idIndexData[id] = updateData

    // update our data
    var find = {}
    find[options.idProperty] = id
    data.splice(_.findIndex(data, find), 1, updateData);

    saveFile('afterUpdate', updateData, callback)
  }


  function updateMany() {
    throw new Error('updateMany is not implemented for the json save engine')
  }

  function deleteMany() {
    throw new Error('deleteMany is not implemented for the json save engine')
  }

   /**
   * Deletes one object. Returns an error if the object can not be found
   * or if the ID property is not present.
   *
   * @param {Object} object to delete
   * @param {Function} callback
   * @api public
   */
  function del(id, callback) {

    callback = callback || emptyFn

    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function or empty')
    }

    if (!idIndexData[id]) {
      return callback(new Error('No object found with \'' + options.idProperty +
          '\' = \'' + id + '\''))
    }

    self.emit('delete', id)

    delete idIndexData[id]

    // Work around for dynamic property
    var find = {}
    find[options.idProperty] = id

    data.splice(_.findIndex(data, find), 1)

    saveFile('afterDelete', id, callback)
  }

  function findOne(query, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    self.emit('findOne', query)

    var foundData = _.where(data, query)

    if (!foundData || !foundData.length) return callback(new Error('No object found'))

    callback(null, _.clone(foundData[0]))
  }

  function find(query, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    self.emit('find', query)

    if (Object.keys(query).length === 0) return callback(null, _.clone(data))

    var foundData = _.where(data, query)

    if (!foundData || !foundData.length) return callback(new Error('No objects found'))

    callback(null, _.clone(foundData))
  }

  function count(query, callback) {
    self.emit('count', query)

    self.find(query, function (error, objects) {
      callback(null, objects ? objects.length : 0)
    })
  }

  return _.extend(self,
    { create: create
    , createOrUpdate: createOrUpdate
    , read: read
    , update: update
    , updateMany: updateMany
    , deleteMany: deleteMany
    , 'delete': del
    , find: find
    , findOne: findOne
    , count: count
    , idProperty: options.idProperty
    })
}