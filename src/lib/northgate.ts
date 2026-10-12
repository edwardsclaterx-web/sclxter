export const NORTHGATE_LOGIN = "northgate";
export const NORTHGATE_USER_ID = "usr_northgate";
export const NORTHGATE_BIZ_ID = "biz_northgate";

export function isNorthgateLogin(value: string) {
  return value.trim().toLowerCase() === NORTHGATE_LOGIN;
}
