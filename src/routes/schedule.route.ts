import { Application, NextFunction, Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import {
  successresponse,
  failureresponse,
  insufficientparameters,
} from "../services/common.service";
import passport from "passport";
import { AppointmentService } from "./../services/appointment.service";
import {
  AppointmentInput,
  AppointmentUpdate,
} from "../models/appointment.model";
import { ScheduleService } from "../services/schedule.service";
import {
    ScheduleDelete,
  ScheduleGet,
  ScheduleInput,
  ScheduleUpdate,
} from "../models/schedule.model";

@autoInjectable()
export default class Routes {
  schedule_service: ScheduleService;
  constructor(schedule_service: ScheduleService) {
    this.schedule_service = schedule_service;
  }

  public route(app: Application) {
    // schedule setup route
    app.post("/schedule/setup", async (req: Request, res: Response) => {
      passport.authenticate(
        "jwt",
        { session: false },
        async (err, user, info) => {
          if (user) {
            const data = await this.schedule_service.setupschedule(
              req.body as ScheduleInput
            );
            if (data.status == "success") {
              successresponse("Created schedule successfully.", data.data, res);
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
    });
    //  get schedule route
    app.post("/schedule/get", async (req: Request, res: Response) => {
      passport.authenticate(
        "jwt",
        { session: false },
        async (err, user, info) => {
          if (user) {
            const data = await this.schedule_service.getschedule(
              req.body as ScheduleGet
            );
            if (data.status == "success") {
              successresponse("Get schedules successfully.", data.data, res);
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
    });

    // update schedule route
    app.post("/schedule/update", async (req: Request, res: Response) => {
      passport.authenticate(
        "jwt",
        { session: false },
        async (err, user, info) => {
          if (user) {
            const data = await this.schedule_service.updateschedule(
              req.body as ScheduleUpdate
            );
            if (data.status == "success") {
              successresponse(
                "Updated appointment successfully.",
                data.data,
                res
              );
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
    });

    // delete schedule route
    app.post(
        "/schedule/delete",
        passport.authenticate("jwt", { session: false }),
        async (req: Request, res: Response) => {
          const data = await this.schedule_service.deleteschedule(req.body as ScheduleDelete);
          if (data.status == "success") {
            successresponse("Deleted schedule successfully", data.data, res);
          } else if (data.status == "insufficient") {
            insufficientparameters(res);
          } else if (data.status == "unauthorized") {
            failureresponse("Unauthorized.", data.data, res);
          } else if (data.status == "invalid") {
            failureresponse("Schedule not found.", data.data, res);
          } else if (data.status == "cannotdelete") {
            failureresponse("Can not delete schedule.", data.data, res);
          } else {
            failureresponse("Error.", data.data, res);
          }
        }
      );
  }

  
}
