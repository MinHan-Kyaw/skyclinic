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
import ClinicClass, { Clinic, ClinicInput } from "../models/clinic.model";
import { v4 as uuidv4 } from "uuid";
import { fileupload, getfileurl } from "../common/fileupload";

const jwt = require("jsonwebtoken");

const { secretKey, algorithms } = environment.getJWTConfig();

@injectable()
export class ClinicServices {
  clinic: mongoose.Model<any>;
  appusers: mongoose.Model<any>;
  constructor(clinic?: ClinicClass, appuser?: AppUserClass) {
    this.clinic = clinic!.model;
    this.appusers = appuser!.model;
  }

  // setup doctor
  public async setupclinic(
    req: ClinicInput,
    files: any
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const check = this.checksetupclinicrequest(req);
      if (check == "fail") {
        data = {};
        const status = "insufficient";
        return { status, data };
      }

      const { userid } = req;
      const _userid = AesEncryption.encrypt(userid);
      // check user exit or not
      const filter_userid = {
        $or: [{ username: _userid }, { phone: _userid }],
      };
      var filter = await this.appusers.findOne(filter_userid);
      if (filter != null && filter.appuserid) {
        const appuserid = filter.appuserid;

        const filter_clinicidentifiednumber = {
          clinicidentifiednumber: req.clinicidentifiednumber,
        };
        const check_exist = await this.clinic.findOne(
          filter_clinicidentifiednumber
        );
        if (check_exist != null) {
          data = {};
          const status = "unauthorized";
          return { data, status };
        }

        var files: any = files;
        console.log(req);
        const clinicidentifiedphoto = files?.find(
          (x: any) => x.fieldname == "clinicidentifiedphoto"
        );
        // const grecord = files?.find((x: any) => x.fieldname == "grecord");

        if (clinicidentifiedphoto == undefined) {
          console.log("here");
          data = {};
          status = "insufficient";
          return { status, data };
        }
        // Check Image Type
        if (!checkFileType(clinicidentifiedphoto.mimetype)) {
          data = {};
          status = "invalidimg";
          return { status, data };
        }

        const clinicidentifiedphotoname = generateFilename(
          clinicidentifiedphoto.originalname
        );
        const await_profile = await fileupload(
          "clinicidentifiedphoto/" + clinicidentifiedphotoname,
          clinicidentifiedphoto["path"]
        );

        const clinicid = uuidv4();
        // collect request parameter for appuser
        const phone_nos = req.phone.toString().split(',');
        
        const clinic_data: Clinic = {
          clinicid: clinicid,
          clinicname: AesEncryption.encrypt(req.clinicname),
          owner: [appuserid],
          address: AesEncryption.encrypt(req.address),
          phone: phone_nos,
          website: AesEncryption.encrypt(req.website),
          clinicidentifiednumber: AesEncryption.encrypt(
            req.clinicidentifiednumber
          ), //
          clinicidentifiedphoto: AesEncryption.encrypt(
            clinicidentifiedphotoname
          ),
          created_date: new Date(Date.now()),
          modified_date: new Date(),
          created_user: AesEncryption.encrypt(req.userid),
          modified_user: "null",
          is_delete: false,
          is_active: true,
        };
        const clinic_value = new this.clinic(clinic_data);
        const clinic_result = await clinic_value.save();

        data = clinic_result;
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

  public checksetupclinicrequest(req: ClinicInput) {
    // check request parameter contain or not
    if (
      (req.userid &&
        req.clinicname &&
        req.address &&
        req.phone &&
        req.website &&
        req.clinicidentifiednumber) == undefined
    ) {
      return "fail";
    }
  }
}
