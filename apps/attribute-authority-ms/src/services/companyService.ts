import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { Companies } from "../../generated/definitions/Companies";
import { Company } from "../../generated/definitions/Company";
import { Referent } from "../models/dbModels";

export const getCompanies = (
  fiscalCode: FiscalCode,
): TE.TaskEither<Error, O.Option<Companies>> =>
  pipe(
    TE.tryCatch(
      async () =>
        Referent.findByPk(fiscalCode, {
          include: [Referent.associations.organizations],
        }),
      E.toError,
    ),
    TE.map((maybeReferent) =>
      pipe(
        O.fromNullable(maybeReferent),
        O.map((ref) =>
          pipe(
            ref.organizations.map((org) =>
              Company.decode({
                fiscalCode: org.fiscalCode,
                organizationName: org.name,
                pec: org.pec,
              }),
            ),
            A.filter(E.isRight),
            A.map((comp) => comp.right),
          ),
        ),
      ),
    ),
  );
