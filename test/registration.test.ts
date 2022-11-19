import "reflect-metadata";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import environment from "../environment";
import { AppIUser, AppReqUser, AppSignInUser, AppUserOTP } from "../src/models/appuser.model";
import AppUserClass from "../src/models/appuser.model";
import { RegistrationServices } from "../src/services/registration.service";
import ISKCUserClass from "../src/models/skcuser.model";
import { v4 as uuidv4 } from "uuid";
import AesEncryption from "../src/common/aesEncryption";
import userData from './mockData/user.json';

const jwt = require("jsonwebtoken");
const { secretKey, algorithms } = environment.getJWTConfig();

const appuserclass = new AppUserClass();
const skcuser = new ISKCUserClass();
const registration_servie = new RegistrationServices(skcuser, appuserclass);

beforeAll(async () => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoose.connection.close();
});

describe("User Registration", () => {

  it("should create user successfully", async () => {
    // const token = jwt.sign({ userid }, secretKey, {
    //   expiresIn: "1w",
    // });
    const userBody = userData.correctdata;
    const response = await registration_servie.signup(userBody as AppReqUser);
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data", "token"]);
    expect(response.status).toBe("success");
  });

  it("should return error if user alreay exists", async () => {
    var appuserid = uuidv4();
    const userdata = userData.correctdata;
    const app_user: AppIUser = {
      appuserid: appuserid,
      username: AesEncryption.encrypt(userdata.username),
      phone: AesEncryption.encrypt(userdata.email),
      password: AesEncryption.encrypt(userdata.password),
      verify: false,
      created_date: new Date(Date.now()),
      modified_date: new Date(),
      created_user: "null",
      modified_user: "null",
      is_delete: false,
      is_active: false,
    };
    const appuser_value = new appuserclass.model(app_user);
    const appuser_result = await appuser_value.save();
    expect(appuser_result).toHaveProperty("username");
    expect(appuser_result.username).toBe(AesEncryption.encrypt(userdata.username));
    expect(appuser_result.phone).toBe(AesEncryption.encrypt(userdata.email));

    const userBody = userData.correctdata;
    const response = await registration_servie.signup(userBody as AppReqUser);
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data"]);
    expect(response.status).toBe("invalidname");
  });

  it("should return error when insuffiient parameters", async () => {
    const userBody = userData.insufficientdata;
    const response = await registration_servie.signup(
      userBody as unknown as AppReqUser
    );
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data"]);
    expect(response.status).toBe("insufficient");
  });
});

describe("User SignIn", () => {
  it("should signin user successfully", async () => { 
    const userBody = userData.signindata;
    const response = await registration_servie.signin(userBody as AppSignInUser);
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data", "token"]);
    expect(response.status).toBe("success");
  })

  it("should return error when the password or userid is wrong", async () => {
    const userBody = userData.wrongsignindata;
    const response = await registration_servie.signin(userBody as AppSignInUser);
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data"]);
    expect(response.status).toBe("invalid");
  });

  it("should return error when insufficient parameters", async () => {
    const userBody = userData.insufficientsignindata;
    const response = await registration_servie.signin(userBody as unknown as AppSignInUser);
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data"]);
    expect(response.status).toBe("insufficient");
  });
});

describe("Send OTP", () => {
  it("should sent otp successfully", async () => { 
    const _userid = AesEncryption.encrypt(userData.userid);
    const token = jwt.sign({ _userid }, secretKey, {
      expiresIn: "1w",
    });
    const userBody = {
      "userid": userData.userid,
      "token": token
    }
    const response = await registration_servie.sendotp(userBody as AppUserOTP);
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data"]);
    expect(response.status).toBe("success");
  })

  it("should return error when userid from token and userid doesn't match", async () => {
    const _userid = AesEncryption.encrypt(userData.wronguserid);
    const token = jwt.sign({ _userid }, secretKey, {
      expiresIn: "1w",
    });
    const userBody = {
      "userid": userData.userid,
      "token": token
    }
    const response = await registration_servie.sendotp(userBody as AppUserOTP);
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data"]);
    expect(response.status).toBe("unauthorized");
  });

  it("should return error when mail is not valid", async () => {
    const _userid = AesEncryption.encrypt(userData.wrongmail);
    const token = jwt.sign({ _userid }, secretKey, {
      expiresIn: "1w",
    });
    const userBody = {
      "userid": userData.wrongmail,
      "token": token
    }
    const response = await registration_servie.sendotp(userBody as AppUserOTP);
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data"]);
    expect(response.status).toBe("invalidmail");
  });
});