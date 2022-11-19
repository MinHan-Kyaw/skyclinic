import { Request } from "express";
import mongoose from "mongoose";
import AesEncryption from "../common/aesEncryption";
import { ISKCUser, RSKCUser } from "../models/skcuser.model";
import ISKCUserClass from "../models/skcuser.model";
import AppUserClass from "../models/appuser.model";
import { injectable } from "tsyringe";
import environment from "../../environment";
import getTokenFromHeader from "../common/headerToken";
import generateFilename from "../common/generateFilename";
import minioClient from "../common/minio";
import * as fs from "fs"; //for unlink(delete) old image in folder
import checkFileType from "../common/checkFileType";

const jwt = require("jsonwebtoken");

const { secretKey, algorithms } = environment.getJWTConfig();

@injectable()
export class UserServices {
  skcuser: mongoose.Model<any>;
  appusers: mongoose.Model<any>;
  constructor(skcuser?: ISKCUserClass, appusers?: AppUserClass) {
    this.skcuser = skcuser!.model;
    this.appusers = appusers!.model;
  }

  // update user
  public async updateskcuser(
    req: Request
  ): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const check = this.checkskcuserrequest(req);
      if (check == "fail") {
        data = {};
        status = "insufficient";
        return { status, data };
      }
      const { userid } = req.body;
      const token = getTokenFromHeader(req);
      console.log('here')

