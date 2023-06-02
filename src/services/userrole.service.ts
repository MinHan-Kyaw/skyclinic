  
  import mongoose from "mongoose";
  import AesEncryption from "../common/aesEncryption";
//   import { ISKCUser, IUserUpdate, RSKCUser } from "../models/skcuser.model";
  import IdoctorClass, { IDoctorDetail } from "../models/doctor.model";
  import ClinicClass from "../models/clinic.model";
  import { injectable } from "tsyringe";
  
  @injectable()
  export class UserRoleService {
    doctor: mongoose.Model<any>;
    clinic: mongoose.Model<any>;
    constructor( doctor?: IdoctorClass,clinic?: ClinicClass) {
      this.doctor = doctor!.model;
      this.clinic = clinic!.model;
    }
  // Get User Detail
  public async getrole(
    req: IDoctorDetail
  ): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any = [];
    try {
      const { appuserid } = req;
      const _appuserid = AesEncryption.encrypt(appuserid);
      const appuser_filter = { appuserid: _appuserid};
      var doctorres = await this.doctor.findOne(appuser_filter);
      var clinicres = await this.clinic.find({ owner: { $regex: _appuserid} });
      //check user is deleted or not
      var isdoctor = false;
      var clinicowner = false;
      if (doctorres && doctorres["is_delete"] == false) {
        isdoctor = true;
      } 
      if (clinicres){
        clinicowner = true;
      }
      data = {"isdoctor":isdoctor, "clinicowner": clinicowner};
      status = "success";
      return { status, data };
    } catch (e: any) {
      data = e;
      status = "fail";
      return { status, data };
    }
  }
}