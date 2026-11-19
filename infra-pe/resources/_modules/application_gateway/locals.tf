locals {
  # Review this PL1/PL2 list when changing the OWASP CRS version. Azure cannot enable PL3/PL4 rules.
  # https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules?tabs=owasp32#request-942-application-attack-sqli
  waf_sqli_rule_ids = toset([
    "942100", "942110", "942120", "942130", "942140", "942150", "942160", "942170", "942180", "942190",
    "942200", "942210", "942220", "942230", "942240", "942250", "942260", "942270", "942280", "942290",
    "942300", "942310", "942320", "942330", "942340", "942350", "942360", "942361", "942370", "942380", "942390",
    "942400", "942410", "942430", "942440", "942450", "942470", "942480",
    "942500",
  ])
}
