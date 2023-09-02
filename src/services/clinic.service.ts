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
import ClinicClass, {
  Clinic,
  ClinicInput,
  ClinicUpdateInput,
  IGetClinicModel,
  ILinkDoctor,
  ClinicDoctor
} from "../models/clinic.model";
import { v4 as uuidv4 } from "uuid";
import { fileupload, getfileurl } from "../common/fileupload";
import ISKCUserClass from "../models/skcuser.model";

const jwt = require("jsonwebtoken");

const { secretKey, algorithms } = environment.getJWTConfig();

@injectable()
export class ClinicServices {
  clinic: mongoose.Model<any>;
  appusers: mongoose.Model<any>;
  skcusers: mongoose.Model<any>;
  constructor(
    clinic?: ClinicClass,
    appuser?: AppUserClass,
    skcuser?: ISKCUserClass
  ) {
    this.clinic = clinic!.model;
    this.appusers = appuser!.model;
    this.skcusers = skcuser!.model;
  }

  // setup clinic
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
        const phone_nos = req.phone.toString().replace(" ", "").split(",");
        const doctors = req.doctor.toString().replace(" ", "").split(",");

        const clinic_data: Clinic = {
          clinicid: clinicid,
          clinicname: AesEncryption.encrypt(req.clinicname),
          owner: [appuserid],
          address: AesEncryption.encrypt(req.address),
          phone: phone_nos,
          website: AesEncryption.encrypt(req.website),
          doctor: doctors,
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

  // update clinic
// setup doctor
public async updateclinic(
  req: ClinicUpdateInput,
  files: any
): Promise<{ status: string; data: any }> {
  var status: any;
  var data: any;
  var list: any = [];
  try {
    // check request parameter contain or not
    const check = this.checkupdateclinicrequest(req);
    if (check == "fail") {
      data = {};
      const status = "insufficient";
      return { status, data };
    }

    const { userid, clinicid } = req;
    const _userid = AesEncryption.encrypt(userid);
    // check user exit or not
    const filter_userid = {
      $or: [{ username: _userid }, { phone: _userid }],
    };
    var filter = await this.appusers.findOne(filter_userid);
    if (filter != null && filter.appuserid) {
      const appuserid = filter.appuserid;

      // check clinic exists
      const filter_clinicid = {
        clinicid: clinicid,
      };
      const clinic_info = await this.clinic.findOne(
        filter_clinicid
      );

      if(clinic_info == null){
        data = {};
        const status = "unauthorized";
        return { data, status };
      }

      // check clinic identified number is changed and duplicate number exists
      if(clinic_info['clinicidentifiednumber'] != req.clinicidentifiednumber){
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
      }



      var files: any = files;
      console.log(req);
      const clinicidentifiedphoto = files?.find(
        (x: any) => x.fieldname == "clinicidentifiedphoto"
      );

      

      // Check Image Type
      if (clinicidentifiedphoto != undefined && !checkFileType(clinicidentifiedphoto.mimetype)) {
        data = {};
        status = "invalidimg";
        return { status, data };
      }

      const clinicidentifiedphotoname = clinicidentifiedphoto ? generateFilename(
        clinicidentifiedphoto.originalname
       ) : "";
      // check clinic identified photo is updated or not
      if(clinicidentifiedphoto != undefined){
        console.log('here')
        const await_profile = await fileupload(
          "clinicidentifiedphoto/" + clinicidentifiedphotoname,
          clinicidentifiedphoto["path"]
        );
      }

      console.log('asdfasdf')
      
      const phone_nos = req.phone.toString().replace(" ", "").split(",");
      const doctors = req.doctor.toString().replace(" ", "").split(",");

      const clinic_data: Clinic = {
        clinicid: clinicid,
        clinicname: AesEncryption.encrypt(req.clinicname),
        owner: clinic_info.owner,
        address: AesEncryption.encrypt(req.address),
        phone: phone_nos,
        website: AesEncryption.encrypt(req.website),
        doctor: doctors,
        clinicidentifiednumber: AesEncryption.encrypt(
          req.clinicidentifiednumber
        ), //
        clinicidentifiedphoto: clinicidentifiedphoto ? AesEncryption.encrypt(
          clinicidentifiedphotoname
        ) : clinic_info.clinicidentifiedphoto,
        created_date: clinic_info.created_date,
        modified_date: new Date(Date.now()),
        created_user: clinic_info.created_user,
        modified_user: _userid,
        is_delete: false,
        is_active: true,
      };
      const result = await this.clinic.findOneAndUpdate(
        { clinicid: clinicid },
        clinic_data,
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

  // get clinic by owner
  public async getclinic(
    userid: string
  ): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      
      if (userid == "" || userid == undefined || userid == null) {
        data = {};
        const status = "insufficient";
        return { status, data };
      }

      const _userid = AesEncryption.encrypt(userid);
      // check user exit or not
      const filter_userid = {
        $or: [{ username: _userid }, { phone: _userid }],
      };
      var filter = await this.appusers.findOne(filter_userid);
      if (filter != null && filter.appuserid) {
        const appuserid = filter.appuserid;
        const query = { owner: { $in: [appuserid] } };
        const cliniclist = await this.clinic.find(query);
        status = "success";
        // check data empty
        if (!cliniclist) {
          data = {};
          return { status, data };
        }
        for (var i = 0; i < cliniclist.length; i++) {
          //check user is deleted or not
          if (cliniclist[0]["is_delete"] == false) {
            list.push({
              clinicid: cliniclist[0].clinicid,
              clinicname: AesEncryption.decrypt(cliniclist[0].clinicname),
              // owner: [appuserid],
              address: AesEncryption.decrypt(cliniclist[0].address),
              phone: cliniclist[0].phone,
              website: AesEncryption.decrypt(cliniclist[0].website),
              clinicidentifiednumber: AesEncryption.decrypt(
                cliniclist[0].clinicidentifiednumber
              ), //
              clinicidentifiedphoto: AesEncryption.decrypt(
                cliniclist[0].clinicidentifiedphoto
              ),
              clinicidentifiedphotourl: getfileurl(
                AesEncryption.decrypt(cliniclist[0].clinicidentifiedphoto),
                "clinicidentifiedphoto"
              ),
            });
          }
        }
        data = list;
        status = "success";
        return { status, data };
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

  // get all clinics
  public async getallclinic(): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      const cliniclist = await this.clinic.find({});
      status = "success";
      // check data empty
      if (!cliniclist) {
        data = {};
        return { status, data };
      }
      for (var i = 0; i < cliniclist.length; i++) {
        //check user is deleted or not
        if (cliniclist[0]["is_delete"] == false) {
          list.push({
            clinicid: cliniclist[0].clinicid,
            clinicname: AesEncryption.decrypt(cliniclist[0].clinicname),
            // owner: [appuserid],
            address: AesEncryption.decrypt(cliniclist[0].address),
            phone: cliniclist[0].phone,
            website: AesEncryption.decrypt(cliniclist[0].website),
            clinicidentifiednumber: AesEncryption.decrypt(
              cliniclist[0].clinicidentifiednumber
            ), //
            clinicidentifiedphoto: AesEncryption.decrypt(
              cliniclist[0].clinicidentifiedphoto
            ),
            clinicidentifiedphotourl: getfileurl(
              AesEncryption.decrypt(cliniclist[0].clinicidentifiedphoto),
              "clinicidentifiedphoto"
            ),
            // created_date: cliniclist[0].created_date,
            // modified_date: cliniclist[0].modified_date,
            // created_user: cliniclist[0].created_user,
            // modified_user: cliniclist[0].modified_user,
            // is_delete: false,
            // is_active: true,
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

  // link doctor to clinic
  public async linkdoctor(req: ILinkDoctor): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    try {
      const check = this.checklinkdoctor(req);
      if (check == "fail") {
        data = {};
        const status = "insufficient";
        return { status, data };
      }
      const { userid, clinicid, doctorid } = req;
      const _userid = AesEncryption.encrypt(userid);
      // check user exit or not
      const filter_userid = {
        $or: [{ username: _userid }, { phone: _userid }],
      };
      var filter = await this.appusers.findOne(filter_userid);
      if (filter != null && filter.appuserid) {
        const appuserid = filter.appuserid;

        // check clinic exists and the owner
        const query = { owner: { $in: [appuserid] }, clinicid: clinicid };
        const clinic_info = await this.clinic.findOne(query);
        if(!clinic_info){
          data = {};
          const status = "invalid";
          return { data, status };
        }
        const oldclinicdoc = clinic_info.doctor;
        // check already exist
        if (oldclinicdoc.includes(doctorid)) {
            data = {};
            const status = "exist";
            return { data, status };
        }
        const clinic_data: ClinicDoctor = {
          doctor: oldclinicdoc,
          created_date: clinic_info.created_date,
          modified_date: new Date(Date.now()),
          created_user: clinic_info.created_user,
          modified_user: _userid,
          is_delete: false,
          is_active: true,
        };
        const result = await this.clinic.findOneAndUpdate(
          { clinicid: clinicid },
          clinic_data,
          { new: true }
        );
        data = result;
        status = "success";
        return { status, data };
      }
      else {
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

  public checkupdateclinicrequest(req: ClinicUpdateInput) {
    // check request parameter contain or not
    if (
      (req.clinicid &&
        req.userid &&
        req.clinicname &&
        req.address &&
        req.phone &&
        req.website &&
        req.clinicidentifiednumber) == undefined
    ) {
      return "fail";
    }
  }

  public checklinkdoctor(req: ILinkDoctor) {
    // check request parameter contain or not
    if (
      (req.clinicid &&
        req.userid &&
        req.doctorid) == undefined
    ) {
      return "fail";
    }
  }

  public checkgetclinicrequest(req: IGetClinicModel) {
    // check request parameter contain or not
    if (req.userid == undefined) {
      return "fail";
    }
  }
}
