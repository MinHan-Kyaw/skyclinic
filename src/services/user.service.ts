import { Request } from "express";
import mongoose from "mongoose";
import AesEncryption from "../common/aesEncryption";
import { ISKCUser, IUserUpdate, RSKCUser } from "../models/skcuser.model";
import ISKCUserClass from "../models/skcuser.model";
// import AppUserClass from "../models/appuser.model";
import AppUserClass, {
  AppReqUser,
  AppSignInUser,
  AppUserDetail,
  AppUserByType,
} from "../models/appuser.model";
import { injectable } from "tsyringe";
import environment from "../../environment";
import generateFilename from "../common/generateFilename";
import minioClient from "../common/minio";
import checkFileType from "../common/checkFileType";
import { fileupload, getfileurl } from "../common/fileupload";

const bucketname = "awyc-lonely";

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
    req: IUserUpdate,
    files: any
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
      const { userid } = req;
      // const token = getTokenFromHeader(req);

      // check request token exist or not
      // if (token) {
      //   const doc = jwt.decode(token, secretKey, algorithms);

      const _userid = AesEncryption.encrypt(userid);
      //   // check request token valid or not
      //   if (doc["_userid"] == _userid) {
      var files: any = files;
      const profileimage = files?.find(
        (x: any) => x.fieldname == "profileimage"
      );
      const identifiedphoto_front = files?.find(
        (x: any) => x.fieldname == "identifiedphoto_front"
      );
      const identifiedphoto_back = files?.find(
        (x: any) => x.fieldname == "identifiedphoto_back"
      );
      if (
        profileimage == undefined ||
        identifiedphoto_front == undefined ||
        identifiedphoto_back == undefined
      ) {
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
        if (checkexist) {
          //profile image upload
          const profileimagename = generateFilename(profileimage.originalname);
          const await_profile = await fileupload(
            "profiles/" + profileimagename,
            profileimage["path"]
          );

          //Identified front image upload
          const identifiedphotofrontname = generateFilename(
            identifiedphoto_front.originalname
          );
          const await_identifiedphoto_front = await fileupload(
            "identifiedphotos/" + identifiedphotofrontname,
            identifiedphoto_front["path"]
          );

          //Identified back image upload
          const identifiedphotobackname = generateFilename(
            identifiedphoto_back.originalname
          );
          const await_identifiedphoto_back = await fileupload(
            "identifiedphotos/" + identifiedphotobackname,
            identifiedphoto_back["path"]
          );

          const today = new Date();
          var year = parseInt(req.dob.toString().split("-")[0]);
          // let year = d.getFullYear();
          var age = today.getFullYear() - year;
          const skcuser_params: ISKCUser = {
            skcuserid: checkexist.skcuserid,
            appuserid: checkexist.appuserid,
            address: AesEncryption.encrypt(req.address),
            gender: AesEncryption.encrypt(req.gender),
            usertype: checkexist.usertype,
            identifiedphoto_front: AesEncryption.encrypt(
              identifiedphotofrontname
            ),
            identifiedphoto_back: AesEncryption.encrypt(
              identifiedphotobackname
            ),
            nrccode: AesEncryption.encrypt(req.nrccode),
            nrcregion: AesEncryption.encrypt(req.nrcregion),
            nrctype: AesEncryption.encrypt(req.nrctype),
            nrcnumber: AesEncryption.encrypt(req.nrcnumber),
            // identifiednumber: AesEncryption.encrypt(req.identifiednumber),
            fullname: AesEncryption.encrypt(req.fullname),
            othername: AesEncryption.encrypt(req.othername),
            email: AesEncryption.encrypt(req.email),
            dob: req.dob,
            bloodtype: AesEncryption.encrypt(req.bloodtype),
            allergicdrug: AesEncryption.encrypt(req.allergicdrug),
            cmt: AesEncryption.encrypt(req.cmt),
            profileimage: AesEncryption.encrypt(profileimagename),
            created_date: checkexist.created_date,
            modified_date: new Date(),
            created_user: checkexist.created_user,
            modified_user: checkexist.modified_user,
            is_delete: checkexist.is_delete,
            is_active: checkexist.is_active,
            age: age,
          };
          const result = await this.skcuser.findOneAndUpdate(
            { appuserid: app_user.appuserid },
            skcuser_params,
            { new: true }
          );

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

  // update profile
  public async updateprofile(
    req: IUserUpdate,
    files: any
  ): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const check = this.checkupdateprofilerequest(req);
      if (check == "fail") {
        data = {};
        status = "insufficient";
        return { status, data };
      }
      const { userid } = req;

      const _userid = AesEncryption.encrypt(userid);

      var files: any = files;
      const profileimage = files?.find(
        (x: any) => x.fieldname == "profileimage"
      );
      const identifiedphoto_front = files?.find(
        (x: any) => x.fieldname == "identifiedphoto_front"
      );
      const identifiedphoto_back = files?.find(
        (x: any) => x.fieldname == "identifiedphoto_back"
      );

      // Check Image Type
      if (
        (profileimage != undefined && !checkFileType(profileimage.mimetype)) ||
        (identifiedphoto_front != undefined &&
          !checkFileType(identifiedphoto_front.mimetype)) ||
        (identifiedphoto_back != undefined &&
          !checkFileType(identifiedphoto_back.mimetype))
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
        const oldskcuser = await this.skcuser.findOne(skcuser_filter);
        if (oldskcuser) {
          var profileimagename = AesEncryption.decrypt(oldskcuser.profileimage);
          var identifiedphotofrontname = AesEncryption.decrypt(
            oldskcuser.identifiedphoto_front
          );
          var identifiedphotobackname = AesEncryption.decrypt(
            oldskcuser.identifiedphoto_back
          );
          //profile image upload
          if (profileimage != undefined) {
            profileimagename = generateFilename(profileimage.originalname);
            const await_profile = await fileupload(
              "profiles/" + profileimagename,
              profileimage["path"],
              "profiles/" + oldskcuser.profileimage
            );
          }

          //Identified front image upload
          if (identifiedphoto_front != undefined) {
            identifiedphotofrontname = generateFilename(
              identifiedphoto_front.originalname
            );
            const await_identifiedphoto_front = await fileupload(
              "identifiedphotos/" + identifiedphotofrontname,
              identifiedphoto_front["path"],
              "identifiedphotos/" + oldskcuser.identifiedphoto_front
            );
          }

          if (identifiedphoto_back != undefined) {
            //Identified back image upload
            identifiedphotobackname = generateFilename(
              identifiedphoto_back.originalname
            );
            const await_identifiedphoto_back = await fileupload(
              "identifiedphotos/" + identifiedphotobackname,
              identifiedphoto_back["path"],
              "identifiedphotos/" + oldskcuser.identifiedphoto_back
            );
          }

          const today = new Date();
          var year = parseInt(req.dob.toString().split("-")[0]);
          // let year = d.getFullYear();
          var age = today.getFullYear() - year;
          const skcuser_params: ISKCUser = {
            skcuserid: oldskcuser.skcuserid,
            appuserid: oldskcuser.appuserid,
            address: AesEncryption.encrypt(req.address),
            gender: AesEncryption.encrypt(req.gender),
            usertype: oldskcuser.usertype,
            identifiedphoto_front: AesEncryption.encrypt(
              identifiedphotofrontname
            ),
            identifiedphoto_back: AesEncryption.encrypt(
              identifiedphotobackname
            ),
            nrccode: AesEncryption.encrypt(req.nrccode),
            nrcregion: AesEncryption.encrypt(req.nrcregion),
            nrctype: AesEncryption.encrypt(req.nrctype),
            nrcnumber: AesEncryption.encrypt(req.nrcnumber),
            // identifiednumber: AesEncryption.encrypt(req.identifiednumber),
            fullname: AesEncryption.encrypt(req.fullname),
            othername: AesEncryption.encrypt(req.othername),
            email: AesEncryption.encrypt(req.email),
            dob: req.dob,
            bloodtype: AesEncryption.encrypt(req.bloodtype),
            allergicdrug: AesEncryption.encrypt(req.allergicdrug),
            cmt: AesEncryption.encrypt(req.cmt),
            profileimage: AesEncryption.encrypt(profileimagename),
            created_date: oldskcuser.created_date,
            modified_date: new Date(),
            created_user: oldskcuser.created_user,
            modified_user: oldskcuser.modified_user,
            is_delete: oldskcuser.is_delete,
            is_active: oldskcuser.is_active,
            age: age,
          };
          const result = await this.skcuser.findOneAndUpdate(
            { appuserid: app_user.appuserid },
            skcuser_params,
            { new: true }
          );
          data = {
            address: AesEncryption.decrypt(result.address),
            gender: AesEncryption.decrypt(result.gender),
            identifiedphoto_front: getfileurl(
              AesEncryption.decrypt(result.identifiedphoto_front),
              "identifiedphotos"
            ),
            identifiedphoto_back: getfileurl(
              AesEncryption.decrypt(result.identifiedphoto_back),
              "identifiedphotos"
            ),
            nrccode: AesEncryption.decrypt(result.nrccode),
            nrcregion: AesEncryption.decrypt(result.nrcregion),
            nrctype: AesEncryption.decrypt(result.nrctype),
            nrcnumber: AesEncryption.decrypt(result.nrcnumber),
            // identifiednumber: AesEncryption.decrypt(result.identifiednumber),
            fullname: AesEncryption.decrypt(result.fullname),
            othername: AesEncryption.decrypt(result.othername),
            email: AesEncryption.decrypt(result.email),
            dob: req.dob,
            bloodtype: AesEncryption.decrypt(result.bloodtype),
            allergicdrug: AesEncryption.decrypt(result.allergicdrug),
            cmt: AesEncryption.decrypt(result.cmt),
            profileimage: getfileurl(
              AesEncryption.decrypt(result.profileimage),
              "profiles"
            ),
          };
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
  //get all user by type (age, active/inactive)
  public async getbytype(
    req: AppUserByType
  ): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const { age, active, gender } = req;
      const check = this.checkgettypeuserrequest(req);
      if (check == "fail") {
        data = {};
        status = "insufficient";
        return { status, data };
      }
      // const { userid } = req.body;
      // const token = getTokenFromHeader(req);
      // check request token exist or not
      // if (token) {
      // const doc = jwt.decode(token, secretKey, algorithms);
      // check request token true or false
      // if (doc["_userid"] == AesEncryption.encrypt(userid)) {
      var skcuserlist: any;
      if (req.age == 0) {
        if (req.gender == "") {
          skcuserlist = await this.skcuser.find({ is_active: req.active });
        } else {
          skcuserlist = await this.skcuser.find({
            is_active: req.active,
            gender: req.gender,
          });
        }
      } else if (req.gender == "") {
        if (req.age == 0) {
          skcuserlist = await this.skcuser.find({ is_active: req.active });
        } else {
          skcuserlist = await this.skcuser.find({
            is_active: req.active,
            age: req.age,
          });
        }
      } else {
        skcuserlist = await this.skcuser.find({
          age: req.age,
          is_active: req.active,
        });
      }

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
    } catch (e) {
      data = e;
      status = "fail";
      return { status, data };
    }
  }

  // get all user
  public async getall(): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      // const check = this.checkgetalluserrequest(req);
      // if (check == "fail") {
      //   data = {};
      //   status = "insufficient";
      //   return { status, data };
      // }
      // const { userid } = req.body;
      // const token = getTokenFromHeader(req);
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
  public async getdetail(
    req: AppUserDetail
  ): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      const { userid } = req;
      const _userid = AesEncryption.encrypt(userid);
      // const token = getTokenFromHeader(req);
      // // check request parameter contain or not
      // const check = this.checkuserid(req);
      // if (check == "fail") {
      //   data = {};
      //   status = "insufficient";
      //   return { status, data };
      // }
      // check request token exist or not
      // if (token) {
      //   const doc = jwt.decode(token, secretKey, algorithms);
      //   // check request token valid or not
      //   if (doc["_userid"] == _userid) {
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
            nrccode: AesEncryption.decrypt(skcuser.nrccode),
            nrcregion: AesEncryption.decrypt(skcuser.nrcregion),
            nrctype: AesEncryption.decrypt(skcuser.nrctype),
            nrcnumber: AesEncryption.decrypt(skcuser.nrcnumber),
            // identifiednumber: AesEncryption.decrypt(skcuser.identifiednumber),
            identifiedphoto_front: getfileurl(
              AesEncryption.decrypt(skcuser.identifiedphoto_front),
              "identifiedphotos"
            ),
            identifiedphoto_back: getfileurl(
              AesEncryption.decrypt(skcuser.identifiedphoto_back),
              "identifiedphotos"
            ),
            profileimage: getfileurl(
              AesEncryption.decrypt(skcuser.profileimage),
              "profiles"
            ),
            age: skcuser.age,
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
      // const token = getTokenFromHeader(req);
      // check request parameter contain or not
      const check = this.checkuserdeleterequest(req);
      if (check == "fail") {
        data = {};
        status = "insufficient";
        return { status, data };
      }
      // check request token exist or not
      // if (token) {
      // const doc = jwt.decode(token, secretKey, algorithms);
      // check request token valid or not
      // if (doc["_userid"] == AesEncryption.encrypt(userid)) {
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
      // } else {
      //   data = {};
      //   status = "invalid";
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

  public checkskcuserrequest(req: IUserUpdate) {
    // check request parameter contain or not
    if (
      (req.userid &&
        // req.username &&
        req.address &&
        req.gender &&
        req.fullname &&
        req.othername &&
        req.email &&
        req.dob &&
        req.bloodtype &&
        req.allergicdrug &&
        req.cmt) == undefined
    ) {
      return "fail";
    }
  }

  public checkupdateprofilerequest(req: IUserUpdate) {
    // check request parameter contain or not
    if (
      (req.userid &&
        req.address &&
        req.gender &&
        req.fullname &&
        req.othername &&
        req.email &&
        req.dob &&
        req.bloodtype &&
        req.allergicdrug &&
        req.cmt) == undefined
    ) {
      return "fail";
    }
  }
  public checkgettypeuserrequest(req: AppUserByType) {
    // check request parameter contain or not
    if (req.age && req.active && req.gender == undefined) {
      return "fail";
    }
  }
}
