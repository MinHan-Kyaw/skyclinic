import { Request } from "express";
import mongoose from "mongoose";
import AesEncryption from "../common/aesEncryption";
import { ISKCUser } from "../models/skcuser.model";
import ISKCUserClass from "../models/skcuser.model";
import AppUserClass, { AppReqUser,AppSignInUser,AppUserOTP } from "../models/appuser.model";
import { AppIUser } from "../models/appuser.model";
import { injectable } from "tsyringe";
import environment from "../../environment";
import getTokenFromHeader from "../common/headerToken";
import { v4 as uuidv4 } from 'uuid';

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const { secretKey, algorithms } = environment.getJWTConfig();

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "skyclinic28@gmail.com",
    pass: "skyclinic@2021",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

@injectable()
export class RegistrationServices {
  skcuser: mongoose.Model<any>;
  appusers: mongoose.Model<any>;
  constructor(skcuser?: ISKCUserClass, appusers?: AppUserClass) {
    this.skcuser = skcuser!.model;
    this.appusers = appusers!.model;
  }
  //sign up
  public async signup(req: AppReqUser): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const check = this.checkappuserrequest(req);
      if (check == "fail") {
        data = {};
        const status = "insufficient";
        return { status, data };
      }

      const {username, phone, password} = req;
      if(username == '' || phone == '' || password == ''){
        data = {};
        const status = "insufficient";
        return { status, data };
      }
      
      const _username = AesEncryption.encrypt(username);
      const _phone = AesEncryption.encrypt(phone);
      //check user exit or not
      const filter_userid = { $or: [{username: _username},{phone: _phone}]};
      var filter = await this.appusers.findOne(filter_userid);
      
