const request = require('supertest');
const chai = require('chai');
const app = require('../server');  // Adjust the path to your app file

const expect = chai.expect;  // Use chai's expect for assertions

describe('GET /', () => {
  it('should return Hello World!', (done) => {
    request(app)
      .get('/')
      .expect('Content-Type', /text/)   // Assert content-type
      .expect(200)                      // Assert status code
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.equal('Hello World!');  // Assert response body
        done();  // Mark the test as done
      });
  });
});
