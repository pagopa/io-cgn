import { Model } from "sequelize";

export default class CountModel extends Model {
  public readonly count!: number;
}
