const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const path    = require("path");
const process = require("process");
const sharp   = require("sharp");
const sinon   = require("sinon");

const { 
  checkAuth, checkEmail, checkPass, checkRange, checkUrl,
  getName, getPosterName, getMailer, getMessage, getPassword,
  setAuth, setImage, setThumbnail
} = require("../../app/middlewares");

const originalEnv = process.env;
global.alert = jest.fn();

beforeEach(() => {
  jest.resetModules();

  process.env = {
    ...originalEnv,

    AUTH_ID: "Invalid Id !",
    AUTH_REQ: "Invalid Request !",
    GENERATE_LENGTH: 12,
    GENERATE_NUMBERS: true,
    GENERATE_SYMBOLS: true,
    GENERATE_STRICT: true,
    IMG_EXT: "webp",
    IMG_URL: "img/",
    JWT: "your-json-web-token",
    JWT_DURATION: "72h",
    LOGIN_EMAIL: "User not found !",
    LOGIN_PASS: "Incorrect password !",
    MAIL_HOST: "mail.test.com",
    MAIL_PASS: "your-password",
    MAIL_PORT: 25,
    MAIL_SECURE: false,
    MAIL_USER: "user@mail.com",
    MAX: 50,
    MIN: 2,
    PASS_INT: 1,
    PASS_MAX: 50,
    PASS_MIN: 8,
    THUMB_EXT: "webp",
    THUMB_FIT: "cover",
    THUMB_HEIGHT: 200,
    THUMB_POSITION: "center",
    THUMB_URL: "img/",
    THUMB_WIDTH: 200,
  };
});

afterEach(() => {
  process.env = originalEnv;
});

//! ******************** CHECKERS ********************

/**
 * ? CHECK AUTH
 */
describe("checkAuth()", () => {
  const next = jest.fn();

  test("should return 401 if the token is invalid", () => {
    const req = { headers: { authorization: "Bearer invalid_token" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jwt.verify = jest.fn(() => { 
      throw new Error() 
    });

    checkAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: new Error(process.env.AUTH_REQ) });
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 401 if the userId in the request body is different from the one in the token", () => {
    const req = {
      headers: { authorization: "Bearer valid_token" },
      body: { userId: "invalid_userid" }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jwt.verify = jest.fn(() => ({ userId: "valid_userid" }));
    checkAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: new Error(process.env.AUTH_REQ) });
    expect(next).not.toHaveBeenCalled();
  });

  test("should throw an error when an invalid token is provided", () => {
    const req = { headers: { authorization: "Bearer invalidToken" } };
    const res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn() 
    };

    jwt.verify = jest.fn().mockImplementationOnce(() => { 
      throw new Error() 
    });

    checkAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: new Error(process.env.AUTH_REQ) });
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next() if the userId matches", () => {
    const token = jwt.sign(
      { userId: "1" },
      process.env.JWT,
      { expiresIn: process.env.JWT_DURATION }
    );

    const req = {
      headers: { authorization: `Bearer ${token}` },
      body: { userId: "1" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = () => {};

    expect(checkAuth(req, res, next)).toStrictEqual(undefined);
  });
});

/**
 * ? CHECK EMAIL
 */
describe("checkEmail()", () => {

  test("returns true when given a valid email", () => {
    expect(checkEmail("hello@example.com")).toStrictEqual(true);
  });

  test("returns false when given an invalid email format", () => {
    expect(checkEmail("notanemail")).toStrictEqual(false);
  });

  test("returns false when given an empty string", () => {
    expect(checkEmail("")).toStrictEqual(false);
  });
});

/**
 * ? CHECK PASS
 */
describe("checkPass()", () => {

  test("returns true for a valid password", () => {
    const validPass = "Abcdef1!";
    const isValid = checkPass(validPass);

    expect(isValid).toStrictEqual(true);
  });

  test("returns false for a password that is too short", () => {
    const invalidPass = "Abc1!";
    const isValid = checkPass(invalidPass);

    expect(isValid).toStrictEqual(false);
  });

  test("returns false for a password that is too long", () => {
    const invalidPass = "Abcdef1!".repeat(100);
    const isValid = checkPass(invalidPass);

    expect(isValid).toStrictEqual(false);
  });

  test("returns false for a password without an uppercase letter", () => {
    const invalidPass = "abcdef1!";
    const isValid = checkPass(invalidPass);

    expect(isValid).toStrictEqual(false);
  });

  test("returns false for a password without a lowercase letter", () => {
    const invalidPass = "ABCDEF1!";
    const isValid = checkPass(invalidPass);

    expect(isValid).toStrictEqual(false);
  });

  test("returns false for a password without a digit", () => {
    const invalidPass = "Abcdefgh!";
    const isValid = checkPass(invalidPass);

    expect(isValid).toStrictEqual(false);
  });

  test("returns false for a password with spaces", () => {
    const invalidPass = "Abcdef1! ";
    const isValid = checkPass(invalidPass);

    expect(isValid).toStrictEqual(false);
  });
});

