import mongoose from "mongoose";
import AesEncryption from "../common/aesEncryption";
import AppUserClass from "../models/appuser.model";
import { injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import ISKCUserClass from "../models/skcuser.model";
import ClinicClass from "../models/clinic.model";
import IScheduleClass, {
  Schedule,
  ScheduleDelete,
  ScheduleGet,
  ScheduleInput,
  ScheduleUpdate,
} from "../models/schedule.model";

@injectable()
export class ScheduleService {
  clinic: mongoose.Model<any>;
  appusers: mongoose.Model<any>;
  skcusers: mongoose.Model<any>;
  schedule: mongoose.Model<any>;
  constructor(
    clinic?: ClinicClass,
    appuser?: AppUserClass,
    skcuser?: ISKCUserClass,
    schedule?: IScheduleClass
  ) {
    this.clinic = clinic!.model;
    this.appusers = appuser!.model;
    this.skcusers = skcuser!.model;
    this.schedule = schedule!.model;
  }

  // setup doctor
  public async setupschedule(
    req: ScheduleInput
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not

      const check = this.checksetupschedulerequest(req);
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
        if (req.clinicid) {
          //   Check Clinic ID exists
          const filter_clinic = {
            clinicid: req.clinicid,
          };
          const check_clinic_exits = await this.clinic.findOne(filter_clinic);
          if (!check_clinic_exits) {
            data = {};
            const status = "invalidclinic";
            return { data, status };
          }
        }
        if (req.doctorid) {
          //   Check Doctor ID Exists
          const filter_user = {
            appuserid: req.doctorid,
          };
          const check_doctor_exits = await this.skcusers.findOne(filter_user);
          if (!check_doctor_exits) {
            data = {};
            const status = "invalid";
            return { data, status };
          }
        }

        const scheduleid = uuidv4();

        const schedule_data: Schedule = {
          scheduleid: scheduleid,
          clinicid: req.clinicid,
          doctorid: req.doctorid,
          starttime: req.starttime,
          endtime: req.endtime,
          monday: req.monday,
          tuesday: req.tuesday,
          wednesday: req.wednesday,
          thursday: req.thursday,
          friday: req.friday,
          saturday: req.saturday,
          sunday: req.sunday,
          closedonph: req.closedonph,
          created_date: new Date(Date.now()),
          modified_date: new Date(),
          created_user: AesEncryption.encrypt(req.userid),
          modified_user: "null",
          is_delete: false,
          is_active: true,
        };
        const schedule_value = new this.schedule(schedule_data);
        const schedule_result = await schedule_value.save();

        data = schedule_result;
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

  // get all appointments
  public async getschedule(
    req: ScheduleGet
  ): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: ScheduleUpdate[] = [];
    try {
      const check = this.checkgetscheduleparam(req);
      if (check == "fail") {
        data = {};
        const status = "insufficient";
        return { status, data };
      }

      var filter_expression = {};
      if (req.clinicid && !req.doctorid) {
        filter_expression = {
          clinicid: req.clinicid,
        };
      } else if (!req.clinicid && req.doctorid) {
        filter_expression = {
          doctorid: req.doctorid,
        };
      } else {
        filter_expression = {
          clinicid: req.clinicid,
          doctorid: req.doctorid,
        };
      }
      const schedule_list = await this.schedule.find(filter_expression);

      status = "success";
      // check data empty
      if (!schedule_list) {
        data = {};
        return { status, data };
      }
      for (var i = 0; i < schedule_list.length; i++) {
        //check user is deleted or not
        if (schedule_list[i]["is_delete"] == false) {
          var temp: ScheduleUpdate = {
            scheduleid: schedule_list[i].scheduleid,
            userid: "",
            clinicid: schedule_list[i].clinicid,
            doctorid: schedule_list[i].doctorid,
            starttime: schedule_list[i].starttime,
            endtime: schedule_list[i].endtime,
            monday: schedule_list[i].monday,
            tuesday: schedule_list[i].tuesday,
            wednesday: schedule_list[i].wednesday,
            thursday: schedule_list[i].thursday,
            friday: schedule_list[i].friday,
            saturday: schedule_list[i].saturday,
            sunday: schedule_list[i].sunday,
            closedonph: schedule_list[i].closedonph,
          };
          list.push(temp);
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

  // setup doctor
  public async updateschedule(
    req: ScheduleUpdate
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not

      const check = this.checkupdateschedulerequest(req);
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
        //   Check Schdule exists
        const filter_schedule = {
          scheduleid: req.scheduleid,
        };
        const check_schedule_exits = await this.schedule.findOne(
          filter_schedule
        );
        if (!check_schedule_exits) {
          data = {};
          const status = "unauthorized";
          return { data, status };
        }

        if (req.clinicid) {
          //   Check Clinic ID exists
          const filter_clinic = {
            clinicid: req.clinicid,
          };
          const check_clinic_exits = await this.clinic.findOne(filter_clinic);
          if (!check_clinic_exits) {
            data = {};
            const status = "invalidclinic";
            return { data, status };
          }
        }
        if (req.doctorid) {
          //   Check Doctor ID Exists
          const filter_user = {
            appuserid: req.doctorid,
          };
          const check_doctor_exits = await this.skcusers.findOne(filter_user);
          if (!check_doctor_exits) {
            data = {};
            const status = "invalid";
            return { data, status };
          }
        }

        const schedule_data: Schedule = {
          scheduleid: req.scheduleid,
          clinicid: req.clinicid,
          doctorid: req.doctorid,
          starttime: req.starttime,
          endtime: req.endtime,
          monday: req.monday,
          tuesday: req.tuesday,
          wednesday: req.wednesday,
          thursday: req.thursday,
          friday: req.friday,
          saturday: req.saturday,
          sunday: req.sunday,
          closedonph: req.closedonph,
          created_date: new Date(Date.now()),
          modified_date: new Date(),
          created_user: AesEncryption.encrypt(req.userid),
          modified_user: "null",
          is_delete: false,
          is_active: true,
        };

        const result = await this.schedule.findOneAndUpdate(
          { scheduleid: req.scheduleid },
          schedule_data,
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

  public async deleteschedule(
    req: ScheduleDelete
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not

      const check = this.checkdeletescheduleparam(req);
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
        //   Check Schdule exists
        const filter_schedule = {
          scheduleid: req.scheduleid,
        };
        const check_schedule_exits = await this.schedule.findOne(
          filter_schedule
        );
        if (!check_schedule_exits) {
          data = {};
          const status = "unauthorized";
          return { data, status };
        }

        check_schedule_exits["is_delete"] = true;

        const result = await this.schedule.findOneAndUpdate(
          { scheduleid: req.scheduleid },
          check_schedule_exits,
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

  public checksetupschedulerequest(req: ScheduleInput) {
    // check request parameter contain or not
    if (
      (req.userid &&
        req.clinicid &&
        req.doctorid &&
        req.starttime &&
        req.endtime &&
        req.monday &&
        req.tuesday &&
        req.wednesday &&
        req.thursday &&
        req.friday &&
        req.saturday &&
        req.sunday &&
        req.closedonph) == undefined
    ) {
      return "fail";
    }
  }

  public checkupdateschedulerequest(req: ScheduleUpdate) {
    // check request parameter contain or not
    if (
      (req.scheduleid &&
        req.userid &&
        req.clinicid &&
        req.doctorid &&
        req.starttime &&
        req.endtime &&
        req.monday &&
        req.tuesday &&
        req.wednesday &&
        req.thursday &&
        req.friday &&
        req.saturday &&
        req.sunday &&
        req.closedonph) == undefined
    ) {
      return "fail";
    }
  }

  public checkgetscheduleparam(req: ScheduleGet) {
    // check request parameter contain or not
    if ((req.userid && req.clinicid && req.doctorid) == undefined) {
      return "fail";
    }
  }

  public checkdeletescheduleparam(req: ScheduleDelete) {
    // check request parameter contain or not
    if ((req.userid && req.scheduleid) == undefined) {
      return "fail";
    }
  }
}
