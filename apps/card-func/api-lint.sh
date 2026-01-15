#!/bin/bash
find ./openapi -name '*.yaml' -exec swagger-cli validate {} \;