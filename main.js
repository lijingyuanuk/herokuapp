/*导入需要用到的nodejs库*/
var http = require('http');
var url = require('url');
var qs = require('querystring');
var fs   = require("fs");
/**
 * 简单配置个路由 用来检测无用的请求 仅符合路由规则的才能被接受
 * 自己可以按照需要定义
 * @type {{/: string, favicon: string, user: string, login: string, biz: string}}
 */
var route = {
    '/': "/",
    'cash': '/cash',
    'deal': '/deal',
    'find_cash': '/find_cash',
    'find_deal': '/find_deal',
    'delete_cash': '/delete_cash',
    'delete_deal': '/delete_deal'
};

//连接数据库
/*var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'us-cdbr-iron-east-04.cleardb.net',
    user: 'b48929c4db77b3',
    password: 'bf041084',
    database:'heroku_185aaaa9d967a8b'
});
connection.connect();  */
var mysql = require('mysql');
var db_config = {
    host: 'us-cdbr-iron-east-04.cleardb.net',
    user: 'b4276cfc181235',
    password: '251feeda',
    database:'heroku_8e03040bdc0b6b1'
};

var connection;


function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();




//查询
var find = function(query, cb) {
    if (!connection) return false;
    connection.query(query, function(err, rows, fields) {
        if (err) {
            if (cb) cb(err, "");
        } else {
            if (cb) cb(null, rows);
        }
        console.log('Query Result： ', rows);
    });
}

//添加
var add = function(query, parm, cb) {
    if (!connection) return false;
    connection.query(query,parm,function (err, result) {
        if(err){
            console.log('[INSERT ERROR] - ',err.message);
            if (cb) cb(err, "");
        } else {
            console.log('-------INSERT----------');  
            console.log('INSERT ID:',result); 
            if (cb) cb(null, {ok:true});
        }
});
}

//删除
var deleteItem = function(query, cb) {
    if (!connection) return false;
    connection.query(query,function (err, result) {
        if(err){
          console.log('[DELETE ERROR] - ',err.message);
          if (cb) cb(err, "");
          return;
        }       
 
       console.log('-------------DELETE--------------');
       console.log('DELETE affectedRows',result.affectedRows);
       if (cb) cb(null, {ok:true});
    });   
}

var update = function(query, parm, cb) {
    if (!connection) return false;
    console.log(query);
    connection.query(query,parm,function (err, result) {
        if(err){
            console.log('[UPDATE ERROR] - ',err.message);
            if (cb) cb(err, "");
        } else {
            console.log('-------UPDATE----------');  
            console.log('UPTATE ID:',result); 
            if (cb) cb(null, {ok:true});
        }
    });
}

var closeConnection = function() {
    if (connection) {
        //关闭连接
        connection.end();
        connection = null;
    }
}

/**
 * 上述路由的简单判断规则
 * @param reqPath
 * @returns {boolean}
 */
var isValid = function (reqPath) {
    for (var key in route) {
        if (route[key] == reqPath) {
            return true;
        }
    }
    return false;
};

/**
 * 照样输出json格式的数据
 * @param query
 * @param res
 */
var writeOut = function (pathname, query, res) {
    var cb = function(err, rows) {
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        if (err) {
            res.write(JSON.stringify(err)); 
            res.end();
            return;
        }
        res.write(JSON.stringify(rows));
        res.end();
    }
    switch(pathname) {
        case route["cash"]:
			console.log(query);
            var parm = [query.deal_id, new Date(parseInt(query.date)), decodeURI(query.type), query.cashflows]
            console.log(parm);
            add("INSERT INTO cashflows(deal_id,date,type,cashflows) VALUES(?,?,?,?)", parm, cb);
            break;
        case route["find_cash"]:
            find("select * from cashflows", cb);
            break;
        case route["delete_cash"]:
            deleteItem("DELETE FROM cashflows WHERE id = " + query.id, cb);
            break;
        case route["delete_deal"]:
            var parm = ["deleted", query.id];
            update("UPDATE deal set fund = ? where id = ?", parm, cb);
            break;
        case route["deal"]:
            var parm = [decodeURI(query.name), query.currency];
            console.log(parm);
            add("INSERT INTO deal(name,currency) VALUES(?,?)", parm, cb);
            break;
        case route["find_deal"]:
            find("select * from deal", cb);
            break;
        default:
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
            res.end(fs.readFileSync('index.html','UTF-8'));
            break;
    }
}


/**
 * 启用http创建一个端口为8124的服务
 * createServer内侧为回调函数：
 * ...可看作java servlet中的 onService(HttpRequest,HttpResponse)
 * ...或者（doGet、doPost）
 */
http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var pathname = url.parse(req.url).pathname;
    if (!isValid(pathname)) {
        res.writeHead(404, {'Content-Type': 'text/plain;charset=utf-8'});
        res.write("{'errcode':404,'errmsg':'404 Error'}");
        res.end();
    } else {
        if (req.method.toUpperCase() == 'POST') {
            var postData = "";
            /**
             * 因为post方式的数据不太一样可能很庞大复杂，
             * 所以要添加监听来获取传递的数据
             * 也可写作 req.on("data",function(data){});
             */
            req.addListener("data", function (data) {
                postData += data;
            });
            /**
             * 这个是如果数据读取完毕就会执行的监听方法
             */
            req.addListener("end", function () {
                var query = qs.parse(postData);
                writeOut(pathname, query, res);
            });
        }
        else if (req.method.toUpperCase() == 'GET') {
            /**
             * 也可使用var query=qs.parse(url.parse(req.url).query);
             * 区别就是url.parse的arguments[1]为true：
             * ...也能达到‘querystring库’的解析效果，而且不使用querystring
             */
            var query = url.parse(req.url, true).query;
            writeOut(pathname, query, res);
        } else {
            //head put delete options etc.
        }
    }

}).listen(process.env.PORT || 8124, function () {
    console.log("listen on port 8124");
});