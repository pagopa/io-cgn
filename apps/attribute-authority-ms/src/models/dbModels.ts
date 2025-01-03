import {
  Association,
  BelongsToManyAddAssociationMixin,
  BelongsToManyAddAssociationsMixin,
  BelongsToManyCountAssociationsMixin,
  BelongsToManyCreateAssociationMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyHasAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";

import sequelize = require("sequelize");

export class Organization extends Model<
  InferAttributes<Organization>,
  InferCreationAttributes<Organization>
> {
  declare static readonly associations: {
    readonly referents: Association<Organization, Referent>;
  };

  declare readonly addReferent: BelongsToManyAddAssociationMixin<
    Referent,
    string
  >;

  declare readonly addReferents: BelongsToManyAddAssociationsMixin<
    Referent,
    string
  >;

  declare readonly countReferents: BelongsToManyCountAssociationsMixin;

  declare readonly createReferent: BelongsToManyCreateAssociationMixin<Referent>;

  declare readonly fiscalCode: string;

  declare readonly getReferents: BelongsToManyGetAssociationsMixin<Referent>;

  declare readonly hasReferent: BelongsToManyHasAssociationMixin<
    Referent,
    string
  >;

  declare readonly hasReferents: BelongsToManyHasAssociationsMixin<
    Referent,
    string
  >;

  declare readonly insertedAt?: string;

  declare readonly name: string;

  declare readonly pec: string;

  declare readonly referents: NonAttribute<readonly Referent[]>;

  declare readonly removeReferent: BelongsToManyRemoveAssociationMixin<
    Referent,
    string
  >;

  declare readonly removeReferents: BelongsToManyRemoveAssociationsMixin<
    Referent,
    string
  >;

  declare readonly setReferents: BelongsToManySetAssociationsMixin<
    Referent,
    string
  >;
}

export class Referent extends Model<
  InferAttributes<Referent>,
  InferCreationAttributes<Referent>
> {
  declare static readonly associations: {
    readonly organizations: Association<Referent, Organization>;
  };

  declare readonly fiscalCode: string;

  declare readonly organizations: NonAttribute<readonly Organization[]>;
}

export const initModels = (db: Sequelize) => {
  Organization.init(
    {
      fiscalCode: {
        primaryKey: true,
        type: DataTypes.STRING(16),
      },

      insertedAt: {
        defaultValue: sequelize.NOW,
        type: DataTypes.DATE,
      },
      name: {
        type: DataTypes.STRING(100),
      },
      pec: {
        type: DataTypes.STRING(100),
      },
    },
    {
      modelName: "organization",
      sequelize: db,
      timestamps: false,
      underscored: true,
    },
  );

  Referent.init(
    {
      fiscalCode: {
        primaryKey: true,
        type: DataTypes.STRING(16),
      },
    },
    {
      modelName: "referent",
      sequelize: db,
      timestamps: false,
      underscored: true,
    },
  );

  Organization.belongsToMany(Referent, {
    through: "organizations_referents",
  });

  Referent.belongsToMany(Organization, {
    through: "organizations_referents",
  });

  db.sync({ alter: true });
};
