var express = require("express");
var app = express();
var path = require("path");
var PORT = process.env.PORT||3000;
var axios = require('axios');
const bodyparser = require("body-parser");
const { credentials } = require("./config");
const getmac = require('getmac');

const { networkInterfaces } = require('os');

var JWT_Token;
var FeedToken;
var RefreshToken;
var CLIENT_ID;
var CLIENT_PASSWORD;
 
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(express.static(__dirname + "/public"));
var ip;
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    ip=add;
  })

var mac=getmac.default();

function getProfile(res){
    var config = {
        method: 'get',
        url: 'https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/getProfile',
      
        headers : {
          'Authorization': `Bearer ${JWT_Token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': ip,
          'X-ClientPublicIP': ip,
          'X-MACAddress': mac,
          'X-PrivateKey': credentials.API_KEY
        }
      };
      
      axios(config)
      .then(function (response) {
        console.log(response.data);
        return res.send(response.data);

      })
      .catch(function (error) {
        console.log(error);
        return res.send(error);

      });
}

function logout(res){
    var data = JSON.stringify({
        "clientcode":CLIENT_ID
    });
    
    var config = {
      method: 'post',
      url: 'https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/logout',
      headers : {
        'Authorization': `Bearer ${JWT_Token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': ip,
        'X-ClientPublicIP': ip,
        'X-MACAddress': mac,
        'X-PrivateKey': credentials.API_KEY
      },
      data : data
    };
    
    axios(config)
    .then(function (response) {
    
      console.log(response.data);
      if(response.data.status == true){
        var local_id = CLIENT_ID;
        JWT_Token = null;
        RefreshToken = null;
        FeedToken = null;
        CLIENT_ID = null;
        CLIENT_PASSWORD = null;
        return res.send("LOGGED OUT " + local_id);
      }
      
      return res.send("No User Logged in!");
    })
    .catch(function (error) {
      console.log(error);
      return res.send(error);
    });
}


function generateToken(){

    if(!JWT_Token||!RefreshToken){
        return console.log("LOGIN FIRST");
    }

    var data = JSON.stringify({
        "refreshToken":RefreshToken
    });
    
    var config = {
      method: 'post',
      url: 'https://apiconnect.angelbroking.com/rest/auth/angelbroking/jwt/v1/generateTokens',
    
      headers: {
        'Authorization': `Bearer ${JWT_Token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': ip,
        'X-ClientPublicIP': ip,
        'X-MACAddress': mac,
        'X-PrivateKey': credentials.API_KEY
      },
      data : data
    };
    
    axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      res.send(response.data);
      if(response.data.status==true)  {
        JWT_Token = response.data.jwtToken;
        RefreshToken = response.data.refreshToken;
        FeedToken = response.data.feedToken;
      }else{
        console.log(response.data.message);
      }
    })
    .catch(function (error) {
      console.log(error);
      res.send(error)
    });
}

 async function getCandles (exchange,symbol,from,to,res){

  console.log(exchange,symbol,from,to)

  if(!JWT_Token){
    console.log(JWT_Token)
    res.status(401);
    return res.send("unAuthenticated! LOGIN");
  }
    var Intervals = [
        "ONE_MINUTE",
        "THREE_MINUTE",
        "FIVE_MINUTE",
        "TEN_MINUTE",
        "FIFTEEN_MINUTE",
        "THIRTY_MINUTE",
        "ONE_HOUR",
        "ONE_DAY",
    ]

    var data = JSON.stringify({
        "exchange":exchange,
        "symboltoken":symbol,
        "interval":Intervals[0],
        "fromdate":from,
        "todate":to
      });

var config = {
  method: 'post',
  url: 'https://apiconnect.angelbroking.com/rest/secure/angelbroking/historical/v1/getCandleData',
  headers: { 
    'X-PrivateKey': credentials.API_KEY, 
    'Accept': 'application/json', 
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': ip, 
    'X-ClientPublicIP': ip, 
    'X-MACAddress': mac, 
    'X-UserType': 'USER', 
    'Authorization': `Bearer ${JWT_Token}`, 
    'Content-Type': 'application/json'
  },
  data : data
};

axios(config)
  .then(function (response) {
    console.log(response.data);
    res.send(response.data);
  })
  .catch(function (error) {
    console.log(error);
    res.send(error);
  }); 
}

app.post("/candle",(req, res)=>{
  getCandles(req.body.exchange, req.body.symbol, req.body.from, req.body.to, res);
})

app.get("/logout", (req,res)=>{
  logout(res);
})

app.get("/getprofile",(req,res)=>{
  getProfile(res);
})


app.post("/login", (req, res)=>{

    CLIENT_ID = req.body.CLIENT_ID;
    CLIENT_PASSWORD = req.body.CLIENT_PASSWORD;
   
    var data = JSON.stringify({
        "clientcode":CLIENT_ID,
        "password":CLIENT_PASSWORD
    });
    
    var config = {
      method: 'post',
      url: `https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword`,
    
      headers : {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': ip,
        'X-ClientPublicIP': ip,
        'X-MACAddress': mac,
        'X-PrivateKey': credentials.API_KEY
      },
      data : data
    };
    
    axios(config)
    .then(function (response) {
      // console.log(JSON.stringify(response.data));
      res.send(response.data);

      console.log(response.status)

      if(response.data.status==true)  {
        JWT_Token = response.data.data.jwtToken;
        RefreshToken = response.data.data.refreshToken;
        FeedToken = response.data.data.feedToken;

        console.log(JWT_Token, RefreshToken, FeedToken);
      }else{
        console.log(response.data.message);
      }
    })
    .catch(function (error) {
      console.log(error);
      res.send(error)
    });
})


app.get("/",(req,res)=>{

    console.log(mac);
    
    res.send(mac);

})


app.listen(PORT, (req, res) => {
    console.log("Server up and running at port "+PORT);
  });
  