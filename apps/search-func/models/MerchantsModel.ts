import { Model } from "sequelize";

export default class MerchantsModel extends Model {
  public readonly description!: string;
  public readonly id!: string;
  public readonly name!: string;
  public readonly new_discounts!: boolean;
}
