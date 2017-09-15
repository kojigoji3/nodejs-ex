//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan');
var bodyParser = require('body-parser');
Object.assign=require('object-assign');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


//DB------
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};



//-IF----------------------

app.get('/', function (req, res) {
  //if (!db) { initDb(function(err){}); }
  //if (db) {
  //  var col = db.collection('counts');
  //  // Create a document with request IP and current time of request
  //  //col.insert({ip: req.ip, date: Date.now()});
  //  col.count(function(err, count){
  //    res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
  //  });
  //} else {
  //  res.render('index.html', { pageCountMessage : null});
  //}
  res.render('index.html', { pageCountMessage : null});
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) { initDb(function(err){}); }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

//////////addtest
app.post('/test_post', function (req, res) {

  console.log(req.body);
  if (req.body != null && req.body != "" && req.body != {} && req.body != []) {
    res.send(req.body);
  } else {
    res.send('{ test_post: -1}');
  }
});
////////////







app.post('/post_sensor_data', function (req, res) {
  if (!db) { initDb(function(err){}); }

  if (db && req.body != null && req.body != "" && req.body != {} && req.body != []) {
    var nowDate = new Date();
    nowDate.setHours(nowDate.getHours()+9);//UTC adjust
    var yy = nowDate.getFullYear();
    var mm = nowDate.getMonth();
    var dd = nowDate.getDate();
    var hh = nowDate.getHours();
    var mi = nowDate.getMinutes();
    var ss = nowDate.getSeconds();
    req.body['year'] = Number(yy);
    req.body['month'] = Number(mm)+1; 
    req.body['day'] =  Number(dd);
    req.body['hour'] = Number(hh);
    req.body['minute'] = Number(mi);
    req.body['second'] = Number(ss);
    console.log(req.body);

    var col = db.collection('sensor_datas');
    
    /*
    for(var i = 0; i < req.body.response.sensors.length; i++){
      col.insertOne({
        "date": nowDate.toISOString(),
        "sensor": req.body.response.sensors[i].sensor_type,
        "sensor_data": req.body.response.sensors[i],
      }), (err, res) => {
        if(!error){
          //error process
        }
      };
    }*/
    col.insert(req.body);
    col.count(function(err, count){
      res.status(200).send('{ datas_count: ' + count + '}');
    });
    
  }
  else {
    res.send('{ add_count: 0}');
  }
});

app.get('/get_sensor_data', function (req, res) {
  if (!db) { initDb(function(err){}); }

/*
  var d = req.query.date || req.body.date;
  var t = req.query.time || req.body.time;

  if(d != "" || t != ""){
    res.status(400).send("parameter error.");
    return;
  }else{
    var ptn = /[0-9]{8}/;
    if(!ptn.test(d)){
      res.status(400).send("parameter error.");
      return;
    }else if(d.match(ptn)[0] != d){
      res.status(400).send("parameter error.");
      return;
    }
  }

  if (db) {
    var date = new Date(d.substring(0,4) + '-' + d.substring(4,6) + '-' + d.substring(6,8));
    if(!date.getTime()){
      res.status(400).send("date format error.");
      return;
    }
    date.setTime(t);

    mongoFind2(db, date)
    .then((list) => {
      res.send(list);
    });
  } else {
    res.send('{ get_count: 0}');
  }
  */
  var getyear = req.query.year || req.body.year;
  var getmonth = req.query.month || req.body.month;
  var getday = req.query.day || req.body.day;
  var gettime = req.query.hour || req.body.hour;
  var yy1 = Number(getyear)
  var mm1 = Number(getmonth);//1-12
  var mm1b = mm1 - 1;//0-11
  var dd1 = Number(getday);
  var hh1 = Number(gettime);
  if(getyear != undefined && getyear != '' && getmonth != undefined && getmonth != ''
     && getday != undefined  && getday != ''  && gettime != undefined  && gettime != '' 
     && 0 < yy1 && 0 < mm1 && mm1 <= 12 && 0 < dd1 && dd1 <= 31 && 0 < hh1 && hh1 <= 24){
  }
  else{
    res.status(400).send("parameter error.  year=*&month=*&day=*&hour=*");
    return;
  }

  if (db) {
    var yesterdate = new Date(yy1, mm1b, dd1, hh1, 0, 0);
    yesterdate.setDate(yesterdate.getDate()-1);
    
    var yy2 = yesterdate.getFullYear();
    var mm2b = yesterdate.getMonth();//0-11
    var mm2 = mm2b+1;//1-12
    var dd2 = yesterdate.getDate();
    var hh2 = yesterdate.getHours();

    var col = db.collection('sensor_datas');
    var getquery = { $or : [ 
                            {year : yy2, month : mm2, day : dd2, hour: { $gte: hh2 } }, 
                            {year : yy1, month : mm1, day : dd1, hour: { $lte: hh1 } } 
                           ]
                   };
    console.log(getquery);
    var ary = col.find(getquery).toArray((error, documents) => {
      console.log('OK');
      console.log(documents);
      res.status(200).json(documents);
    });
  } 
  else {
    res.status(500).send("db error");
    return;
  }
  
});

/*
async function mongoFind2(db, date){
  date.setDate(date.getDate()- 1);

  var jsn = {};
  for(var i = 0; i < 9; i++){
    var datestr = date.toISOString().substring(0,19);
    jsn[datestr] = {};
    for(var j = 0; j < sensor.length; j++){
      var srhDate = new RegExp(date.toISOString().substring(0,10) + 'T' + ('00' + date.getHours()).slice(-2) + '\:[0-9]{2}\:[0-9]{2}\.[0-9]{3}Z');
      var findRes = await db.collection('sensor_datas').find({
        "date": srhDate,
        "sensor": sensor[j],
      });
      var docs = findRes.toArray();
      jsn[datestr][sensor[j]] = docs;
    }
    date.setHours(date.getHours()+3);
  }
  console.log(jsn);
  return jsn;
}
*/

app.get('/get_sensor_all', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) { initDb(function(err){}); }
  if (db) {
         
    var col = db.collection('sensor_datas');
    var getquery = {};
    var ary = col.find(getquery).toArray((error, documents) => {
      console.log('OK');
      res.status(200).json(documents);
    });
  } 
  else {
    res.status(500).send("UnknownError");
  }
});

app.get('/delete_sensor_datas', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) { initDb(function(err){}); }

  if (db) {
    var col = db.collection('sensor_datas');
    var ary = col.deleteMany();
    res.status(200).send('Delete Success');
  } 
  else {
    res.status(500).send('Delete Error');
  }
});
//-------------------------------------------------------------------------------------




//-MainRunSet------------------------------------------
// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
