# save-json

[![Build Status](https://travis-ci.org/confuser/save-json.png?branch=master)](https://travis-ci.org/confuser/save-json)

JSON based file persistance engine for [save](https://npmjs.org/package/save) using lodash _.where style find queries.

## Installation

    npm install save-json

## Usage

```js
var save = require('save') // npm install save
  , saveJson = require('..')

// Create a save object and pass in a saveJson engine.
var contactStore = save('Contact', { engine: saveJson('contact.json') })

// Ensure the engine initialised correctly
if (!contactStore)
  throw Error('Could not initiate json save') // Common cause is file creation issue

// Then we can create a new object.
contactStore.create({ name: 'James', email: 'jamesmortemore@gmail.com'}, function (error, contact) {

  // The created 'contact' is returned and has been given an id
  console.log(contact)
  
  // Now check the contents of contact.json... magic!
})

// Lets find that object with a lodash _.where style query. Simple!
contactStore.findOne({ name: 'James' }, function (error, contact) {
    // Will be the object created above
    console.log(contact)
})
```

## Licence
Licensed under the [New BSD License](http://opensource.org/licenses/bsd-license.php)