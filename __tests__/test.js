const request = require("supertest");
var cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}


describe("Player test suite", () => {
    beforeAll(async () => {
      await db.sequelize.sync({ force: true });
      server = app.listen(4000, () => {});
      agent = request.agent(server);
    });
    afterAll(async () => {
      await db.sequelize.close();
      server.close();
    });

    test("Sign up", async () => {
        let res = await agent.get("/signup");
        const csrfToken = extractCsrfToken(res);
        res = await agent.post("/create-player").send({
          firstName: "Test",
          lastName: "user A",
          email: "user.a@test.com",
          password: "12345678",
          _csrf: csrfToken,
        });
        expect(res.statusCode).toBe(302);
      });

    //   test("sign out", async () => {
    //     let res = await agent.get("/player");
    //     expect(res.statusCode).toBe(302);
    //     res = await agent.get("/signout");
    //     expect(res.statusCode).toBe(302);
    //     res = await agent.get("/player");
    //     expect(res.statusCode).toBe(302);
    //   });

})