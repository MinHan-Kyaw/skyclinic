import mongoose from "mongoose";
import AesEncryption from "../common/aesEncryption";
import AppUserClass from "../models/appuser.model";
import { injectable } from "tsyringe";
import environment from "../../environment";
import generateFilename from "../common/generateFilename";
import checkFileType from "../common/checkFileType";
import ClinicClass, {
  Clinic,
  ClinicInput,
  GetClinicModel,
} from "../models/clinic.model";
import { v4 as uuidv4 } from "uuid";
import { fileupload, getfileurl } from "../common/fileupload";
import ISKCUserClass from "../models/skcuser.model";
import AppointmentClass, {
  Appointment,
  AppointmentInput,
  AppointmentUpdate,
} from "../models/appointment.model";

@injectable()
export class AppointmentService {
  clinic: mongoose.Model<any>;
  appusers: mongoose.Model<any>;
  skcusers: mongoose.Model<any>;
  appointments: mongoose.Model<any>;
  constructor(
    clinic?: ClinicClass,
    appuser?: AppUserClass,
    skcuser?: ISKCUserClass,
    appointment?: AppointmentClass
  ) {
    this.clinic = clinic!.model;
    this.appusers = appuser!.model;
    this.skcusers = skcuser!.model;
    this.appointments = appointment!.model;
  }

  // setup doctor
  public async setupappointment(
    req: AppointmentInput
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not

      const check = this.checksetupappointmentrequest(req);
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

        //   Check Clinic ID exists
        const filter_patient = {
          appuserid: req.appuserid,
        };
        const check_patient_exits = await this.skcusers.findOne(filter_patient);
        if (!check_patient_exits) {
          data = {};
          const status = "invalid";
          return { data, status };
        }

        const appointmentid = uuidv4();

        const appointment_data: Appointment = {
          appointmentid: appointmentid,
          clinicid: req.clinicid,
          appuserid: req.appuserid,
          doctorid: req.doctorid,
          date: req.date,
          time: req.time,
          initialinfo: req.initialinfo,
          status: req.status,
          created_date: new Date(Date.now()),
          modified_date: new Date(),
          created_user: AesEncryption.encrypt(req.userid),
          modified_user: "null",
          is_delete: false,
          is_active: true,
        };
        const appointment_value = new this.appointments(appointment_data);
        const appointment_result = await appointment_value.save();

        data = appointment_result;
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
  public async getallappointments(): Promise<{ status: string; data: any }> {
    var data: any;
    var status: any;
    var list: any[] = [];
    try {
      const appointment_list = await this.appointments.find({});
      const clinic_list = await this.clinic.find({});
      const skcuser_list = await this.skcusers.find({});
      status = "success";
      // check data empty
      if (!appointment_list) {
        data = {};
        return { status, data };
      }
      for (var i = 0; i < appointment_list.length; i++) {
        //check user is deleted or not
        if (appointment_list[i]["is_delete"] == false) {
          var patient;
          var clinic;

          if (appointment_list[i].appuserid != "") {
            patient = skcuser_list.find(
              (x: any) => x.appuserid == appointment_list[i].appuserid
            );
          }
          if (appointment_list[i].clinicid != "") {
            clinic = clinic_list.find(
              (x: any) => x.clinicid == appointment_list[i].clinicid
            );
          }

          list.push({
            appointmentid: appointment_list[i].appointmentid,
            clinicid: appointment_list[i].clinicid,
            userid: "",
            appuserid: appointment_list[i].appuserid,
            doctorid: appointment_list[i].doctorid,
            date: appointment_list[i].date,
            time: appointment_list[i].time,
            initialinfo: appointment_list[i].initialinfo,
            status: appointment_list[i].status,
            clinicinfo: clinic,
            patientinfo: patient,
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

  // setup doctor
  public async updateappointment(
    req: AppointmentUpdate
  ): Promise<{ status: string; data: any }> {
    var status: any;
    var data: any;
    var list: any = [];
    try {
      // check request parameter contain or not

      const check = this.checkupdateappointmentrequest(req);
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
        //   Check Clinic ID exists
        const filter_appointment = {
          appointmentid: req.appointmentid,
        };
        const check_appointment_exits = await this.appointments.findOne(
          filter_appointment
        );
        if (!check_appointment_exits) {
          data = {};
          const status = "unauthorized";
          return { data, status };
        }

        //   Check Clinic ID exists
        const filter_patient = {
          appuserid: req.appuserid,
        };
        const check_patient_exits = await this.skcusers.findOne(filter_patient);
        if (!check_patient_exits) {
          data = {};
          const status = "invalid";
          return { data, status };
        }

        const appointment_data: Appointment = {
          appointmentid: req.appointmentid,
          clinicid: req.clinicid,
          appuserid: req.appuserid,
          doctorid: req.doctorid,
          date: req.date,
          time: req.time,
          initialinfo: req.initialinfo,
          status: req.status,
          created_date: check_patient_exits.created_date,
          modified_date: new Date(),
          created_user: check_patient_exits.created_user,
          modified_user: req.userid,
          is_delete: false,
          is_active: true,
        };
        const result = await this.appointments.findOneAndUpdate(
          { appointmentid: req.appointmentid },
          appointment_data,
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

  public checksetupappointmentrequest(req: AppointmentInput) {
    // check request parameter contain or not
    if (
      (req.userid &&
        req.clinicid &&
        req.appuserid &&
        req.doctorid &&
        req.date &&
        req.time &&
        req.initialinfo &&
        req.status) == undefined
    ) {
      return "fail";
    }
  }

  public checkupdateappointmentrequest(req: AppointmentUpdate) {
    // check request parameter contain or not
    if (
      (req.userid &&
        req.appointmentid &&
        req.clinicid &&
        req.appuserid &&
        req.doctorid &&
        req.date &&
        req.time &&
        req.initialinfo &&
        req.status) == undefined
    ) {
      return "fail";
    }
  }
}
