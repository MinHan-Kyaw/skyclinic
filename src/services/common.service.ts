import { Response } from "express";

enum responseStatusCode {
    success = 200,
    bad_request = 400,
    internal_server_error = 500
}

export function successresponse(message: string, data: any, res: Response) {
    res.status(responseStatusCode.success).json({
        status: 'SUCCESS',
        message: message,
        data
    });
}

export function failureresponse(message: string, data: any, res: Response) {
    res.status(responseStatusCode.success).json({
        status: 'FAILURE',
        message: message,
        data
    });
}

export function insufficientparameters(res: Response) {
    res.status(responseStatusCode.bad_request).json({
        status: 'FAILURE',
        message: 'Insufficient parameters',
        data: {}
    });
}

export function mongoerror(err: any, res: Response) {
    res.status(responseStatusCode.internal_server_error).json({
        status: 'FAILURE',
        message: 'MongoDB error',
        data: err
    });
}
