import { Request } from "express";
import mongoose from "mongoose";
import AesEncryption from "../common/aesEncryption";
// import { ISKCUser, RSKCUser } from "../models/skcuser.model";
// import ISKCUserClass from "../models/skcuser.model";
import AppUserClass from "../models/appuser.model";
import { injectable } from "tsyringe";
import environment from "../../environment";
// import getTokenFromHeader from "../common/headerToken";
import generateFilename from "../common/generateFilename";
import minioClient from "../common/minio";
import * as fs from "fs"; //for unlink(delete) old image in folder
import checkFileType from "../common/checkFileType";
import IdoctorClass, { Idoctor, IDoctorInput } from "../models/doctor.model";
import { v4 as uuidv4 } from "uuid";
import { fileupload, getfileurl } from "../common/fileupload";

const jwt = require("jsonwebtoken");

const { secretKey, algorithms } = environment.getJWTConfig();

@injectable()
export class DoctorServices {
  doctor: mongoose.Model<any>;
  appusers: mongoose.Model<any>;
  constructor(doctor?: IdoctorClass, appuser?: AppUserClass) {
    this.doctor = doctor!.model;
    this.appusers = appuser!.model;
  }

  // setup doctor
  public async setupdoctor(
    req: IDoctorInput,
    files: any
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const check = this.checksetupdoctorrequest(req);
      if (check == "fail") {
        data = {};
        const status = "insufficient";
        return { status, data };
      }

      const { userid } = req;
      const _userid = AesEncryption.encrypt(userid);
      //check user exit or not
      const filter_userid = {
        $or: [{ username: _userid }, { phone: _userid }],
      };
      var filter = await this.appusers.findOne(filter_userid);
      if (filter != null && filter.appuserid) {
        const appuserid = filter.appuserid;

        const filter_appuserid = { appuserid: appuserid };
        const check_exist = await this.doctor.findOne(filter_appuserid);
        if (check_exist != null) {
          data = {};
          const status = "unauthorized";
          return { data, status };
        }

        var files: any = files;
        console.log(req);
        const smphoto = files?.find((x: any) => x.fieldname == "smphoto");
        const grecord = files?.find((x: any) => x.fieldname == "grecord");

        if (smphoto == undefined) {
          console.log("here");
          data = {};
          status = "insufficient";
          return { status, data };
        }
        // Check Image Type
        if (
          !checkFileType(smphoto.mimetype) ||
          (grecord != undefined && !checkFileType(grecord.mimetype))
        ) {
          data = {};
          status = "invalidimg";
          return { status, data };
        }

        const smphotoname = generateFilename(smphoto.originalname);
        const await_profile = await fileupload(
          "smphoto/" + smphotoname,
          smphoto["path"]
        );

        const grecordname = grecord
          ? generateFilename(grecord.originalname)
          : "";
        if (grecord != undefined) {
          const await_grecord = await fileupload(
            "grecord/" + grecordname,
            grecord["path"]
          );
        }

        const doctorid = uuidv4();
        // collect request parameter for appuser
        const doctor_data: Idoctor = {
          appuserid: appuserid,
          doctorid: doctorid,
          doctorname: AesEncryption.encrypt(req.doctorname),
          smno: AesEncryption.encrypt(req.smno),
          expdate: req.expdate,
          smphoto: AesEncryption.encrypt(smphotoname),
          degrees: [
            {
              degreename: AesEncryption.encrypt(req.degreename),
              guni: AesEncryption.encrypt(req.guni),
              gyear: AesEncryption.encrypt(req.gyear),
              grecord: AesEncryption.encrypt(grecordname),
            },
          ],
          phone: AesEncryption.encrypt(req.phone),
          specializedarea: AesEncryption.encrypt(req.specializedarea),
          created_date: new Date(Date.now()),
          modified_date: new Date(),
          created_user: _userid,
          modified_user: "null",
          is_delete: false,
          is_active: true,
        };
        const doctor_value = new this.doctor(doctor_data);
        const doctor_result = await doctor_value.save();

        data = doctor_result;
        status = "success";
        return { status, data };
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

  public async updatedoctor(
    req: IDoctorInput,
    files: any
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const check = this.checksetupdoctorrequest(req);
      if (check == "fail") {
        data = {};
        const status = "insufficient";
        return { status, data };
      }

      const { userid } = req;
      const _userid = AesEncryption.encrypt(userid);
      //check user exit or not
      const filter_userid = {
        $or: [{ username: _userid }, { phone: _userid }],
      };
      var filter = await this.appusers.findOne(filter_userid);
      if (filter != null && filter.appuserid) {
        const appuserid = filter.appuserid;

        const filter_appuserid = { appuserid: appuserid };
        const check_exist = await this.doctor.findOne(filter_appuserid);
        if (check_exist == null) {
          data = {};
          const status = "unauthorized";
          return { data, status };
        }

        var files: any = files;
        console.log(req);
        const smphoto = files?.find((x: any) => x.fieldname == "smphoto");
        const grecord = files?.find((x: any) => x.fieldname == "grecord");

        // Check Image Type
        if (
          (smphoto != undefined && !checkFileType(smphoto.mimetype)) ||
          (grecord != undefined && !checkFileType(grecord.mimetype))
        ) {
          data = {};
          status = "invalidimg";
          return { status, data };
        }
        const smphotoname = smphoto
          ? generateFilename(smphoto.originalname)
          : "";
        if (smphoto != undefined) {
          const await_profile = await fileupload(
            "smphoto/" + smphotoname,
            smphoto["path"]
          );
          console.log(await_profile);
        }
        const grecordname = grecord
          ? generateFilename(grecord.originalname)
          : "";
        if (grecord != undefined) {
          const await_grecord = await fileupload(
            "grecord/" + grecordname,
            grecord["path"]
          );
        }

        // collect request parameter for appuser
        const doctor_data: Idoctor = {
          appuserid: appuserid,
          doctorid: check_exist.doctorid,
          doctorname: AesEncryption.encrypt(req.doctorname),
          smno: AesEncryption.encrypt(req.smno),
          expdate: req.expdate,
          smphoto: smphoto
            ? AesEncryption.encrypt(smphotoname)
            : check_exist.smphoto,
          degrees: [
            {
              degreename: AesEncryption.encrypt(req.degreename),
              guni: AesEncryption.encrypt(req.guni),
              gyear: AesEncryption.encrypt(req.gyear),
              grecord: grecord
                ? AesEncryption.encrypt(grecordname)
                : check_exist.grecord,
            },
          ],
          phone: AesEncryption.encrypt(req.phone),
          specializedarea: AesEncryption.encrypt(req.specializedarea),
          created_date: check_exist.created_date,
          modified_date: new Date(),
          created_user: check_exist.created_user,
          modified_user: _userid,
          is_delete: false,
          is_active: true,
        };
        // const doctor_value = new this.doctor(doctor_data);
        // const doctor_result = await doctor_value.save();

        const result = await this.doctor.findOneAndUpdate(
          { appuserid: appuserid },
          doctor_data,
          { new: true }
        );

        data = result;
        status = "success";
        return { status, data };
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

  public async getdoctor(
    userid: string
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      const check = this.checkgetdoctorinput(userid);
      if (check == "fail") {
        data = {};
        const status = "insufficient";
        return { status, data };
      }

      const _userid = AesEncryption.encrypt(userid);
      //check user exit or not
      const filter_userid = {
        $or: [{ username: _userid }, { phone: _userid }],
      };
      var filter = await this.appusers.findOne(filter_userid);
      if (filter != null && filter.appuserid) {
        const appuserid = filter.appuserid;

        const filter_appuserid = { appuserid: appuserid };
        const check_exist = await this.doctor.findOne(filter_appuserid);
        if (check_exist == null) {
          data = {};
          const status = "invalid";
          return { data, status };
        } else {
          console.log(check_exist);
          // collect request parameter for appuser
          const doctor_data = {
            appuserid: appuserid,
            doctorid: check_exist.doctorid,
            doctorname: AesEncryption.decrypt(check_exist.doctorname),
            smno: AesEncryption.decrypt(check_exist.smno),
            expdate: check_exist.expdate,
            smphoto: getfileurl(
              AesEncryption.decrypt(check_exist.smphoto),
              "smphoto"
            ),
            degrees: [
              {
                degreename: AesEncryption.decrypt(check_exist.degreename),
                guni: AesEncryption.decrypt(check_exist.guni),
                gyear: AesEncryption.decrypt(check_exist.gyear),
                grecord: getfileurl(
                  AesEncryption.decrypt(check_exist.smphoto),
                  "grecord"
                ),
              },
            ],
            phone: AesEncryption.decrypt(check_exist.phone),
            specializedarea: AesEncryption.decrypt(check_exist.specializedarea),
          };
          data = doctor_data;
          const status = "success";
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

  public checksetupdoctorrequest(req: IDoctorInput) {
    // check request parameter contain or not
    if (
      (req.userid &&
        req.doctorname &&
        req.smno &&
        req.expdate &&
        req.degreename &&
        req.guni &&
        req.gyear &&
        req.phone &&
        req.specializedarea) == undefined
    ) {
      return "fail";
    }
  }

  public checkgetdoctorinput(userid: string) {
    // check request parameter contain or not
    if (userid == undefined || userid == "") {
      return "fail";
    }
  }
}
