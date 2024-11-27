import * as t from "io-ts";
import { UserCompanies } from "../../generated/definitions/UserCompanies";

export const UsersCompanies = t.readonlyArray(UserCompanies);

export type UsersCompanies = t.TypeOf<typeof UsersCompanies>;
