import "reflect-metadata";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import environment from "../environment";
import { AppIUser, AppReqUser,AppUserDetail, AppSignInUser, AppUserByType } from "../src/models/appuser.model";
import AppUserClass from "../src/models/appuser.model";
import { RegistrationServices } from "../src/services/registration.service";
import { UserServices } from "../src/services/user.service";
import ISKCUserClass from "../src/models/skcuser.model";
import { v4 as uuidv4 } from "uuid";
import AesEncryption from "../src/common/aesEncryption";
import userData from './mockData/user.json';

const jwt = require("jsonwebtoken");
const { secretKey, algorithms } = environment.getJWTConfig();

const appuserclass = new AppUserClass();
const skcuser = new ISKCUserClass();
const user_service = new UserServices(skcuser, appuserclass);
// const registration_servie = new RegistrationServices(skcuser, appuserclass);

beforeAll(async () => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoose.connection.close();
});

describe("Get User Detail", () => {

  it("should return user detail successfully", async () => {
    const userBody = userData;
    const response = await user_service.getdetail(userBody as AppUserDetail);
    expect(response).toHaveProperty(["status"]);
    expect(response).toHaveProperty(["data", "token"]);
    expect(response.status).toBe("success");
  });
});

describe("Get All User", () => {

    it("should return all user", async () => {
    //   const userBody = userData;
      const response = await user_service.getall();
      expect(response).toHaveProperty(["status"]);
      expect(response).toHaveProperty(["data", "token"]);
      expect(response.status).toBe("success");
    });
  });


describe("Get User By Type", () => {

    it("should return correct user type", async () => {
      const userBody = userData.userbytypedata;
      const response = await user_service.getbytype(userBody as AppUserByType);
      expect(response).toHaveProperty(["status"]);
      expect(response).toHaveProperty(["data", "token"]);
      expect(response.status).toBe("success");
    });
  });



// describe("User SignIn", () => {
//   it("should signin user successfully", async () => { 
//     const userBody = userData.signindata;
//     const response = await user_service.getall(userBody as AppSignInUser);
//     expect(response).toHaveProperty(["status"]);
//     expect(response).toHaveProperty(["data", "token"]);
//     expect(response.status).toBe("success");
//   })

//   it("should return error when the password or userid is wrong", async () => {
//     const userBody = userData.wrongsignindata;
//     const response = await registration_servie.signin(userBody as AppSignInUser);
//     expect(response).toHaveProperty(["status"]);
//     expect(response).toHaveProperty(["data"]);
//     expect(response.status).toBe("invalid");
//   });

//   it("should return error when insufficient parameters", async () => {
//     const userBody = userData.insufficientsignindata;
//     const response = await registration_servie.signin(userBody as unknown as AppSignInUser);
//     expect(response).toHaveProperty(["status"]);
//     expect(response).toHaveProperty(["data"]);
//     expect(response.status).toBe("insufficient");
//   });
// });

// describe("Send OTP", () => {
//   it("should sent otp successfully", async () => { 
//     const _userid = AesEncryption.encrypt(userData.userid);
//     const token = jwt.sign({ _userid }, secretKey, {
//       expiresIn: "1w",
//     });
//     const userBody = {
//       "userid": userData.userid,
//       "token": token
//     }
//     const response = await registration_servie.sendotp(userBody as AppUserOTP);
//     expect(response).toHaveProperty(["status"]);
//     expect(response).toHaveProperty(["data"]);
//     expect(response.status).toBe("success");
//   })

//   it("should return error when userid from token and userid doesn't match", async () => {
//     const _userid = AesEncryption.encrypt(userData.wronguserid);
//     const token = jwt.sign({ _userid }, secretKey, {
//       expiresIn: "1w",
//     });
//     const userBody = {
//       "userid": userData.userid,
//       "token": token
//     }
//     const response = await registration_servie.sendotp(userBody as AppUserOTP);
//     expect(response).toHaveProperty(["status"]);
//     expect(response).toHaveProperty(["data"]);
//     expect(response.status).toBe("unauthorized");
//   });

//   it("should return error when mail is not valid", async () => {
//     const _userid = AesEncryption.encrypt(userData.wrongmail);
//     const token = jwt.sign({ _userid }, secretKey, {
//       expiresIn: "1w",
//     });
//     const userBody = {
//       "userid": userData.wrongmail,
//       "token": token
//     }
//     const response = await registration_servie.sendotp(userBody as AppUserOTP);
//     expect(response).toHaveProperty(["status"]);
//     expect(response).toHaveProperty(["data"]);
//     expect(response.status).toBe("invalidmail");
//   });
// });