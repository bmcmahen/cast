var assert = require('assert');
var cast = require('cast');
var $ = require('jquery');

var testTemplate = function(attr){
  return '<p>'+attr.name+'</p>';
};

var container = document.createElement('div');
container.id = 'cast';
container.style.width = 500 + 'px';
document.body.appendChild(container);

describe('Cast', function(){

  beforeEach(function(){
    this.cast = cast(container);
  });

  afterEach(function(){
    delete this.cast;
  });

  it('should be constructed with a container', function(){
    assert(this.cast);
    assert(this.cast instanceof cast);
    assert(this.cast.wrapper);
  });

  it('should set the width', function(){
    assert(this.cast.wrapperWidth === 500);
  });

  it('should be constructed with a string selector', function(){
    var c = cast('#cast');
    assert(c.wrapper);
    assert(c.wrapperWidth === 500);
  });

  it('should be optionally constructed only with a width', function(){
    var c = cast(300);
    assert(!c.wrapper);
    assert(c.wrapperWidth === 300);
  });

  describe('#data', function(){
    var docs = [{name: 'ben'}, {name: 'kit'}, {name: 'joe'}];

    it('should iterate through the docs array and create models', function(){
      this.cast.data(docs, 'name');
      assert(this.cast.collection.length() === 3);
      assert(this.cast.collection.at(0).get('name') === 'ben');
      assert(this.cast.collection.get('ben').get('name') === 'ben');
    });

    it('should support a fn callback to determine unique id', function(){
      this.cast.data(docs, function(attr){
        return attr.name;
      });
      assert(this.cast.collection.length() === 3);
    });

    it('should set docs without a unique id', function(){
      this.cast.data(docs);
      assert(this.cast.collection.length() === 3);
      assert(this.cast.collection.at(0).get('name') === 'ben');
    });

    it('should remove missing docs upon subsequent calls', function(){
      this.cast.data(docs, 'name');
      this.cast.data([{ name: 'ben' }], 'name');
      assert(this.cast.collection.length() === 1);
      assert(!this.cast.collection.get('kit'));
    });

    it('should fill in new docs upon subsquent calls', function(){
      this.cast.data(docs, 'name');
      var extended = docs;
      extended.push({ name: 'superman' });
      this.cast.data(extended, 'name');
      assert(this.cast.collection.get('superman'));
      assert(this.cast.toJSON().length === 4);
    });

  });

  describe('#toJSON', function(){
    var docs = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];

    it('should return all of our docs', function(){
      this.cast.data(docs, 'name');
      var json = this.cast.toJSON();
      assert(json.length === 3);
      assert(json[0].name === 'ben');
      assert(json[0].age == 28);
      assert(json[2].name === 'joe');
    });

  });

  describe('#reset', function(){
    var docs = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];

    it('should clear out our previous attributes, and add new ones', function(){
      this.cast.data(docs, 'name');
      this.cast.reset([{name: 'albert'}, {name: 'roger'}], 'name');
      var json = this.cast.toJSON();
      assert(json.length === 2);
      assert(!this.cast.collection.get('ben'));
      assert(json[0].name === 'albert');
      assert(json[1].name === 'roger');
    });
  });

  describe('#add', function(){

    it('should add a value to an empty cast collection', function(){
      this.cast.add({name: 'ben'}, 'name');
      assert(this.cast.toJSON()[0].name === 'ben');
      this.cast.add({name: 'kit'}, 'name');
      assert(this.cast.toJSON().length === 2);
      assert(this.cast.toJSON()[1].name === 'kit');
    });

    it('should add a value without a uid', function(){
      this.cast.collection.clear();
      this.cast.add({name: 'ben'});
      assert(this.cast.collection.length() === 1);
      this.cast.add({name: 'kit'});
      assert(this.cast.collection.length() === 2);
    });

  });

  // better tests here...
  describe('#justify', function(){
    var docs = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];
    
    it('should set a left and top attribute', function(){
      this.cast.data(docs, 'name');
      this.cast.justify(50, 50, 20, 20);
      var json = this.cast.toJSON();
      assert(json);
      for (var i = 0; i < json.length; i++){
        assert(typeof json[i].left !== 'undefined');
        assert(json[i].top);
      }
    });

    it('should set the first to 0, 20; last to 450, 20', function(){
      this.cast.data(docs, 'name');
      this.cast.justify(50, 50, 20, 20);
      var json = this.cast.toJSON();
      assert(json[0].left === 0);
      assert(json[0].top === 20);
    });
  });

    // better tests here...
  describe('#center', function(){
    var docs = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];
    
    it('should set a left and top attribute', function(){
      this.cast.data(docs, 'name');
      this.cast.center(50, 50, 20, 20);
      var json = this.cast.toJSON();
      assert(json);
      for (var i = 0; i < json.length; i++){
        assert(json[i].left);
        assert(json[i].top);
      }

    });
  });

    // better tests here...
  describe('#dynamic', function(){
    var docs = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];
    
    it('should set a left, top, width, and height', function(){
      this.cast.data(docs, 'name');
      this.cast.dynamic(50, 50, 20, 20);
      var json = this.cast.toJSON();
      assert(json);
      for (var i = 0; i < json.length; i++){
        assert(json[i].left);
        assert(json[i].top);
        assert(json[i].width);
        assert(json[i].top);
      }

    });


  });

  describe('#draw', function(){
    var docs = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];

    beforeEach(function(){
      this.cast = cast(container)
        .data(docs, 'name')
        .justify(50, 50, 20, 20)
        .draw(testTemplate);
    });

    afterEach(function(){
      delete this.cast;
    });

    it('should attach itself to the container', function(){
      assert(container.children[0].children.length === 3);
    });

    it('should render using the supplied template', function(){
      assert($(container.children[0].children[0]).find('p').text() === 'ben');
      assert($(container.children[0].children[1]).find('p').text() === 'kit');
    });

    it('should remove a view when associated doc is removed', function(done){
      this.cast.data([{name: 'ben'}], 'name');

      setTimeout(function(){
        assert($('.cast-item').length === 1);
        assert($('.cast-item').find('p').text() === 'ben');
        done();
      }, 500);
    });

    it('should add a view when new doc is added', function(){
      this.cast.data([{name: 'zoey'}], 'name');
      assert($('.cast-item').length === 4);
    });


  });

});
