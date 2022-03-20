require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const typeDefs = require('./graphql/schema/index');
const resolvers = require('./graphql/resolver/index');
const { GraphQLServer } = require('graphql-yoga');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const database = process.env.DB_URI ? process.env.DB_URI : `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/peseta`
mongoose.connect(database)
  .then(() => {
    console.log('Connection to DB successful');
  })
  .catch(err => {
    console.log('Db connection error====', err);
  });
//handling of graphQL schema and resolvers
const server = new GraphQLServer({
  typeDefs,  //importing and defining graphql schema
  resolvers  //importing all resolvers
});
server.start(() => {
  console.log('GraphQL Listening on port 4000');
});