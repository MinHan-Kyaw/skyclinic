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
import IdoctorClass, { Idoctor } from "../models/doctor.model";
import { v4 as uuidv4 } from "uuid";

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
    req: Request
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

      const { userid } = req.body;
      const _userid = AesEncryption.encrypt(userid);
      //check user exit or not
      const filter_userid = {
        $or: [{ username: _userid }, { phone: _userid }],
      };
      var filter = await this.appusers.findOne(filter_userid);
      if (filter != null && filter.appuserid) {
        var files: any = req.files;
        const grecord = files?.find(
          (x: any) => x.grecord == "grecord"
        );
        if (
          grecord == undefined
        ) {
          data = {};
          status = "insufficient";
          return { status, data };
        }
        // Check Image Type
        if (
          !checkFileType(grecord.mimetype)
        ) {
          data = {};
          status = "invalidimg";
          return { status, data };
        }

        const grecordname = generateFilename(grecord.originalname);
        minioClient.fPutObject(
          "skcbucket",
          "grecord/" + grecordname,
          grecord["path"],
          { "Content-Type": "application/octet-stream" },
          function (error, etag) {
            if (error) {
              data = error;
              status = "fail";
              return { status, data };
            }
          }
        );

        const appuserid = filter.appuserid;
        const doctorid = uuidv4();
        // collect request parameter for appuser
        const doctor_data: Idoctor = {
          appuserid: appuserid,
          doctorid: doctorid,
          doctorname: AesEncryption.encrypt(req.body.doctorname),
          smno: AesEncryption.encrypt(req.body.smno),
          expdate: req.body.expdate,
          smphoto: AesEncryption.encrypt(req.body.smphoto),
          degreename: AesEncryption.encrypt(req.body.degreename),
          guni: AesEncryption.encrypt(req.body.guni),
          gyear: AesEncryption.encrypt(req.body.gyear),
          grecord: AesEncryption.encrypt(grecordname),
          degrees: [],
          phone: AesEncryption.encrypt(req.body.phone),
          specializedarea: [],
          created_date: new Date(Date.now()),
          modified_date: new Date(),
          created_user: _userid,
          modified_user: "null",
          is_delete: false,
          is_acitve: false,
        };
        const doctor_value = new this.doctor(doctor_data);
        const doctor_result = await doctor_value.save();

        data = {};
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

  public checksetupdoctorrequest(req: Request) {
    // check request parameter contain or not
    if (req.body.userid == undefined || req.body.userid == "") {
      return "fail";
    }
  }
}
