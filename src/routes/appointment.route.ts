import { Application, NextFunction, Request, Response } from "express";
import { autoInjectable } from "tsyringe"
import {
  successresponse,
  failureresponse,
  insufficientparameters,
} from "../services/common.service";
import passport from "passport";
import multer = require("multer");
import {AppointmentService} from './../services/appointment.service';
import { AppointmentInput, AppointmentUpdate } from "../models/appointment.model";

@autoInjectable()
export default class Routes {
  appointment_service: AppointmentService;
  constructor(
    appointment_service: AppointmentService,
  ) {
    this.appointment_service = appointment_service;
  }

  public route(app: Application) {
    // appointment setup route
    app.post(
      "/appointment/setup",
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.appointment_service.setupappointment(req.body as AppointmentInput);
              if (data.status == "success") {
                successresponse("Created appointment successfully.", data.data, res);
              } else if (data.status == "insufficient") {
                insufficientparameters(res);
              } else if (data.status == "unauthorized") {
                failureresponse("Unauthorized.", data.data, res);
              } else if (data.status == "invalid") {
                failureresponse("Invalid User.", data.data, res);
              } else if (data.status == "invalidclinic") {
                failureresponse("Invalid Clinic.", data.data, res);
              } else {
                failureresponse("Error.", data.data, res);
              }
            } else {
              failureresponse("Unauthorized.", {}, res);
            }
          }
        )(req, res);
      }
    );
    //  get all appointment route
    app.post(
      "/appointment/getall",
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.appointment_service.getallappointments();
              if (data.status == "success") {
                successresponse("Get appointment successfully.", data.data, res);
              } else if (data.status == "insufficient") {
                insufficientparameters(res);
              } else if (data.status == "unauthorized") {
                failureresponse("Unauthorized.", data.data, res);
              } else {
                failureresponse("Error.", data.data, res);
              }
            } else {
              failureresponse("Unauthorized.", {}, res);
            }
          }
        )(req, res);
      }
    );

    // update appointment route
    app.post(
        "/appointment/update",
        async (req: Request, res: Response) => {
          passport.authenticate(
            "jwt",
            { session: false },
            async (err, user, info) => {
              if (user) {
                const data = await this.appointment_service.updateappointment(req.body as AppointmentUpdate);
                if (data.status == "success") {
                  successresponse("Updated appointment successfully.", data.data, res);
                } else if (data.status == "insufficient") {
                  insufficientparameters(res);
                } else if (data.status == "unauthorized") {
                  failureresponse("Unauthorized.", data.data, res);
                } else if (data.status == "invalid") {
                  failureresponse("Invalid User.", data.data, res);
                } else if (data.status == "invalidclinic") {
                  failureresponse("Invalid Clinic.", data.data, res);
                } else {
                  failureresponse("Error.", data.data, res);
                }
              } else {
                failureresponse("Unauthorized.", {}, res);
              }
            }
          )(req, res);
        }
      );
  }
}
