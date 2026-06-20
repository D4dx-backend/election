const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/*.js'];

swaggerAutogen(outputFile, endpointsFiles, {
  swagger: '2.0',
  info: {
    title: 'Your API',
    version: '1.0.0',
    description: 'API documentation using Swagger',
  },
});