      // check request token exist or not
      if (token) {
        const doc = jwt.decode(token, secretKey, algorithms);

        const _userid = AesEncryption.encrypt(userid);
        // check request token valid or not
        if (doc["_userid"] == _userid) {
          var files: any = req.files;
          const profileimage = files?.find((x: any) => x.fieldname == 'profileimage');
          const identifiedphoto_front = files?.find((x: any) => x.fieldname == 'identifiedphoto_front');
          const identifiedphoto_back = files?.find((x: any) => x.fieldname == 'identifiedphoto_back');
          if(profileimage == undefined || identifiedphoto_front == undefined || identifiedphoto_back == undefined){
            data = {};
            status = "insufficient";
            return { status, data };
          }
          // Check Image Type
          if (
            !checkFileType(profileimage.mimetype) ||
            !checkFileType(identifiedphoto_front.mimetype) ||
            !checkFileType(identifiedphoto_back.mimetype)
          ) {
            data = {};
            status = "invalidimg";
            return { status, data };
          }

          const appuser_filter = {
            $or: [{ username: _userid }, { phone: _userid }],
          };
          const app_user = await this.appusers.findOne(appuser_filter);
          // Check user exists in app user table
          if (app_user && app_user.is_delete == false) {
            const skcuser_filter = { appuserid: app_user.appuserid };
            // check user exist or not
            const checkexist = await this.skcuser.findOne(skcuser_filter);
            console.log('here 2')
            if (checkexist) {
              //profile image upload
              const profileimagename = generateFilename(
                profileimage.originalname
              );
              const await_profile = await minioClient.fPutObject(
                "skcbucket",
                "profiles/" + profileimagename,
                /*  */
                /* *|MARKER_CURSOR|* */
                profileimage["path"],
                { "Content-Type": "application/octet-stream" },
              );

              //Identified front image upload

              const identifiedphotofrontname = generateFilename(
                identifiedphoto_front.originalname
              );
              const await_identifiedphoto_front = await minioClient.fPutObject(
                "skcbucket",
                "identifiedphotos/" + identifiedphotofrontname,
                identifiedphoto_front["path"],
                { "Content-Type": "application/octet-stream" },
              );

              //Identified back image upload
              const identifiedphotobackname = generateFilename(
                identifiedphoto_back.originalname
              );
              const await_identifiedphoto_back = await minioClient.fPutObject(
                "skcbucket",
                "identifiedphotos/" + identifiedphotobackname,
                identifiedphoto_back["path"],
                { "Content-Type": "application/octet-stream" },
              );

              const skcuser_params: ISKCUser = {
                skcuserid: checkexist.skcuserid,
                appuserid: checkexist.appuserid,
                address: AesEncryption.encrypt(req.body.address),
                gender: AesEncryption.encrypt(req.body.gender),
                usertype: checkexist.usertype,
                identifiedphoto_front: AesEncryption.encrypt(
                  identifiedphotofrontname
                ),
                identifiedphoto_back: AesEncryption.encrypt(
                  identifiedphotobackname
                ),
                identifiednumber: AesEncryption.encrypt(
                  req.body.identifiednumber
                ),
                fullname: AesEncryption.encrypt(req.body.fullname),
                othername: AesEncryption.encrypt(req.body.othername),
                email: AesEncryption.encrypt(req.body.email),
                dob: req.body.dob,
                bloodtype: AesEncryption.encrypt(req.body.bloodtype),
                allergicdrug: AesEncryption.encrypt(req.body.allergicdrug),
                cmt: AesEncryption.encrypt(req.body.cmt),
                profileimage: AesEncryption.encrypt(profileimagename),
                created_date: checkexist.created_date,
                modified_date: new Date(),
                created_user: checkexist.created_user,
                modified_user: checkexist.modified_user,
                is_delete: checkexist.is_delete,
                is_acitve: checkexist.is_acitve,
              };
              const result = await this.skcuser.findOneAndUpdate(
                { appuserid: app_user.appuserid },
                skcuser_params,
                { new: true }
              );
              list.push({
                _id: result._id,
                skcuserid: result.skcuserid,
                appuserid: result.appuserid,
                name: AesEncryption.decrypt(result.name),
                address: AesEncryption.decrypt(result.address),
                gender: AesEncryption.decrypt(result.gender),
                usertype: AesEncryption.decrypt(result.usertype),
                identifiedPhoto: AesEncryption.decrypt(result.identifiedPhoto),
                profileImage: AesEncryption.decrypt(result.profileImage),
                modification_notes: result.modification_notes,
                __v: result.__v,
              });

              // // remove temporary folder for images
              // fs.rm("uploads/", { recursive: true }, (err) => {
              //   if (err) {
              //     throw err;
              //   }
              // });

              data = {};
              status = "success";
              return { status, data };
            } else {
              data = {};
              status = "unauthorized";
              return { status, data };
            }
          } else {
            data = {};
            status = "invalid";
            return { status, data };
          }
        } else {
          data = {};
          status = "unauthorized";
          return { status, data };
        }
      } else {
        data = {};
        status = "unauthorized";
        return { status, data };
      }
    } catch (e) {
      data = e;
      status = "fail";
      return { status, data };
    }
  }
  // get all user
  public async getall(req: Request): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const check = this.checkgetalluserrequest(req);
      if (check == "fail") {
        data = {};
        status = "insufficient";
        return { status, data };
      }
      const { userid } = req.body;
      const token = getTokenFromHeader(req);
      // check request token exist or not
      // if (token) {
      // const doc = jwt.decode(token, secretKey, algorithms);
      // check request token true or false
      // if (doc["_userid"] == AesEncryption.encrypt(userid)) {
      const skcuserlist = await this.skcuser.find({});
      const appuserlist = await this.appusers.find({});
      status = "success";
      // check data empty
      if (!skcuserlist) {
        data = {};
        return { status, data };
      }
      for (var i = 0, len = skcuserlist.length; i < len; i++) {
        let useridobj: any;
        useridobj = appuserlist.filter(
          (appuser) => appuser.appuserid === skcuserlist[i]["appuserid"]
        );
        //check user is deleted or not
        if (useridobj[0]["is_delete"] == false) {
          list.push({
            skcuserid: skcuserlist[i]["skcuserid"],
            // userid: AesEncryption.decrypt(useridobj[0]["userid"]),
            name: AesEncryption.decrypt(useridobj[0]["username"]),
            phone: AesEncryption.decrypt(useridobj[0]["phone"]),
            address: AesEncryption.decrypt(skcuserlist[i]["address"]),
            gender: skcuserlist[i]["gender"],
            usertype: AesEncryption.decrypt(skcuserlist[i]["usertype"]),
            identifiedPhoto: skcuserlist[i]["identifiedPhoto"],
            profileImage: skcuserlist[i]["profileImage"],
          });
        }
      }
      data = list;
      status = "success";
      return { status, data };
      // } else {
      //   data = {};
      //   status = "unauthorized";
      //   return { status, data };
      // }
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
  // Get User Detail
  public async getdetail(req: Request): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      const { userid } = req.body;
      const _userid = AesEncryption.encrypt(userid);
      const token = getTokenFromHeader(req);
      // check request parameter contain or not
      const check = this.checkuserid(req);
      if (check == "fail") {
        data = {};
        status = "insufficient";
        return { status, data };
      }
      // check request token exist or not
      if (token) {
        const doc = jwt.decode(token, secretKey, algorithms);
        // check request token valid or not
        if (doc["_userid"] == _userid) {
          const appuser_filter = {
            $or: [{ username: _userid }, { phone: _userid }],
          };
          var appuser = await this.appusers.findOne(appuser_filter);
          //check user is deleted or not
          if (appuser && appuser["is_delete"] == false) {
            const skcuser_filter = {
              appuserid: appuser.appuserid,
            };
            const skcuser = await this.skcuser.findOne(skcuser_filter);
            // Check user exist in skc user table and it is active
            if (skcuser && skcuser["is_delete"] == false) {
              var result: RSKCUser = {
                username: AesEncryption.decrypt(appuser.username),
                phone: AesEncryption.decrypt(appuser.phone),
                fullname: AesEncryption.decrypt(skcuser.fullname),
                othername: AesEncryption.decrypt(skcuser.othername),
                email: AesEncryption.decrypt(skcuser.email),
                address: AesEncryption.decrypt(skcuser.address),
                dob: skcuser.dob,
                gender: AesEncryption.decrypt(skcuser.gender),
                bloodtype: AesEncryption.decrypt(skcuser.bloodtype),
                allergicdrug: AesEncryption.decrypt(skcuser.allergicdrug),
                cmt: AesEncryption.decrypt(skcuser.cmt),
                usertype: AesEncryption.decrypt(skcuser.usertype),
                identifiednumber: AesEncryption.decrypt(
                  skcuser.identifiednumber
                ),
                identifiedphoto_front: AesEncryption.decrypt(
                  skcuser.identifiedphoto_front
                ),
                identifiedphoto_back: AesEncryption.decrypt(
                  skcuser.identifiedphoto_back
                ),
                profileimage: AesEncryption.decrypt(skcuser.profileimage),
              };
              data = result;
              status = "success";
              return { status, data };
            } else {
              data = {};
              status = "invalid";
              return { status, data };
            }
          } else {
            data = {};
            status = "invalid";
            return { status, data };
          }
        } else {
          data = {};
          status = "unauthorized";
          return { status, data };
        }
      } else {
        data = {};
        status = "unauthorized";
        return { status, data };
      }
    } catch (e: any) {
      data = e;
      status = "fail";
      return { status, data };
    }
  }
  // delete user
  public async deleteskcuser(
    req: Request
  ): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    try {
      const { userid } = req.body;
      const token = getTokenFromHeader(req);
      // check request parameter contain or not
      const check = this.checkuserdeleterequest(req);
      if (check == "fail") {
        data = {};
        status = "insufficient";
        return { status, data };
      }
      // check request token exist or not
      if (token) {
        const doc = jwt.decode(token, secretKey, algorithms);
        // check request token valid or not
        if (doc["_userid"] == AesEncryption.encrypt(userid)) {
          const skcuser_filter = { skcuserid: req.body.skcuserid };
          if (req.body.skcuserid) {
            const skcuser_value = await this.skcuser.findOne(skcuser_filter);
            const appuserlist = await this.appusers.find({});
            //check user exist or not
            if (skcuser_value) {
              if (skcuser_value.is_delete) {
                data = {};
                status = "invalid";
                return { status, data };
              }
              let appuser_value: any;
              appuser_value = appuserlist.filter(
                (appuser) => appuser.appuserid === skcuser_value["appuserid"]
              );
              skcuser_value["modification_notes"][0]["is_delete"] = true;
              await this.skcuser.findOneAndUpdate(
                { skcuserid: req.body.skcuserid },
                skcuser_value
              );
              appuser_value[0]["modification_notes"][0]["is_delete"] = true;
              await this.appusers.findOneAndUpdate(
                { appuserid: appuser_value[0]["appuserid"] },
                appuser_value[0]
              );
            }
            data = {};
            status = "success";
            return { status, data };
          } else {
            data = {};
            status = "fail";
            return { status, data };
          }
        } else {
          data = {};
          status = "invalid";
          return { status, data };
        }
      } else {
        data = {};
        status = "unauthorized";
        return { status, data };
      }
    } catch (e) {
      data = e;
      status = "fail";
      return { status, data };
    }
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

  public checkskcuserrequest(req: Request) {
    // check request parameter contain or not
    if (
      // req.files?.length != 2 &&
      req.body.userid ==
      //  &&
      // req.body.username &&
      // req.body.address &&
      // req.body.gender &&
      // req.body.fullname &&
      // req.body.othername &&
      // req.body.email &&
      // req.body.dob &&
      // req.body.bloodtype &&
      // req.body.allergicdrug &&
      // req.body.cmt &&
      // req.body.identifiednumber &&
      // req.body.identifiedphoto &&
      // req.body.profileimage
      undefined
    ) {
      return "fail";
    }
  }
  public checkgetalluserrequest(req: Request) {
    // check request parameter contain or not
    if (req.body.userid == undefined) {
      return "fail";
    }
  }
}