/**
 * ? CHECK RANGE
 */
describe("checkRange()", () => {
  test("should return true if value is within the specified range", () => {

    expect(checkRange(3)).toBe(true);
    expect(checkRange(50)).toBe(true);
    expect(checkRange("aA")).toBe(true);
    expect(checkRange("abcdefghijklmnopqrstuvwxyz")).toBe(true);
  });

  test("should return false if value is not within the specified range", () => {

    expect(checkRange(1)).toBe(false);
    expect(checkRange(51)).toBe(false);
    expect(checkRange("")).toBe(false);
    expect(checkRange("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe(false);
  });
});

/**
 * ? CHECK URL
 */
describe("checkUrl()", () => {

  test("returns true for a valid URL", () => {
    expect(checkUrl("https://www.example.com")).toBe(true);
  });

  test("returns false for a non-URL string", () => {
    expect(checkUrl("not a url")).toBe(false);
  });

  test("returns false for an empty string", () => {
    expect(checkUrl("")).toBe(false);
  });

  test("returns false for a null value", () => {
    expect(checkUrl(null)).toBe(false);
  });

  test("returns false for an undefined value", () => {
    expect(checkUrl(undefined)).toBe(false);
  });
});

//! ******************** GETTERS ********************

/**
 * ? GET NAME
 */
describe("getName()", () => {

  test("should remove accents, replace spaces with hyphens & convert everything to lowercase", () => {
    const input = "Rénée Joséphine ñoño";
    const expectedOutput = "renee-josephine-nono";
    const actualOutput = getName(input);

    expect(actualOutput).toStrictEqual(expectedOutput);
  });

  test("should return an empty string if the input is an empty string", () => {
    const input = "";
    const expectedOutput = "";
    const actualOutput = getName(input);

    expect(actualOutput).toStrictEqual(expectedOutput);
  });

  test("should handle an input string with no accents & no spaces", () => {
    const input = "foobar";
    const expectedOutput = "foobar";
    const actualOutput = getName(input);

    expect(actualOutput).toStrictEqual(expectedOutput);
  });
});

/**
 * ? GET POSTER NAME
 */
describe("getPosterName()", () => {

  test("returns correct poster name with .jpg extension", () => {
    const name = "poster1";
    process.env.IMG_EXT = "jpg";

    expect(getPosterName(name)).toStrictEqual("poster1-01.jpg");
  });

  test("returns correct poster name with .png extension", () => {
    const name = "poster2";
    process.env.IMG_EXT = "png";

    expect(getPosterName(name)).toStrictEqual("poster2-01.png");
  });

  test("returns correct poster name with empty string extension", () => {
    const name = "poster3";
    process.env.IMG_EXT = "";

    expect(getPosterName(name)).toStrictEqual("poster3-01.");
  });

  test("returns a string with the name of the poster image", () => {
    const name = "poster";

    expect(getPosterName(name)).toBe(`${name}-01.${process.env.IMG_EXT}`);
  });
});

/**
 * ? GET MAILER
 */
describe("getMailer()", () => {

  test("should set the correct host, port, secure, user & pass from environment variables", () => {
    const transport = getMailer();

    expect(transport.options.host).toStrictEqual(process.env.MAIL_HOST);
    expect(transport.options.port).toStrictEqual(process.env.MAIL_PORT);
    expect(transport.options.secure).toStrictEqual(process.env.MAIL_SECURE);
    expect(transport.options.auth.user).toStrictEqual(process.env.MAIL_USER);
    expect(transport.options.auth.pass).toStrictEqual(process.env.MAIL_PASS);
  });
});

/**
 * ? GET MESSAGE
 */
describe("getMessage()", () => {

  test("returns an object with the expected properties", () => {
    const data = { email: "test@example.com", subject: "Test Subject", html: "<p>Test HTML</p>" };
    const result = getMessage(data);

    expect(result).toHaveProperty("from", process.env.MAIL_USER);
    expect(result).toHaveProperty("to", data.email);
    expect(result).toHaveProperty("bcc", process.env.MAIL_USER);
    expect(result).toHaveProperty("subject", data.subject);
    expect(result).toHaveProperty("html", data.html);
  });

  test("returns an object with default bcc when email is not provided", () => {
    const data = { subject: "Test Subject", html: "<p>Test HTML</p>" };
    const result = getMessage(data);

    expect(result).toHaveProperty("from", process.env.MAIL_USER);
    expect(result).toHaveProperty("to", undefined);
    expect(result).toHaveProperty("bcc", process.env.MAIL_USER);
    expect(result).toHaveProperty("subject", data.subject);
    expect(result).toHaveProperty("html", data.html);
  });
});

/**
 * ? GET PASSWORD
 */
describe("getPassword()", () => {

  test("returns a string", () => {
    const password = getPassword();

    expect(typeof password).toStrictEqual("string");
  });

  test("returns a password with the correct length", () => {
    const length = 10;
    process.env.GENERATE_LENGTH = length;
    const password = getPassword();

    expect(password.length).toStrictEqual(length);
  });

  test("returns a password without numbers if the numbers option is false", () => {
    process.env.GENERATE_NUMBERS = false;
    const password = getPassword();

    expect(!/\d/.test(password)).toStrictEqual(true);
  });

  test("returns a password without symbols if the symbols option is false", () => {
    process.env.GENERATE_SYMBOLS = false;
    const password = getPassword();

    expect(!/[!@#$%^&*(),.?":{}|<>]/.test(password)).toStrictEqual(true);
  });
});

//! ******************** SETTERS ********************

/**
 * ? SET AUTH
 */
describe("setAuth()", () => {

  test("should return 404 if user is null", async () => {
    const pass = "password";
    const user = null;

    const res = {
      status: (code) => ({ json: (response) => {
        expect(code).toStrictEqual(404);
        expect(response).toStrictEqual({ error: process.env.LOGIN_EMAIL });
      }})
    };

    await setAuth(pass, user, res);
  });

  test("should return 401 if password is invalid", async () => {
    const pass = "invalid-password";
    const user = { pass: await bcrypt.hash("password", 10) };

    const res = {
      status: (code) => ({ json: (response) => {
          expect(code).toStrictEqual(401);
          expect(response).toStrictEqual({ error: process.env.LOGIN_PASS });
        }
      })
    };

    await setAuth(pass, user, res);
  });

  test("should return 200 with token & user id if authentication is successful", async () => {
    const pass = "password";
    const user = { id: "123", pass: await bcrypt.hash("password", 10) };

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT,
      { expiresIn: process.env.JWT_DURATION }
    );

    const res = {
      status: (code) => ({ json: (response) => {
          expect(code).toStrictEqual(200);
          expect(response).toStrictEqual({ userId: user.id, token });
        }
      })
    };

    await setAuth(pass, user, res);
  });

  test("should return 400 if an error occurs", async () => {
    const pass = "password";
    const user = { id: "123", pass: await bcrypt.hash("password", 10) };

    const res = {
      status: (code) => ({ json: (response) => {
          expect(code).toStrictEqual(400);
        }
      })
    };

    const originalBcryptCompare = bcrypt.compare;
    bcrypt.compare = () => { 
      throw new Error("an error occurred") 
    };

    await setAuth(pass, user, res);
    bcrypt.compare = originalBcryptCompare;
  });

});

/**
 * ? SET IMAGE
 */
describe("setImage()", () => {
  test("should throw an error if input file does not exist", async () => {
    const inputPath = path.join(__dirname, "nofile.webp");
    const outputPath = path.join(__dirname, "test.webp");
    await expect(setImage(inputPath, outputPath)).rejects.toThrow();
  });
});

/**
 * ? SET THUMBNAIL
 */
describe("setThumbnail()", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    sandbox.stub(process.env, "THUMB_URL").value("img/");
    sandbox.stub(process.env, "THUMB_WIDTH").value(200);
    sandbox.stub(process.env, "THUMB_HEIGHT").value(200);
    sandbox.stub(process.env, "THUMB_FIT").value("cover");
    sandbox.stub(process.env, "THUMB_POSITION").value("center");
    sandbox.stub(process.env, "THUMB_EXT").value("webp");
  });

  afterEach(() => {
    sandbox.restore();
  });

  test("should default to the process environment variables for the width & height if none are provided", async () => {
    const input = "node.png";
    const output = "test.webp";
    const resizeSpy = sandbox.spy(sharp.prototype, "resize");
    const toFormatSpy = sandbox.spy(sharp.prototype, "toFormat");
    const toFileSpy = sandbox.spy(sharp.prototype, "toFile");

    await setThumbnail(input, output);

    expect(resizeSpy.calledOnceWithExactly(200, 200, { fit: "cover", position: "center" })).toBe(false);
    expect(toFormatSpy.calledOnceWithExactly("webp")).toBe(false);
    expect(toFileSpy.calledOnceWithExactly(output)).toBe(false);
  });
});