      if (
        filter == null ||
        (filter.username != _username && filter.phone != _phone)
      ) {
        console.log('here');
        var appuserid = uuidv4();
        // collect request parameter for appuser
        const app_user: AppIUser = {
          appuserid: appuserid,
          username: AesEncryption.encrypt(req.username),
          phone: AesEncryption.encrypt(req.phone),
          password: AesEncryption.encrypt(req.password),
          verify: false,
          created_date: new Date(Date.now()),
          modified_date: new Date(),
          created_user: "null",
          modified_user: "null",
          is_delete: false,
          is_active: true,
        };
        const appuser_value = new this.appusers(app_user);
        const appuser_result = await appuser_value.save();

        const skcuserId = uuidv4();

        // collect request parameter for skcuser
        const skc_param: ISKCUser = {
          skcuserid: skcuserId,
          appuserid: appuserid,
          fullname: AesEncryption.encrypt(req.fullname),
          othername: "",
          email: AesEncryption.encrypt(req.email),
          dob: undefined,
          bloodtype: "",
          allergicdrug: "",
          cmt: "",
          identifiednumber: "",
          address: "",
          gender: "",
          usertype: AesEncryption.encrypt("002"),
          identifiedphoto_front: "",
          identifiedphoto_back: "",
          profileimage: "",
          created_date: new Date(Date.now()),
          modified_date: new Date(),
          created_user: "null",
          modified_user: "null",
          is_delete: false,
          is_active: true,
          age: 0
        };
        const skc_value = new this.skcuser(skc_param);
        await skc_value.save();

        // Generate Token
        const _userid = _username;
        const token = jwt.sign({ _userid }, secretKey, {
          expiresIn: "1w",
        });
        const mytoken = "Bearer " + token;

        data = {
          token: mytoken
        };
        status = "success";
        return { status, data };
      } else {
        if(filter.username == _username){
          data = {};
        const status = "invalidname";
        return { data, status };
        }
        else{
          data = {};
        const status = "invalidphone";
        return { data, status };
        }
      }
    } catch (e) {
      data = e;
      status = "fail";
      return { status, data };
    }
  }
  //sign in
  public async signin(req: AppSignInUser): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    try {
      // check request parameter contain or not
      const check = this.checksigninrequest(req);
      if (check == "fail") {
        data = {};
        const status = "insufficient";
        return { status, data };
      }
      // collect request parameter
      const { userid, password } = req;

      if(userid == '' || password == ''){
        data = {};
        const status = "insufficient";
        return { status, data };
      }
      const _userid = AesEncryption.encrypt(userid);
      const _password = AesEncryption.encrypt(password);

      // validate user exist or not
      const app_user = await this.appusers.findOne({ $or : [{username: _userid}, { phone: _userid}] });

      if (
        app_user &&
        (app_user.username == _userid || app_user.phone == _userid) &&
        app_user.password == _password
      ) {
        const skc_user = await this.skcuser.findOne({ appuserid: app_user.appuserid });
        if (skc_user) {
          // Check the user has completed step 2 of registration process
          const step = skc_user.identifiednumber ? true : false;
          // Create token
          const token = jwt.sign({ _userid }, secretKey, {
            expiresIn: "1w",
          });
          data = {
            token : "Bearer " + token,
            step : step,
            username : AesEncryption.decrypt(app_user.username),
            fullname : AesEncryption.decrypt(skc_user.fullname),
            phone: AesEncryption.decrypt(app_user.phone),
            email : AesEncryption.decrypt(skc_user.email),
          };
          status = "success";
          return { status, data };
        } else {
          data = {};
          const status = "invalid";
          return { data, status };
        }
      } else {
        data = {};
        const status = "invalid";
        return { data, status };
      }
    } catch (e) {
      data = e;
      status = "fail";
      return { status, data };
    }
  }
  // sent OTP
  public async sendotp(req: AppUserOTP): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    try {
      // check request parameter contain or not
      const check = this.checksendotprequest(req);
      if (check == "fail") {
        data = {};
        status = "insufficient";
        return { status, data };
      }
      const { userid } = req;
      // // const token = getTokenFromHeader(req);
      // // check request token exist or not
      // if (token) {
      //   // check request token true or false
      //   const doc = jwt.decode(token, secretKey, algorithms);
      //   if (doc["_userid"] == AesEncryption.encrypt(userid)) {
          var OTP = this.random(1, 900000);
          const JWT = jwt.sign({ code: OTP }, secretKey, {
            expiresIn: "2m",
          });
          const checkmail = this.verificationemail(userid);
          if (checkmail == "true") {
            let mailOptions = {
              from: "skyclinic28@gmail.com",
              to: userid,
              subject: "OTP",
              cc: "",
              text: OTP.toString(),
              html: "",
            };
            this.sendemail(mailOptions);
          } else {
            data = {};
            status = "invalidmail";
            return { status, data };
          }

          data = JWT;
          status = "success";
          return { status, data };
      //   } else {
      //     data = {};
      //     status = "unauthorized";
      //     return { status, data };
      //   }
      // } else {
      //   data = {};
      //   status = "unauthorized";
      //   return { status, data };
      // }
    } catch (e) {
      data = e;
      status = "fail";
      return { status, data };
    }
  }
  // verify otp
  public async verifyotp(req: Request): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const check = this.checkverifyotprequest(req);
      if (check == "fail") {
        data = {};
        status = "insufficient";
        return { status, data };
      }
      const { userid, session, otp } = req.body;
      // const token = getTokenFromHeader(req);
      // check request token exist or not
      // if (token) {
      //   // check request token true or false
      //   const doc_token = jwt.decode(token, secretKey, algorithms);
      //   if (doc_token["_userid"] == AesEncryption.encrypt(userid)) {
          // check request session true or false
          const doc_session = jwt.decode(session, secretKey, algorithms);
          if (
            doc_session["code"] == otp &&
            !(Date.now() >= doc_session["exp"] * 1000)
          ) {
            const appuserlist = await this.appusers.findOne({
              userid: AesEncryption.encrypt(userid),
            });
            if (appuserlist) {
              appuserlist.verify = true;
              const app_user = await this.appusers.findOneAndUpdate(
                { appuserid: appuserlist.appuserid },
                appuserlist,
                { new: true }
              );
              const skcuserlist = await this.skcuser.find({});
              var userlist: any;
              userlist = skcuserlist.filter(
                (skcuser: any) => skcuser.appuserid === app_user.appuserid
              );
              // check data empty
              if (!userlist) {
                data = {};
                return { status, data };
              }
              for (var i = 0, len = userlist.length; i < len; i++) {
                list.push({
                  skcuserid: userlist[i]["skcuserid"],
                  userid: userid,
                  name: AesEncryption.decrypt(userlist[i]["name"]),
                  address: AesEncryption.decrypt(userlist[i]["address"]),
                  gender: userlist[i]["gender"],
                  usertype: userlist[i]["usertype"],
                  identifiedphoto: userlist[i]["identifiedphoto"],
                  profileImage: userlist[i]["profileImage"],
                  verify: app_user.verify,
                });
              }
              data = list;
              status = "success";
              return { status, data };
            } else {
              data = {};
              status = "invalid";
              return { status, data };
            }
          } else {
            data = {};
            status = "invalidotp";
            return { status, data };
          }
      //   } else {
      //     data = {};
      //     status = "unauthorized";
      //     return { status, data };
      //   }
      // } else {
      //   data = {};
      //   status = "unauthorized";
      //   return { status, data };
      // }
    } catch (e) {
      data = e;
      status = "fail";
      return { status, data };
    }
  }

  public sendemail(mailOptions: any) {
    // console.log(mailOptions)
    transporter.sendMail(mailOptions, (err: any) => {
      if (err) {
        console.log(err);
      } else {
        console.log("success");
      }
    });
  }
  public random(min: number, max: number) {
    var random_number = Math.floor(min + Math.random() * max);
    return random_number;
  }

  public checkuserid(req: Request) {
    // check request parameter contain or not
    if (req.body.userid == undefined) {
      return "fail";
    }
  }
  public checkuserdeleterequest(req: Request) {
    // check request parameter contain or not
    if ((req.body.skcuserid && req.body.userid) == undefined) {
      return "fail";
    }
  }

  public checksigninrequest(req: AppSignInUser) {
    // check request parameter contain or not
    if ((req.userid && req.password) == undefined) {
      return "fail";
    }
  }
  public checksendotprequest(req: AppUserOTP) {
    // check request parameter contain or not
    if ((req.userid && req.token) == undefined){
      return "fail";
    }
  }
  public checkverifyotprequest(req: Request) {
    // check request parameter contain or not
    if ((req.body.userid && req.body.otp && req.body.session) == undefined) {
      return "fail";
    }
  }
  public verificationemail(email: any) {
    const emailRegex = /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i;
    if (emailRegex.test(email)) {
      return "true";
    } else {
      return "false";
    }
  }

  public checkappuserrequest(req: AppReqUser) {
    // check request parameter contain or not
    if (
      (req.username &&
        req.phone &&
        req.fullname &&
        req.email &&
        req.password) == undefined
    ) {
      return "fail";
    }
  }
}
