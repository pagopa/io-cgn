import { parse } from "fp-ts/lib/Json";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as fs from "fs";

import { errorsToError } from "./errorsFormatter";
import { UsersCompanies } from "./types";

export const readFileAsync = TE.taskify(fs.readFile);

export const parseUsers = (): TE.TaskEither<Error, UsersCompanies> =>
  pipe(
    readFileAsync("./conf/companies.json"),
    TE.bimap(
      (err) => new Error(`Error parsing JSON file ${err.message}`),
      (rawData) => Buffer.from(rawData).toString(),
    ),
    TE.chainEitherKW(parse),
    TE.mapLeft(() => new Error("Cannot parse JSON")),
    TE.chain(
      flow(UsersCompanies.decode, TE.fromEither, TE.mapLeft(errorsToError)),
    ),
  );
