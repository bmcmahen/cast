var testTemplate = function(attr){
  return '<p>'+attr.name+'</p>';
};

describe('Cast', function(){

  beforeEach(function(){
    this.cast = new cast();
  });

  afterEach(function(){
    delete this.cast;
  });

  it('should get constructed without arguments', function(){
    should.exist(this.cast);
    this.cast.should.be.an.instanceOf(cast);
  });

  describe('#data()', function(){
    var attributes = [{name: 'ben'}, {name: 'kit'}, {name: 'joe'}];

    it('should iterate through the array and create models', function(){
      this.cast.data(attributes, function(attr){
        return attr.name;
      });
      this.cast.collection.length().should.equal(3);
      this.cast.collection.at(0).get('name').should.equal('ben');
      this.cast.collection.get('ben').get('name').should.equal('ben');
    });

    it('should set attributes without a unique key', function(){
      this.cast.data(attributes);
      this.cast.collection.length().should.equal(3);
      this.cast.collection.at(0).get('name').should.equal('ben');
    });

    it('should remove missing attributes upon subsequent data()', function(){
      this.cast.data(attributes, function(attr){ return attr.name; });
      this.cast.data([{name: 'ben'}], function(attr){ return attr.name; });
      this.cast.collection.length().should.equal(1);
      should.not.exist(this.cast.collection.get('kit'));
    });

    it('should fill in new attributes upon subsequent data()', function(){
      this.cast.data(attributes, function(attr){return attr.name; });
      var extended = attributes;
      extended.push({name: 'superman'});
      this.cast.data(extended, function(attr){return attr.name; });
      should.exist(this.cast.collection.get('superman'));
      this.cast.toJSON().length.should.equal(4);
    });
  });

describe('#.toJSON()', function(){
    var attributes = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];
    it('should return all of our attributes', function(){
      this.cast.data(attributes, function(a){return a.name; });
      var json = this.cast.toJSON();
      json.length.should.equal(3);
      json[0].name.should.equal('ben');
      json[0].age.should.equal(28);
      json[2].name.should.equal('joe');
    });
});

describe('#reset()', function(){
  var attributes = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];
  it('should clear out our previous attributes, and add the new ones', function(){
    this.cast.data(attributes, function(a){return a.name; });
    this.cast.reset([{name: 'albert'}, {name: 'roger'}], function(a){
      return a.name;
    });
    var json = this.cast.toJSON();
    json.length.should.equal(2);
    should.not.exist(this.cast.collection.get('ben'));
    json[0].name.should.equal('albert');
    json[1].name.should.equal('roger');
  });
});

describe('#add()', function(){
  it('should add a value to an empty cast collection', function(){
    this.cast.add([{name: 'ben'}], function(k){return k.name; });
    this.cast.toJSON()[0].name.should.equal('ben');
    this.cast.add({name: 'kit'}, function(k){return k.name; });
    this.cast.toJSON().length.should.equal(2);
    this.cast.toJSON()[1].name.should.equal('kit');
  });

  it('should add a value without unique key', function(){
    this.cast.collection.clear();
    this.cast.add({name: 'ben'});
    this.cast.collection.length().should.equal(1);
    this.cast.add({name: 'kit'});
    this.cast.collection.length().should.equal(2);
  });
});

describe('#justify()', function(){
  var attributes = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];
  it('should update our options', function(){
    this.cast.justify({
      wrapperWidth: 400,
      boxWidth: 50,
      boxHeight: 50,
      paddingWidth: 20,
      paddingHeight: 20
    });
    this.cast.should.have.property('wrapperWidth', 400);
    this.cast.should.have.property('boxWidth', 50);
    this.cast.should.have.property('boxHeight', 50);
    this.cast.should.have.property('paddingWidth', 20);
    this.cast.should.have.property('paddingHeight', 20);
  });

  it('should set a left and top attribute', function(){
    this.cast.data(attributes, function(a){return a.name; });
    this.cast.justify({
      wrapperWidth: 400,
      boxWidth: 50,
      boxHeight: 50,
      paddingWidth: 20,
      paddingHeight: 20
    });
    var json = this.cast.toJSON();
    should.exist(json);
    for (var i = 0; i < json.length; i++){
      should.exist(json[i].left);
      should.exist(json[i].top);
    }
  });
});

describe('#center()', function(){
  var attributes = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];
  it('should set a left and top attribute', function(){
    this.cast.data(attributes, function(a){return a.name; });
    this.cast.justify({
      wrapperWidth: 400,
      boxWidth: 50,
      boxHeight: 50,
      paddingWidth: 20,
      paddingHeight: 20
    });
    var json = this.cast.toJSON();
    should.exist(json);
    for (var i = 0; i < json.length; i++){
      should.exist(json[i].left);
      should.exist(json[i].top);
    }
  });
});

describe('#dynamic()', function(){
  var attributes = [{name: 'ben', age: 28}, {name: 'kit'}, {name: 'joe'}];
  var tcast = cast().data(attributes, function(a){
    return a.name;
  }).dynamic({
    wrapperWidth: 400,
    paddingWidth: 20,
    paddingHeight: 20,
    boxWidth: 50,
    boxHeight: 50
  });
  var json = tcast.toJSON();

  it('should set a left and top attribute', function(){
    for (var i = 0; i < json.length; i++){
      should.exist(json[i].left);
      should.exist(json[i].top);
    }
  });

  it('should set a width and height attr', function(){
    for (var i = 0; i < json.length; i++){
      should.exist(json[i].width);
      should.exist(json[i].height);
    }
  });
});

// I need view related tests...

});