const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
require('dotenv').config();

const db = require('../lib/db');
const { validateRegister, isLoggedIn } = require('../middleware/users.js');

//http://localhost:5000/api/sing-up
router.post('/sing-up', validateRegister, (req, res, next) => {
  db.query(
    `SELECT id FROM users WHERE LOWER(username) =  LOWER(${req.body.username})`,
    (err, result) => {
      if (result && result.length) {
        return res.status(409).send({
          message: 'This username is already in use!',
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            throw err;
            return res.status(500).send({
              message: err,
            });
          } else {
            db.query(
              `INSERT INTO users (id, username, password, registered, last_login) VALUES ("${uuid.v4()}", ${db.escape(
                req.body.username
              )}, "${hash}", now(), now())`,
              (err, result) => {
                if (err) {
                  throw err;
                  return res.status(400).send({
                    message: err,
                  });
                }
                return res.status(201).send({ message: 'Registered!' });
              }
            );
          }
        });
      }
    }
  );
});

//http://localhost:5000/api/login
router.post('/login', (req, res, next) => {
  db.query(
    `SELECT * FROM users WHERE username = ${db.escape(req.body.username)}`,
    (err, result) => {
      if (err) {
        throw err;
        return res.status(400).send({
          message: err,
        });
      }
      if (!result) {
        return res.status(400).send({
          message: 'Username or password incorrect!',
        });
      }
      bcrypt.compare(req.body.password, result[0]['password'], (bErr, bResult) => {
        if (bErr) {
          throw bErr;
          return res.status(400).send({ message: 'Username or password incorrect!' });
        }
        if (bResult) {
          const token = jwt.sign(
            {
              usename: result[0].username,
              userId: result[0].id,
            },
            process.env.SECRET_KEY,
            { expiresIn: '7d' }
          );
          db.query(`UPDATE users SET last_login = now() WHERE id = "${result[0].id}"`);
          return res.status(200).send({ message: 'Logged in!', token, user: result[0] });
        }
        return res.status(401).send({ message: 'Username or password incorrect!' });
      });
    }
  );
});

//http://localhost:5000/api/secret-route
router.get('/secret-route', isLoggedIn, (req, res, next) => {
  console.log(req.userData);
  res.send('This is secret content!');
});

module.exports = router;
