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
import ITreatMentClass, { ITreatMent, TreatMentInput } from "../models/treatment.model";
import { v4 as uuidv4 } from "uuid";
import { fileupload, getfileurl } from "../common/fileupload";

const jwt = require("jsonwebtoken");

const { secretKey, algorithms } = environment.getJWTConfig();

@injectable()
export class TreatMentService {
  treatment: mongoose.Model<any>;
  appusers: mongoose.Model<any>;
  constructor(treatment?: ITreatMentClass, appuser?: AppUserClass) {
    this.treatment = treatment!.model;
    this.appusers = appuser!.model;
  }

  // setup doctor
  public async setuptreatment(
    req: TreatMentInput,
    files: any
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not
      const check = this.checksetuptreatmentrequest(req);
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

        // const filter_clinicidentifiednumber = {
        //   clinicidentifiednumber: req.clinicidentifiednumber,
        // };
        // const check_exist = await this.clinic.findOne(
        //   filter_clinicidentifiednumber
        // );
        // if (check_exist != null) {
        //   data = {};
        //   const status = "unauthorized";
        //   return { data, status };
        // }

        // var files: any = files;
        // console.log(req);
        // const clinicidentifiedphoto = files?.find(
        //   (x: any) => x.fieldname == "clinicidentifiedphoto"
        // );
        // // const grecord = files?.find((x: any) => x.fieldname == "grecord");

        // if (clinicidentifiedphoto == undefined) {
        //   console.log("here");
        //   data = {};
        //   status = "insufficient";
        //   return { status, data };
        // }
        // Check Image Type
        // if (!checkFileType(clinicidentifiedphoto.mimetype)) {
        //   data = {};
        //   status = "invalidimg";
        //   return { status, data };
        // }

        // const clinicidentifiedphotoname = generateFilename(
        //   clinicidentifiedphoto.originalname
        // );
        // const await_profile = await fileupload(
        //   "clinicidentifiedphoto/" + clinicidentifiedphotoname,
        //   clinicidentifiedphoto["path"]
        // );

        const treatmentid = uuidv4();
        // collect request parameter for appuser
        // const phone_nos = req.phone.toString().split(',');
        var files: any = files;
        console.log(req);
        const treatentdoc = files?.find((x: any) => x.fieldname == "treatentdoc");

        if (treatentdoc == undefined) {
          console.log('here')
          data = {};
          status = "insufficient";
          return { status, data };
        }

        const documentname = generateFilename(treatentdoc.originalname);
        const await_profile = await fileupload(
          "treatentdoc/" + documentname,
          treatentdoc["path"],
        );
        const treatment_data: ITreatMent = {
          treatmentid: treatmentid,
          clinicid: req.clinicid,
          doctorid: req.doctorid,
          userid: req.userid,
          desc: AesEncryption.encrypt(req.desc),
          pressure: AesEncryption.encrypt(req.pressure),
          temperature: AesEncryption.encrypt(req.temperature),
          date: req.date,
          oxygenlevel: AesEncryption.encrypt(req.oxygenlevel),
          weight: AesEncryption.encrypt(req.weight),
          document: AesEncryption.encrypt(documentname),
          created_date: new Date(Date.now()),
          modified_date: new Date(),
          created_user: AesEncryption.encrypt(req.created_user),
          modified_user: "null",
          is_delete: false,
          is_active: true,
        };
        const treatment_value = new this.treatment(treatment_data);
        const treatment_result = await treatment_value.save();

        data = treatment_result;
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

  public checksetuptreatmentrequest(req: TreatMentInput) {
    // check request parameter contain or not
    if (
      (req.userid &&
        req.clinicid &&
        req.doctorid &&
        req.desc &&
        req.pressure &&
        req.temperature && 
        req.oxygenlevel && 
        req.weight && 
        req.date && 
        req.document) == undefined
    ) {
      return "fail";
    }
  }
}
