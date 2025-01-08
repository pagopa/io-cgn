import { Model } from "sequelize";

import { ProductCategoryEnumModelType } from "./ProductCategories";

export default class DiscountModel extends Model {
  public readonly bucket_code!: string | undefined;
  public readonly condition!: string | undefined;
  public readonly description!: string | undefined;
  public readonly discount_k!: number;
  public readonly discount_url!: string | undefined;
  public readonly discount_value!: number | undefined;
  public readonly end_date!: Date;
  public readonly is_new!: boolean;
  public readonly landing_page_referrer!: string | undefined;
  public readonly landing_page_url!: string | undefined;
  public readonly name!: string;
  public readonly product_categories!: readonly ProductCategoryEnumModelType[];
  public readonly start_date!: Date;
  public readonly static_code!: string | undefined;
}
