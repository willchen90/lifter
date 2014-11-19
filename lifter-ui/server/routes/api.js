var express = require('express');
var router = express.Router();
var docker = require('../api/dockerRemoteAPI').docker;

/* GET docker remote API info */
router.get('/docker', function(req, res) {
  console.log('in the server, docker api');
  res.send('docker remote api reached');
});

// Requests only active containers
router.get('/docker/containers', function(req, res) {
  docker.listContainers(function(err, containers){
    if (err){
      console.log(err);
      return;
    }
    res.send(containers);
  });
});

// Requests all containers (active and stopped)
router.get('/docker/containers/all', function(req, res) {
  docker.listContainers({all: true},function(err, containers){
    if (err){
      console.log(err);
      return;
    }
    res.send(containers);
  });
});

// Requests details for a specific container
router.get('/docker/container', function(req, res) {
  var container = docker.getContainer('a02820a1e53d');
  // query API for container info

  container.inspect(function (err, data) {
    if (err){
      console.log(err);
      return;
    }
    res.send(data);
  });

});

module.exports = router;
