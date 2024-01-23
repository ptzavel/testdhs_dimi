const swaggerAutogen = require('swagger-autogen')()

const path = require('path')
const doc = {
  info: {
    version: '',      // by default: '1.0.0'
    title: '',        // by default: 'REST API'
    description: ''  // by default: ''
  },
  host: '',      // by default: 'localhost:3000'
  basePath: '/api',  // by default: '/'
  schemes: [],   // by default: ['http']
  consumes: [],  // by default: ['application/json']
  produces: [],  // by default: ['application/json']
  tags: [        // by default: empty Array
    {
      name: '',         // Tag name
      description: ''  // Tag description
    }
    // { ... }
  ],


  definitions: {},          // by default: empty object (Swagger 2.0)

  securityDefinitions: { Bearer: { "type": "apiKey", "name": "Authorization", "in": "header", "description": "Enter JWT Token" } }

  // by default: empty object (OpenAPI 3.x)
}


const outputFile = './swagger-output.json'
const endpointsFiles = [path.join(__dirname, 'src/appRoutes.js')]
/* NOTE: if you use the express Router, you must pass in the
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc)

