// eslint-disable-next-line max-classes-per-file
import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  Association,
  NonAttribute,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyAddAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyHasAssociationsMixin,
  BelongsToManyCountAssociationsMixin,
  BelongsToManyCreateAssociationMixin
} from "sequelize";
import sequelize = require("sequelize");

export class Organization extends Model<
  InferAttributes<Organization>,
  InferCreationAttributes<Organization>
> {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly fiscalCode: string;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly name: string;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly pec: string;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly insertedAt?: string;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly referents: NonAttribute<ReadonlyArray<Referent>>;

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly getReferents: BelongsToManyGetAssociationsMixin<Referent>;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly addReferent: BelongsToManyAddAssociationMixin<
    Referent,
    string
  >;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly addReferents: BelongsToManyAddAssociationsMixin<
    Referent,
    string
  >;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly setReferents: BelongsToManySetAssociationsMixin<
    Referent,
    string
  >;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly removeReferent: BelongsToManyRemoveAssociationMixin<
    Referent,
    string
  >;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly removeReferents: BelongsToManyRemoveAssociationsMixin<
    Referent,
    string
  >;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly hasReferent: BelongsToManyHasAssociationMixin<
    Referent,
    string
  >;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly hasReferents: BelongsToManyHasAssociationsMixin<
    Referent,
    string
  >;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly countReferents: BelongsToManyCountAssociationsMixin;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly createReferent: BelongsToManyCreateAssociationMixin<
    Referent
  >;

  // eslint-disable-next-line @typescript-eslint/member-ordering, @typescript-eslint/explicit-member-accessibility
  declare static readonly associations: {
    readonly referents: Association<Organization, Referent>;
  };
}

export class Referent extends Model<
  InferAttributes<Referent>,
  InferCreationAttributes<Referent>
> {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly fiscalCode: string;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  declare readonly organizations: NonAttribute<ReadonlyArray<Organization>>;
  // eslint-disable-next-line @typescript-eslint/member-ordering, @typescript-eslint/explicit-member-accessibility
  declare static readonly associations: {
    readonly organizations: Association<Referent, Organization>;
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const initModels = (db: Sequelize) => {
  Organization.init(
    {
      fiscalCode: {
        type: DataTypes.STRING(16),
        // eslint-disable-next-line sort-keys
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100)
      },
      pec: {
        type: DataTypes.STRING(100)
      },
      // eslint-disable-next-line sort-keys
      insertedAt: {
        type: DataTypes.DATE,
        // eslint-disable-next-line sort-keys
        defaultValue: sequelize.NOW
      }
    },
    {
      sequelize: db,
      // eslint-disable-next-line sort-keys
      modelName: "organization",
      timestamps: false,
      underscored: true
    }
  );

  Referent.init(
    {
      fiscalCode: {
        type: DataTypes.STRING(16),
        // eslint-disable-next-line sort-keys
        primaryKey: true
      }
    },
    {
      sequelize: db,
      // eslint-disable-next-line sort-keys
      modelName: "referent",
      timestamps: false,
      underscored: true
    }
  );

  Organization.belongsToMany(Referent, {
    through: "organizations_referents"
  });

  Referent.belongsToMany(Organization, {
    through: "organizations_referents"
  });

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  db.sync({ alter: true });
};
