require("dotenv").config();

exports.credentials = {
    CLIENT_ID : process.env.CLIENT_ID,
    CLIENT_PASSWORD: process.env.CLIENT_PASSWORD,
    API_KEY: process.env.API_KEY,
    SECRET_KEY: process.env.SECRET_KEY,
    APP_NAME: process.env.APP_NAME,
    API_TYPE: process.env.API_TYPE
  };