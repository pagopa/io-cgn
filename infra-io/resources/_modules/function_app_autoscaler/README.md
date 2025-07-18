# function_app_autoscaler

<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

No providers.

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_function_app_autoscaler"></a> [function\_app\_autoscaler](#module\_function\_app\_autoscaler) | github.com/pagopa/dx//infra/modules/azure_app_service_plan_autoscaler | 5fe5d992a856636e2f49f6720a2b735dd77f1696 |

## Resources

No resources.

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_app_service_plan_id"></a> [app\_service\_plan\_id](#input\_app\_service\_plan\_id) | The id of the app service plan containing the service to autoscale. | `string` | n/a | yes |
| <a name="input_autoscale_name"></a> [autoscale\_name](#input\_autoscale\_name) | Name of the autoscale settings | `string` | `null` | no |
| <a name="input_function_app_name"></a> [function\_app\_name](#input\_function\_app\_name) | Name of the function app to autoscale | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | The location of the app service plan | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Name of the resource group where resources will be created | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |

## Outputs

No outputs.
<!-- END_TF_DOCS -->
