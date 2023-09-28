/* eslint-disable no-multi-spaces */
declare namespace Express {
  export interface Request {
    user: {
      email: string
      phoneNumber: string
      firstName: string
      lastName: string
    }
  }
}
